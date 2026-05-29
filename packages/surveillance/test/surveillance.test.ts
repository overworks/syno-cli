import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { getInfo, getSnapshot, listCameras, listRecordings } from "../src/index.js";

function client(handler: (url: URL) => { json?: unknown; raw?: BodyInit }): SynoClient {
  const fetchImpl = vi.fn(async (input: string) => {
    const url = new URL(input);
    const out = handler(url);
    if (out.raw !== undefined) {
      return new Response(out.raw, { status: 200, headers: { "content-type": "image/jpeg" } });
    }
    return new Response(JSON.stringify(out.json), { status: 200 });
  });
  const c = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
  c.setApiInfoCache({
    "SYNO.SurveillanceStation.Info": { path: "entry.cgi", minVersion: 1, maxVersion: 1 },
    "SYNO.SurveillanceStation.Camera": { path: "entry.cgi", minVersion: 1, maxVersion: 9 },
    "SYNO.SurveillanceStation.Recording": { path: "entry.cgi", minVersion: 1, maxVersion: 6 },
  });
  return c;
}

describe("getInfo", () => {
  it("GETs SYNO.SurveillanceStation.Info method=GetInfo", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.SurveillanceStation.Info");
      expect(url.searchParams.get("method")).toBe("GetInfo");
      return { json: { success: true, data: { cameraNumber: 3 } } };
    });
    const info = await getInfo(c);
    expect(info.cameraNumber).toBe(3);
  });
});

describe("listCameras", () => {
  it("GETs Camera method=List with paging flags and returns cameras", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.SurveillanceStation.Camera");
      expect(url.searchParams.get("method")).toBe("List");
      expect(url.searchParams.get("version")).toBe("9");
      expect(url.searchParams.get("basic")).toBe("true");
      return {
        json: {
          success: true,
          data: { total: 1, cameras: [{ id: 1, newName: "Front Door", status: 1 }] },
        },
      };
    });
    const page = await listCameras(c, { basic: true });
    expect(page.cameras?.[0]?.newName).toBe("Front Door");
  });
});

describe("getSnapshot", () => {
  it("uses requestRaw and returns the binary Response", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.SurveillanceStation.Camera");
      expect(url.searchParams.get("method")).toBe("GetSnapshot");
      expect(url.searchParams.get("cameraId")).toBe("1");
      return { raw: "\xff\xd8\xff\xe0JFIF-bytes" };
    });
    const res = await getSnapshot(c, { cameraId: 1 });
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(await res.text()).toContain("JFIF");
  });
});

describe("listRecordings", () => {
  it("joins cameraIds and passes time range", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.SurveillanceStation.Recording");
      expect(url.searchParams.get("method")).toBe("List");
      expect(url.searchParams.get("cameraIds")).toBe("1,2");
      expect(url.searchParams.get("fromTime")).toBe("1700000000");
      return { json: { success: true, data: { total: 0, recordings: [] } } };
    });
    const page = await listRecordings(c, { cameraIds: [1, 2], fromTime: 1700000000 });
    expect(page.total).toBe(0);
  });
});
