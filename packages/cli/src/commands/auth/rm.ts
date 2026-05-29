import { Command } from "commander";
import { loadConfig, removeProfile } from "../../config.js";

export function authRmCommand(): Command {
  return new Command("rm")
    .description("Forget a stored profile locally (does NOT invalidate the SID on DSM — use `syno auth logout` for that)")
    .argument("<name>", "Profile name to remove")
    .action(async (name: string) => {
      const cfg = await loadConfig();
      if (!cfg || !cfg.profiles[name]) {
        throw new Error(`Profile "${name}" not found.`);
      }
      await removeProfile(name);
      process.stdout.write(`Removed profile "${name}".\n`);
    });
}
