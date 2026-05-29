import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { SynoApiError } from "./errors.js";
import type { SynoApiInfoMap, SynoRequest, SynoResponse } from "./types.js";

export interface MultipartFilePart {
  /** Form field name (e.g. `"file"`). */
  field: string;
  /** Filename to record in the part's Content-Disposition. */
  filename: string;
  /** Source bytes. Node stream or web stream, both accepted. */
  stream: WebReadableStream<Uint8Array> | NodeJS.ReadableStream;
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

export class SynoClient {
  readonly baseUrl: string;
  private sid: string | undefined;
  private readonly fetchImpl: FetchLike;
  private apiInfo: SynoApiInfoMap | undefined;

  constructor(options: SynoClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
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

    const info = await this.request<SynoApiInfoMap>({
      api: "SYNO.API.Info",
      version: 1,
      method: "query",
      params: { query: "all" },
    });
    this.apiInfo = info;
    const entry = info[api];
    if (!entry) {
      throw new SynoApiError({ code: 102, api, method: "(resolvePath)" });
    }
    return entry.path;
  }

  private async buildUrl(req: SynoRequest): Promise<URL> {
    const path = await this.resolvePath(req.api);
    const url = new URL(`${this.baseUrl}/webapi/${path}`);
    url.searchParams.set("api", req.api);
    url.searchParams.set("version", String(req.version));
    url.searchParams.set("method", req.method);
    if (this.sid) url.searchParams.set("_sid", this.sid);
    if (req.params) {
      for (const [k, v] of Object.entries(req.params)) {
        const encoded = encodeParam(v);
        if (encoded !== undefined) url.searchParams.set(k, encoded);
      }
    }
    return url;
  }

  /** Issue a GET, parse the JSON envelope, throw on `success: false`. */
  async request<T>(req: SynoRequest): Promise<T> {
    const url = await this.buildUrl(req);
    const res = await this.fetchImpl(url.toString());
    if (!res.ok) {
      throw new SynoApiError({ code: res.status, api: req.api, method: req.method });
    }
    const body = (await res.json()) as SynoResponse<T>;
    if (!body.success) {
      throw new SynoApiError({ code: body.error.code, api: req.api, method: req.method });
    }
    return body.data;
  }

  /**
   * Issue a GET and return the raw `Response`. Used for binary endpoints
   * like SYNO.FileStation.Download where the body is the file contents,
   * not a JSON envelope.
   */
  async requestRaw(req: SynoRequest): Promise<Response> {
    const url = await this.buildUrl(req);
    const res = await this.fetchImpl(url.toString());
    if (!res.ok) {
      throw new SynoApiError({ code: res.status, api: req.api, method: req.method });
    }
    return res;
  }

  /**
   * POST a multipart body assembled from text fields + a single streaming
   * file part. Unlike {@link SynoClient.requestForm}, this never buffers the
   * file into memory — the file's `stream` is piped straight into the
   * request body. Use this for large uploads.
   *
   * `api`, `version`, `method`, and `_sid` are appended as text fields
   * automatically; the caller only adds endpoint payload fields.
   */
  async requestStreamForm<T>(args: {
    api: string;
    version: number;
    method: string;
    fields: Record<string, string>;
    file: MultipartFilePart;
  }): Promise<T> {
    const path = await this.resolvePath(args.api);
    const url = new URL(`${this.baseUrl}/webapi/${path}`);

    const fields: Record<string, string> = {
      ...args.fields,
      api: args.api,
      version: String(args.version),
      method: args.method,
    };
    if (this.sid) fields["_sid"] = this.sid;

    const boundary = `------syno-${Math.random().toString(16).slice(2, 14)}`;
    const encoder = new TextEncoder();

    const fieldChunks: Uint8Array[] = [];
    for (const [k, v] of Object.entries(fields)) {
      fieldChunks.push(
        encoder.encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`,
        ),
      );
    }
    const fileHeader = encoder.encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${args.file.field}"; filename="${args.file.filename}"\r\n` +
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
        : (args.file.stream as WebReadableStream<Uint8Array>);

    async function* parts(): AsyncGenerator<Uint8Array> {
      for (const c of fieldChunks) yield c;
      yield fileHeader;
      const reader = fileStream.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) yield value;
        }
      } finally {
        reader.releaseLock();
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

    const res = await this.fetchImpl(url.toString(), init);
    if (!res.ok) {
      throw new SynoApiError({ code: res.status, api: args.api, method: args.method });
    }
    const json = (await res.json()) as SynoResponse<T>;
    if (!json.success) {
      throw new SynoApiError({ code: json.error.code, api: args.api, method: args.method });
    }
    return json.data;
  }

  /**
   * POST a multipart `FormData` body. `api`, `version`, `method`, and `_sid`
   * are appended to the form automatically — the caller only adds endpoint
   * payload fields (e.g. `path`, `file`, `overwrite`).
   */
  async requestForm<T>(args: {
    api: string;
    version: number;
    method: string;
    form: FormData;
  }): Promise<T> {
    const path = await this.resolvePath(args.api);
    const url = new URL(`${this.baseUrl}/webapi/${path}`);

    args.form.set("api", args.api);
    args.form.set("version", String(args.version));
    args.form.set("method", args.method);
    if (this.sid) args.form.set("_sid", this.sid);

    const res = await this.fetchImpl(url.toString(), {
      method: "POST",
      body: args.form,
    });
    if (!res.ok) {
      throw new SynoApiError({ code: res.status, api: args.api, method: args.method });
    }
    const body = (await res.json()) as SynoResponse<T>;
    if (!body.success) {
      throw new SynoApiError({ code: body.error.code, api: args.api, method: args.method });
    }
    return body.data;
  }
}
