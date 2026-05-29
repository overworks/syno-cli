import { Command } from "commander";
import { audioInfoCommand } from "./info.js";
import {
  audioSongCommand,
  audioAlbumCommand,
  audioArtistCommand,
  audioPlaylistCommand,
} from "./browse.js";
import { audioCoverCommand } from "./cover.js";

export function audioCommand(): Command {
  return new Command("audio")
    .description("Browse Audio Station (SYNO.AudioStation.*)")
    .addCommand(audioInfoCommand())
    .addCommand(audioSongCommand())
    .addCommand(audioAlbumCommand())
    .addCommand(audioArtistCommand())
    .addCommand(audioPlaylistCommand())
    .addCommand(audioCoverCommand());
}
