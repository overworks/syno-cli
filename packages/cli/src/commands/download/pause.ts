import { Command } from "commander";
import { pauseTasks, resumeTasks, type TaskActionResult } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson } from "../../output.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";

interface TaskActionOptions extends ConnectionOptions {
  json?: boolean;
}

/** One line per task: `<id>: <verb>` or `<id>: error <code>`. Shared with `download rm`. */
export function printTaskActionResults(results: TaskActionResult[], verb: string, json: boolean | undefined): void {
  if (json) return printJson(results);
  for (const r of results) {
    process.stdout.write(`${r.id}: ${r.error === 0 ? verb : `error ${r.error}`}\n`);
  }
}

export function downloadPauseCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("pause"), "status lines"))
    .description("Pause one or more tasks")
    .argument("<ids...>", "Task IDs to pause")
    .action(async (ids: string[], opts: TaskActionOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      printTaskActionResults(await pauseTasks(client, ids), "paused", opts.json);
    });
}

export function downloadResumeCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("resume"), "status lines"))
    .description("Resume one or more paused tasks")
    .argument("<ids...>", "Task IDs to resume")
    .action(async (ids: string[], opts: TaskActionOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      printTaskActionResults(await resumeTasks(client, ids), "resumed", opts.json);
    });
}
