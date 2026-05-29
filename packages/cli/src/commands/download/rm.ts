import { Command } from "commander";
import { deleteTasks } from "@syno-cli/download-station";
import { clientFromConfig } from "../../client-from-config.js";

interface RmOptions {
  host?: string;
  forceComplete?: boolean;
}

export function downloadRmCommand(): Command {
  return new Command("rm")
    .description("Remove one or more tasks")
    .argument("<ids...>", "Task IDs to remove")
    .option("--host <url>", "Override the configured DSM URL")
    .option(
      "--force-complete",
      "Treat unfinished tasks as completed (skip seed-ratio target etc.)",
    )
    .action(async (ids: string[], opts: RmOptions) => {
      const { client } = await clientFromConfig(opts.host);
      const res = await deleteTasks(client, { id: ids, forceComplete: opts.forceComplete });
      for (const r of res) {
        process.stdout.write(`${r.id}: ${r.error === 0 ? "removed" : `error ${r.error}`}\n`);
      }
    });
}
