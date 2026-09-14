import { basename } from "node:path";
import { Command } from "commander";
import { download } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, saveResponse, withConnectionOptions } from "../shared.js";

interface DownloadOptions extends ConnectionOptions {
  output?: string;
  force?: boolean;
}

export function fileDownloadCommand(): Command {
  return withConnectionOptions(new Command("download"))
    .description("Download a remote file to local disk (or stdout with -o -)")
    .argument("<remotePath>", "Remote file path on the DSM")
    .option("-o, --output <local>", "Local destination path (default: basename of remote, '-' for stdout)")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (remotePath: string, opts: DownloadOptions) => {
      const dest = opts.output ?? basename(remotePath);
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await download(client, { path: remotePath });
      await saveResponse(res, dest, { force: opts.force });
    });
}
