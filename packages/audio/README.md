# @overworks/syno-audio

Synology Audio Station (`SYNO.AudioStation.*`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-audio @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { getInfo, listSongs, listAlbums, listArtists, listPlaylists, getCover } from "@overworks/syno-audio";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

await getInfo(client);
const { songs } = await listSongs(client, { limit: 100 });
await listAlbums(client);
await listArtists(client);
await listPlaylists(client);
const res = await getCover(client, { songId: songs![0]!.id! }); // raw image Response
```

`getCover` returns the raw `Response` (cover art image); stream `res.body` to disk yourself.

> Read-only browse + cover art. Playback control (`SYNO.AudioStation.RemotePlayer`)
> is out of scope here. Audio Station must be installed on the DSM, and the account
> needs access. API versions shift between releases — if a call fails on version,
> check the constants in `audio.ts` (`syno api list --query AudioStation`).

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
