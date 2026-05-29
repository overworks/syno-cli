import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { list, listShares } from "../src/index.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("listShares", () => {
  it("calls SYNO.FileStation.List method=list_share", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get("api")).toBe("SYNO.FileStation.List");
      expect(url.searchParams.get("method")).toBe("list_share");
      expect(url.searchParams.get("additional")).toBe('["size","owner"]');
      return jsonResponse({
        success: true,
        data: { total: 1, offset: 0, shares: [{ name: "home", path: "/home", isdir: true }] },
      });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.List": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });

    const page = await listShares(client, { additional: ["size", "owner"] });
    expect(page.shares[0]?.name).toBe("home");
  });
});

describe("list", () => {
  it("encodes folder_path and filetype", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get("method")).toBe("list");
      expect(url.searchParams.get("folder_path")).toBe("/home/me");
      expect(url.searchParams.get("filetype")).toBe("file");
      return jsonResponse({
        success: true,
        data: { total: 0, offset: 0, files: [] },
      });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.List": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });

    const page = await list(client, "/home/me", { filetype: "file" });
    expect(page.files).toEqual([]);
  });
});
