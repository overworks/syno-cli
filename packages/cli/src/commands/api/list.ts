import { Command } from "commander";
import { queryApiInfo } from "@overworks/syno-core";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";

interface ApiListOptions extends ConnectionOptions {
  query?: string;
  json?: boolean;
}

export function apiListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List APIs exposed by the DSM (SYNO.API.Info)")
    .option("--query <substr>", "Filter API names by substring (case-insensitive)")
    .action(async (opts: ApiListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const info = await queryApiInfo(client, "all");
      const needle = opts.query?.toLowerCase();
      const rows = Object.entries(info)
        .filter(([name]) => !needle || name.toLowerCase().includes(needle))
        .map(([name, entry]) => ({
          name,
          path: entry.path,
          minVersion: entry.minVersion,
          maxVersion: entry.maxVersion,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (opts.json) {
        printJson(rows);
      } else {
        printTable(rows, ["name", "path", "minVersion", "maxVersion"]);
      }
    });
}

export function apiCommand(): Command {
  return new Command("api")
    .description("Inspect DSM APIs")
    .addCommand(apiListCommand());
}
