# Agent context for syno-cli

This file gives AI coding assistants (Claude Code, Codex, Cursor, etc.) the context they need to work in this repo. `CLAUDE.md` is a symlink to this file.

## What this project is

TypeScript pnpm + Turborepo monorepo for accessing the Synology DSM Web API.

- `packages/core` — `@overworks/syno-core`: HTTP/JSON SDK on top of Node 20's built-in `fetch`. Zero runtime dependencies. Exposes `SynoClient.request` (JSON envelope), `requestRaw` (binary downloads), `requestForm` (in-memory multipart), and `requestStreamForm` (streamed multipart with `Content-Length` for large uploads).
- `packages/file` — `@overworks/syno-file`: Synology File Station wrappers (`list`, `listShares`, `createFolder`, `del`/`startDelete`/`deleteStatus`/`stopDelete`, `upload`/`uploadFromPath`, `download`) on top of `syno-core`.
- `packages/ds` — `@overworks/syno-ds`: Download Station task wrappers (`listTasks`, `getTaskInfo`, `createTask`, `pauseTasks`, `resumeTasks`, `deleteTasks`) on top of `syno-core`. (npm rejects names containing "download", so the package is `syno-ds`; the CLI group stays `syno download`.)
- `packages/system` — `@overworks/syno-system`: read-only system-status wrappers (`getSystemInfo`, `getUtilization`, `getStorageInfo`) over `SYNO.Core.System.*` + `SYNO.Storage.CGI.Storage`, on top of `syno-core`.
- `packages/surveillance` — `@overworks/syno-surveillance`: Surveillance Station wrappers (`getInfo`, `listCameras`, `getSnapshot`, `listRecordings`) over `SYNO.SurveillanceStation.*`, on top of `syno-core`.
- `packages/photo` — `@overworks/syno-photo`: Synology Photos wrappers (`listAlbums`, `listItems`, `download`) over `SYNO.Foto.*` (Personal Space), on top of `syno-core`.
- `packages/audio` — `@overworks/syno-audio`: Audio Station wrappers (`getInfo`, `listSongs`, `listAlbums`, `listArtists`, `listPlaylists`, `getCover`) over `SYNO.AudioStation.*`, on top of `syno-core`.
- `packages/log` — `@overworks/syno-log`: read-only system-log wrappers (`listLogs`, `getStatus`) over `SYNO.Core.SyslogClient.*`, on top of `syno-core`.
- `packages/cli` — `@overworks/syno-cli` (`bin: syno`): commander-based CLI on top of `syno-core` + domain packages.

Package names are scoped under the maintainer's npm org `@overworks` with a `syno-` prefix; one Synology service per package. Names trim the `-Station` suffix to match the DSM-side aliases (`@overworks/syno-file`, not `@overworks/syno-file-station`).

Today the surface is `SYNO.API.Auth`, `SYNO.API.Info`, `SYNO.FileStation.*`, `SYNO.DownloadStation.Task`, `SYNO.Core.System`, `SYNO.Core.System.Utilization`, `SYNO.Storage.CGI.Storage`, `SYNO.SurveillanceStation.*` (Info/Camera/Recording), `SYNO.Foto.*` (Browse.Album/Browse.Item/Download), `SYNO.AudioStation.*` (Info/Song/Album/Artist/Playlist/Cover), and `SYNO.Core.SyslogClient.*` (Log/Status). Other domains (Video, …) will land as additional workspace packages following the same shape.

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
      upload.ts                # upload (in-memory multipart via requestForm)
      upload-from-path.ts      # uploadFromPath (streamed from disk via requestStreamForm)
      download.ts              # download (raw Response via requestRaw)
      types.ts                 # FileEntry, ShareEntry, Overwrite, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  ds/                            # @overworks/syno-ds
    src/
      task.ts                  # listTasks / getTaskInfo / createTask / pause / resume / deleteTasks
      types.ts                 # Task, TaskStatus, TaskListPage, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  system/                        # @overworks/syno-system
    src/
      system.ts                # getSystemInfo / getUtilization / getStorageInfo
      types.ts                 # SystemInfo, Utilization, StorageInfo, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  surveillance/                  # @overworks/syno-surveillance
    src/
      surveillance.ts          # getInfo / listCameras / getSnapshot (raw) / listRecordings
      types.ts                 # SurveillanceInfo, Camera, Recording, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  photo/                         # @overworks/syno-photo
    src/
      photo.ts                 # listAlbums / listItems / download (raw)
      types.ts                 # Album, PhotoItem, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  audio/                         # @overworks/syno-audio
    src/
      audio.ts                 # getInfo / listSongs / listAlbums / listArtists / listPlaylists / getCover (raw)
      types.ts                 # Song, AudioAlbum, Artist, Playlist, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  log/                           # @overworks/syno-log
    src/
      log.ts                   # listLogs / getStatus
      types.ts                 # LogEntry, LogStatus, …
      index.ts                 # public surface
    test/             # vitest, fetch is mocked
  cli/
    src/
      index.ts                 # commander entrypoint + interactive hook
      config.ts                # named-profile config CRUD (loadConfig / upsertProfile / removeProfile / setCurrent / listProfiles)
      client-from-config.ts    # {host?, profile?} → SynoClient; tracks activeProfile()
      session-hint.ts          # sessionExpiryHint: re-login command for 105/106/107/119
      output.ts                # printTable / printJson
      prompt.ts                # readline + raw-mode password prompt
      interactive.ts           # STUB — interactive mode not implemented yet
      commands/
        auth/
          index.ts             # `syno auth` group
          login.ts logout.ts list.ts show.ts use.ts rm.ts
        api/list.ts
        completion.ts          # `syno completion <bash|zsh>` — walks the commander tree
        file/
          index.ts             # `syno file` group (DSM alias for FileStation)
          list.ts mkdir.ts rm.ts upload.ts download.ts
        download/
          index.ts             # `syno download` group (DSM alias for DownloadStation)
          list.ts add.ts pause.ts rm.ts
        system/
          index.ts             # `syno system` group (SYNO.Core.System.* + storage)
          info.ts usage.ts storage.ts format.ts
        surveillance/
          index.ts             # `syno surveillance` group (SYNO.SurveillanceStation.*)
          info.ts camera.ts recording.ts   # camera = list + snapshot (binary)
        photo/
          index.ts             # `syno photo` group (SYNO.Foto.*)
          album.ts item.ts     # album list; item list + download (binary)
        audio/
          index.ts             # `syno audio` group (SYNO.AudioStation.*)
          info.ts browse.ts cover.ts   # info; song/album/artist/playlist list; cover (binary)
    test/             # vitest, XDG_CONFIG_HOME-overridden tmpdir, no network
