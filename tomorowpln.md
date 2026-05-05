# 📅 Tomorrow's Feature Roadmap

This document outlines the next set of premium features to be implemented for **JARVIS COMICS**.

---

## ✅ FIXED 1 — Anime / Hentai Streaming
The adult anime section now uses Hanime-first searching and improved HLS playback with iframe fallbacks.

## ✅ FIXED 2 — Missing Chapters (Stepmother's Friends)
The ManhwaRead fallback has been hardened with multiple proxies and robust regex. Chapters 79-147 are now correctly merged and accessible.

---

The adult anime section loads but **never plays video**. Here's the full diagnosis:

### Root Cause
All Consumet API mirrors are dead (451 / timeout / connection refused):
- `api.consumet.org` → ❌ 451 (geo-blocked)
- `consumet-api.ryuk-me.dev` → ❌ fetch failed
- `api-consumet-org-ashy.vercel.app` → ❌ timeout
- `c.delusionz.xyz` → ❌ fetch failed
- `api.anify.tv` → ❌ timeout (consistently)

**Hanime** (`search.htv-services.com`) is ✅ working and returns results.
**HentaiCity** (`hentaicity.com`) is ✅ reachable but uses an **iframe-based player** — no direct `<source>` tag in the HTML. Video URLs are loaded dynamically by JavaScript.

### Plan for Tomorrow

#### Option A — Hanime-first approach (Recommended)
1. When user clicks an anime, **immediately search Hanime** by title instead of waiting for Anify.
2. Show the Hanime results directly as episode cards (they have real slugs & HLS streams).
3. Use `/api/anime/hanime/video/:slug` to get the `.m3u8` stream → pass to `AnimePlayer`.

#### Option B — HentaiCity iframe embed
1. Instead of scraping the video source (it's behind JS), **embed the HentaiCity page in an iframe** directly in the player area.
2. Search for the video URL via `/api/anime/hentaicity/search/:title`, get back the page URL, and embed it.
3. Simpler but less control over playback UI.

#### Files to change
- `api/anime.js` — add a `/hanime/list` endpoint that searches by title and returns full episode slugs
- `src/lib/anime.ts` — `getAnimeInfo()` should do a parallel Hanime search immediately, not just as a fallback
- `src/routes/adult.tsx` — wire up direct Hanime episode links on the adult page

---

### 1. 📱 PWA & Offline Reading
Transform the web app into a high-performance **Progressive Web App**.
- **Installable**: Add a "Add to Home Screen" prompt for mobile users.
- **Splash Screen**: Custom branding during app launch.
- **Offline Cache**: Allow users to download chapters for reading without an internet connection.

### 2. 📖 Advanced Reader Settings
Enhance the reading experience with granular controls.
- **Layout Toggles**: Switch between **Vertical Scroll** (Webtoon mode) and **Single Page** (Manga mode).
- **Direction**: Support for Right-to-Left (Japanese style) and Left-to-Right.
- **Reading Filters**: Add a "Night Mode" brightness slider and Sepia/Gray filters for eye comfort.

### 3. 🔔 Release Notifications
Keep users engaged with real-time updates.
- **Follow System**: Let users "Follow" their favorite series.
- **Push Notifications**: Use browser notifications to alert users when a new chapter is released on MangaDex or uploaded by an admin.

### 4. 🤖 AI Recommendations
Personalize the home page discovery.
- **Smart Feed**: Analyze the user's `reading_progress` to suggest similar genres and titles they might enjoy.

### 5. 📂 Custom Collections
Social and organization features.
- **User Lists**: Let users create public or private collections (e.g., "My All-Time Favorites" or "Isekai Gems") and share them with others.

---
*Created by Antigravity on 2026-05-03*
