import { basename } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Command } from "commander";
import { download } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";

interface DownloadOptions {
  host?: string;
  output?: string;
  force?: boolean;
}

export function fileDownloadCommand(): Command {
  return new Command("download")
    .description("Download a remote file to local disk (or stdout with -o -)")
    .argument("<remotePath>", "Remote file path on the DSM")
    .option("--host <url>", "Override the configured DSM URL")
    .option("-o, --output <local>", "Local destination path (default: basename of remote, '-' for stdout)")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (remotePath: string, opts: DownloadOptions) => {
      const dest = opts.output ?? basename(remotePath);
      const { client } = await clientFromConfig(opts.host);
      const res = await download(client, { path: remotePath });
      if (!res.body) throw new Error("Empty response body");
      const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);

      if (dest === "-") {
        await pipeline(nodeStream, process.stdout);
        return;
      }
      await pipeline(
        nodeStream,
        createWriteStream(dest, { flags: opts.force ? "w" : "wx" }),
      );
      process.stderr.write(`Saved to ${dest}\n`);
    });
}
