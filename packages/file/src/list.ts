import type { SynoClient } from "@overworks/syno-core";
import type { FileEntry, ShareEntry } from "./types.js";

export interface ListSharesOptions {
  offset?: number;
  limit?: number;
  sortBy?: "name" | "user" | "group" | "mtime" | "atime" | "ctime" | "crtime" | "posix" | "type";
  sortDirection?: "asc" | "desc";
  /** Extra fields to request, e.g. `["size", "time", "owner", "perm", "type"]`. */
  additional?: string[];
}

/** @deprecated Renamed to {@link ListSharesOptions} to avoid clashing with other `syno-*` packages. */
export type ListOptions = ListSharesOptions;

export interface ListFilesOptions extends ListSharesOptions {
  pattern?: string;
  filetype?: "file" | "dir" | "all";
}

export interface SharesPage {
  total: number;
  offset: number;
  shares: ShareEntry[];
}

export interface FilesPage {
  total: number;
  offset: number;
  files: FileEntry[];
}

export async function listShares(client: SynoClient, opts: ListSharesOptions = {}): Promise<SharesPage> {
  return client.request<SharesPage>({
    api: "SYNO.FileStation.List",
    version: 2,
    method: "list_share",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      sort_by: opts.sortBy,
      sort_direction: opts.sortDirection,
      additional: opts.additional,
    },
  });
}

export async function list(
  client: SynoClient,
  folderPath: string,
  opts: ListFilesOptions = {},
): Promise<FilesPage> {
  return client.request<FilesPage>({
    api: "SYNO.FileStation.List",
    version: 2,
    method: "list",
    params: {
      folder_path: folderPath,
      offset: opts.offset,
      limit: opts.limit,
      sort_by: opts.sortBy,
      sort_direction: opts.sortDirection,
      additional: opts.additional,
      pattern: opts.pattern,
      filetype: opts.filetype,
    },
  });
}
