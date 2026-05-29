import { posix as path } from "node:path";
import { Command } from "commander";
import { createFolder } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson } from "../../output.js";

interface MkdirOptions {
  host?: string;
  json?: boolean;
  parents?: boolean;
}

export function fileMkdirCommand(): Command {
  return new Command("mkdir")
    .description("Create a folder on the DSM")
    .argument("<path>", "Absolute remote path of the folder to create")
    .option("--host <url>", "Override the configured DSM URL")
    .option("-p, --parents", "Create missing parents (force_parent)")
    .option("--json", "Emit JSON instead of a status line")
    .action(async (target: string, opts: MkdirOptions) => {
      const parent = path.dirname(target);
      const name = path.basename(target);
      if (!name || parent === target) {
        throw new Error(`Invalid path: ${target}`);
      }
      const { client } = await clientFromConfig(opts.host);
      const res = await createFolder(client, {
        folderPath: parent,
        name,
        forceParent: opts.parents,
      });
      if (opts.json) {
        printJson(res);
      } else {
        process.stdout.write(`Created ${res.folders[0]?.path ?? target}\n`);
      }
    });
}
