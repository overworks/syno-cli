import { Command } from "commander";
import { photoAlbumCommand } from "./album.js";
import { photoListCommand, photoDownloadCommand } from "./item.js";

export function photoCommand(): Command {
  return new Command("photo")
    .description("Browse Synology Photos (SYNO.Foto.*)")
    .addCommand(photoAlbumCommand())
    .addCommand(photoListCommand())
    .addCommand(photoDownloadCommand());
}
