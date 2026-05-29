import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { completionCommand } from "../src/commands/completion.js";

function buildProgram(): Command {
  const program = new Command();
  program.name("syno").description("test").version("0.0.0");

  const auth = new Command("auth").description("auth group");
  auth.command("login")
    .option("--profile <name>", "profile")
    .option("--host <url>", "host")
    .option("--password <pw>", "password");
  auth.command("logout").option("--all", "all");
  program.addCommand(auth);

  const file = new Command("file").description("file group");
  file.command("list").argument("[path]").option("--json", "json");
  program.addCommand(file);

  program.addCommand(completionCommand());
  return program;
}

async function emit(program: Command, shell: "bash" | "zsh"): Promise<string> {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  try {
    await program.parseAsync(["node", "syno", "completion", shell]);
  } finally {
    process.stdout.write = originalWrite;
  }
  return chunks.join("");
}

describe("completion bash", () => {
  it("includes every subcommand path in a case branch", async () => {
    const out = await emit(buildProgram(), "bash");
    expect(out).toContain('"") COMPREPLY=( $(compgen -W');
    expect(out).toContain('"auth") COMPREPLY=');
    expect(out).toContain('"auth login") COMPREPLY=');
    expect(out).toContain('"auth logout") COMPREPLY=');
    expect(out).toContain('"file list") COMPREPLY=');
  });

  it("lists value-taking flags in the skip table but excludes boolean flags", async () => {
    const out = await emit(buildProgram(), "bash");
    const skipTable = out.match(/case "\$w" in\s*([\s\S]*?)\)\n\s+i=\$\(\(i \+ 2/)?.[1] ?? "";
    expect(skipTable).toContain('"--profile"');
    expect(skipTable).toContain('"--host"');
    expect(skipTable).toContain('"--password"');
    expect(skipTable).not.toContain('"--all"');
    expect(skipTable).not.toContain('"--json"');
  });

  it("ends with `complete -F <fn> <binary>`", async () => {
    const out = await emit(buildProgram(), "bash");
    expect(out.trim().endsWith("complete -F _syno_complete syno")).toBe(true);
  });
});

describe("completion zsh", () => {
  it("starts with #compdef and registers via compdef", async () => {
    const out = await emit(buildProgram(), "zsh");
    expect(out.startsWith("#compdef syno")).toBe(true);
    expect(out.trim().endsWith("compdef _syno syno")).toBe(true);
  });

  it("uses compadd per subcommand path", async () => {
    const out = await emit(buildProgram(), "zsh");
    expect(out).toContain('"auth login") compadd');
    expect(out).toContain('"file list") compadd');
  });
});

describe("--name <binary>", () => {
  it("renames the completion function and registration", async () => {
    const program = buildProgram();
    const chunks: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array): boolean => {
      chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    }) as typeof process.stdout.write;
    try {
      await program.parseAsync(["node", "syno", "completion", "bash", "--name", "nas"]);
    } finally {
      process.stdout.write = originalWrite;
    }
    const out = chunks.join("");
    expect(out).toContain("_nas_complete()");
    expect(out.trim().endsWith("complete -F _nas_complete nas")).toBe(true);
  });
});

describe("unsupported shell", () => {
  it("throws", async () => {
    await expect(emit(buildProgram(), "fish" as "bash")).rejects.toThrow(/Unsupported shell/);
  });
});
