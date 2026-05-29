import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { getStorageInfo, getSystemInfo, getUtilization } from "../src/index.js";

function client(handler: (url: URL) => unknown): SynoClient {
  const fetchImpl = vi.fn(async (input: string) => {
    const url = new URL(input);
    return new Response(JSON.stringify(handler(url)), { status: 200 });
  });
  const c = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
  c.setApiInfoCache({
    "SYNO.Core.System": { path: "entry.cgi", minVersion: 1, maxVersion: 3 },
    "SYNO.Core.System.Utilization": { path: "entry.cgi", minVersion: 1, maxVersion: 1 },
    "SYNO.Storage.CGI.Storage": { path: "entry.cgi", minVersion: 1, maxVersion: 1 },
  });
  return c;
}

describe("getSystemInfo", () => {
  it("GETs SYNO.Core.System method=info and returns data", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Core.System");
      expect(url.searchParams.get("method")).toBe("info");
      expect(url.searchParams.get("version")).toBe("1");
      return {
        success: true,
        data: { model: "DS220+", firmware_ver: "DSM 7.2-64570", up_time: "10:21:34:56", temperature: 44 },
      };
    });
    const info = await getSystemInfo(c);
    expect(info.model).toBe("DS220+");
    expect(info.temperature).toBe(44);
  });
});

describe("getUtilization", () => {
  it("GETs SYNO.Core.System.Utilization method=get and returns data", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Core.System.Utilization");
      expect(url.searchParams.get("method")).toBe("get");
      return {
        success: true,
        data: {
          cpu: { user_load: 1, system_load: 0, other_load: 2 },
          memory: { real_usage: 21, swap_usage: 7 },
          network: [{ device: "total", rx: 6822, tx: 6336 }],
          time: 1749998465,
        },
      };
    });
    const u = await getUtilization(c);
    expect(u.cpu?.user_load).toBe(1);
    expect(u.memory?.real_usage).toBe(21);
    expect(u.network?.[0]?.device).toBe("total");
  });
});

describe("getStorageInfo", () => {
  it("GETs SYNO.Storage.CGI.Storage method=load_info and returns data", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Storage.CGI.Storage");
      expect(url.searchParams.get("method")).toBe("load_info");
      return {
        success: true,
        data: {
          volumes: [
            {
              id: "volume_1",
              display_name: "Volume 1",
              fs_type: "btrfs",
              status: "normal",
              size: { total: "206158430208", used: "7398944768" },
            },
          ],
          disks: [{ id: "sata1", name: "Drive 1", status: "normal", smart_status: "normal", temp: 35 }],
        },
      };
    });
    const s = await getStorageInfo(c);
    expect(s.volumes?.[0]?.size?.total).toBe("206158430208");
    expect(s.disks?.[0]?.temp).toBe(35);
  });
});
