import { homedir } from "node:os";
import { join } from "node:path";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";

export interface SynoConfig {
  host: string;
  account: string;
  sid: string;
  savedAt: string;
}

function configDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  return xdg ? join(xdg, "syno-cli") : join(homedir(), ".config", "syno-cli");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export async function loadConfig(): Promise<SynoConfig | undefined> {
  try {
    const raw = await readFile(configPath(), "utf8");
    return JSON.parse(raw) as SynoConfig;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
}

export async function saveConfig(cfg: SynoConfig): Promise<void> {
  const dir = configDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = configPath();
  await writeFile(path, JSON.stringify(cfg, null, 2), { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

export async function deleteConfig(): Promise<void> {
  await rm(configPath(), { force: true });
}
