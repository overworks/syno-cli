import { Command } from "commander";
import { uploadFromPath } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";

interface UploadOptions {
  host?: string;
  profile?: string;
  overwrite?: boolean;
  skip?: boolean;
  parents?: boolean;
  name?: string;
}

export function fileUploadCommand(): Command {
  return new Command("upload")
    .description("Upload a local file into a remote directory (streamed from disk)")
    .argument("<local>", "Path to local file")
    .argument("<remoteDir>", "Destination folder on the DSM (e.g. /home/me)")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--overwrite", "Overwrite if a file with the same name exists")
    .option("--skip", "Skip if a file with the same name exists")
    .option("-p, --parents", "Create missing parents of the remote directory")
    .option("--name <filename>", "Override stored filename (default: basename of local)")
    .action(async (local: string, remoteDir: string, opts: UploadOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await uploadFromPath(client, {
        destPath: remoteDir,
        localPath: local,
        filename: opts.name,
        overwrite: opts.skip ? "skip" : opts.overwrite ?? false,
        createParents: opts.parents,
      });
      process.stdout.write(`Uploaded ${local} → ${res.path}\n`);
    });
}
