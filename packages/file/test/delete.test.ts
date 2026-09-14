import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { del, startDelete, stopDelete } from "../src/index.js";

describe("del (blocking wrapper)", () => {
  it("starts a delete task and polls status until finished", async () => {
    const responses: unknown[] = [
      { success: true, data: { taskid: "task-1" } },
      { success: true, data: { finished: false, processed_num: 1, total: 3, progress: 0.33 } },
      { success: true, data: { finished: false, processed_num: 2, total: 3, progress: 0.66 } },
      { success: true, data: { finished: true, processed_num: 3, total: 3, progress: 1 } },
    ];
    const fetchImpl = vi.fn(async (input: string) => {
      const url = new URL(input);
      const next = responses.shift();
      if (responses.length === 3) {
        expect(url.searchParams.get("method")).toBe("start");
        expect(url.searchParams.get("path")).toBe('["/x/y"]');
        expect(url.searchParams.get("recursive")).toBe("true");
      } else {
        expect(url.searchParams.get("method")).toBe("status");
        expect(url.searchParams.get("taskid")).toBe("task-1");
      }
      return new Response(JSON.stringify(next), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({
      "SYNO.FileStation.Delete": { path: "entry.cgi", minVersion: 1, maxVersion: 2 },
    });

    const progress: number[] = [];
    const status = await del(client, {
      path: "/x/y",
      recursive: true,
      sleep: async () => undefined,
      onProgress: (s) => progress.push(s.processed_num),
    });

    expect(status.finished).toBe(true);
    expect(progress).toEqual([1, 2, 3]);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });
});

describe("del timeout", () => {
  it("stops the task and throws once the deadline passes", async () => {
    const methods: string[] = [];
    const fetchImpl = vi.fn(async (input: string) => {
      const method = new URL(input).searchParams.get("method")!;
      methods.push(method);
      const data =
        method === "start"
          ? { taskid: "t" }
          : method === "stop"
            ? {}
            : { finished: false, processed_num: 0, total: 1, progress: 0 };
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.FileStation.Delete": { path: "entry.cgi", minVersion: 1, maxVersion: 2 } });

    let clock = 0;
    await expect(
      del(client, { path: "/x", timeoutMs: 1000, sleep: async () => undefined, now: () => (clock += 600) }),
    ).rejects.toThrow(/timed out after 1000ms/);
    expect(methods).toEqual(["start", "status", "status", "stop"]);
  });
});

describe("startDelete / stopDelete", () => {
  it("encode path as a JSON array and pass taskid to stop", async () => {
    const seen: URL[] = [];
    const fetchImpl = vi.fn(async (input: string) => {
      seen.push(new URL(input));
      return new Response(JSON.stringify({ success: true, data: { taskid: "t9" } }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    client.setApiInfoCache({ "SYNO.FileStation.Delete": { path: "entry.cgi", minVersion: 1, maxVersion: 2 } });

    const { taskid } = await startDelete(client, { path: ["/a", "/b"], recursive: false });
    expect(seen[0]?.searchParams.get("path")).toBe('["/a","/b"]');
    expect(seen[0]?.searchParams.get("recursive")).toBe("false");
    await stopDelete(client, taskid);
    expect(seen[1]?.searchParams.get("method")).toBe("stop");
    expect(seen[1]?.searchParams.get("taskid")).toBe("t9");
  });
});
