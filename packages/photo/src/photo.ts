import type { SynoClient } from "@overworks/syno-core";
import type {
  AlbumListPage,
  DownloadOptions,
  ItemListPage,
  ListAlbumsOptions,
  ListItemsOptions,
} from "./types.js";

// Synology Photos (SYNO.Foto.*) API versions vary by DSM/Photos release.
// Centralized so they're easy to bump after checking `syno api list --query
// Foto` (maxVersion) on a live DSM. These target Personal Space; Shared Space
// uses the parallel SYNO.FotoTeam.* family.
const ALBUM_VER = 1;
const ITEM_VER = 1;
const DOWNLOAD_VER = 2;

/** List albums in Personal Space. */
export async function listAlbums(
  client: SynoClient,
  opts: ListAlbumsOptions = {},
): Promise<AlbumListPage> {
  return client.request<AlbumListPage>({
    api: "SYNO.Foto.Browse.Album",
    version: ALBUM_VER,
    method: "list",
    params: {
      offset: opts.offset,
      limit: opts.limit,
    },
  });
}

/** List items (photos/videos), optionally scoped to an album or folder. */
export async function listItems(
  client: SynoClient,
  opts: ListItemsOptions = {},
): Promise<ItemListPage> {
  return client.request<ItemListPage>({
    api: "SYNO.Foto.Browse.Item",
    version: ITEM_VER,
    method: "list",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      album_id: opts.albumId,
      folder_id: opts.folderId,
      type: opts.type,
      sort_by: opts.sortBy,
      sort_direction: opts.sortDirection,
      passphrase: opts.passphrase,
    },
  });
}

/**
 * Download one or more items. Returns the raw `Response` — a single item is the
 * original file, multiple items come back as a zip. Caller streams `res.body`
 * to disk and consumes it once (binary endpoint, not a JSON envelope).
 */
export async function download(client: SynoClient, opts: DownloadOptions): Promise<Response> {
  const ids = Array.isArray(opts.itemId) ? opts.itemId : [opts.itemId];
  return client.requestRaw({
    api: "SYNO.Foto.Download",
    version: DOWNLOAD_VER,
    method: "download",
    params: {
      item_id: ids,
      passphrase: opts.passphrase,
    },
  });
}
