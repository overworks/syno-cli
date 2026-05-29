import { describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";
import { SynoClient } from "../src/index.js";

function streamFromString(s: string): Readable {
  return Readable.from(Buffer.from(s, "utf-8"));
}

describe("SynoClient.requestStreamForm", () => {
  it("POSTs a multipart body with text fields + a streamed file part", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      const headers = new Headers(init?.headers);
      expect(headers.get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
      expect(headers.get("content-length")).toMatch(/^\d+$/);

      const bodyText = await new Response(init?.body as BodyInit).text();

      expect(bodyText).toContain('name="path"');
      expect(bodyText).toContain("/home/me");
      expect(bodyText).toContain('name="api"');
      expect(bodyText).toContain("SYNO.FileStation.Upload");
      expect(bodyText).toContain('name="_sid"');
      expect(bodyText).toContain("sid-xyz");
      expect(bodyText).toContain('name="file"; filename="hello.txt"');
      expect(bodyText).toContain("Content-Type: application/octet-stream");
      expect(bodyText).toContain("payload-bytes");
      expect(bodyText).toMatch(/--+syno-[0-9a-f]+--\r\n$/);

      const url = new URL(input);
      expect(url.pathname).toBe("/webapi/entry.cgi");

      return new Response(
        JSON.stringify({ success: true, data: { name: "hello.txt", path: "/home/me/hello.txt" } }),
        { status: 200 },
      );
    });

    const client = new SynoClient({
      baseUrl: "https://nas.example:5001",
      fetch: fetchImpl,
      sid: "sid-xyz",
    });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });

    const payload = "payload-bytes";
    const res = await client.requestStreamForm<{ name: string; path: string }>({
      api: "SYNO.FileStation.Upload",
      version: 2,
      method: "upload",
      fields: { path: "/home/me", overwrite: "true" },
      file: {
        field: "file",
        filename: "hello.txt",
        stream: streamFromString(payload),
        size: Buffer.byteLength(payload, "utf-8"),
      },
    });
    expect(res.path).toBe("/home/me/hello.txt");
  });

  it("reports Content-Length matching the assembled body", async () => {
    let observed = "";
    let claimedLength = 0;
    const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      claimedLength = Number(headers.get("content-length"));
      observed = await new Response(init?.body as BodyInit).text();
      return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });
    await client.requestStreamForm({
      api: "SYNO.FileStation.Upload",
      version: 2,
      method: "upload",
      fields: { path: "/dest" },
      file: {
        field: "file",
        filename: "x.bin",
        stream: streamFromString("12345"),
        size: 5,
      },
    });
    expect(Buffer.byteLength(observed, "utf-8")).toBe(claimedLength);
  });

  it("throws SynoApiError on transport failure", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("nope", { status: 500 }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Upload": { path: "entry.cgi", minVersion: 2, maxVersion: 2 },
    });
    await expect(
      client.requestStreamForm({
        api: "SYNO.FileStation.Upload",
        version: 2,
        method: "upload",
        fields: { path: "/dest" },
        file: {
          field: "file",
          filename: "x",
          stream: streamFromString("x"),
          size: 1,
        },
      }),
    ).rejects.toThrow();
  });
});
