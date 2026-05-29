# @overworks/syno-file

Synology File Station (`SYNO.FileStation.*`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-file @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { listShares, list, uploadFromPath, download } from "@overworks/syno-file";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

await listShares(client);                       // shared folders
await list(client, "/home/me");                 // directory contents
await uploadFromPath(client, {                  // streamed off disk
  destPath: "/home/me",
  localPath: "./report.pdf",
  overwrite: true,
});
const res = await download(client, "/home/me/photo.jpg");  // raw Response
```

Covers `list`, `listShares`, `createFolder`, `del`/`startDelete`/`deleteStatus`/`stopDelete`,
`upload`/`uploadFromPath`, and `download`.

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
