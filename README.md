<div align="center">

# Agamiz Cinema

**A streaming app** browse movies & TV, also you watch together with friends.

Built with React + Vite + TypeScript + Tailwind CSS on the frontend and Rust (Tauri) for a native desktop shell with local persistence.

</div>

---

## Features

- 🎥 **Browse & Discover** — featured hero carousel, "Now Playing" and "Upcoming" rows sourced from TMDB
- 🏆 **Top 10** — trending titles ranked and shown in a dedicated row
- 🔍 **Search** — live suggestions, trending terms, and recent searches
- ⭐ **Watchlist** — save titles, mark watched, bulk clear with confirmation
- 👥 **Watch Together** — create a room, share a deep link, and sync playback with peers over WebRTC (PeerJS / vidsync)
- 🪟 **Native desktop shell** — Tauri window controls with true fullscreen (hides the taskbar)
- 🌍 **i18n** — English, Hebrew, and Russian
- 🎨 **Cinema design** — dark glassmorphic interface with a mint accent and spring easing

---

## Tech Stack

| Layer | Language / Framework | Badge |
|-------|---------------------|-------|
| Frontend | React 18 | ![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) |
| Language | TypeScript | ![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) |
| Build tool | Vite 5 | ![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) |
| Styling | Tailwind CSS 3 | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| Desktop runtime | Rust (Tauri 2) | ![Rust](https://img.shields.io/badge/Rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=white) |
| i18n | i18next | ![i18next](https://img.shields.io/badge/i18next-%2326A69A.svg?style=for-the-badge&logo=i18next&logoColor=white) |
| P2P sync | PeerJS | ![PeerJS](https://img.shields.io/badge/PeerJS-%234a4a4a.svg?style=for-the-badge) |

---

## Requirements

- **Node.js** 18+ (npm)
- **Rust** toolchain (rustc **1.77.2+**) with `cargo`
- **Tauri 2** prerequisite system tools for your OS — see the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/):
  - **Windows**: Microsoft C++ Build Tools, WebView2
  - **Linux**: WebKitGTK, libappindicator, librsvg

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the TMDB API key

The app pulls metadata and sources from **TMDB**. Create your API key at [themoviedb.org](https://www.themoviedb.org/settings/api) and provide it via a `.env` file:

```
VITE_TMDB_API_KEY=your_key_here
```

> The key is read at build time. If it's missing, the app may fall back to a bundled development key.

### 3. Run locally (web)

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) in your browser.

### 4. Run the native desktop app

```bash
npm run tauri:dev
```

### 5. Build for production

```bash
npm run build        # type-check + bundle the web app
npm run tauri:build  # produce the desktop installer
```

### 6. Other scripts

```bash
npm run preview      # preview the production web build
npm run smoke        # run the SSR smoke test
npm run release      # bump version + build (patch/minor/major variants available)
```

---

## How It Works

- **Frontend** (`src/`) — React components, hooks, providers, and i18n locales (`en`, `he`, `ru`).
- **Rust backend** (`src-tauri/`) — Tauri shell providing local persistence, a TMDB proxy, and a media/embed blocker bridge.
- **Watch Together** (`src/lib/watchTogether.ts`, `src/hooks/useWatchTogether.ts`) — WebRTC peer connection for synced playback via room deep links (`#/watch?room=...`).

---

## Project Structure

```
agamiz-cinema/
├── src/            # React frontend (components, hooks, pages, providers, locales)
├── src-tauri/      # Rust backend + Tauri configuration
├── public/         # Static assets, sitemap, robots.txt
├── scripts/        # Release + SSR smoke tooling
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

> **Disclaimer:** This project is for educational purposes. Please respect copyright bro. the app only surfaces streaming sources and metadata from publicly available providers.
