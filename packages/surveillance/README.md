# @overworks/syno-surveillance

Synology Surveillance Station (`SYNO.SurveillanceStation.*`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-surveillance @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { getInfo, listCameras, getSnapshot, listRecordings } from "@overworks/syno-surveillance";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

await getInfo(client);                         // SS version + capacity
const { cameras } = await listCameras(client); // configured cameras
const res = await getSnapshot(client, { cameraId: 1 }); // raw JPEG Response
await listRecordings(client, { limit: 50 });   // recordings
```

`getSnapshot` returns the raw `Response` (a JPEG); stream `res.body` to disk yourself.

> The logged-in account needs Surveillance Station privileges for the camera and
> recording calls. Surveillance Station's API versions shift between releases — if a
> call fails with an "unsupported version" error, check the version constants in
> `surveillance.ts` against your DSM (`syno api list --query Surveillance`).

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
