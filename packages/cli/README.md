# @overworks/syno-cli

Command-line interface for the Synology DSM Web API. Installs the `syno` binary.

## Install

```bash
npm install -g @overworks/syno-cli
```

## Usage

```bash
# Authenticate (named profiles, AWS/kubectl style)
syno auth login --host https://nas.example:5001
syno auth login --profile work --host https://nas.work:5001
syno auth list

# File Station
syno file list /home/me
syno file upload ./report.pdf /home/me --overwrite
syno file download /home/me/photo.jpg -o ./photo.jpg

# Download Station
syno download add "magnet:?xt=urn:btih:..." --destination home/downloads
syno download list

# System status
syno system info        # model, firmware, uptime, temperature
syno system usage       # live CPU / memory / network / disk
syno system storage     # volumes (capacity + health)

# Shell completion
syno completion bash >> ~/.bashrc-syno
syno completion zsh  > ~/.zsh/completions/_syno
```

Every non-auth command accepts `--profile <name>` (or `$SYNO_PROFILE`) and `--json` for scripting.
Profiles are stored at `~/.config/syno-cli/config.json` (mode `0600`).

See the [repository README](https://github.com/overworks/syno-cli#readme) for the full command list.

## License

MIT © Minhyung Park. Part of the [syno-cli](https://github.com/overworks/syno-cli) monorepo.
