import { Command } from "commander";
import { setCurrent } from "../../config.js";

export function authUseCommand(): Command {
  return new Command("use")
    .description("Set the current auth profile")
    .argument("<name>", "Profile name to activate")
    .action(async (name: string) => {
      await setCurrent(name);
      process.stdout.write(`Current profile is now "${name}".\n`);
    });
}
