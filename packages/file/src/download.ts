import type { SynoClient } from "@overworks/syno-core";

export interface DownloadArgs {
  /** Remote file path. Single path or array (DSM accepts both). */
  path: string | string[];
  /**
   * `download` forces an attachment response; `open` is inline.
   * Default `download`.
   */
  mode?: "download" | "open";
}

/**
 * Returns the raw `Response` — the caller is responsible for streaming
 * `res.body` to disk (or wherever) and consuming the body exactly once.
 */
export async function download(client: SynoClient, args: DownloadArgs): Promise<Response> {
  return client.requestRaw({
    api: "SYNO.FileStation.Download",
    version: 2,
    method: "download",
    params: {
      path: Array.isArray(args.path) ? args.path : args.path,
      mode: args.mode ?? "download",
    },
  });
}
