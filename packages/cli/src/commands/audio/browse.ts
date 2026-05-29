import { Command } from "commander";
import { listAlbums, listArtists, listPlaylists, listSongs, type AudioLibrary } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface BrowseOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  library?: AudioLibrary;
  limit?: string;
}

function commonOptions(cmd: Command): Command {
  return cmd
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--library <kind>", "Library: all | personal | shared")
    .option("--limit <n>", "Max rows to return")
    .option("--json", "Emit JSON instead of a table");
}

function listArgs(opts: BrowseOptions) {
  return { library: opts.library, limit: opts.limit ? Number(opts.limit) : undefined };
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
