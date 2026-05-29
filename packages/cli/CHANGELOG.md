# @overworks/syno-cli

## 0.2.0

### Minor Changes

- 5c935e9: Add `@overworks/syno-audio` and the `syno audio` command group: `info`,
  `song list`, `album list`, `artist list`, `playlist list`, and `cover <songId>`
  (album art) over `SYNO.AudioStation.*`. Read-only; playback control is out of scope.
- ebc3001: Add `@overworks/syno-log` and the `syno log` command group: `list` (query the DSM
  system log with `--level`/`--keyword`/`--type` filters) and `status` (stored count
  - events/sec) over `SYNO.Core.SyslogClient.*`. No Log Center package required.
- 6436315: Add `@overworks/syno-photo` and the `syno photo` command group: `album list`,
  `list` (items, with `--album`/`--folder`/`--type` filters), and `download <id>`
  over `SYNO.Foto.*` (Synology Photos, Personal Space).
- c5183b3: Add `@overworks/syno-surveillance` and the `syno surveillance` command group:
  `info`, `camera list`, `camera snapshot <id>` (JPEG), and `recording list` over
  `SYNO.SurveillanceStation.*`.

### Patch Changes

- @overworks/syno-audio@0.2.0
- @overworks/syno-core@0.2.0
- @overworks/syno-ds@0.2.0
- @overworks/syno-file@0.2.0
- @overworks/syno-log@0.2.0
- @overworks/syno-photo@0.2.0
- @overworks/syno-surveillance@0.2.0
- @overworks/syno-system@0.2.0

## 0.1.2

### Patch Changes

- 264520a: Fix `syno --version` reporting `0.0.0`: the version is now read from
  package.json at runtime instead of being hardcoded, so it always matches the
  published version.
  - @overworks/syno-core@0.1.2
  - @overworks/syno-ds@0.1.2
  - @overworks/syno-file@0.1.2
  - @overworks/syno-system@0.1.2

## 0.1.1

### Patch Changes

- 3232374: Rename `@overworks/syno-download` to `@overworks/syno-ds` (npm rejects package
  names containing "download"). The `syno download` CLI command is unchanged.
  Republishes the whole set so `syno-cli` depends on the publishable `syno-ds`.
  - @overworks/syno-core@0.1.1
  - @overworks/syno-ds@0.1.1
  - @overworks/syno-file@0.1.1
  - @overworks/syno-system@0.1.1

## 0.1.0

### Minor Changes

- 867feb2: First public release.

### Patch Changes

- @overworks/syno-core@0.1.0
- @overworks/syno-download@0.1.0
- @overworks/syno-file@0.1.0
- @overworks/syno-system@0.1.0
