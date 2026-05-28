import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@syno-cli/core";
import { download } from "../src/index.js";

describe("download", () => {
  it("hits SYNO.FileStation.Download and returns the raw Response", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get("api")).toBe("SYNO.FileStation.Download");
      expect(url.searchParams.get("method")).toBe("download");
      expect(url.searchParams.get("path")).toBe("/home/me/photo.jpg");
      expect(url.searchParams.get("mode")).toBe("download");
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Download": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });

    const res = await download(client, { path: "/home/me/photo.jpg" });
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(buf)).toEqual([1, 2, 3]);
  });
});
