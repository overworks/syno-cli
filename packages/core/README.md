# @overworks/syno-core

TypeScript SDK for the [Synology DSM Web API](https://www.synology.com/), built on Node 20's
built-in `fetch`. Zero runtime dependencies.

It's the base layer the other `@overworks/syno-*` packages build on: it owns the single HTTP
entrypoint (`SynoClient`), login/logout, `SYNO.API.Info` path resolution, and error normalization.

## Install

```bash
npm install @overworks/syno-core
```

## Usage

```ts
import { SynoClient, login } from "@overworks/syno-core";

const client = new SynoClient({ baseUrl: "https://nas.example:5001" });
const { sid } = await login(client, { account: "admin", passwd: "••••" });
client.setSid(sid);

// JSON envelope call — path is resolved + cached via SYNO.API.Info
const shares = await client.request({
  api: "SYNO.FileStation.List",
  version: 2,
  method: "list_share",
});
```

`SynoClient` exposes `request` (JSON envelope), `requestRaw` (binary downloads), `requestForm`
(in-memory multipart), and `requestStreamForm` (streamed multipart with `Content-Length` for large
uploads). Synology error codes surface as `SynoApiError { code, api, method, isSessionExpired }`.

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
