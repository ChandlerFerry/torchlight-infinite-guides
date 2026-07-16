# ETOR FAQ

## What is ETOR?
Was posted on Bili Bili - https://www.bilibili.com/opus/1157556272554311684

Used by [Poogf01](https://www.twitch.tv/poogf01) to track loot, in his [stream](https://www.twitch.tv/poogf01), you can use the command `!照妖鏡` to receive the [download link](https://drive.google.com/file/d/1M8LGVXfD8DuQRS8prOuA9iDw3n2amVOZ/view)

## How do I install it?

1. Go to [Releases](https://github.com/ChandlerFerry/etor-translations/releases)
2. Download and unzip the latest release.
3. Run the executable.

Builds are automated via [GitHub Actions](https://github.com/ChandlerFerry/etor-translations/actions) for security.

## Why use this release over the official global release?

This ChandlerFerry (CF) release differs in several important ways:

### Security hardening

- **Shell command blocker** — The original ETOR exposes a `runShellCommand` IPC handler in its Electron preload that allows the renderer process to execute arbitrary shell commands on the user's machine.
  - CF injects a whitelist filter that only allows safe, read-only commands (e.g. `ls`, `dir`, `whoami`, `tasklist`) and blocks everything else. See [`src/scripts/inject-shell-blocker-lib.ts`](../src/scripts/inject-shell-blocker-lib.ts).

### More complete translations
- 1,000+ hand-maintained UI translations covering patch notes, character classes, seasons, constellation talents, notification pet, item types, and all UI elements.
- Community-sourced item translations from [tlidb.com](https://tlidb.com), automatically updated daily.

### Quality-of-life fixes

- Hides several ui "features" we don't want to see
