import { Command } from "commander";
import { del } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";

interface RmOptions {
  host?: string;
  profile?: string;
  recursive?: boolean;
  quiet?: boolean;
}

export function fileRmCommand(): Command {
  return new Command("rm")
    .description("Delete one or more remote paths")
    .argument("<paths...>", "Remote paths to delete")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
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
      process.stdout.write(`Deleted ${status.processed_num} entr${status.processed_num === 1 ? "y" : "ies"}\n`);
    });
}
