import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { SynoApiError, SynoHttpError } from "./errors.js";
import type { SynoApiInfoMap, SynoRequest, SynoResponse } from "./types.js";

export interface MultipartFilePart {
  /** Form field name (e.g. `"file"`). */
  field: string;
  /** Filename to record in the part's Content-Disposition. */
  filename: string;
  /** Source bytes. Node `Readable` or web `ReadableStream`, both accepted. */
  stream: WebReadableStream<Uint8Array> | Readable;
  /** Exact byte length of the stream. */
  size: number;
  /** Defaults to `application/octet-stream`. */
  contentType?: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface SynoClientOptions {
  baseUrl: string;
  sid?: string;
  fetch?: FetchLike;
}

const BOOTSTRAP_PATHS: Record<string, string> = {
  "SYNO.API.Info": "query.cgi",
  "SYNO.API.Auth": "auth.cgi",
};

function encodeParam(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return JSON.stringify(v);
}

function normalizeBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid DSM URL "${raw}": expected an absolute URL like https://nas.example:5001`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid DSM URL "${raw}": scheme must be http or https`);
  }
  return url.toString().replace(/\/+$/, "");
}

/** Escape a value for use inside a quoted multipart header parameter (RFC 7578 §4.2 / WHATWG). */
function escapeHeaderParam(v: string): string {
  return v.replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/"/g, "%22");
}

function contentTypeOf(res: Response): string {
  return (res.headers.get("content-type") ?? "").toLowerCase();
}

export class SynoClient {
  readonly baseUrl: string;
  private sid: string | undefined;
  private readonly fetchImpl: FetchLike;
  private apiInfo: SynoApiInfoMap | undefined;
  private apiInfoPending: Promise<SynoApiInfoMap> | undefined;

  constructor(options: SynoClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.sid = options.sid;
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  }

  setSid(sid: string | undefined): void {
    this.sid = sid;
  }

  getSid(): string | undefined {
    return this.sid;
  }

  setApiInfoCache(info: SynoApiInfoMap): void {
    this.apiInfo = info;
  }

  getApiInfoCache(): SynoApiInfoMap | undefined {
    return this.apiInfo;
  }

  async resolvePath(api: string): Promise<string> {
    const cached = this.apiInfo?.[api];
    if (cached) return cached.path;
    if (BOOTSTRAP_PATHS[api]) return BOOTSTRAP_PATHS[api]!;

    // Only refetch the map if we haven't already: a cache that simply lacks
    // the api is a hard miss, not a reason to hammer SYNO.API.Info.
    if (!this.apiInfo) {
      this.apiInfoPending ??= this.request<SynoApiInfoMap>({
        api: "SYNO.API.Info",
        version: 1,
        method: "query",
        params: { query: "all" },
      }).finally(() => {
        this.apiInfoPending = undefined;
      });
      this.apiInfo = await this.apiInfoPending;
    }
    const entry = this.apiInfo[api];
    if (!entry) {
      throw new SynoApiError({ code: 102, api, method: "(resolvePath)" });
    }
    return entry.path;
  }

  private buildQuery(req: SynoRequest): URLSearchParams {
    const q = new URLSearchParams();
    q.set("api", req.api);
    q.set("version", String(req.version));
    q.set("method", req.method);
    if (this.sid) q.set("_sid", this.sid);
    if (req.params) {
      for (const [k, v] of Object.entries(req.params)) {
        const encoded = encodeParam(v);
        if (encoded !== undefined) q.set(k, encoded);
      }
    }
    return q;
  }

  private async endpoint(api: string): Promise<URL> {
    const path = await this.resolvePath(api);
    return new URL(`${this.baseUrl}/webapi/${path}`);
  }

