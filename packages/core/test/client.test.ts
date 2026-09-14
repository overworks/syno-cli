import { describe, expect, it, vi } from "vitest";
import { SynoApiError, SynoClient, SynoHttpError } from "../src/index.js";
import type { SynoApiInfoMap } from "../src/index.js";

function mockFetch(handler: (url: URL) => unknown) {
  return vi.fn(async (input: string) => {
    const url = new URL(input);
    const body = handler(url);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
}

describe("SynoClient.request", () => {
  it("uses bootstrap path for SYNO.API.Info and includes api/version/method params", async () => {
    const fetchImpl = mockFetch((url) => {
      expect(url.pathname).toBe("/webapi/query.cgi");
      expect(url.searchParams.get("api")).toBe("SYNO.API.Info");
      expect(url.searchParams.get("version")).toBe("1");
      expect(url.searchParams.get("method")).toBe("query");
      expect(url.searchParams.get("query")).toBe("all");
      const data: SynoApiInfoMap = {
        "SYNO.API.Auth": { path: "auth.cgi", minVersion: 1, maxVersion: 7 },
      };
      return { success: true, data };
    });

    const client = new SynoClient({ baseUrl: "https://nas.example:5001/", fetch: fetchImpl });
    const info = await client.request<SynoApiInfoMap>({
      api: "SYNO.API.Info",
      version: 1,
      method: "query",
      params: { query: "all" },
    });

    expect(info["SYNO.API.Auth"]?.path).toBe("auth.cgi");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("appends _sid when present", async () => {
    const fetchImpl = mockFetch((url) => {
      expect(url.searchParams.get("_sid")).toBe("abc123");
      return { success: true, data: { ok: 1 } };
    });

    const client = new SynoClient({
      baseUrl: "https://nas.example:5001",
      sid: "abc123",
      fetch: fetchImpl,
    });
    client.setApiInfoCache({
      "SYNO.FakeApi": { path: "fake.cgi", minVersion: 1, maxVersion: 1 },
    });

    await client.request({ api: "SYNO.FakeApi", version: 1, method: "ping" });
  });

  it("throws SynoApiError on success=false with the response code", async () => {
    const fetchImpl = mockFetch(() => ({ success: false, error: { code: 105 } }));
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.X": { path: "x.cgi", minVersion: 1, maxVersion: 1 } });

    await expect(
      client.request({ api: "SYNO.X", version: 1, method: "do" }),
    ).rejects.toMatchObject({ name: "SynoApiError", code: 105, api: "SYNO.X", method: "do" });
  });

  it("resolvePath auto-queries SYNO.API.Info when api is unknown and caches the result", async () => {
    let infoCalls = 0;
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      if (url.searchParams.get("api") === "SYNO.API.Info") {
        infoCalls++;
        return new Response(
          JSON.stringify({
            success: true,
            data: { "SYNO.Lazy": { path: "lazy.cgi", minVersion: 1, maxVersion: 1 } },
          }),
          { status: 200 },
        );
      }
      expect(url.pathname).toBe("/webapi/lazy.cgi");
      return new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 });
    });

    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await client.request({ api: "SYNO.Lazy", version: 1, method: "go" });
    await client.request({ api: "SYNO.Lazy", version: 1, method: "go" });

    expect(infoCalls).toBe(1);
  });

  it("throws 102 when API is not found in info map", async () => {
    const fetchImpl = mockFetch(() => ({ success: true, data: {} }));
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await expect(
      client.request({ api: "SYNO.Missing", version: 1, method: "go" }),
    ).rejects.toBeInstanceOf(SynoApiError);
  });

  it("JSON-encodes array and object params", async () => {
    const fetchImpl = mockFetch((url) => {
      expect(url.searchParams.get("path")).toBe('["/home/a","/home/b"]');
      expect(url.searchParams.get("opts")).toBe('{"recursive":true}');
      expect(url.searchParams.get("flag")).toBe("false");
      expect(url.searchParams.has("missing")).toBe(false);
      return { success: true, data: { ok: true } };
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.X": { path: "x.cgi", minVersion: 1, maxVersion: 1 } });

    await client.request({
      api: "SYNO.X",
      version: 1,
      method: "do",
      params: { path: ["/home/a", "/home/b"], opts: { recursive: true }, flag: false, missing: undefined },
    });
  });
});

describe("SynoClient.requestRaw", () => {
  it("returns the raw Response for binary endpoints", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("hello", { status: 200, headers: { "content-type": "application/octet-stream" } }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });

    const res = await client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" });
    expect(await res.text()).toBe("hello");
  });

  it("throws SynoHttpError when the HTTP status is not ok", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });

    const err = await client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" }).catch((e) => e);
    expect(err).toBeInstanceOf(SynoHttpError);
    expect(err).not.toBeInstanceOf(SynoApiError);
    expect(err).toMatchObject({ status: 500, api: "SYNO.Dl" });
  });

  it("surfaces a 200 + JSON error envelope as SynoApiError instead of returning it as bytes", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: { code: 408 } }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });

    await expect(
      client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" }),
    ).rejects.toMatchObject({ name: "SynoApiError", code: 408 });
  });

  it("passes a genuine JSON file through untouched", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('{"hello":"world"}', { status: 200, headers: { "content-type": "application/json" } }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });

    const res = await client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" });
    expect(await res.text()).toBe('{"hello":"world"}');
  });

  it("includes _sid on raw requests", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      expect(new URL(input).searchParams.get("_sid")).toBe("sid-raw");
      return new Response("x", { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid: "sid-raw", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });
    await client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" });
  });
});

