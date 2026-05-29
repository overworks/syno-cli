import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { del } from "../src/index.js";

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
