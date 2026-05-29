import { Command } from "commander";
import { fileListCommand } from "./list.js";
import { fileMkdirCommand } from "./mkdir.js";
import { fileRmCommand } from "./rm.js";
import { fileUploadCommand } from "./upload.js";
import { fileDownloadCommand } from "./download.js";

export function fileCommand(): Command {
  return new Command("file")
    .description("Browse and manipulate files on the DSM (SYNO.FileStation.*)")
    .addCommand(fileListCommand())
    .addCommand(fileMkdirCommand())
    .addCommand(fileRmCommand())
    .addCommand(fileUploadCommand())
    .addCommand(fileDownloadCommand());
}
