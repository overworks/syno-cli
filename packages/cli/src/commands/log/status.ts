import { Command } from "commander";
import { getStatus } from "@overworks/syno-log";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";

interface LogStatusOptions extends ConnectionOptions {
  json?: boolean;
}

export function logStatusCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("status")))
    .description("Show stored-log count and events/sec")
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
