import type { SynoClient } from "@overworks/syno-core";
import type {
  AlbumListPage,
  ArtistListPage,
  AudioInfo,
  GetCoverOptions,
  ListOptions,
  PlaylistListPage,
  SongListPage,
} from "./types.js";

// Audio Station API versions vary by release. Centralized so they're easy to
// bump after checking `syno api list --query AudioStation` (maxVersion) on a
// live DSM. Audio Station methods are lowercase (getinfo / list / getsongcover).
const INFO_VER = 1;
const SONG_VER = 1;
const ALBUM_VER = 1;
const ARTIST_VER = 1;
const PLAYLIST_VER = 1;
const COVER_VER = 1;

/** Audio Station service info. */
export async function getInfo(client: SynoClient): Promise<AudioInfo> {
  return client.request<AudioInfo>({
    api: "SYNO.AudioStation.Info",
    version: INFO_VER,
    method: "getinfo",
  });
}

/** List songs. Pass `additional: ["song_tag","song_audio"]`-style data via the API itself if needed. */
export async function listSongs(client: SynoClient, opts: ListOptions = {}): Promise<SongListPage> {
  return client.request<SongListPage>({
    api: "SYNO.AudioStation.Song",
    version: SONG_VER,
    method: "list",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      library: opts.library,
      additional: ["song_tag", "song_audio"],
    },
  });
}

/** List albums. */
export async function listAlbums(client: SynoClient, opts: ListOptions = {}): Promise<AlbumListPage> {
  return client.request<AlbumListPage>({
    api: "SYNO.AudioStation.Album",
    version: ALBUM_VER,
    method: "list",
    params: { offset: opts.offset, limit: opts.limit, library: opts.library },
  });
}

/** List artists. */
export async function listArtists(client: SynoClient, opts: ListOptions = {}): Promise<ArtistListPage> {
  return client.request<ArtistListPage>({
    api: "SYNO.AudioStation.Artist",
    version: ARTIST_VER,
    method: "list",
    params: { offset: opts.offset, limit: opts.limit, library: opts.library },
  });
}

/** List playlists. */
export async function listPlaylists(client: SynoClient, opts: ListOptions = {}): Promise<PlaylistListPage> {
  return client.request<PlaylistListPage>({
    api: "SYNO.AudioStation.Playlist",
    version: PLAYLIST_VER,
    method: "list",
    params: { offset: opts.offset, limit: opts.limit, library: opts.library },
  });
}

/**
 * Fetch a song's cover art. Returns the raw `Response` (an image) — the caller
 * streams `res.body` to disk and consumes it once (binary endpoint).
 */
export async function getCover(client: SynoClient, opts: GetCoverOptions): Promise<Response> {
  return client.requestRaw({
    api: "SYNO.AudioStation.Cover",
    version: COVER_VER,
    method: "getsongcover",
    params: { id: opts.songId },
  });
}
