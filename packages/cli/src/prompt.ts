import * as readline from "node:readline/promises";

export async function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

const CODE_ETX = 0x03;
const CODE_BS = 0x08;
const CODE_LF = 0x0a;
const CODE_CR = 0x0d;
const CODE_DEL = 0x7f;

export function promptPassword(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("Password prompt requires a TTY."));
      return;
    }
    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    let buffer = "";
    const onData = (chunk: Buffer): void => {
      for (const byte of chunk) {
        if (byte === CODE_CR || byte === CODE_LF) {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(buffer);
          return;
        }
        if (byte === CODE_ETX) {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (byte === CODE_DEL || byte === CODE_BS) {
          if (buffer.length > 0) buffer = buffer.slice(0, -1);
        } else if (byte >= 0x20) {
          buffer += String.fromCharCode(byte);
        }
      }
    };
    stdin.on("data", onData);
  });
}
