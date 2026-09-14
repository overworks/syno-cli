import { homedir } from "node:os";
import { join } from "node:path";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";

export interface SynoProfile {
  host: string;
  account: string;
  sid: string;
  savedAt: string;
}

export interface SynoConfig {
  current: string;
  profiles: Record<string, SynoProfile>;
}

function configDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  return xdg ? join(xdg, "syno-cli") : join(homedir(), ".config", "syno-cli");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

function isProfile(value: unknown): value is SynoProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["host"] === "string" &&
    typeof v["account"] === "string" &&
    typeof v["sid"] === "string" &&
    typeof v["savedAt"] === "string"
  );
}

function isConfig(value: unknown): value is SynoConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const profiles = v["profiles"];
  if (typeof v["current"] !== "string") return false;
  if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) return false;
  return Object.values(profiles as Record<string, unknown>).every(isProfile);
}

function malformed(): Error {
  return new Error(
    `Config at ${configPath()} is malformed (expected {current, profiles: {<name>: {host, account, sid, savedAt}}}). Remove the file and log in again.`,
  );
}

export async function loadConfig(): Promise<SynoConfig | undefined> {
  let raw: string;
  try {
    raw = await readFile(configPath(), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw malformed();
  }
  if (!isConfig(parsed)) throw malformed();
  return parsed;
}

/**
 * Atomically replace the config: write to a sibling temp file at mode 0600,
 * then rename over the target so a crash mid-write can never leave truncated
 * JSON, and the sid is never observable through a looser pre-existing mode.
 */
async function writeConfig(cfg: SynoConfig): Promise<void> {
  const dir = configDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = configPath();
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(cfg, null, 2), { encoding: "utf8", mode: 0o600, flag: "wx" });
    await chmod(tmp, 0o600);
    await rename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}

export async function deleteConfig(): Promise<void> {
  await rm(configPath(), { force: true });
}

export async function getProfile(name?: string): Promise<{ name: string; profile: SynoProfile } | undefined> {
  const cfg = await loadConfig();
  if (!cfg) return undefined;
  const target = name ?? cfg.current;
  const profile = cfg.profiles[target];
  if (!profile) return undefined;
  return { name: target, profile };
}

export async function listProfiles(): Promise<Array<{ name: string; profile: SynoProfile; isCurrent: boolean }>> {
  const cfg = await loadConfig();
  if (!cfg) return [];
  return Object.keys(cfg.profiles)
    .sort()
    .map((name) => ({ name, profile: cfg.profiles[name]!, isCurrent: name === cfg.current }));
}

export async function upsertProfile(name: string, profile: SynoProfile): Promise<void> {
  const cfg = (await loadConfig()) ?? { current: name, profiles: {} };
  cfg.profiles[name] = profile;
  if (!cfg.profiles[cfg.current]) cfg.current = name;
  await writeConfig(cfg);
}

export async function removeProfile(name: string): Promise<void> {
  const cfg = await loadConfig();
  if (!cfg || !cfg.profiles[name]) return;
  delete cfg.profiles[name];
  const remaining = Object.keys(cfg.profiles).sort();
  if (remaining.length === 0) {
    await deleteConfig();
    return;
  }
  if (cfg.current === name) cfg.current = remaining[0]!;
  await writeConfig(cfg);
}

export async function setCurrent(name: string): Promise<void> {
  const cfg = await loadConfig();
  if (!cfg) throw new Error("No profiles configured. Run `syno auth login` first.");
  if (!cfg.profiles[name]) {
    throw new Error(`Profile "${name}" not found. Run \`syno auth list\` to see configured profiles.`);
  }
  cfg.current = name;
  await writeConfig(cfg);
}
