import { Command } from "commander";
import { deleteTasks } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";
import { printTaskActionResults } from "./pause.js";

interface RmOptions extends ConnectionOptions {
  json?: boolean;
  forceComplete?: boolean;
}

export function downloadRmCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("rm"), "status lines"))
    .description("Remove one or more tasks")
    .argument("<ids...>", "Task IDs to remove")
    .option(
      "--force-complete",
      "Treat unfinished tasks as completed (skip seed-ratio target etc.)",
    )
    .action(async (ids: string[], opts: RmOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      printTaskActionResults(
        await deleteTasks(client, { id: ids, forceComplete: opts.forceComplete }),
        "removed",
        opts.json,
      );
    });
}
