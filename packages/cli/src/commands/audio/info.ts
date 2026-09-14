import { Command } from "commander";
import { getInfo } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";

interface AudioInfoOptions extends ConnectionOptions {
  json?: boolean;
}

export function audioInfoCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("info")))
    .description("Show Audio Station service info")
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
