# syno-cli

TypeScript SDK and command-line tool for the Synology DSM Web API.

This is a pnpm + Turborepo monorepo containing:

- **`@overworks/syno-core`** — small, dependency-free SDK on top of `fetch`. Handles SID-based auth, automatic `SYNO.API.Info` path resolution, and normalized errors.
- **`@overworks/syno-file`** — File Station wrappers (list / mkdir / rm / upload / download) on top of `syno-core`.
- **`@overworks/syno-ds`** — Download Station task wrappers (list / add / pause / resume / rm) on top of `syno-core`.
- **`@overworks/syno-system`** — read-only system-status wrappers (info / usage / storage) on top of `syno-core`.
- **`@overworks/syno-surveillance`** — Surveillance Station wrappers (info / camera list + snapshot / recording list) on top of `syno-core`.
- **`@overworks/syno-photo`** — Synology Photos wrappers (album list / item list / download) on top of `syno-core`.
- **`@overworks/syno-audio`** — Audio Station wrappers (info / song / album / artist / playlist list / cover) on top of `syno-core`.
- **`@overworks/syno-log`** — read-only system-log wrappers (list / status) on top of `syno-core`.
- **`@overworks/syno-cli`** (`syno` binary) — [commander](https://github.com/tj/commander.js) CLI built on top of `syno-core` and the domain packages.

## Status

Early. Currently implements `SYNO.API.Auth`, `SYNO.API.Info`, `SYNO.FileStation.*`, and `SYNO.DownloadStation.Task`. Other domains (Surveillance, Photo, …) will land as additional workspace packages.

## Requirements

- Node.js >= 20
- pnpm >= 11

## Install & build

```bash
pnpm install
pnpm build
```

## Usage

```bash
# Authenticate against your DSM (stores under profile "default" unless --profile is given)
node packages/cli/dist/index.js auth login --host https://nas.example:5001
node packages/cli/dist/index.js auth login --profile work --host https://nas.work:5001

# Inspect / switch / drop profiles
node packages/cli/dist/index.js auth list
node packages/cli/dist/index.js auth show           # current profile (sid masked)
node packages/cli/dist/index.js auth use work       # switch the current profile
node packages/cli/dist/index.js auth logout         # log out current profile
node packages/cli/dist/index.js auth logout --all   # log out every profile and drop config
node packages/cli/dist/index.js auth rm work        # forget locally without calling DSM logout

# List the APIs your DSM exposes
node packages/cli/dist/index.js api list
node packages/cli/dist/index.js api list --query FileStation --json | jq

# Browse and move files (SYNO.FileStation.*)
node packages/cli/dist/index.js file list                       # shared folders
node packages/cli/dist/index.js file list /home/me              # directory contents
node packages/cli/dist/index.js file mkdir /home/me/new --parents
node packages/cli/dist/index.js file upload ./report.pdf /home/me --overwrite
node packages/cli/dist/index.js file download /home/me/photo.jpg -o ./photo.jpg
node packages/cli/dist/index.js file rm /home/me/old.txt --recursive

# Download Station (SYNO.DownloadStation.Task)
node packages/cli/dist/index.js download list
node packages/cli/dist/index.js download add "magnet:?xt=urn:btih:..." --destination home/downloads
node packages/cli/dist/index.js download pause  dbid_1
node packages/cli/dist/index.js download resume dbid_1
node packages/cli/dist/index.js download rm     dbid_1 --force-complete

# System status (SYNO.Core.System.* + storage) — all read-only
node packages/cli/dist/index.js system info                     # model, firmware, uptime, temperature
node packages/cli/dist/index.js system usage                    # live CPU / memory / network / disk
node packages/cli/dist/index.js system storage                  # volumes (capacity + health)
node packages/cli/dist/index.js system storage --disks          # physical disks (temp, SMART)
node packages/cli/dist/index.js system usage --json | jq

# Surveillance Station (SYNO.SurveillanceStation.*)
node packages/cli/dist/index.js surveillance info               # SS version + capacity
node packages/cli/dist/index.js surveillance camera list        # configured cameras
node packages/cli/dist/index.js surveillance camera snapshot 1 -o front.jpg   # JPEG snapshot
node packages/cli/dist/index.js surveillance recording list --camera 1,2

# Synology Photos (SYNO.Foto.*)
node packages/cli/dist/index.js photo album list
node packages/cli/dist/index.js photo list --album 3 --type photo
node packages/cli/dist/index.js photo download 42 -o vacation.jpg

# Audio Station (SYNO.AudioStation.*)
node packages/cli/dist/index.js audio info
node packages/cli/dist/index.js audio song list --limit 50
node packages/cli/dist/index.js audio album list
node packages/cli/dist/index.js audio playlist list
node packages/cli/dist/index.js audio cover music_1 -o art.jpg

# System log (SYNO.Core.SyslogClient.*)
node packages/cli/dist/index.js log list --level error --limit 100
node packages/cli/dist/index.js log list --type connection --keyword login
node packages/cli/dist/index.js log status

# Every non-auth command accepts --profile <name> to override the current profile for one call
node packages/cli/dist/index.js --profile work file list

# Or set SYNO_PROFILE to switch the default profile for a shell (precedence: --profile > $SYNO_PROFILE > current)
SYNO_PROFILE=work node packages/cli/dist/index.js file list

# Shell completion (bash or zsh)
node packages/cli/dist/index.js completion bash >> ~/.bashrc-syno      # then `source ~/.bashrc-syno`
node packages/cli/dist/index.js completion zsh  > ~/.zsh/completions/_syno
```

Profiles are stored at `~/.config/syno-cli/config.json` (mode `0600`) as
`{current, profiles: {<name>: {host, account, sid, savedAt}}}`.

After `pnpm build` you can add `packages/cli/dist/index.js` to your `PATH` (or `pnpm link --global` from `packages/cli`) so the binary is just `syno`.

## Layout

```
packages/
  core/               # @overworks/syno-core      — base SDK (no runtime deps)
  file/               # @overworks/syno-file      — SYNO.FileStation.* wrappers
  ds/                 # @overworks/syno-ds        — SYNO.DownloadStation.Task wrappers
  system/             # @overworks/syno-system    — SYNO.Core.System.* + storage wrappers
  surveillance/       # @overworks/syno-surveillance — SYNO.SurveillanceStation.* wrappers
  photo/              # @overworks/syno-photo     — SYNO.Foto.* (Synology Photos) wrappers
  audio/              # @overworks/syno-audio     — SYNO.AudioStation.* wrappers
  log/                # @overworks/syno-log       — SYNO.Core.SyslogClient.* wrappers
  cli/                # @overworks/syno-cli       — `syno` binary
```

## Development

```bash
pnpm test                        # vitest across packages
pnpm typecheck
pnpm --filter @overworks/syno-cli dev  # tsx watch on the CLI entry
```

## License

MIT — see [LICENSE](./LICENSE).
