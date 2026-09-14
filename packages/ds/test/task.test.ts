import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import {
  createTask,
  deleteTasks,
  getTaskInfo,
  listTasks,
  pauseTasks,
  resumeTasks,
} from "../src/index.js";

function client(handler: (url: URL, init?: RequestInit) => unknown): SynoClient {
  const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    return new Response(JSON.stringify(handler(url, init)), { status: 200 });
  });
  const c = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
  c.setApiInfoCache({
    "SYNO.DownloadStation.Task": { path: "DownloadStation/task.cgi", minVersion: 1, maxVersion: 3 },
  });
  return c;
}

describe("listTasks", () => {
  it("calls method=list with additional fields comma-separated", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.DownloadStation.Task");
      expect(url.searchParams.get("method")).toBe("list");
      expect(url.searchParams.get("additional")).toBe("detail,transfer");
      return {
        success: true,
        data: {
          offset: 0,
          total: 1,
          tasks: [{ id: "dbid_1", type: "bt", username: "admin", title: "x", size: 100, status: "downloading" }],
        },
      };
    });
    const page = await listTasks(c, { additional: ["detail", "transfer"] });
    expect(page.tasks[0]?.id).toBe("dbid_1");
  });
});

describe("createTask", () => {
  it("POSTs comma-joined URIs and keeps credentials out of the URL", async () => {
    const c = client((url, init) => {
      expect(url.search).toBe("");
      expect(init?.method).toBe("POST");
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("method")).toBe("create");
      expect(body.get("uri")).toBe("magnet:?xt=urn:foo,magnet:?xt=urn:bar");
      expect(body.get("destination")).toBe("home/downloads");
      expect(body.get("password")).toBe("s3cret");
      return { success: true, data: {} };
    });
    await createTask(c, {
      uri: ["magnet:?xt=urn:foo", "magnet:?xt=urn:bar"],
      destination: "home/downloads",
      password: "s3cret",
    });
  });
});

describe("pauseTasks / resumeTasks / deleteTasks", () => {
  it("send comma-separated ids (task.cgi convention) and force_complete on delete", async () => {
    let seen: URL | undefined;
    const c = client((url) => {
      seen = url;
      return { success: true, data: [{ id: "dbid_1", error: 0 }] };
    });
    await pauseTasks(c, "dbid_1");
    expect(seen?.searchParams.get("method")).toBe("pause");
    expect(seen?.searchParams.get("id")).toBe("dbid_1");

    await resumeTasks(c, ["dbid_1", "dbid_2"]);
    expect(seen?.searchParams.get("method")).toBe("resume");
    expect(seen?.searchParams.get("id")).toBe("dbid_1,dbid_2");

    await deleteTasks(c, { id: "dbid_1", forceComplete: true });
    expect(seen?.searchParams.get("method")).toBe("delete");
    expect(seen?.searchParams.get("force_complete")).toBe("true");
  });
});

describe("getTaskInfo", () => {
  it("sends comma-separated ids and additional", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("method")).toBe("getinfo");
      expect(url.searchParams.get("id")).toBe("dbid_1,dbid_2");
      expect(url.searchParams.get("additional")).toBe("detail");
      return { success: true, data: { tasks: [] } };
    });
    await getTaskInfo(c, { id: ["dbid_1", "dbid_2"], additional: ["detail"] });
  });
});
