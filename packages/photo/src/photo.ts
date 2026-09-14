import type { SynoClient } from "@overworks/syno-core";
import type {
  Album,
  AlbumListPage,
  DownloadOptions,
  ItemListPage,
  ListAlbumsOptions,
  ListItemsOptions,
  PhotoItem,
} from "./types.js";

// Synology Photos (SYNO.Foto.*) API versions vary by DSM/Photos release.
// Centralized so they're easy to bump after checking `syno api list --query
// Foto` (maxVersion) on a live DSM. These target Personal Space; Shared Space
// uses the parallel SYNO.FotoTeam.* family.
const ALBUM_VER = 1;
const ITEM_VER = 1;
const DOWNLOAD_VER = 2;

// `SYNO.Foto.Browse.*` list methods reject calls without offset/limit on
// several releases (code 120); supply DSM-friendly defaults.
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 100;

interface RawAlbumListPage {
  list?: Album[];
  albums?: Album[];
  total?: number;
}

interface RawItemListPage {
  items?: PhotoItem[];
  list?: PhotoItem[];
  total?: number;
  totalCount?: number;
}

/** List albums in Personal Space. */
export async function listAlbums(
  client: SynoClient,
  opts: ListAlbumsOptions = {},
): Promise<AlbumListPage> {
  const raw = await client.request<RawAlbumListPage>({
    api: "SYNO.Foto.Browse.Album",
    version: ALBUM_VER,
    method: "list",
    params: {
      offset: opts.offset ?? DEFAULT_OFFSET,
      limit: opts.limit ?? DEFAULT_LIMIT,
    },
  });
  return { albums: raw.list ?? raw.albums ?? [], total: raw.total };
}

/** List items (photos/videos), optionally scoped to an album or folder. */
export async function listItems(
  client: SynoClient,
  opts: ListItemsOptions = {},
): Promise<ItemListPage> {
  const raw = await client.request<RawItemListPage>({
    api: "SYNO.Foto.Browse.Item",
    version: ITEM_VER,
    method: "list",
    params: {
      offset: opts.offset ?? DEFAULT_OFFSET,
      limit: opts.limit ?? DEFAULT_LIMIT,
      album_id: opts.albumId,
      folder_id: opts.folderId,
      type: opts.type,
      sort_by: opts.sortBy,
      sort_direction: opts.sortDirection,
      passphrase: opts.passphrase,
    },
  });
  const items = (raw.items ?? raw.list ?? []).map((it) => {
    const { item_type, ...rest } = it as PhotoItem & { item_type?: string };
    return { ...rest, type: it.type ?? item_type };
  });
  return { items, total: raw.total ?? raw.totalCount };
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
