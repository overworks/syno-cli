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
});
