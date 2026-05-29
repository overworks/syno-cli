import { basename } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { Command } from "commander";
import { upload } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";

interface UploadOptions {
  host?: string;
  overwrite?: boolean;
  skip?: boolean;
  parents?: boolean;
  name?: string;
}

export function fileUploadCommand(): Command {
  return new Command("upload")
    .description("Upload a local file into a remote directory")
    .argument("<local>", "Path to local file")
    .argument("<remoteDir>", "Destination folder on the DSM (e.g. /home/me)")
    .option("--host <url>", "Override the configured DSM URL")
    .option("--overwrite", "Overwrite if a file with the same name exists")
    .option("--skip", "Skip if a file with the same name exists")
    .option("-p, --parents", "Create missing parents of the remote directory")
    .option("--name <filename>", "Override stored filename (default: basename of local)")
    .action(async (local: string, remoteDir: string, opts: UploadOptions) => {
      const stats = await stat(local);
      if (!stats.isFile()) throw new Error(`${local} is not a regular file`);
      const data = await readFile(local);
      const filename = opts.name ?? basename(local);

      const { client } = await clientFromConfig(opts.host);
      const res = await upload(client, {
        destPath: remoteDir,
        filename,
        data,
        overwrite: opts.skip ? "skip" : opts.overwrite ?? false,
        createParents: opts.parents,
        mtime: Math.floor(stats.mtimeMs),
      });
      process.stdout.write(`Uploaded ${local} → ${res.path}\n`);
    });
}
