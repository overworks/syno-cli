import { Command } from "commander";
import { getStatus } from "@overworks/syno-log";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface LogStatusOptions {
  host?: string;
  profile?: string;
  json?: boolean;
}

export function logStatusCommand(): Command {
  return new Command("status")
    .description("Show stored-log count and events/sec")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: LogStatusOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const s = await getStatus(client);
      if (opts.json) {
        printJson(s);
        return;
      }
      const rows = [
        { field: "total", value: s.total === undefined ? "" : String(s.total) },
        { field: "eps", value: s.eps === undefined ? "" : String(s.eps) },
      ].filter((r) => r.value !== "");
      printTable(rows, ["field", "value"]);
    });
}
