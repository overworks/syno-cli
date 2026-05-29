import { Command } from "commander";
import { getInfo } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface AudioInfoOptions {
  host?: string;
  profile?: string;
  json?: boolean;
}

export function audioInfoCommand(): Command {
  return new Command("info")
    .description("Show Audio Station service info")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: AudioInfoOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const info = await getInfo(client);
      if (opts.json) {
        printJson(info);
        return;
      }
      const rows = [
        { field: "version", value: info.version_string ?? info.version ?? "" },
        { field: "is_manager", value: info.is_manager === undefined ? "" : String(info.is_manager) },
      ].filter((r) => r.value !== "");
      printTable(rows, ["field", "value"]);
    });
}
