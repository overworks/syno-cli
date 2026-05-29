import { Command } from "commander";
import { deleteTasks } from "@overworks/syno-download";
import { clientFromConfig } from "../../client-from-config.js";

interface RmOptions {
  host?: string;
  profile?: string;
  forceComplete?: boolean;
}

export function downloadRmCommand(): Command {
  return new Command("rm")
    .description("Remove one or more tasks")
    .argument("<ids...>", "Task IDs to remove")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option(
      "--force-complete",
      "Treat unfinished tasks as completed (skip seed-ratio target etc.)",
    )
    .action(async (ids: string[], opts: RmOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await deleteTasks(client, { id: ids, forceComplete: opts.forceComplete });
      for (const r of res) {
        process.stdout.write(`${r.id}: ${r.error === 0 ? "removed" : `error ${r.error}`}\n`);
      }
    });
}
