import * as readline from "node:readline/promises";

/**
 * Ask a question on the terminal. Rejects when stdin closes before an answer
 * arrives (piped/`</dev/null` runs) instead of leaving the process to exit 0
 * with nothing done.
 */
export async function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const closed = new Promise<never>((_, reject) => {
      rl.once("close", () =>
        reject(new Error(`stdin closed before answering "${question.trim()}". Pass the value as a flag instead.`)),
      );
    });
    return (await Promise.race([rl.question(question), closed])).trim();
  } finally {
    rl.close();
  }
}

/** Read one line from a non-interactive stdin (e.g. `--password-stdin`). */
export async function readLineFromStdin(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  try {
    for await (const line of rl) return line.replace(/\r$/, "");
    throw new Error("stdin was empty.");
  } finally {
    rl.close();
  }
}

const CODE_ETX = 0x03;
const CODE_EOT = 0x04;
const CODE_BS = 0x08;
const CODE_LF = 0x0a;
const CODE_CR = 0x0d;
const CODE_DEL = 0x7f;

/**
 * Prompt for a password with echo off. Input is collected as raw bytes and
 * decoded as UTF-8 on Enter, so multi-byte characters (e.g. Hangul) survive;
 * Backspace removes a whole code point, not a byte.
 */
export function promptPassword(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("Password prompt requires a TTY. Use --password-stdin, --password, or $SYNO_PASSWORD."));
      return;
    }
    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    const bytes: number[] = [];

    const finish = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      process.stdout.write("\n");
    };
    const popCodePoint = (): void => {
      // Drop the trailing code point: any continuation bytes (10xxxxxx) plus the lead byte.
      let i = bytes.length - 1;
      while (i > 0 && (bytes[i]! & 0xc0) === 0x80) i--;
      bytes.length = Math.max(i, 0);
    };

    const onData = (chunk: Buffer): void => {
      for (const byte of chunk) {
        if (byte === CODE_CR || byte === CODE_LF) {
          finish();
          resolve(Buffer.from(bytes).toString("utf8"));
          return;
        }
        if (byte === CODE_ETX) {
          finish();
          process.exit(130);
        }
        if (byte === CODE_EOT) {
          finish();
          reject(new Error("Password prompt aborted (EOF)."));
          return;
        }
        if (byte === CODE_DEL || byte === CODE_BS) {
          popCodePoint();
        } else if (byte >= 0x20) {
          bytes.push(byte);
        }
      }
    };
    stdin.on("data", onData);
  });
}
