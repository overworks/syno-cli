# syno-cli

TypeScript SDK and command-line tool for the Synology DSM Web API.

This is a pnpm + Turborepo monorepo containing:

- **`@syno-cli/core`** — small, dependency-free SDK on top of `fetch`. Handles SID-based auth, automatic `SYNO.API.Info` path resolution, and normalized errors.
- **`@syno-cli/cli`** (`syno` binary) — [commander](https://github.com/tj/commander.js) CLI built on top of `core`.

## Status

Early. Currently implements `SYNO.API.Auth` (login/logout) and `SYNO.API.Info` (capability discovery). Domain APIs (File Station, Download Station, Surveillance, …) will follow.

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

# Drop the stored session
node packages/cli/dist/index.js logout
```

Credentials and the session ID are written to `~/.config/syno-cli/config.json` with mode `0600`.

After `pnpm build` you can add `packages/cli/dist/index.js` to your `PATH` (or `pnpm link --global` from `packages/cli`) so the binary is just `syno`.

## Layout

```
packages/
  core/   # @syno-cli/core — SDK
  cli/    # @syno-cli/cli  — `syno` binary
```

## Development

```bash
pnpm test                        # vitest across packages
pnpm typecheck
pnpm --filter @syno-cli/cli dev  # tsx watch on the CLI entry
```

## License

MIT — see [LICENSE](./LICENSE).
