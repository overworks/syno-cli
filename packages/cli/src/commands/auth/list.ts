import { Command } from "commander";
import { listProfiles } from "../../config.js";
import { printJson, printTable } from "../../output.js";

interface ListOptions {
  json?: boolean;
}

export function authListCommand(): Command {
  return new Command("list")
    .description("List all stored auth profiles")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: ListOptions) => {
      const profiles = await listProfiles();
      if (opts.json) {
        printJson(profiles.map(({ name, profile, isCurrent }) => ({
          name,
          current: isCurrent,
          host: profile.host,
          account: profile.account,
          savedAt: profile.savedAt,
        })));
        return;
      }
      if (profiles.length === 0) {
        process.stdout.write("No profiles configured. Run `syno auth login` to add one.\n");
        return;
      }
      printTable(
        profiles.map(({ name, profile, isCurrent }) => ({
          current: isCurrent ? "*" : "",
          name,
          host: profile.host,
          account: profile.account,
          savedAt: profile.savedAt,
        })),
        ["current", "name", "host", "account", "savedAt"],
      );
    });
}
