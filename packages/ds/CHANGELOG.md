# @overworks/syno-ds

## 0.3.0

### Minor Changes

- 38942fc: Transport hardening and CLI fixes.

  **core**

  - Login/logout (and `syno download add`) now POST their parameters, keeping passwords, OTP codes and `_sid` out of URLs and access logs. `SynoRequest` gained `httpMethod: "POST"`.
  - New `SynoHttpError { status, api, method }` for transport failures (non-2xx, non-JSON body, connection errors). HTTP statuses are no longer mapped through the Synology error tables (an HTTP 404 on login used to read as "Failed to authenticate 2-step verification code").
  - `requestRaw` detects a `200` + JSON error envelope and throws `SynoApiError` instead of handing the JSON back as file bytes. Session-expiry hints now fire for binary commands too.
  - `requestForm` places `api`/`version`/`method`/`_sid` ahead of the caller's fields (Synology ignores parameters after the file part) and no longer mutates the caller's `FormData`.
  - Multipart headers escape `"`/CR/LF; boundary is `crypto.randomBytes`-based; a stream whose length differs from the declared `size` fails with a descriptive error.
  - Concurrent `resolvePath` calls share one `SYNO.API.Info` fetch; a pre-set cache that lacks the API no longer triggers a refetch.
  - `baseUrl` is validated in the constructor (scheme-less hosts fail immediately with a clear message).
  - File Station and Download Station error-code tables added to `describeSynoErrorCode`.

  **ds / audio**

  - Task ids and `additional` are sent comma-separated, as the legacy `task.cgi`/AudioStation CGIs expect (was JSON arrays). `TaskAdditional` (request enum) is renamed `TaskAdditionalField`; `TaskAdditional` now names the response shape. `listSongs` accepts `additional`.

  **file / photo**

  - `ListOptions` → `ListSharesOptions` (file) / `AudioListOptions` (audio); the old names remain as deprecated aliases. `uploadFromPath` destroys the read stream if the request fails early. `del` accepts an injectable `now`.
  - Photo list pages are normalized (`albums`, `items`, `total`, `type`) instead of exposing DSM's dual keys; `offset`/`limit` default to `0`/`100`.

  **cli**

  - Password prompt decodes UTF-8 (non-ASCII passwords were corrupted byte-by-byte); Backspace removes a whole character.
  - `auth login` no longer prompts for the profile name (defaults to `$SYNO_PROFILE`/`default`), reuses an existing profile's host/account, prompts for an OTP when the DSM asks for one, supports `--password-stdin` / `$SYNO_PASSWORD`, and fails instead of exiting 0 when stdin is closed.
  - `$SYNO_PROFILE` is honoured by `auth logout` / `auth show`; a failed remote logout is reported instead of silently swallowed; `--all` + `--profile` is rejected.
  - Config writes are atomic (temp file + rename) and profile entries are validated; truncated JSON reports "malformed config" instead of a raw `SyntaxError`.
  - Shell completion keeps working after positional arguments, falls back to filename completion (bash `-o default`), and the zsh script works when autoloaded from `$fpath` (and no longer clobbers `$PATH`).
  - Binary downloads write to `<dest>.part` and rename on success. Numeric flags are validated (`--limit abc` now errors instead of sending `NaN`). `--json` added to `file rm`, `file upload`, `download add|pause|resume|rm`. Tables align CJK text correctly. Error output includes the underlying cause (e.g. `ECONNREFUSED`).
  - README example `syno --profile work file list` corrected to `syno file list --profile work`.

  **release**

  - The release workflow runs build/typecheck/test before publishing.

### Patch Changes

- Updated dependencies [38942fc]
  - @overworks/syno-core@0.3.0

## 0.2.0

### Patch Changes

- @overworks/syno-core@0.2.0

## 0.1.2

### Patch Changes

- @overworks/syno-core@0.1.2

## 0.1.1

### Patch Changes

- @overworks/syno-core@0.1.1

## 0.1.0

### Patch Changes

- @overworks/syno-core@0.1.0
