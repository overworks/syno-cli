# Releasing

This monorepo publishes all five `@overworks/syno-*` packages to npm with
[Changesets](https://github.com/changesets/changesets). They share one version (a **fixed** group),
so every release bumps and publishes them together.

## Day-to-day flow

1. Make your change on a branch and open a PR against `0.x`.
2. Add a changeset describing it:
   ```bash
   pnpm changeset
   ```
   Pick a bump level (patch / minor / major) and write a one-line summary. Commit the generated
   `.changeset/*.md` file with your change. Because the group is fixed, selecting any one package
   bumps all five.
3. Merge the PR into `0.x`.
4. CI (`.github/workflows/release.yml`) sees the pending changeset and opens a **"Version Packages"**
   PR that applies the bump (updates every `package.json` + `CHANGELOG.md`, rewrites `workspace:*`
   ranges).
5. **Merge the "Version Packages" PR.** That push triggers the workflow again; this time there are no
   pending changesets, so it runs `pnpm release` (`pnpm build && changeset publish`) and publishes to
   npm with [provenance](https://docs.npmjs.com/generating-provenance-statements).

You never bump versions or run `npm publish` by hand.

## One-time setup (maintainer)

- **npm org**: ensure the npm account behind the token can publish under the `@overworks` scope.
- **npm token**: create an automation token (granular or classic) with publish rights and **2FA not
  required on publish**. Add it to the GitHub repo as the secret **`NPM_TOKEN`**
  (Settings → Secrets and variables → Actions).
- **Provenance** requires this repo to stay **public** and the workflow's `id-token: write`
  permission (already set). If the repo is ever made private, remove `id-token: write` from
  `release.yml` and `"provenance": true` from each package's `publishConfig`.

## First release (0.1.0)

A seed changeset (`.changeset/initial-release.md`) is already present, so once `NPM_TOKEN` is
configured the first push to `0.x` opens the Version Packages PR that sets everything to `0.1.0`.
Merging it publishes the initial release.

## Local dry-run

```bash
pnpm changeset status            # what would be released
npx changeset version           # apply bumps locally to inspect — then `git restore .` to undo
pnpm -r publish --dry-run --no-git-checks   # inspect tarball contents + access, no upload
```
