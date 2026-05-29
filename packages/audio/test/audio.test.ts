import { describe, expect, it, vi } from "vitest";
import { SynoClient } from "@overworks/syno-core";
import { getCover, getInfo, listAlbums, listArtists, listPlaylists, listSongs } from "../src/index.js";

function client(handler: (url: URL) => { json?: unknown; raw?: BodyInit }): SynoClient {
  const fetchImpl = vi.fn(async (input: string) => {
    const url = new URL(input);
    const out = handler(url);
    if (out.raw !== undefined) {
      return new Response(out.raw, { status: 200, headers: { "content-type": "image/jpeg" } });
    }
    return new Response(JSON.stringify(out.json), { status: 200 });
  });
  const c = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
  c.setApiInfoCache({
    "SYNO.AudioStation.Info": { path: "AudioStation/info.cgi", minVersion: 1, maxVersion: 1 },
    "SYNO.AudioStation.Song": { path: "AudioStation/song.cgi", minVersion: 1, maxVersion: 3 },
    "SYNO.AudioStation.Album": { path: "AudioStation/album.cgi", minVersion: 1, maxVersion: 3 },
    "SYNO.AudioStation.Artist": { path: "AudioStation/artist.cgi", minVersion: 1, maxVersion: 3 },
    "SYNO.AudioStation.Playlist": { path: "AudioStation/playlist.cgi", minVersion: 1, maxVersion: 2 },
    "SYNO.AudioStation.Cover": { path: "AudioStation/cover.cgi", minVersion: 1, maxVersion: 1 },
  });
  return c;
}

describe("getInfo", () => {
  it("GETs SYNO.AudioStation.Info method=getinfo", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.AudioStation.Info");
      expect(url.searchParams.get("method")).toBe("getinfo");
      return { json: { success: true, data: { version_string: "7.0" } } };
    });
    expect((await getInfo(c)).version_string).toBe("7.0");
  });
});

describe("listSongs", () => {
  it("lists with library + additional and returns songs", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.AudioStation.Song");
      expect(url.searchParams.get("method")).toBe("list");
      expect(url.searchParams.get("library")).toBe("shared");
      expect(url.searchParams.get("additional")).toBe('["song_tag","song_audio"]');
      return { json: { success: true, data: { total: 1, songs: [{ id: "music_1", title: "Track" }] } } };
    });
    const page = await listSongs(c, { library: "shared" });
    expect(page.songs?.[0]?.title).toBe("Track");
  });
});

describe("listAlbums / listArtists / listPlaylists", () => {
  it("hit the right APIs with method=list", async () => {
    let seen: URL | undefined;
    const c = client((url) => {
      seen = url;
      return { json: { success: true, data: { total: 0, albums: [], artists: [], playlists: [] } } };
    });
    await listAlbums(c);
    expect(seen?.searchParams.get("api")).toBe("SYNO.AudioStation.Album");
    await listArtists(c);
    expect(seen?.searchParams.get("api")).toBe("SYNO.AudioStation.Artist");
    await listPlaylists(c);
    expect(seen?.searchParams.get("api")).toBe("SYNO.AudioStation.Playlist");
    expect(seen?.searchParams.get("method")).toBe("list");
  });
});

describe("getCover", () => {
  it("uses requestRaw getsongcover with the song id and returns binary", async () => {
    const c = client((url) => {
      expect(url.searchParams.get("api")).toBe("SYNO.AudioStation.Cover");
      expect(url.searchParams.get("method")).toBe("getsongcover");
      expect(url.searchParams.get("id")).toBe("music_1");
      return { raw: "\xff\xd8\xff\xe0JFIF-bytes" };
    });
    const res = await getCover(c, { songId: "music_1" });
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(await res.text()).toContain("JFIF");
  });
});
