import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { download, listAlbums, listItems } from "../src/index.js";

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
    "SYNO.Foto.Browse.Album": { path: "entry.cgi", minVersion: 1, maxVersion: 4 },
    "SYNO.Foto.Browse.Item": { path: "entry.cgi", minVersion: 1, maxVersion: 4 },
    "SYNO.Foto.Download": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
  });
  return c;
}

describe("listAlbums", () => {
  it("GETs SYNO.Foto.Browse.Album method=list", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Foto.Browse.Album");
      expect(url.searchParams.get("method")).toBe("list");
      return { json: { success: true, data: { list: [{ id: 3, name: "Vacation", item_count: 12 }] } } };
    });
    const page = await listAlbums(c, { limit: 50 });
    expect(page.list?.[0]?.name).toBe("Vacation");
  });
});

describe("listItems", () => {
  it("maps albumId/type to album_id/type query params", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Foto.Browse.Item");
      expect(url.searchParams.get("method")).toBe("list");
      expect(url.searchParams.get("album_id")).toBe("3");
      expect(url.searchParams.get("type")).toBe("photo");
      return {
        json: {
          success: true,
          data: { totalCount: 1, items: [{ id: 1, filename: "p.jpg", item_type: "photo" }] },
        },
      };
    });
    const page = await listItems(c, { albumId: 3, type: "photo" });
    expect(page.items?.[0]?.filename).toBe("p.jpg");
  });
});

describe("download", () => {
  it("uses requestRaw with item_id array and returns binary Response", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.Foto.Download");
      expect(url.searchParams.get("method")).toBe("download");
      expect(url.searchParams.get("item_id")).toBe("[42]");
      return { raw: "\xff\xd8\xff\xe0JFIF-bytes" };
    });
    const res = await download(c, { itemId: 42 });
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(await res.text()).toContain("JFIF");
  });
});
