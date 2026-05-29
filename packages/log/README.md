# @overworks/syno-log

Synology system-log (`SYNO.Core.SyslogClient.*`) wrappers built on
[`@overworks/syno-core`](https://www.npmjs.com/package/@overworks/syno-core).

## Install

```bash
npm install @overworks/syno-log @overworks/syno-core
```

## Usage

```ts
import { SynoClient } from "@overworks/syno-core";
import { listLogs, getStatus } from "@overworks/syno-log";

const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid });

const { items } = await listLogs(client, { level: "error", limit: 100 });
await getStatus(client); // stored count + events/sec
```

Reads the DSM system log (login / connection / file-transfer / system events) via the
built-in syslog client — no Log Center package required.

> Log severity values, `logType` categories, method names, and versions shift between
> DSM releases. If a call fails, check the constants in `log.ts`
> (`syno api list --query SyslogClient`).

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
