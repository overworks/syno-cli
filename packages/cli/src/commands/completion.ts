import { Command, Option } from "commander";

interface Node {
  path: string[];
  subs: string[];
  flags: string[];
  valueFlags: string[];
}

function flagsOf(cmd: Command, isRoot: boolean): { flags: string[]; valueFlags: string[] } {
  const flags: string[] = [];
  const valueFlags: string[] = [];
  for (const opt of cmd.options as readonly Option[]) {
    const takesValue = opt.required || opt.optional;
    if (opt.long) {
      flags.push(opt.long);
      if (takesValue) valueFlags.push(opt.long);
    }
    if (opt.short) {
      flags.push(opt.short);
      if (takesValue) valueFlags.push(opt.short);
    }
  }
  flags.push("--help");
  if (isRoot) flags.push("--version", "-V");
  flags.push("-h");
  return { flags, valueFlags };
}

function walk(cmd: Command, prefix: string[] = [], isRoot = true): Node[] {
  const subs: string[] = [];
  const children: Command[] = [];
  for (const sub of cmd.commands) {
    const name = sub.name();
    if (name === "help") continue;
    subs.push(name);
    children.push(sub);
  }
  if (children.length > 0) subs.push("help");

  const { flags, valueFlags } = flagsOf(cmd, isRoot);
  const node: Node = { path: [...prefix], subs, flags, valueFlags };
  const out = [node];
  for (const child of children) {
    out.push(...walk(child, [...prefix, child.name()], false));
  }
  return out;
}

function findRoot(cmd: Command): Command {
  let cur: Command = cmd;
  while (cur.parent) cur = cur.parent;
  return cur;
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)];
}

/**
 * Both scripts walk the words typed so far and descend the command tree only
 * while each word names a known subcommand of the current node. The first
 * word that isn't one (a path, a task id, …) is a positional argument: it is
 * skipped and the current node's flags are what get completed.
 */
function bashScript(binary: string, nodes: Node[]): string {
  const fn = `_${binary.replace(/[^a-zA-Z0-9_]/g, "_")}_complete`;
  const allValueFlags = uniq(nodes.flatMap((n) => n.valueFlags)).sort();
  const valueFlagPattern = allValueFlags.length > 0 ? allValueFlags.map((f) => `"${f}"`).join("|") : "__none__";
  const knownKeys = nodes
    .filter((n) => n.path.length > 0)
    .map((n) => `"${n.path.join(" ")}"`)
    .join("|");

  const cases = nodes
    .map((n) => {
      const key = n.path.join(" ");
      const items = uniq([...n.subs, ...n.flags]);
      return `        "${key}") COMPREPLY=( $(compgen -W "${items.join(" ")}" -- "$cur") ) ;;`;
    })
    .join("\n");

  return `# bash completion for ${binary}
${fn}() {
    COMPREPLY=()
    local cur w path candidate i
    cur="\${COMP_WORDS[COMP_CWORD]}"
    path=""
    i=1
    while (( i < COMP_CWORD )); do
        w="\${COMP_WORDS[i]}"
        if [[ "$w" == -* ]]; then
            if [[ "$w" == *=* ]]; then
                i=$((i + 1))
                continue
            fi
            case "$w" in
                ${valueFlagPattern})
                    i=$((i + 2))
                    continue
                    ;;
            esac
            i=$((i + 1))
            continue
        fi
        candidate="\${path:+$path }$w"
        case "$candidate" in
            ${knownKeys || '""'}) path="$candidate" ;;
            *) ;;
        esac
        i=$((i + 1))
    done

    case "$path" in
${cases}
        *) COMPREPLY=() ;;
    esac
}
complete -o default -F ${fn} ${binary}
`;
}

function zshScript(binary: string, nodes: Node[]): string {
  const fn = `_${binary.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const allValueFlags = uniq(nodes.flatMap((n) => n.valueFlags)).sort();
  const valueFlagsArr = allValueFlags.map((f) => `'${f}'`).join(" ");
  const knownKeys = nodes
    .filter((n) => n.path.length > 0)
    .map((n) => `'${n.path.join(" ")}'`)
    .join(" ");

  const cases = nodes
    .map((n) => {
      const key = n.path.join(" ");
      const items = uniq([...n.subs, ...n.flags]).map((i) => `'${i}'`).join(" ");
      return `        "${key}") compadd -- ${items} ;;`;
    })
    .join("\n");

  return `#compdef ${binary}
# zsh completion for ${binary}
${fn}() {
    local -a value_flags known_keys
    value_flags=(${valueFlagsArr})
    known_keys=(${knownKeys})

    local i=2
    local -a cmdpath
    local w candidate
    while (( i < CURRENT )); do
        w="\${words[i]}"
        if [[ "$w" == -* ]]; then
            if [[ "$w" == *=* ]]; then
                (( i++ ))
                continue
            fi
            if (( \${value_flags[(I)$w]} )); then
                (( i += 2 ))
                continue
            fi
            (( i++ ))
            continue
        fi
        candidate="\${(j: :)cmdpath} $w"
        candidate="\${candidate# }"
        if (( \${known_keys[(I)$candidate]} )); then
            cmdpath+=("$w")
        fi
        (( i++ ))
    done

    local key="\${(j: :)cmdpath}"
    case "$key" in
${cases}
        *) _files ;;
    esac
}
# Works both when sourced directly and when autoloaded from $fpath as _${binary}.
if [[ "\${zsh_eval_context[-1]}" == loadautofunc ]]; then
    ${fn} "$@"
else
    compdef ${fn} ${binary}
fi
`;
}

interface CompletionOptions {
  name?: string;
}

export function completionCommand(): Command {
  return new Command("completion")
    .description("Print a shell completion script (bash | zsh)")
    .argument("<shell>", "Target shell: bash or zsh")
    .option("--name <binary>", "Binary name to register completions for", "syno")
    .action(function (this: Command, shell: string, opts: CompletionOptions) {
      const root = findRoot(this);
      const nodes = walk(root);
      const binary = opts.name ?? "syno";
      let script: string;
      switch (shell) {
        case "bash":
          script = bashScript(binary, nodes);
          break;
        case "zsh":
          script = zshScript(binary, nodes);
          break;
        default:
          throw new Error(`Unsupported shell "${shell}". Use bash or zsh.`);
      }
      process.stdout.write(script);
    });
}
