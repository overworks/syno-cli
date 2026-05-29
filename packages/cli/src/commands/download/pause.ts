import { Command } from "commander";
import { pauseTasks, resumeTasks } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";

interface PauseOptions {
  host?: string;
  profile?: string;
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
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .action(async (ids: string[], opts: PauseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await pauseTasks(client, ids);
      process.stdout.write(`${summarize(res)}\n`);
    });
}

export function downloadResumeCommand(): Command {
  return new Command("resume")
    .description("Resume one or more paused tasks")
    .argument("<ids...>", "Task IDs to resume")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .action(async (ids: string[], opts: PauseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await resumeTasks(client, ids);
      process.stdout.write(`${summarize(res)}\n`);
    });
}
