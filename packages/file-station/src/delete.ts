import type { SynoClient } from "@syno-cli/core";

export interface StartDeleteArgs {
  path: string | string[];
  recursive?: boolean;
  accurateProgress?: boolean;
}

export interface DeleteTask {
  taskid: string;
}

export interface DeleteStatus {
  finished: boolean;
  processed_num: number;
  progress: number;
  total: number;
  processing_path?: string;
}

export async function startDelete(client: SynoClient, args: StartDeleteArgs): Promise<DeleteTask> {
  return client.request<DeleteTask>({
    api: "SYNO.FileStation.Delete",
    version: 2,
    method: "start",
    params: {
      path: Array.isArray(args.path) ? args.path : [args.path],
      recursive: args.recursive,
      accurate_progress: args.accurateProgress,
    },
  });
}

export async function deleteStatus(client: SynoClient, taskid: string): Promise<DeleteStatus> {
  return client.request<DeleteStatus>({
    api: "SYNO.FileStation.Delete",
    version: 2,
    method: "status",
    params: { taskid },
  });
}

export async function stopDelete(client: SynoClient, taskid: string): Promise<void> {
  await client.request<Record<string, never>>({
    api: "SYNO.FileStation.Delete",
    version: 2,
    method: "stop",
    params: { taskid },
  });
}

export interface DeleteOptions extends StartDeleteArgs {
  /** Poll interval in ms. Default 500. */
  pollIntervalMs?: number;
  /** Timeout in ms. Default 5 minutes. */
  timeoutMs?: number;
  /** Called after each status poll. */
  onProgress?: (status: DeleteStatus) => void;
  /** Optional sleep implementation (for tests). */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Start a delete task and block until it finishes (or times out).
 * Throws on timeout. Errors raised mid-task surface as `SynoApiError`.
 */
export async function del(client: SynoClient, opts: DeleteOptions): Promise<DeleteStatus> {
  const { taskid } = await startDelete(client, opts);
  const interval = opts.pollIntervalMs ?? 500;
  const timeout = opts.timeoutMs ?? 5 * 60_000;
  const sleep = opts.sleep ?? defaultSleep;
  const started = Date.now();

  while (true) {
    const status = await deleteStatus(client, taskid);
    opts.onProgress?.(status);
    if (status.finished) return status;
    if (Date.now() - started > timeout) {
      await stopDelete(client, taskid).catch(() => undefined);
      throw new Error(`Delete task ${taskid} timed out after ${timeout}ms`);
    }
    await sleep(interval);
  }
}
