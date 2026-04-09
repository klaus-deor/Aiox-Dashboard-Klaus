<p align="center">
  <img src="https://img.shields.io/badge/AIOX-Dashboard-a78bfa?style=for-the-badge&logo=electron&logoColor=white" alt="AIOX Dashboard" />
  <img src="https://img.shields.io/github/v/release/klaus-deor/Aiox-Dashboard-Klaus?style=for-the-badge&color=22c55e" alt="Release" />
  <img src="https://img.shields.io/badge/platforms-Linux%20%7C%20macOS%20%7C%20Windows-18181b?style=for-the-badge" alt="Platforms" />
</p>

<h1 align="center">AIOX Dashboard</h1>

<p align="center">
  Desktop app for monitoring your AIOX agents, squads, and sessions.<br/>
  Built with Next.js + Electron. Runs on Linux, macOS, and Windows.
</p>

<p align="center">
  <a href="./README.md">Versão em Português</a>
</p>

---

## Overview

AIOX Dashboard is a cross-platform desktop application that reads your local AIOX workspace and gives you a visual overview of:

- **Agents** — all registered agents with their roles, commands, and dependencies
- **Squads** — installed squads with agent composition and workflow counts
- **Sessions** — recent activity and session history

No internet connection required. No server to run. Just open the app, point it to your AIOX workspace, and go.

## Download

Go to [**Releases**](https://github.com/klaus-deor/Aiox-Dashboard-Klaus/releases/latest) and download the file for your OS:

| Platform | File | How to run |
|----------|------|------------|
| Linux | `.AppImage` | `chmod +x` then double-click |
| Windows | `.exe` | Double-click (portable, no install) |
| macOS (Intel) | `.dmg` | Open and drag to Applications |
| macOS (Apple Silicon) | `-arm64.dmg` | Open and drag to Applications |

> **Windows note:** SmartScreen may show a warning on first launch since the app is not code-signed. Click "More info" > "Run anyway".

## Requirements

- An AIOX workspace on your machine (any folder containing `.aiox-core` or `.aios-core`)
- That's it. No Node.js, no npm, no terminal.

On first launch, the app will ask you to select your workspace folder. It remembers your choice for next time.

## Development

If you want to run from source or contribute:

```bash
# Prerequisites: Node.js >= 22

# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run electron:dev

# Build for your platform
npm run electron:build:linux   # AppImage
npm run electron:build:mac     # dmg
npm run electron:build:win     # portable exe
```

Output goes to `release/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Next.js 16, React 19, Tailwind CSS 4 |
| Desktop | Electron 41 |
| Fonts | Geist Sans & Geist Mono |
| Icons | Lucide React |
| Build | electron-builder |
| CI/CD | GitHub Actions (auto-release on tag) |

## How It Works

1. On launch, you select (or it remembers) your AIOX workspace folder
2. The app starts an embedded Next.js server using Electron's built-in Node.js
3. It reads `.aiox-core/development/agents/`, `squads/`, and session files directly from disk
4. Everything runs locally — no network requests, no external APIs

## Creating a Release

Releases are automated via GitHub Actions. To publish a new version:

```bash
git tag -a v0.4.0 -m "v0.4.0 - Description"
git push origin v0.4.0
```

The workflow builds for all 3 platforms and creates a GitHub Release with downloadable executables.

## Security

- **No telemetry.** The app does not collect, send, or store any data externally.
- **No network access required.** All data is read from your local filesystem.
- **No credentials stored.** The only persisted config is your workspace folder path, saved in your OS user data directory.
- **Open source.** You can audit every line of code in this repository.

If you find a security vulnerability, please open an issue or contact [klausdeor@gmail.com](mailto:klausdeor@gmail.com).

## License

[MIT License](./LICENSE) — Copyright (c) 2026 Klaus Deor
