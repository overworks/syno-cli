# @overworks/syno-photo

Synology Photos (`SYNO.Foto.*`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-photo @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { listAlbums, listItems, download } from "@overworks/syno-photo";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

const albums = await listAlbums(client);                       // Personal Space albums
const { items } = await listItems(client, { albumId: 3, type: "photo" });
const res = await download(client, { itemId: 42 });            // raw Response (original file)
```

`download` returns the raw `Response` (original file for one item, a zip for many);
stream `res.body` to disk yourself.

> Covers **Personal Space** (`SYNO.Foto.*`). Shared Space lives under the parallel
> `SYNO.FotoTeam.*` family. Foto API versions shift between Photos releases — if a
> call fails on version, check the constants in `photo.ts` against your DSM
> (`syno api list --query Foto`).

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
