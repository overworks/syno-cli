/** Which music library to query. */
export type AudioLibrary = "all" | "personal" | "shared";

/** `SYNO.AudioStation.Info` (method `getinfo`). Service summary. */
export interface AudioInfo {
  version?: string;
  version_string?: string;
  is_manager?: boolean;
  serviceport?: number;
  [key: string]: unknown;
}

/** One song from `SYNO.AudioStation.Song` (method `list`). */
export interface Song {
  id?: string;
  title?: string;
  path?: string;
  type?: string;
  additional?: {
    song_tag?: { album?: string; artist?: string; album_artist?: string; genre?: string; track?: number; year?: number };
    song_audio?: { bitrate?: number; duration?: number; frequency?: number; codec?: string };
  };
  [key: string]: unknown;
}

export interface SongListPage {
  songs?: Song[];
  total?: number;
  offset?: number;
}

/** One album from `SYNO.AudioStation.Album` (method `list`). Albums are keyed by name + artist, not an id. */
export interface AudioAlbum {
  name?: string;
  artist?: string;
  album_artist?: string;
  display_artist?: string;
  year?: number;
  [key: string]: unknown;
}

export interface AlbumListPage {
  albums?: AudioAlbum[];
  total?: number;
  offset?: number;
}

/** One artist from `SYNO.AudioStation.Artist` (method `list`). */
export interface Artist {
  name?: string;
  [key: string]: unknown;
}

export interface ArtistListPage {
  artists?: Artist[];
  total?: number;
  offset?: number;
}

/** One playlist from `SYNO.AudioStation.Playlist` (method `list`). */
export interface Playlist {
  id?: string;
  name?: string;
  library?: string;
  type?: string;
  [key: string]: unknown;
}

export interface PlaylistListPage {
  playlists?: Playlist[];
  total?: number;
  offset?: number;
}

export interface ListOptions {
  offset?: number;
  limit?: number;
  /** Which library to read. DSM defaults to all when omitted. */
  library?: AudioLibrary;
}

export interface GetCoverOptions {
  /** Song ID to fetch embedded/album cover art for. */
  songId: string;
}
