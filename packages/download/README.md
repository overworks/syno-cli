# @overworks/syno-download

Synology Download Station (`SYNO.DownloadStation.Task`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-download @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { listTasks, createTask, pauseTasks, deleteTasks } from "@overworks/syno-download";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

await createTask(client, {
  uri: "magnet:?xt=urn:btih:...",
  destination: "home/downloads",
});
const page = await listTasks(client, { additional: ["transfer"] });
await pauseTasks(client, "dbid_1");
await deleteTasks(client, { id: "dbid_1", forceComplete: true });
```

Covers `listTasks`, `getTaskInfo`, `createTask`, `pauseTasks`, `resumeTasks`, and `deleteTasks`.

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
