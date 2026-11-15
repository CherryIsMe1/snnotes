# SNNOTES

A cyberpunk companion notes, interactive checklist, and alarm application for Windows, crafted with the exact design system, themes, and Web Audio API architecture as **SNDeck**.

![Version](https://img.shields.io/badge/version-1.0.0-00ff88?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-b026ff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-ff1a75?style=flat-square)

---

## ⚡ Key Features

- **SNDeck Theme System**:
  - Full support for SNDeck themes: **SN** (Default Cyberpunk), **ER** (Blue/Cyan), **BLOSSOM** (Pink/Rose), and **BASIC** (Monochrome Minimalist).
  - Create and save **Custom Themes** with custom accent, secondary, and highlight color pickers.
- **Retro CRT Scanline Filter**:
  - Toggle the scanline overlay on/off via the **RETRO: ON / OFF** button in the top HUD (matching SNDeck).
- **Keystroke Typing Audio (Sound Effects)**:
  - Acoustic feedback on every keypress when writing notes, checklists, and search queries.
  - Built-in sound profiles: `Mechanical Switch`, `Cyber Terminal`, `Typewriter`, `Soft Bubble`.
  - **Custom Audio Support**: Upload your own `.mp3` or `.wav` sound file to use as your keystroke sound!
  - Volume slider and quick ON/OFF toggles.
- **Interactive Checklists & Tasks**:
  - Dedicated interactive task list with animated checkboxes and strike-through styles.
  - Live progress bar showing completed items and percentage (`4/6 (66%)`) in both the editor and note cards.
  - Add tasks with the Enter key, delete tasks, and toggle task completion with sound.
- **Alarm & Reminder System**:
  - Schedule reminders with specific date and time.
  - Recurring alarms (`Daily`, `Weekly`).
  - Quick Countdown Timers (`+5m`, `+15m`, `+30m`, `+1h`).
  - Live HUD ticker showing time remaining until the next active alarm.
  - Emergency Alarm overlay with sound siren, snooze (+5m, +15m), and dismiss.
- **QOL & Offline Storage**:
  - Live HUD clock (`HH:MM:SS`).
  - Instant backup and restore: export/import your entire library as JSON.
  - Export individual notes as clean Markdown (`.md`).
  - 100% offline local storage on Windows.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Create new note |
| `Ctrl + S` | Save note immediately |
| `Ctrl + F` | Focus search bar |
| `Escape` | Close modals / dismiss alarm |

---

## 📦 Building Windows Installers (.msi / .exe) with GitHub Actions

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/release.yml`).

1. Push your repository to GitHub:
   ```bash
   git add -A
   git commit -m "feat: SNNotes v1.0.0"
   git remote add origin https://github.com/YOUR_USERNAME/snnotes.git
   git push -u origin main
   ```
2. Trigger the automated release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   GitHub Actions will automatically build and publish Windows `.msi` and `.exe` installers in your GitHub Releases.
