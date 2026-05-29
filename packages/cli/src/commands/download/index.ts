import { Command } from "commander";
import { downloadListCommand } from "./list.js";
import { downloadAddCommand } from "./add.js";
import { downloadPauseCommand, downloadResumeCommand } from "./pause.js";
import { downloadRmCommand } from "./rm.js";

export function downloadCommand(): Command {
  return new Command("download")
    .description("Manage Download Station tasks (SYNO.DownloadStation.Task)")
    .addCommand(downloadListCommand())
    .addCommand(downloadAddCommand())
    .addCommand(downloadPauseCommand())
    .addCommand(downloadResumeCommand())
    .addCommand(downloadRmCommand());
}
