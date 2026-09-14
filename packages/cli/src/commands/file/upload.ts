import { Command } from "commander";
import { uploadFromPath } from "@overworks/syno-file";
import { printJson } from "../../output.js";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";

interface UploadOptions extends ConnectionOptions {
  json?: boolean;
  overwrite?: boolean;
  skip?: boolean;
  parents?: boolean;
  name?: string;
}

export function fileUploadCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("upload"), "a status line"))
    .description("Upload a local file into a remote directory (streamed from disk)")
    .argument("<local>", "Path to local file")
    .argument("<remoteDir>", "Destination folder on the DSM (e.g. /home/me)")
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
      if (opts.json) printJson(res);
      else process.stdout.write(`Uploaded ${local} → ${res.path}\n`);
    });
}
