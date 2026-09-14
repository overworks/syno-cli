import { Command } from "commander";
import { del } from "@overworks/syno-file";
import { printJson } from "../../output.js";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";

interface RmOptions extends ConnectionOptions {
  json?: boolean;
  recursive?: boolean;
  quiet?: boolean;
}

export function fileRmCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("rm"), "a status line"))
    .description("Delete one or more remote paths")
    .argument("<paths...>", "Remote paths to delete")
    .option("-r, --recursive", "Recurse into directories")
    .option("-q, --quiet", "Suppress progress output")
    .action(async (paths: string[], opts: RmOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const status = await del(client, {
        path: paths,
        recursive: opts.recursive,
        accurateProgress: !opts.quiet,
        onProgress: opts.quiet
          ? undefined
          : (s) => {
              if (s.processing_path) {
                process.stderr.write(
                  `\r[${s.processed_num}/${s.total}] ${s.processing_path}    `,
                );
              }
            },
      });
      if (!opts.quiet) process.stderr.write("\n");
      if (opts.json) return printJson(status);
      process.stdout.write(`Deleted ${status.processed_num} entr${status.processed_num === 1 ? "y" : "ies"}\n`);
    });
}
