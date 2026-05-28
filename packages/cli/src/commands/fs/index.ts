import { Command } from "commander";
import { fsListCommand } from "./list.js";
import { fsMkdirCommand } from "./mkdir.js";
import { fsRmCommand } from "./rm.js";
import { fsUploadCommand } from "./upload.js";
import { fsDownloadCommand } from "./download.js";

export function fsCommand(): Command {
  return new Command("fs")
    .description("Browse and manipulate files on the DSM (SYNO.FileStation.*)")
    .addCommand(fsListCommand())
    .addCommand(fsMkdirCommand())
    .addCommand(fsRmCommand())
    .addCommand(fsUploadCommand())
    .addCommand(fsDownloadCommand());
}
