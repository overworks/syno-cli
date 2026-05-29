import { Command } from "commander";
import { systemInfoCommand } from "./info.js";
import { systemUsageCommand } from "./usage.js";
import { systemStorageCommand } from "./storage.js";

export function systemCommand(): Command {
  return new Command("system")
    .description("Inspect Synology system status (SYNO.Core.System.*, storage)")
    .addCommand(systemInfoCommand())
    .addCommand(systemUsageCommand())
    .addCommand(systemStorageCommand());
}