describe("SynoClient.requestForm", () => {
  it("POSTs FormData with api/version/method/_sid auto-appended", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      const body = init?.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get("api")).toBe("SYNO.Up");
      expect(body.get("version")).toBe("2");
      expect(body.get("method")).toBe("upload");
      expect(body.get("_sid")).toBe("sid-7");
      expect(body.get("path")).toBe("/home");
      // Synology requires the file part to be last; meta fields go first.
      expect([...body.keys()]).toEqual(["api", "version", "method", "_sid", "path", "file"]);
      expect((body.get("file") as File).name).toBe("x.txt");
      return new Response(JSON.stringify({ success: true, data: { name: "x.txt" } }), { status: 200 });
    });
    const client = new SynoClient({
      baseUrl: "https://nas.example:5001",
      sid: "sid-7",
      fetch: fetchImpl,
    });
    client.setApiInfoCache({ "SYNO.Up": { path: "upload.cgi", minVersion: 2, maxVersion: 2 } });

    const form = new FormData();
    form.set("path", "/home");
    form.set("file", new File(["x"], "x.txt"), "x.txt");
    const out = await client.requestForm<{ name: string }>({
      api: "SYNO.Up",
      version: 2,
      method: "upload",
      form,
    });
    expect(out.name).toBe("x.txt");
    // The caller's form is not mutated (no sid leaks into it).
    expect([...form.keys()]).toEqual(["path", "file"]);
  });

  it("throws SynoApiError on success=false", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: { code: 408 } }), { status: 200 }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Up": { path: "upload.cgi", minVersion: 2, maxVersion: 2 } });

    await expect(
      client.requestForm({ api: "SYNO.Up", version: 2, method: "upload", form: new FormData() }),
    ).rejects.toMatchObject({ code: 408 });
  });
});

describe("SynoClient transport errors", () => {
  const cache = { "SYNO.X": { path: "x.cgi", minVersion: 1, maxVersion: 1 } };

  it("does not map an HTTP status through the Synology auth table", async () => {
    const fetchImpl = vi.fn(async () => new Response("not found", { status: 404 }));
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    const err = await client.request({ api: "SYNO.API.Auth", version: 6, method: "login" }).catch((e) => e);
    expect(err).toBeInstanceOf(SynoHttpError);
    expect(err.message).toContain("HTTP 404");
    expect(err.message).not.toContain("2-step");
  });

  it("wraps a non-JSON 200 body in SynoHttpError with api/method context", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("<html>login</html>", { status: 200, headers: { "content-type": "text/html" } }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache(cache);
    const err = await client.request({ api: "SYNO.X", version: 1, method: "do" }).catch((e) => e);
    expect(err).toBeInstanceOf(SynoHttpError);
    expect(err.message).toContain("SYNO.X.do");
    expect(err.message).toContain("text/html");
  });

  it("wraps a fetch rejection and surfaces the underlying cause code", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed", { cause: Object.assign(new Error("connect"), { code: "ECONNREFUSED" }) });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache(cache);
    const err = await client.request({ api: "SYNO.X", version: 1, method: "do" }).catch((e) => e);
    expect(err).toBeInstanceOf(SynoHttpError);
    expect(err.message).toContain("ECONNREFUSED");
  });

  it("rejects a baseUrl without a scheme up front", () => {
    expect(() => new SynoClient({ baseUrl: "nas.example:5001" })).toThrow(/Invalid DSM URL/);
    expect(() => new SynoClient({ baseUrl: "ftp://nas" })).toThrow(/http or https/);
  });

  it("POST requests put params and _sid in the body, not the URL", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      expect(url.search).toBe("");
      expect(init?.method).toBe("POST");
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("_sid")).toBe("s1");
      expect(body.get("secret")).toBe("p");
      return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid: "s1", fetch: fetchImpl });
    client.setApiInfoCache(cache);
    await client.request({ api: "SYNO.X", version: 1, method: "do", httpMethod: "POST", params: { secret: "p" } });
  });
});

describe("SynoClient.resolvePath", () => {
  it("dedupes concurrent SYNO.API.Info fetches", async () => {
    let infoCalls = 0;
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      if (url.searchParams.get("api") === "SYNO.API.Info") {
        infoCalls++;
        await new Promise((r) => setTimeout(r, 5));
        return new Response(
          JSON.stringify({ success: true, data: { "SYNO.A": { path: "a.cgi", minVersion: 1, maxVersion: 1 } } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await Promise.all([
      client.request({ api: "SYNO.A", version: 1, method: "a" }),
      client.request({ api: "SYNO.A", version: 1, method: "a" }),
      client.request({ api: "SYNO.A", version: 1, method: "a" }),
    ]);
    expect(infoCalls).toBe(1);
  });

  it("does not refetch when a pre-set cache lacks the api", async () => {
    const fetchImpl = vi.fn();
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.A": { path: "a.cgi", minVersion: 1, maxVersion: 1 } });
    await expect(client.request({ api: "SYNO.B", version: 1, method: "b" })).rejects.toMatchObject({ code: 102 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
