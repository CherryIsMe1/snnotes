# SNNOTES // SNAKE NATION NEURAL LOG & ALARM MATRIX

A retro-futuristic Cyberpunk notes, task organizer, and chrono alarm desktop application for Windows, crafted with the same visual language and Web Audio API architecture as **SNDeck**.

![Version](https://img.shields.io/badge/version-1.0.0-00ff88?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-b026ff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-ff1a75?style=flat-square)

---

## ⚡ Key Features

- **Snake Nation Cyberpunk Aesthetic**: High-contrast dark theme (`#07090E`), angled chamfered cyber cuts, glowing neon accents (hot pink, purple, neon green, and cyber blue), and custom typography (Orbitron, Rajdhani, Share Tech Mono).
- **Chrono Alarm & Reminder Engine**:
  - Exact timestamp scheduling with customizable alarms.
  - Repeating alarms (`Daily`, `Workdays`, `Weekly`).
  - Quick Countdown Timers (`+5m`, `+15m`, `+30m`, `+1h`).
  - Active Alarms countdown HUD ticker showing time remaining to the nearest reminder.
  - Fullscreen Emergency Alarm HUD overlay with pulsing warnings, snooze (+5m, +15m), and dismiss protocols.
  - Web Notification and native desktop notifications support.
- **Web Audio API Sound Synthesizer**:
  - 100% synthesized acoustic feedback (mechanical switch clicks, terminal keystroke blips, mission complete chimes).
  - Multi-tone siren alarms (Cyber Siren, Tactical Pulse, Sonar Ping, Pitch Sweep). Zero external audio files required!
- **Neural Data Shard Manager**:
  - Interactive checklists (`- [ ] task` toggles into clickable cyber power cells with strike-through animations).
  - Priority matrix: `LOW` (Green), `MED` (Yellow), `HIGH / URGENT` (Hot Pink).
  - Tag indexing (`#MISSION`, `#INTEL`, `#PERSONAL`, `#SYSTEM`, `#CORPO` + custom tags).
  - Pinning / Favoriting shards.
  - Real-time search across titles, content, and tags.
  - Markdown preview toggle.
  - Export shards as `.md` markdown files.
  - 100% offline local storage persistence.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Initialize new Data Shard |
| `Ctrl + S` | Force encrypted save |
| `Escape` | Dismiss active alarm / close overlays |

---

## 🚀 Quick Launch on Windows

Double-click `Launch_SNNotes.bat` to instantly launch the application in standalone desktop app window mode (Edge/Chromium).

---

## 📦 Building Windows Installers (.msi / .exe) with GitHub Actions

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/release.yml`).

1. Push your repository to GitHub:
   ```bash
   git add -A
   git commit -m "feat: SNNotes v1.0.0"
   git remote add origin https://github.com/YOUR_USERNAME/snnotes.git
   git branch -M main
   git push -u origin main
   ```
2. Trigger the automated Windows release build:
   ```bash
   git tag -f v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically compile the Rust Tauri backend and generate signed Windows `.msi` and `.exe` installers in your GitHub Releases tab!

---

## 🛡️ License

MIT License. Designed and built with futuristic cyberdeck protocols by Snake Nation.
