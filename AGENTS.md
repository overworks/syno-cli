# Agent context for syno-cli

This file gives AI coding assistants (Claude Code, Codex, Cursor, etc.) the context they need to work in this repo. `CLAUDE.md` is a symlink to this file.

## What this project is

TypeScript pnpm + Turborepo monorepo for accessing the Synology DSM Web API.

- `packages/core` — `@overworks/syno-core`: HTTP/JSON SDK on top of Node 20's built-in `fetch`. Zero runtime dependencies. Exposes `SynoClient.request` (JSON envelope), `requestRaw` (binary downloads), and `requestForm` (multipart uploads).
- `packages/file` — `@overworks/syno-file`: Synology File Station wrappers (`list`, `listShares`, `createFolder`, `del`/`startDelete`/`deleteStatus`/`stopDelete`, `upload`, `download`) on top of `syno-core`.
- `packages/download` — `@overworks/syno-download`: Download Station task wrappers (`listTasks`, `getTaskInfo`, `createTask`, `pauseTasks`, `resumeTasks`, `deleteTasks`) on top of `syno-core`.
- `packages/cli` — `@overworks/syno-cli` (`bin: syno`): commander-based CLI on top of `syno-core` + domain packages.

Package names are scoped under the maintainer's npm org `@overworks` with a `syno-` prefix; one Synology service per package. Names trim the `-Station` suffix to match the DSM-side aliases (`@overworks/syno-file`, not `@overworks/syno-file-station`).

Today the surface is `SYNO.API.Auth`, `SYNO.API.Info`, `SYNO.FileStation.*`, and `SYNO.DownloadStation.Task`. Other domains (Surveillance, Photo, …) will land as additional workspace packages following the same shape.

## Tooling

- Node.js >= 20 (maintainer uses Node 24)
- pnpm 11, Turborepo 2
- TypeScript 5 with `NodeNext` module resolution, `strict` + `noUncheckedIndexedAccess`
- Vitest for tests; HTTP is exercised via an injected `fetch` — no real network

## Common commands

| Goal | Command |
| --- | --- |
| Install | `pnpm install` |
| Build (turbo) | `pnpm build` |
| Test (turbo) | `pnpm test` |
| Typecheck | `pnpm typecheck` |
| Watch the CLI | `pnpm --filter @overworks/syno-cli dev` |
| Run built CLI | `node packages/cli/dist/index.js <cmd>` |

`turbo.json` makes `^build` a dependency of `build`, `test`, and `typecheck`, so `cli` always sees a fresh `core/dist`.

## Layout

```
packages/
  core/
    src/
      client.ts       # SynoClient: request / requestRaw / requestForm, _sid, API path cache
      auth.ts         # login / logout
      api-info.ts     # queryApiInfo (SYNO.API.Info wrapper)
      errors.ts       # SynoApiError + code → message tables
      types.ts
      index.ts        # public surface
    test/             # vitest, fetch is mocked
  file/                          # @overworks/syno-file
    src/
      list.ts                  # listShares, list (SYNO.FileStation.List)
      create-folder.ts         # createFolder
      delete.ts                # startDelete / deleteStatus / stopDelete / del (blocking wrapper)
      upload.ts                # upload (multipart via requestForm)
      download.ts              # download (raw Response via requestRaw)
      types.ts                 # FileEntry, ShareEntry, Overwrite, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  download/                      # @overworks/syno-download
    src/
      task.ts                  # listTasks / getTaskInfo / createTask / pause / resume / deleteTasks
      types.ts                 # Task, TaskStatus, TaskListPage, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  cli/
    src/
      index.ts                 # commander entrypoint + interactive hook
      config.ts                # ~/.config/syno-cli/config.json (mode 0600)
      client-from-config.ts    # config → SynoClient
      output.ts                # printTable / printJson
      prompt.ts                # readline + raw-mode password prompt
      interactive.ts           # STUB — interactive mode not implemented yet
      commands/
        login.ts
        logout.ts
        api/list.ts
        file/
          index.ts             # `syno file` group (DSM alias for FileStation)
          list.ts mkdir.ts rm.ts upload.ts download.ts
        download/
          index.ts             # `syno download` group (DSM alias for DownloadStation)
          list.ts add.ts pause.ts rm.ts
```

## Conventions

- **ESM only** (`"type": "module"`). Import other source files with the `.js` suffix from TypeScript — NodeNext resolves them correctly after emit.
- **Single HTTP entrypoint**: every Synology call goes through `SynoClient.{request,requestRaw,requestForm}`. New APIs should rely on `client.resolvePath(api)` (auto-fetches `SYNO.API.Info` once and caches it) rather than hard-coding `*.cgi` paths. Use `request` for JSON envelopes, `requestRaw` for binary downloads, `requestForm` for multipart uploads.
- **Domain packages**: one workspace package per Synology service (`@overworks/syno-file`, `@overworks/syno-download`, …). They depend on `@overworks/syno-core` via `workspace:*`, expose function-style APIs (`list(client, …)`), and are consumed by `cli` under matching command groups (`syno file …`, `syno download …`).
- **Error model**: `SynoApiError { code, api, method, isSessionExpired }`. Auth codes get auth-aware messages via `describeSynoErrorCode`. Don't swallow these — bubble them up.
- **CLI commands** live in `packages/cli/src/commands/<group>/<name>.ts`, return a `Command`, and accept a `--json` flag that switches `printTable` → `printJson` for scripting. Command-group names mirror DSM's built-in aliases — `file` for `SYNO.FileStation.*` and `download` for `SYNO.DownloadStation.Task`.
- **Credentials**: only `packages/cli/src/config.ts` reads/writes `~/.config/syno-cli/config.json`. Keep mode 0600. Never log passwords or sids.
- **`core` has no runtime deps.** Add new runtime deps to `cli`. If you need a parser/util in `core`, write it.
- **Tests don't hit the network.** Inject a `fetch` into `SynoClient({ fetch })` and assert on the URL + body.

## Out of scope right now (planned follow-ups)

- Additional domain packages: `@overworks/syno-surveillance`, `@overworks/syno-photo`, `@overworks/syno-audio`, …
- Streaming uploads for very large files (current `upload` reads the whole file into memory)
- Real interactive TUI (`interactive.ts` is currently a stub that prints a message)
- OS keychain credential storage (`keytar`)
- Shell completion, `changesets` + npm publishing

## Things to avoid

- Don't introduce a second HTTP client or bypass `SynoClient.request` — `_sid`, path resolution, and error normalization all live there.
- Don't add automatic retries on `SynoApiError`. Session-expiry (105/106/107/119) should surface a re-login hint, not silently re-auth — the password isn't kept in memory.
- Don't mutate `~/.config/syno-cli/config.json` from anywhere other than `config.ts`.
- Don't paper over Synology error codes with generic messages; extend the tables in `errors.ts` instead.
- Don't commit `dist/`, `.turbo/`, or `node_modules/` (already gitignored).

## Reference: relevant planning notes

The original bootstrap plan lives at `~/.claude/plans/synology-web-api-velvety-mountain.md` on the maintainer's machine — useful background but not normative; this file is the source of truth for current state.
