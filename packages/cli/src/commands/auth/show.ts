import { Command } from "commander";
import { getProfile } from "../../config.js";
import { printJson } from "../../output.js";
import { resolveProfileName } from "../../client-from-config.js";

interface ShowOptions {
  json?: boolean;
}

function maskSid(sid: string): string {
  if (sid.length <= 4) return "****";
  return `****${sid.slice(-4)}`;
}

export function authShowCommand(): Command {
  return new Command("show")
    .description("Show details of a stored auth profile (default: $SYNO_PROFILE or current)")
    .argument("[name]", "Profile name; omit to show the current one")
    .option("--json", "Emit JSON instead of a key/value list")
    .action(async (name: string | undefined, opts: ShowOptions) => {
      const target = resolveProfileName(name);
      const found = await getProfile(target);
      if (!found) {
        const which = target ? `Profile "${target}"` : "Current profile";
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
