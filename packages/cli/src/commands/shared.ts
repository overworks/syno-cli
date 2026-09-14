import { createWriteStream } from "node:fs";
import { access, rename, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Command, InvalidArgumentError } from "commander";

/** Options every command that talks to a DSM accepts. */
export interface ConnectionOptions {
  host?: string;
  profile?: string;
}

export function withConnectionOptions(cmd: Command): Command {
  return cmd
    .option("--profile <name>", "Auth profile to use (default: $SYNO_PROFILE or current)")
    .option("--host <url>", "Override the DSM URL for this call only");
}

export function withJsonOption(cmd: Command, insteadOf = "a table"): Command {
  return cmd.option("--json", `Emit JSON instead of ${insteadOf}`);
}

/** Commander argParser for non-negative integer options/arguments. */
export function intArg(label: string): (value: string) => number {
  return (value) => {
    const n = Number(value);
    if (!/^\d+$/.test(value.trim()) || !Number.isSafeInteger(n)) {
      throw new InvalidArgumentError(`${label} must be a non-negative integer, got "${value}".`);
    }
    return n;
  };
}

export interface SaveOptions {
  /** Overwrite an existing file. Default false (fails with EEXIST). */
  force?: boolean;
}

/**
 * Stream a binary `Response` to `dest` (`"-"` = stdout). Writes to a `.part`
 * sibling and renames on success so an interrupted transfer never leaves a
 * truncated file under the final name.
 */
export async function saveResponse(res: Response, dest: string, opts: SaveOptions = {}): Promise<void> {
  if (!res.body) throw new Error("Empty response body");
  const source = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);

  if (dest === "-") {
    await pipeline(source, process.stdout, { end: false });
    return;
  }

  if (!opts.force && (await exists(dest))) {
    throw new Error(`${dest} already exists (pass -f to overwrite).`);
  }
  const part = `${dest}.part`;
  try {
    await pipeline(source, createWriteStream(part, { flags: "wx" }));
    await rename(part, dest);
  } catch (err) {
    await rm(part, { force: true });
    throw err;
  }
  process.stderr.write(`Saved to ${dest}\n`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
