import { Command } from "commander";
import { listAlbums, listArtists, listPlaylists, listSongs, type AudioLibrary } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";
import { type ConnectionOptions, intArg, withConnectionOptions, withJsonOption } from "../shared.js";

interface BrowseOptions extends ConnectionOptions {
  json?: boolean;
  library?: AudioLibrary;
  limit?: number;
}

function commonOptions(cmd: Command): Command {
  return withConnectionOptions(withJsonOption(cmd))
    .option("--library <kind>", "Library: all | personal | shared")
    .option("--limit <n>", "Max rows to return", intArg("--limit"));
}

function listArgs(opts: BrowseOptions) {
  return { library: opts.library, limit: opts.limit };
}

export function audioSongCommand(): Command {
  const list = commonOptions(new Command("list").description("List songs")).action(
    async (opts: BrowseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listSongs(client, listArgs(opts));
      if (opts.json) return printJson(page);
      printTable(
        (page.songs ?? []).map((s) => ({
          id: s.id ?? "",
          title: s.title ?? "",
          artist: s.additional?.song_tag?.artist ?? "",
          album: s.additional?.song_tag?.album ?? "",
        })),
        ["id", "title", "artist", "album"],
      );
    },
  );
  return new Command("song").description("Songs").addCommand(list);
}

export function audioAlbumCommand(): Command {
  const list = commonOptions(new Command("list").description("List albums")).action(
    async (opts: BrowseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listAlbums(client, listArgs(opts));
      if (opts.json) return printJson(page);
      printTable(
        (page.albums ?? []).map((a) => ({
          name: a.name ?? "",
          artist: a.display_artist ?? a.album_artist ?? a.artist ?? "",
          year: a.year ?? "",
        })),
        ["name", "artist", "year"],
      );
    },
  );
  return new Command("album").description("Albums").addCommand(list);
}

export function audioArtistCommand(): Command {
  const list = commonOptions(new Command("list").description("List artists")).action(
    async (opts: BrowseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listArtists(client, listArgs(opts));
      if (opts.json) return printJson(page);
      printTable((page.artists ?? []).map((a) => ({ name: a.name ?? "" })), ["name"]);
    },
  );
  return new Command("artist").description("Artists").addCommand(list);
}

export function audioPlaylistCommand(): Command {
  const list = commonOptions(new Command("list").description("List playlists")).action(
    async (opts: BrowseOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listPlaylists(client, listArgs(opts));
      if (opts.json) return printJson(page);
      printTable(
        (page.playlists ?? []).map((p) => ({
          id: p.id ?? "",
          name: p.name ?? "",
          library: p.library ?? "",
        })),
        ["id", "name", "library"],
      );
    },
  );
  return new Command("playlist").description("Playlists").addCommand(list);
}
