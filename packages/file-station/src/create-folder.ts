import type { SynoClient } from "@syno-cli/core";
import type { FileEntry } from "./types.js";

export interface CreateFolderArgs {
  /** Parent folder path. */
  folderPath: string;
  /** New folder name to create under `folderPath`. */
  name: string;
  /** Create missing parents of `folderPath` if needed. Default false. */
  forceParent?: boolean;
}

export async function createFolder(
  client: SynoClient,
  args: CreateFolderArgs,
): Promise<{ folders: FileEntry[] }> {
  return client.request<{ folders: FileEntry[] }>({
    api: "SYNO.FileStation.CreateFolder",
    version: 2,
    method: "create",
    params: {
      folder_path: args.folderPath,
      name: args.name,
      force_parent: args.forceParent,
    },
  });
}
