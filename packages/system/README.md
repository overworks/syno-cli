# @overworks/syno-system

Read-only Synology system-status wrappers over `SYNO.Core.System`,
`SYNO.Core.System.Utilization`, and `SYNO.Storage.CGI.Storage`, built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-system @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { getSystemInfo, getUtilization, getStorageInfo } from "@overworks/syno-system";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

const info = await getSystemInfo(client);     // model, firmware, uptime, temperature
const usage = await getUtilization(client);   // live CPU / memory / network / disk
const storage = await getStorageInfo(client); // volumes, disks, pools (capacity + health)
```

All three are single read-only calls; nothing here mutates the NAS.

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
