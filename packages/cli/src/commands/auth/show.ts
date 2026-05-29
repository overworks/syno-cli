import { Command } from "commander";
import { getProfile } from "../../config.js";
import { printJson } from "../../output.js";

interface ShowOptions {
  json?: boolean;
}

function maskSid(sid: string): string {
  if (sid.length <= 4) return "****";
  return `****${sid.slice(-4)}`;
}

export function authShowCommand(): Command {
  return new Command("show")
    .description("Show details of a stored auth profile (default: current)")
    .argument("[name]", "Profile name; omit to show current")
    .option("--json", "Emit JSON instead of a key/value list")
    .action(async (name: string | undefined, opts: ShowOptions) => {
      const found = await getProfile(name);
      if (!found) {
        const which = name ? `Profile "${name}"` : "Current profile";
        throw new Error(`${which} not found. Run \`syno auth list\` to see configured profiles.`);
      }
      const view = {
        name: found.name,
        host: found.profile.host,
        account: found.profile.account,
        savedAt: found.profile.savedAt,
        sid: maskSid(found.profile.sid),
      };
      if (opts.json) {
        printJson(view);
        return;
      }
      for (const [k, v] of Object.entries(view)) {
        process.stdout.write(`${k.padEnd(8)} ${v}\n`);
      }
    });
}
