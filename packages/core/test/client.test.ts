import { describe, expect, it, vi } from "vitest";
import { SynoApiError, SynoClient } from "../src/index.js";
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

  it("throws SynoApiError when the HTTP status is not ok", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.Dl": { path: "download.cgi", minVersion: 1, maxVersion: 2 } });

    await expect(
      client.requestRaw({ api: "SYNO.Dl", version: 2, method: "download" }),
    ).rejects.toMatchObject({ code: 500, api: "SYNO.Dl" });
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
    const out = await client.requestForm<{ name: string }>({
      api: "SYNO.Up",
      version: 2,
      method: "upload",
      form,
    });
    expect(out.name).toBe("x.txt");
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
