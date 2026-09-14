import { posix as path } from "node:path";
import { Command } from "commander";
import { createFolder } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson } from "../../output.js";

interface MkdirOptions extends ConnectionOptions {
  json?: boolean;
  parents?: boolean;
}

export function fileMkdirCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("mkdir"), "a status line"))
    .description("Create a folder on the DSM")
    .argument("<path>", "Absolute remote path of the folder to create")
    .option("-p, --parents", "Create missing parents (force_parent)")
    .action(async (target: string, opts: MkdirOptions) => {
      const parent = path.dirname(target);
      const name = path.basename(target);
      if (!name || parent === target) {
        throw new Error(`Invalid path: ${target}`);
      }
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
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