  private async send(url: URL, init: RequestInit | undefined, api: string, method: string): Promise<Response> {
    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), init);
    } catch (err) {
      const cause = (err as { cause?: unknown }).cause;
      const reason =
        cause instanceof Error
          ? ((cause as NodeJS.ErrnoException).code ?? cause.message)
          : err instanceof Error
            ? err.message
            : String(err);
      throw new SynoHttpError({ status: 0, api, method, detail: `request failed (${reason})`, cause: err });
    }
    if (!res.ok) {
      throw new SynoHttpError({ status: res.status, api, method });
    }
    return res;
  }

  private async parseEnvelope<T>(res: Response, api: string, method: string): Promise<T> {
    let body: SynoResponse<T>;
    try {
      body = (await res.json()) as SynoResponse<T>;
    } catch (err) {
      throw new SynoHttpError({
        status: res.status,
        api,
        method,
        detail: `expected a JSON envelope but got "${contentTypeOf(res) || "unknown"}" — is the URL pointing at the DSM Web API?`,
        cause: err,
      });
    }
    if (!body || typeof body !== "object" || typeof body.success !== "boolean") {
      throw new SynoHttpError({ status: res.status, api, method, detail: "response is not a Synology envelope" });
    }
    if (!body.success) {
      throw new SynoApiError({ code: body.error?.code ?? 100, api, method });
    }
    return body.data;
  }

  /**
   * Call an API and parse the JSON envelope; throws `SynoApiError` on
   * `success: false` and `SynoHttpError` on transport failures.
   *
   * Defaults to GET with the params in the query string. Pass
   * `httpMethod: "POST"` to send everything (including `_sid`) as an
   * `application/x-www-form-urlencoded` body instead — use it for anything
   * carrying credentials or a large parameter list.
   */
  async request<T>(req: SynoRequest): Promise<T> {
    const url = await this.endpoint(req.api);
    const query = this.buildQuery(req);
    let init: RequestInit | undefined;
    if (req.httpMethod === "POST") {
      init = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: query.toString(),
      };
    } else {
      url.search = query.toString();
    }
    const res = await this.send(url, init, req.api, req.method);
    return this.parseEnvelope<T>(res, req.api, req.method);
  }

  /**
   * Issue a GET and return the raw `Response`. Used for binary endpoints
   * like SYNO.FileStation.Download where the body is the file contents,
   * not a JSON envelope.
   *
   * DSM reports failures on these endpoints as HTTP 200 + a JSON error
   * envelope, so a JSON body is inspected and surfaced as `SynoApiError`
   * before the response is handed back.
   */
  async requestRaw(req: SynoRequest): Promise<Response> {
    const url = await this.endpoint(req.api);
    url.search = this.buildQuery(req).toString();
    const res = await this.send(url, undefined, req.api, req.method);
    if (contentTypeOf(res).startsWith("application/json")) {
      let body: unknown;
      try {
        body = await res.clone().json();
      } catch {
        return res;
      }
      const envelope = body as Partial<SynoResponse<unknown>> | null;
      if (envelope && typeof envelope === "object" && envelope.success === false) {
        throw new SynoApiError({ code: envelope.error?.code ?? 100, api: req.api, method: req.method });
      }
    }
    return res;
  }

  /**
   * POST a multipart body assembled from text fields + a single streaming
   * file part. Unlike {@link SynoClient.requestForm}, this never buffers the
   * file into memory — the file's `stream` is piped straight into the
   * request body. Use this for large uploads.
   *
   * `api`, `version`, `method`, and `_sid` are sent as text fields ahead of
   * the file part (Synology requires the file to be the last part); the
   * caller only adds endpoint payload fields.
   */
  async requestStreamForm<T>(args: {
    api: string;
    version: number;
    method: string;
    fields: Record<string, string>;
    file: MultipartFilePart;
  }): Promise<T> {
    const url = await this.endpoint(args.api);

    const fields: Record<string, string> = {
      api: args.api,
      version: String(args.version),
      method: args.method,
      ...args.fields,
    };
    if (this.sid) fields["_sid"] = this.sid;

    const boundary = `----syno-${randomBytes(16).toString("hex")}`;
    const encoder = new TextEncoder();

    const fieldChunks: Uint8Array[] = [];
    for (const [k, v] of Object.entries(fields)) {
      fieldChunks.push(
        encoder.encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="${escapeHeaderParam(k)}"\r\n\r\n${v}\r\n`,
        ),
      );
    }
    const fileHeader = encoder.encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${escapeHeaderParam(args.file.field)}"; filename="${escapeHeaderParam(args.file.filename)}"\r\n` +
        `Content-Type: ${args.file.contentType ?? "application/octet-stream"}\r\n\r\n`,
    );
    const trailer = encoder.encode(`\r\n--${boundary}--\r\n`);

    let contentLength = 0;
    for (const c of fieldChunks) contentLength += c.length;
    contentLength += fileHeader.length;
    contentLength += args.file.size;
    contentLength += trailer.length;

    const fileStream =
      args.file.stream instanceof Readable
        ? (Readable.toWeb(args.file.stream) as WebReadableStream<Uint8Array>)
        : args.file.stream;

    const expected = args.file.size;
    const filename = args.file.filename;
    async function* parts(): AsyncGenerator<Uint8Array> {
      for (const c of fieldChunks) yield c;
      yield fileHeader;
      const reader = fileStream.getReader();
      let sent = 0;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          sent += value.byteLength;
          if (sent > expected) {
            throw new Error(
              `Upload of "${filename}" aborted: stream produced more than the declared ${expected} bytes (file changed while uploading?)`,
            );
          }
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
      if (sent !== expected) {
        throw new Error(
          `Upload of "${filename}" aborted: stream ended after ${sent} bytes, expected ${expected} (file changed while uploading?)`,
        );
      }
      yield trailer;
    }

    const body = Readable.toWeb(Readable.from(parts())) as unknown as WebReadableStream<Uint8Array>;

    const init = {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(contentLength),
      },
      body,
      duplex: "half" as const,
    } as unknown as RequestInit;

    const res = await this.send(url, init, args.api, args.method);
    return this.parseEnvelope<T>(res, args.api, args.method);
  }

  /**
   * POST a multipart `FormData` body. `api`, `version`, `method`, and `_sid`
   * are placed ahead of the caller's fields (Synology requires the file part
   * to come last), and the caller's `FormData` is left untouched.
   */
  async requestForm<T>(args: {
    api: string;
    version: number;
    method: string;
    form: FormData;
  }): Promise<T> {
    const url = await this.endpoint(args.api);

    const form = new FormData();
    form.set("api", args.api);
    form.set("version", String(args.version));
    form.set("method", args.method);
    if (this.sid) form.set("_sid", this.sid);
    for (const [k, v] of args.form) form.append(k, v);

    const res = await this.send(url, { method: "POST", body: form }, args.api, args.method);
    return this.parseEnvelope<T>(res, args.api, args.method);
  }
}
