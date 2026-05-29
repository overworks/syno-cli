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

Covers `SYNO.API.Auth`, `SYNO.API.Info`, `SYNO.FileStation.*`, `SYNO.DownloadStation.Task`,
`SYNO.Core.System.*` + storage, `SYNO.SurveillanceStation.*`, `SYNO.Foto.*`, `SYNO.AudioStation.*`,
and `SYNO.Core.SyslogClient.*`. More domains (Video, …) will land as additional workspace packages.

## Requirements

- Node.js >= 20

## Install

```bash
npm install -g @overworks/syno-cli   # provides the `syno` binary
syno --help
```

The SDK packages can be installed individually too, e.g. `npm install @overworks/syno-core @overworks/syno-file`.

To build from source instead, see [Development](#development).

## Usage

```bash
# Authenticate against your DSM (stores under profile "default" unless --profile is given)
syno auth login --host https://nas.example:5001
syno auth login --profile work --host https://nas.work:5001

# Inspect / switch / drop profiles
syno auth list
syno auth show           # current profile (sid masked)
syno auth use work       # switch the current profile
syno auth logout         # log out current profile
syno auth logout --all   # log out every profile and drop config
syno auth rm work        # forget locally without calling DSM logout

# List the APIs your DSM exposes
syno api list
syno api list --query FileStation --json | jq

# Browse and move files (SYNO.FileStation.*)
syno file list                       # shared folders
syno file list /home/me              # directory contents
syno file mkdir /home/me/new --parents
syno file upload ./report.pdf /home/me --overwrite
syno file download /home/me/photo.jpg -o ./photo.jpg
syno file rm /home/me/old.txt --recursive

# Download Station (SYNO.DownloadStation.Task)
syno download list
syno download add "magnet:?xt=urn:btih:..." --destination home/downloads
syno download pause  dbid_1
syno download resume dbid_1
syno download rm     dbid_1 --force-complete

# System status (SYNO.Core.System.* + storage) — all read-only
syno system info                     # model, firmware, uptime, temperature
syno system usage                    # live CPU / memory / network / disk
syno system storage                  # volumes (capacity + health)
syno system storage --disks          # physical disks (temp, SMART)
syno system usage --json | jq

# Surveillance Station (SYNO.SurveillanceStation.*)
syno surveillance info               # SS version + capacity
syno surveillance camera list        # configured cameras
syno surveillance camera snapshot 1 -o front.jpg   # JPEG snapshot
syno surveillance recording list --camera 1,2

# Synology Photos (SYNO.Foto.*)
syno photo album list
syno photo list --album 3 --type photo
syno photo download 42 -o vacation.jpg

# Audio Station (SYNO.AudioStation.*)
syno audio info
syno audio song list --limit 50
syno audio album list
syno audio playlist list
syno audio cover music_1 -o art.jpg

# System log (SYNO.Core.SyslogClient.*)
syno log list --level error --limit 100
syno log list --type connection --keyword login
syno log status

# Every non-auth command accepts --profile <name> to override the current profile for one call
syno --profile work file list

# Or set SYNO_PROFILE to switch the default profile for a shell (precedence: --profile > $SYNO_PROFILE > current)
SYNO_PROFILE=work syno file list

# Shell completion (bash or zsh)
syno completion bash >> ~/.bashrc-syno      # then `source ~/.bashrc-syno`
syno completion zsh  > ~/.zsh/completions/_syno
```

Profiles are stored at `~/.config/syno-cli/config.json` (mode `0600`) as
`{current, profiles: {<name>: {host, account, sid, savedAt}}}`.

Running from a source checkout instead of a global install? Use `node packages/cli/dist/index.js <cmd>`
after `pnpm build`, or `pnpm --filter @overworks/syno-cli dev` for watch mode.

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
pnpm install
pnpm build                       # turbo build across packages
pnpm test                        # vitest across packages
pnpm typecheck
pnpm --filter @overworks/syno-cli dev  # tsx watch on the CLI entry
node packages/cli/dist/index.js --help # run the locally built CLI
```

Releases go through Changesets — see [RELEASING.md](./RELEASING.md).

## License

MIT — see [LICENSE](./LICENSE).