```

## Conventions

- **ESM only** (`"type": "module"`). Import other source files with the `.js` suffix from TypeScript — NodeNext resolves them correctly after emit.
- **Single HTTP entrypoint**: every Synology call goes through `SynoClient.{request,requestRaw,requestForm,requestStreamForm}`. New APIs should rely on `client.resolvePath(api)` (auto-fetches `SYNO.API.Info` once and caches it) rather than hard-coding `*.cgi` paths. Use `request` for JSON envelopes, `requestRaw` for binary downloads, `requestForm` for in-memory multipart, and `requestStreamForm` when the request body has a single large file part that must be streamed off disk.
- **Domain packages**: one workspace package per Synology service (`@overworks/syno-file`, `@overworks/syno-ds`, …). They depend on `@overworks/syno-core` via `workspace:*`, expose function-style APIs (`list(client, …)`), and are consumed by `cli` under matching command groups (`syno file …`, `syno download …`). npm package names can't contain "download" (blocklisted), so Download Station ships as `syno-ds` even though its CLI group is `download`.
- **Error model**: `SynoApiError { code, api, method, isSessionExpired }`. Auth codes get auth-aware messages via `describeSynoErrorCode`. Don't swallow these — bubble them up.
- **CLI commands** live in `packages/cli/src/commands/<group>/<name>.ts`, return a `Command`, and accept a `--json` flag that switches `printTable` → `printJson` for scripting. Command-group names mirror DSM's built-in aliases — `file` for `SYNO.FileStation.*` and `download` for `SYNO.DownloadStation.Task`. `SYNO.Core.System.*` has no short DSM alias, so its group is named after the API family: `system` (info/usage/storage). Auth/session lives under `syno auth` (login/logout/list/show/use/rm) — there is no top-level `syno login`.
- **Profiles**: every non-auth command accepts `--profile <name>`. Selection precedence is `--profile` > `$SYNO_PROFILE` > config `current`. `--host <url>` is still available as a one-shot URL override on the same profile (useful pre-login or for peeking). All three are resolved in one place — `client-from-config.ts`.
- **Credentials**: `~/.config/syno-cli/config.json` is `{current, profiles: {<name>: {host, account, sid, savedAt}}}` at mode 0600. Only `packages/cli/src/config.ts` reads/writes it. The schema has no `version` field — malformed shapes are rejected, not migrated. Never log passwords or sids (the `auth show` command masks the sid to `****<last 4>`).
- **`core` has no runtime deps.** Add new runtime deps to `cli`. If you need a parser/util in `core`, write it.
- **Tests don't hit the network.** Inject a `fetch` into `SynoClient({ fetch })` and assert on the URL + body.

## Releasing

All five packages publish together as a **fixed** Changesets group (one shared version). Add a
changeset with `pnpm changeset`, merge to `0.x`; CI opens a "Version Packages" PR, and merging that
PR publishes to npm with provenance. Versions/`workspace:*` are rewritten by Changesets — never bump
by hand. Full process + one-time `NPM_TOKEN` setup: [`RELEASING.md`](./RELEASING.md). Config lives in
`.changeset/config.json` (`baseBranch: 0.x`); workflows in `.github/workflows/`.

## Out of scope right now (planned follow-ups)

- Additional domain packages: `@overworks/syno-video`, …
- Real interactive TUI (`interactive.ts` is currently a stub that prints a message)
- OS keychain credential storage (`keytar`)

## Things to avoid

- Don't introduce a second HTTP client or bypass `SynoClient.request` — `_sid`, path resolution, and error normalization all live there.
- Don't add automatic retries on `SynoApiError`. Session-expiry (105/106/107/119) surfaces a profile-aware re-login hint at the CLI error boundary (`sessionExpiryHint` + `activeProfile()`), not a silent re-auth — the password isn't kept in memory.
- Don't mutate `~/.config/syno-cli/config.json` from anywhere other than `config.ts`.
- Don't paper over Synology error codes with generic messages; extend the tables in `errors.ts` instead.
- Don't commit `dist/`, `.turbo/`, or `node_modules/` (already gitignored).
