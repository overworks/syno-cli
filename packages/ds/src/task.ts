import type { SynoClient } from "@overworks/syno-core";
import type { Task, TaskListPage } from "./types.js";

/** Extra sections `SYNO.DownloadStation.Task` can attach to each task. */
export type TaskAdditionalField = "detail" | "transfer" | "file" | "tracker" | "peer";

export interface ListTasksOptions {
  offset?: number;
  limit?: number;
  additional?: TaskAdditionalField[];
}

/**
 * Download Station runs on the legacy `task.cgi` and takes list parameters
 * as comma-separated values, not the JSON arrays `entry.cgi` accepts.
 */
function csv(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v.join(",") : v;
}

export async function listTasks(
  client: SynoClient,
  opts: ListTasksOptions = {},
): Promise<TaskListPage> {
  return client.request<TaskListPage>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "list",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      additional: csv(opts.additional),
    },
  });
}

export interface GetTaskInfoOptions {
  id: string | string[];
  additional?: TaskAdditionalField[];
}

export async function getTaskInfo(
  client: SynoClient,
  opts: GetTaskInfoOptions,
): Promise<{ tasks: Task[] }> {
  return client.request<{ tasks: Task[] }>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "getinfo",
    params: {
      id: csv(opts.id),
      additional: csv(opts.additional),
    },
  });
}

export interface CreateTaskArgs {
  /** Comma-separated URIs, magnet links, or HTTP/FTP URLs. */
  uri: string | string[];
  /** Destination shared folder + path (e.g. `home/downloads`). */
  destination?: string;
  /** Username for protected sources (HTTP/FTP). */
  username?: string;
  /** Password for protected sources. */
  password?: string;
  /** Password for protected archives once extracted. */
  unzipPassword?: string;
}

export async function createTask(
  client: SynoClient,
  args: CreateTaskArgs,
): Promise<{ task_id?: string[] }> {
  return client.request<{ task_id?: string[] }>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "create",
    // POST: source credentials must not end up in the URL / access logs.
    httpMethod: "POST",
    params: {
      uri: csv(args.uri),
      destination: args.destination,
      username: args.username,
      password: args.password,
      unzip_password: args.unzipPassword,
    },
  });
}

export interface TaskActionResult {
  id: string;
  error: number;
}

export async function pauseTasks(
  client: SynoClient,
  id: string | string[],
): Promise<TaskActionResult[]> {
  return client.request<TaskActionResult[]>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "pause",
    params: { id: csv(id) },
  });
}

export async function resumeTasks(
  client: SynoClient,
  id: string | string[],
): Promise<TaskActionResult[]> {
  return client.request<TaskActionResult[]>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "resume",
    params: { id: csv(id) },
  });
}

export interface DeleteTasksOptions {
  id: string | string[];
  /** Skip the upload-ratio target and remove immediately. Default false. */
  forceComplete?: boolean;
}

export async function deleteTasks(
  client: SynoClient,
  opts: DeleteTasksOptions,
): Promise<TaskActionResult[]> {
  return client.request<TaskActionResult[]>({
    api: "SYNO.DownloadStation.Task",
    version: 1,
    method: "delete",
    params: {
      id: csv(opts.id),
      force_complete: opts.forceComplete,
    },
  });
}
