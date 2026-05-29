import type { SynoClient } from "@overworks/syno-core";

export interface UploadArgs {
  /** Destination folder path on the DSM (parent of the new file). */
  destPath: string;
  /** Name to give the file once stored. */
  filename: string;
  /** File contents. Accepts a Node Buffer, typed array, Blob/File, or string. */
  data: Blob | ArrayBuffer | ArrayBufferView | string;
  /** `true` overwrite, `false` error if exists, `"skip"` no-op if exists. Default false. */
  overwrite?: boolean | "skip";
  /** Create missing parent directories of `destPath`. Default false. */
  createParents?: boolean;
  /** Modification time to record (unix ms). */
  mtime?: number;
  /** Creation time to record (unix ms). */
  crtime?: number;
}

export interface UploadResult {
  name: string;
  path: string;
  blSkip?: boolean;
}

function toBlob(data: UploadArgs["data"]): Blob {
  if (data instanceof Blob) return data;
  if (typeof data === "string") return new Blob([data]);
  return new Blob([data as ArrayBuffer]);
}

export async function upload(client: SynoClient, args: UploadArgs): Promise<UploadResult> {
  const form = new FormData();
  form.set("path", args.destPath);
  if (args.createParents !== undefined) form.set("create_parents", String(args.createParents));
  if (args.overwrite !== undefined) {
    form.set("overwrite", args.overwrite === "skip" ? "skip" : String(args.overwrite));
  }
  if (args.mtime !== undefined) form.set("mtime", String(args.mtime));
  if (args.crtime !== undefined) form.set("crtime", String(args.crtime));

  const file = new File([toBlob(args.data)], args.filename);
  form.set("file", file, args.filename);

  return client.requestForm<UploadResult>({
    api: "SYNO.FileStation.Upload",
    version: 2,
    method: "upload",
    form,
  });
}
