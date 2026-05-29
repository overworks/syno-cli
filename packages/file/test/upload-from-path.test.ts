import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SynoClient } from "@overworks/syno-core";
import { uploadFromPath } from "../src/index.js";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "syno-file-upload-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("uploadFromPath", () => {
  it("streams the file via requestStreamForm with overwrite/create_parents/mtime", async () => {
    const local = join(workDir, "report.pdf");
    const payload = "%PDF fake-bytes\n";
    await writeFile(local, payload);

    const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      const body = await new Response(init?.body as BodyInit).text();
      expect(body).toContain('name="path"\r\n\r\n/home/me\r\n');
      expect(body).toContain('name="overwrite"\r\n\r\ntrue\r\n');
      expect(body).toContain('name="create_parents"\r\n\r\ntrue\r\n');
      expect(body).toMatch(/name="mtime"\r\n\r\n\d+\r\n/);
      expect(body).toContain('name="file"; filename="report.pdf"');
      expect(body).toContain(payload);
      return new Response(
        JSON.stringify({ success: true, data: { name: "report.pdf", path: "/home/me/report.pdf" } }),
        { status: 200 },
      );
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });

    const res = await uploadFromPath(client, {
      destPath: "/home/me",
      localPath: local,
      overwrite: true,
      createParents: true,
    });
    expect(res.path).toBe("/home/me/report.pdf");
  });

  it("honors filename override and skip overwrite mode", async () => {
    const local = join(workDir, "real.bin");
    await writeFile(local, "data");

    const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
      const body = await new Response(init?.body as BodyInit).text();
      expect(body).toContain('name="overwrite"\r\n\r\nskip\r\n');
      expect(body).toContain('filename="renamed.bin"');
      return new Response(
        JSON.stringify({ success: true, data: { name: "renamed.bin", path: "/dest/renamed.bin" } }),
        { status: 200 },
      );
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });

    await uploadFromPath(client, {
      destPath: "/dest",
      localPath: local,
      filename: "renamed.bin",
      overwrite: "skip",
    });
  });

  it("throws when the local path is not a regular file", async () => {
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: vi.fn() });
    await expect(
      uploadFromPath(client, { destPath: "/dest", localPath: workDir }),
    ).rejects.toThrow(/not a regular file/);
  });
});
