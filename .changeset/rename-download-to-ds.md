---
"@overworks/syno-cli": patch
---

Rename `@overworks/syno-download` to `@overworks/syno-ds` (npm rejects package
names containing "download"). The `syno download` CLI command is unchanged.
Republishes the whole set so `syno-cli` depends on the publishable `syno-ds`.
