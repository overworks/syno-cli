import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { upload } from "../src/index.js";

describe("upload", () => {
  it("POSTs multipart FormData with path/overwrite/file", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(init?.method).toBe("POST");
      expect(form.get("api")).toBe("SYNO.FileStation.Upload");
      expect(form.get("method")).toBe("upload");
      expect(form.get("path")).toBe("/home/me");
      expect(form.get("overwrite")).toBe("true");
      const file = form.get("file");
      expect(file).toBeInstanceOf(File);
      expect((file as File).name).toBe("hello.txt");
      expect(await (file as File).text()).toBe("payload");
      return new Response(
        JSON.stringify({ success: true, data: { name: "hello.txt", path: "/home/me/hello.txt" } }),
        { status: 200 },
      );
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });

    const res = await upload(client, {
      destPath: "/home/me",
      filename: "hello.txt",
      data: "payload",
      overwrite: true,
    });
    expect(res.path).toBe("/home/me/hello.txt");
  });
});
