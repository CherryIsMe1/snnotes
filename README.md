# SNNOTES

A cyberpunk companion notes, interactive checklist, and alarm application for Windows, crafted with the exact design system, themes, and Web Audio API architecture as **SNDeck**.

![Version](https://img.shields.io/badge/version-1.2.0-00ff88?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-b026ff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-ff1a75?style=flat-square)

---

## ⚡ Key Features

- **Cyber Planner & Calendar**:
  - Full monthly calendar view linked directly with alarms, scheduled notes, and daily tasks.
  - Interactive day agenda showing hourly timeline, active alarm sirens, and daily checklist progress.
  - Quick scheduling: plan a task or alarm directly onto any date with one click.
  - Seamless integration: opening any scheduled item from the calendar opens that note in the editor.
- **Rich Markdown Formatting & Shortcuts**:
  - Full formatting toolbar (`Bold`, `Italic`, `Strikethrough`, `H1`, `H2`, `• List`, `☑ Task`, `</> Code`, `❝ Quote`, `🔗 Link`).
  - Keyboard shortcuts (`Ctrl+B` for bold, `Ctrl+I` for italic, `Ctrl+U` for strikethrough, `Ctrl+K` for link).
- **Accidental Deletion Protection**:
  - Cyberpunk confirmation modal prevents accidental note loss on missclicks.
- **Redesigned High-Legibility Sidebar**:
  - High-contrast, easy-to-read Quick Timers (`⏱ 5 MIN`, `⏱ 15 MIN`, `⏱ 30 MIN`, `⏱ 1 HOUR`).
  - Redesigned Tag pills with clean contrast and sharp active highlights.
- **SNDeck Theme System**:
  - Full support for SNDeck themes: **SN** (Default Cyberpunk), **ER** (Blue/Cyan), **BLOSSOM** (Pink/Rose), and **BASIC** (Monochrome Minimalist).
  - Create and save **Custom Themes** with custom color pickers.
- **Retro CRT Scanline Filter**:
  - Toggle the scanline overlay on/off via the **RETRO: ON / OFF** button in the top HUD.
- **Keystroke Typing Audio (Sound Effects)**:
  - Acoustic feedback on every keypress when writing notes, checklists, and search queries.
  - Built-in sound profiles: `Mechanical Switch`, `Cyber Terminal`, `Typewriter`, `Soft Bubble`.
  - **Custom Audio Support**: Upload your own `.mp3` or `.wav` sound file to use as your keystroke sound!
- **Interactive Checklists & Tasks**:
  - Dedicated interactive task list with animated checkboxes and strike-through styles.
  - Live progress bar showing completed items and percentage (`4/6 (66%)`) in both the editor and note cards.
- **Standalone Windows Desktop App**:
  - Double-click `SNNotes.exe` to run immediately in a clean, standalone desktop window with no console or terminal popups.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Create new note |
| `Ctrl + S` | Save note immediately |
| `Ctrl + F` | Focus search bar |
| `Ctrl + B` | Format selection as **Bold** |
| `Ctrl + I` | Format selection as *Italic* |
| `Ctrl + U` | Format selection as ~~Strikethrough~~ |
| `Ctrl + K` | Insert Markdown [Link](url) |
| `Escape` | Close modals / dismiss alarm |

---

## 🚀 Quick Launch on Windows

Double-click **`SNNotes.exe`** in the project folder to instantly launch the standalone desktop application window.

---

## 📦 Building Windows Installers (.msi / .exe) with GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/release.yml`).

1. Push your repository to GitHub:
   ```bash
   git add -A
   git commit -m "feat: SNNotes v1.2.0"
   git push -u origin main
   ```
2. Trigger the automated release:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
   GitHub Actions will automatically build and publish Windows `.msi` and `.exe` installers in your GitHub Releases.
