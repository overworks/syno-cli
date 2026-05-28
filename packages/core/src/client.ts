import { SynoApiError } from "./errors.js";
import type { SynoApiInfoMap, SynoRequest, SynoResponse } from "./types.js";

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

  async request<T>(req: SynoRequest): Promise<T> {
    const path = await this.resolvePath(req.api);
    const url = new URL(`${this.baseUrl}/webapi/${path}`);
    url.searchParams.set("api", req.api);
    url.searchParams.set("version", String(req.version));
    url.searchParams.set("method", req.method);
    if (this.sid) url.searchParams.set("_sid", this.sid);
    if (req.params) {
      for (const [k, v] of Object.entries(req.params)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }

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
}
