import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { createFolder } from "../src/index.js";

describe("createFolder", () => {
  it("calls SYNO.FileStation.CreateFolder.create with folder_path/name/force_parent", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get("api")).toBe("SYNO.FileStation.CreateFolder");
      expect(url.searchParams.get("method")).toBe("create");
      expect(url.searchParams.get("folder_path")).toBe("/home/me");
      expect(url.searchParams.get("name")).toBe("new");
      expect(url.searchParams.get("force_parent")).toBe("true");
      return new Response(
        JSON.stringify({ success: true, data: { folders: [{ name: "new", path: "/home/me/new", isdir: true }] } }),
        { status: 200 },
      );
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.CreateFolder": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });
    const out = await createFolder(client, { folderPath: "/home/me", name: "new", forceParent: true });
    expect(out.folders[0]?.path).toBe("/home/me/new");
  });

  it("drops force_parent when omitted", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      expect(new URL(input).searchParams.has("force_parent")).toBe(false);
      return new Response(JSON.stringify({ success: true, data: { folders: [] } }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.CreateFolder": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });
    await createFolder(client, { folderPath: "/x", name: "y" });
  });
});
