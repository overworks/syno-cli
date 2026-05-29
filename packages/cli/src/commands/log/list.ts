import { Command } from "commander";
import { listLogs } from "@overworks/syno-log";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface LogListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  level?: string;
  keyword?: string;
  type?: string;
  limit?: string;
}

export function logListCommand(): Command {
  return new Command("list")
    .description("Query the DSM system log")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--level <level>", "Severity filter (e.g. info | warning | error)")
    .option("--keyword <text>", "Free-text keyword filter")
    .option("--type <type>", "Log category (e.g. system | connection | fileTransfer)")
    .option("--limit <n>", "Max entries to return")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: LogListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listLogs(client, {
        level: opts.level,
        keyword: opts.keyword,
        logType: opts.type,
        limit: opts.limit ? Number(opts.limit) : undefined,
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        (page.items ?? []).map((e) => ({
          time: e.time ?? "",
          level: e.level ?? "",
          who: e.who ?? "",
          descr: e.descr ?? "",
        })),
        ["time", "level", "who", "descr"],
      );
    });
}
