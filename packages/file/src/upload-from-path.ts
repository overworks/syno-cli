import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Readable } from "node:stream";
import type { SynoClient } from "@overworks/syno-core";
import type { UploadResult } from "./upload.js";

export interface UploadFromPathArgs {
  /** Destination folder path on the DSM (parent of the new file). */
  destPath: string;
  /** Path to the local file to upload. */
  localPath: string;
  /** Override the stored filename. Defaults to basename of `localPath`. */
  filename?: string;
  /** `true` overwrite, `false` error if exists, `"skip"` no-op if exists. Default false. */
  overwrite?: boolean | "skip";
  /** Create missing parent directories of `destPath`. Default false. */
  createParents?: boolean;
  /** Modification time to record (unix ms). Defaults to the file's mtime. */
  mtime?: number;
  /** Creation time to record (unix ms). */
  crtime?: number;
  /** MIME type for the multipart part. Defaults to `application/octet-stream`. */
  contentType?: string;
}

/**
 * Stream a local file into `SYNO.FileStation.Upload`. The file is read
 * lazily from disk via `fs.createReadStream` and piped straight into the
 * request body — it's never fully buffered.
 *
 * Throws if `localPath` is not a regular file.
 */
export async function uploadFromPath(
  client: SynoClient,
  args: UploadFromPathArgs,
): Promise<UploadResult> {
  const stats = await stat(args.localPath);
  if (!stats.isFile()) {
    throw new Error(`uploadFromPath: ${args.localPath} is not a regular file`);
  }

  const fields: Record<string, string> = { path: args.destPath };
  if (args.createParents !== undefined) fields["create_parents"] = String(args.createParents);
  if (args.overwrite !== undefined) {
    fields["overwrite"] = args.overwrite === "skip" ? "skip" : String(args.overwrite);
  }
  const mtime = args.mtime ?? Math.floor(stats.mtimeMs);
  fields["mtime"] = String(mtime);
  if (args.crtime !== undefined) fields["crtime"] = String(args.crtime);

  const filename = args.filename ?? basename(args.localPath);
  const nodeStream = createReadStream(args.localPath);

  return client.requestStreamForm<UploadResult>({
    api: "SYNO.FileStation.Upload",
    version: 2,
    method: "upload",
    fields,
    file: {
      field: "file",
      filename,
      stream: nodeStream as unknown as NodeJS.ReadableStream,
      size: stats.size,
      contentType: args.contentType,
    },
  });
}

// keep Readable import live for type narrowing in case bundlers tree-shake it out
void Readable;
