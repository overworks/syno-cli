import { Command } from "commander";
import { pauseTasks, resumeTasks } from "@syno-cli/download-station";
import { clientFromConfig } from "../../client-from-config.js";

interface PauseOptions {
  host?: string;
}

function summarize(results: Array<{ id: string; error: number }>): string {
  return results
    .map((r) => (r.error === 0 ? `${r.id}: ok` : `${r.id}: error ${r.error}`))
    .join("\n");
}

export function downloadPauseCommand(): Command {
  return new Command("pause")
    .description("Pause one or more tasks")
    .argument("<ids...>", "Task IDs to pause")
    .option("--host <url>", "Override the configured DSM URL")
    .action(async (ids: string[], opts: PauseOptions) => {
      const { client } = await clientFromConfig(opts.host);
      const res = await pauseTasks(client, ids);
      process.stdout.write(`${summarize(res)}\n`);
    });
}

export function downloadResumeCommand(): Command {
  return new Command("resume")
    .description("Resume one or more paused tasks")
    .argument("<ids...>", "Task IDs to resume")
    .option("--host <url>", "Override the configured DSM URL")
    .action(async (ids: string[], opts: PauseOptions) => {
      const { client } = await clientFromConfig(opts.host);
      const res = await resumeTasks(client, ids);
      process.stdout.write(`${summarize(res)}\n`);
    });
}
