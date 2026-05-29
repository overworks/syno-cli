/** One album from `SYNO.Foto.Browse.Album` (method `list`). */
export interface Album {
  id?: number;
  name?: string;
  item_count?: number;
  /** Whether the album is shared. */
  shared?: boolean;
  /** Cover item id, when present. */
  cover_item_id?: number;
  /** Passphrase for shared albums. */
  passphrase?: string;
  [key: string]: unknown;
}

/**
 * Album list page. The Foto API has returned the array under both `list` and
 * `albums` across versions, so both are optional — read whichever is set.
 */
export interface AlbumListPage {
  list?: Album[];
  albums?: Album[];
  total?: number;
}

export interface ListAlbumsOptions {
  offset?: number;
  limit?: number;
}

/** One item (photo/video/live) from `SYNO.Foto.Browse.Item` (method `list`). */
export interface PhotoItem {
  id?: number;
  filename?: string;
  filesize?: number;
  /** Capture time (unix epoch seconds). */
  time?: number;
  takentime?: number;
  /** `"photo"`, `"video"`, or `"live"`. */
  type?: string;
  item_type?: string;
  owner_user_id?: number;
  folder_id?: number;
  [key: string]: unknown;
}

/** Item list page. Both `items`/`list` + `total`/`totalCount` are accepted. */
export interface ItemListPage {
  items?: PhotoItem[];
  list?: PhotoItem[];
  total?: number;
  totalCount?: number;
}

export interface ListItemsOptions {
  offset?: number;
  limit?: number;
  /** List items in this album. */
  albumId?: number;
  /** List items in this folder (Personal Space tree). */
  folderId?: number;
  /** Filter by media type. */
  type?: "photo" | "video" | "live";
  sortBy?: "filename" | "filesize" | "takentime" | "item_type";
  sortDirection?: "asc" | "desc";
  /** Passphrase for a shared album. */
  passphrase?: string;
}

export interface DownloadOptions {
  /** Item ID or IDs to download (a multi-item download returns a zip). */
  itemId: number | number[];
  passphrase?: string;
}
