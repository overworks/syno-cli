---
"@overworks/syno-cli": patch
---

Fix `syno --version` reporting `0.0.0`: the version is now read from
package.json at runtime instead of being hardcoded, so it always matches the
published version.
