import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { getStatus, listLogs } from "../src/index.js";

function client(handler: (url: URL) => unknown): SynoClient {
  const fetchImpl = vi.fn(async (input: string) => {
    const url = new URL(input);
    return new Response(JSON.stringify(handler(url)), { status: 200 });
  });
  const c = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
  c.setApiInfoCache({
    "SYNO.Core.SyslogClient.Log": { path: "entry.cgi", minVersion: 1, maxVersion: 1 },
    "SYNO.Core.SyslogClient.Status": { path: "entry.cgi", minVersion: 1, maxVersion: 1 },
  });
  return c;
}

describe("listLogs", () => {
  it("GETs SYNO.Core.SyslogClient.Log method=list with filters mapped", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Core.SyslogClient.Log");
      expect(url.searchParams.get("method")).toBe("list");
      expect(url.searchParams.get("level")).toBe("error");
      expect(url.searchParams.get("keyword")).toBe("login");
      expect(url.searchParams.get("logtype")).toBe("connection");
      return {
        success: true,
        data: { total: 1, items: [{ time: "2026-05-29 10:21:34", level: "Error", who: "admin", descr: "x" }] },
      };
    });
    const page = await listLogs(c, { level: "error", keyword: "login", logType: "connection" });
    expect(page.items?.[0]?.who).toBe("admin");
  });
});

describe("getStatus", () => {
  it("GETs SYNO.Core.SyslogClient.Status method=get", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Core.SyslogClient.Status");
      expect(url.searchParams.get("method")).toBe("get");
      return { success: true, data: { total: 4096, eps: 2 } };
    });
    const s = await getStatus(c);
    expect(s.total).toBe(4096);
    expect(s.eps).toBe(2);
  });
});
