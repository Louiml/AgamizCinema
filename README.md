<div align="center">

# Agamiz Cinema

**A streaming app** browse movies & TV, also you watch together with friends.

Built with React + Vite + TypeScript + Tailwind CSS on the frontend and Rust (Tauri) for a native desktop shell with local persistence.

</div>

---

<a id="designs"></a>

## ⚠️ Important update: two interface designs

Agamiz Cinema now ships with **two full interface designs**. Switch at any time in
**Settings → Appearance → Interface Design**:

| | **Old Design** | **New Design (Beta)** |
|---|---|---|
| Look | Dark glassmorphic, accent swatches, spring easing | Netflix-inspired: flat `#141414`, 2px corners, no blur |
| Hover on a poster | Fade + centre play button | **Card grows and expands a detail panel** (title, actions, rating, synopsis) |
| Hero | Rotating carousel | Full-bleed featured title with Play / More Info |
| Navigation | Centred segmented pill | Left-aligned top bar that solidifies on scroll |
| Light mode | ✅ | ❌ dark only |
| Accent theme | 6 swatches (noir/mint/rose/amber/violet/azure) | fixed `#E50914` |
| Frosted glass | ✅ | ❌ flat surfaces |
| Default | ✅ **for everyone, unchanged** | opt-in |

**Old Design is still the default, so upgrading changes nothing until you opt in.**
Your choice is stored per device and survives restarts, so you can flip back and
forth as much as you like.

### How the two designs are wired

Worth knowing if you plan to contribute:

- `uiDesign` in `AppSettings` (`src/types/app.ts`) is the single source of truth,
  defaulting to `"classic"`.
- The choice is written to `<html data-design="netflix">`, which `src/netflix.css`
  reacts to. Because every colour in `tailwind.config.js` resolves through the
  semantic vars (`rgb(var(--canvas) / <alpha-value>)`), the whole app re-themes
  from that one attribute.
- Only the browsing chrome is purpose-built for the new design — top bar, hero,
  poster rails, hover-expand cards, Top 10 row (`src/components/netflix/`).
  Discover, Watchlist, Settings, the player, search and every modal are the
  **same components as before**, re-skinned by `netflix.css`. The two designs do
  not fork the app.
- `NetflixShell` is lazy-loaded, so Old Design users never download it
  (~22 kB / ~7 kB gzipped).

---

## Features

- 🏛️ **Two interface designs** - the original glassmorphic look, plus a Netflix-inspired redesign (poster rails, expanding hover cards, Top 10 with stroked numerals) — see [the update above](#designs)
- 🎥 **Browse & Discover** - featured hero carousel, "Now Playing" and "Upcoming" rows sourced from TMDB
- 🏆 **Top 10** - trending titles ranked and shown in a dedicated row
- 🔍 **Search** - live suggestions, trending terms, and recent searches
- ⭐ **Watchlist** - save titles, mark watched, bulk clear with confirmation
- 👥 **Watch Together** - create a room, share a deep link, and sync playback with peers over WebRTC (PeerJS / vidsync)
- 🪟 **Native desktop shell** - Tauri window controls with true fullscreen (hides the taskbar)
- 🌍 **i18n** - English, Hebrew, and Russian
- 🎨 **Cinema design** - configurable accent theme and Light/Dark mode, on top of either interface design

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
- **Tauri 2** prerequisite system tools for your OS - see the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/):
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

- **Frontend** (`src/`) - React components, hooks, providers, and i18n locales (`en`, `he`, `ru`).
- **Design switch** (`src/netflix.css`, `src/components/netflix/`) - one `<html data-design>` attribute picks the skin; see [the update above](#designs).
- **Rust backend** (`src-tauri/`) - Tauri shell providing local persistence, a TMDB proxy, and a media/embed blocker bridge.
- **Watch Together** (`src/lib/watchTogether.ts`, `src/hooks/useWatchTogether.ts`) - WebRTC peer connection for synced playback via room deep links (`#/watch?room=...`).

---

## Project Structure

```
agamiz-cinema/
├── src/            # React frontend (components, hooks, pages, providers, locales)
│   ├── components/shell/    # Old Design app shell
│   ├── components/netflix/  # New Design (Beta): shell, rails, hover-expand cards
│   └── netflix.css          # New Design tokens + shared-primitive overrides
├── src-tauri/      # Rust backend + Tauri configuration
├── public/         # Static assets, sitemap, robots.txt
├── scripts/        # Release + SSR smoke tooling
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

> **Disclaimer:** This project is for educational purposes. Please respect copyright bro. the app only surfaces streaming sources and metadata from publicly available providers.
