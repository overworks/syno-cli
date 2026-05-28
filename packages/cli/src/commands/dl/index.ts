import { Command } from "commander";
import { dlListCommand } from "./list.js";
import { dlAddCommand } from "./add.js";
import { dlPauseCommand, dlResumeCommand } from "./pause.js";
import { dlRmCommand } from "./rm.js";

export function dlCommand(): Command {
  return new Command("dl")
    .description("Manage Download Station tasks (SYNO.DownloadStation.Task)")
    .addCommand(dlListCommand())
    .addCommand(dlAddCommand())
    .addCommand(dlPauseCommand())
    .addCommand(dlResumeCommand())
    .addCommand(dlRmCommand());
}
