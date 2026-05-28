# syno-cli

TypeScript SDK and command-line tool for the Synology DSM Web API.

This is a pnpm + Turborepo monorepo containing:

- **`@syno-cli/core`** — small, dependency-free SDK on top of `fetch`. Handles SID-based auth, automatic `SYNO.API.Info` path resolution, and normalized errors.
- **`@syno-cli/file-station`** — File Station wrappers (list / mkdir / rm / upload / download) on top of `core`.
- **`@syno-cli/cli`** (`syno` binary) — [commander](https://github.com/tj/commander.js) CLI built on top of `core` and the domain packages.

## Status

Early. Currently implements `SYNO.API.Auth`, `SYNO.API.Info`, and `SYNO.FileStation.*`. Other domains (Download Station, Surveillance, …) will land as additional workspace packages.

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
# Authenticate against your DSM
node packages/cli/dist/index.js login --host https://nas.example:5001

# List the APIs your DSM exposes
node packages/cli/dist/index.js api list
node packages/cli/dist/index.js api list --query FileStation --json | jq

# Browse and move files (SYNO.FileStation.*)
node packages/cli/dist/index.js fs list                       # shared folders
node packages/cli/dist/index.js fs list /home/me              # directory contents
node packages/cli/dist/index.js fs mkdir /home/me/new --parents
node packages/cli/dist/index.js fs upload ./report.pdf /home/me --overwrite
node packages/cli/dist/index.js fs download /home/me/photo.jpg -o ./photo.jpg
node packages/cli/dist/index.js fs rm /home/me/old.txt --recursive

# Drop the stored session
node packages/cli/dist/index.js logout
```

Credentials and the session ID are written to `~/.config/syno-cli/config.json` with mode `0600`.

After `pnpm build` you can add `packages/cli/dist/index.js` to your `PATH` (or `pnpm link --global` from `packages/cli`) so the binary is just `syno`.

## Layout

```
packages/
  core/           # @syno-cli/core          — base SDK (no runtime deps)
  file-station/   # @syno-cli/file-station  — SYNO.FileStation.* wrappers
  cli/            # @syno-cli/cli           — `syno` binary
```

## Development

```bash
pnpm test                        # vitest across packages
pnpm typecheck
pnpm --filter @syno-cli/cli dev  # tsx watch on the CLI entry
```

## License

MIT — see [LICENSE](./LICENSE).
