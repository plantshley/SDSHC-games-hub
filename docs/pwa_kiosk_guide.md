# PWA Kiosk Deployment Guide

This document outlines the strategy and instructions for running the SDSHC Games Hub as an offline, installable Progressive Web App (PWA) on a Windows 11 Kiosk.

## 1. How It Works

A Progressive Web App (PWA) is a standard web application that uses modern browser features to act like a native desktop app. 
By adding a "Service Worker" and a "Web App Manifest" to your Vite project:
1. The browser is told to cache all of your HTML, CSS, JavaScript, and Image assets locally on the hard drive.
2. The browser allows the user to "Install" the website, giving it a desktop shortcut and removing the browser's URL bar, tabs, and menus.
3. When launched from the shortcut, the app intercepts all network requests and serves the files from the local cache instead of trying to fetch them from the internet. This allows the app to run completely offline.

## 2. Setup & Installation Steps

### Developer Setup (You)
1. **Install the Plugin:** Add `vite-plugin-pwa` to your project dependencies.
2. **Configure Vite:** Update `vite.config.js` to register the plugin and define the app's metadata (Name, icons, colors).
3. **Deploy:** Push the changes to GitHub. Your GitHub Pages site will now be a PWA.

### Advisor Setup (One-Time Kiosk Setup)
1. **Connect to Internet:** Turn on the Dell OptiPlex kiosk and connect to Wi-Fi.
2. **Visit Site:** Open Microsoft Edge or Google Chrome and navigate to: `https://plantshley.github.io/SDSHC-games-hub/`
3. **Install App:** Look at the far right of the URL address bar. Click the **"App available"** or **"Install"** icon. Follow the prompt to install the app.
4. **Pin/Shortcut:** The app will now have a shortcut on the Start Menu and Desktop.
5. **Kiosk Mode (Optional):** 
   - *Simple Method:* Open the app and press **F11** to enter full screen.
   - *Strict Method:* Open Windows Settings > Accounts > Family & other users > Set up a kiosk (Assigned Access). Assign the installed SDSHC app to the kiosk profile. This prevents users from exiting the app entirely.

## 3. How Updating Works

The update process is automatic, driven by the background Service Worker. The app is configured with `registerType: 'autoUpdate'` (see [vite.config.js](../vite.config.js)), which means **no "Update Available" button and no manual reopen are required** — the new version applies itself.

1. **You Push an Update:** You push new code to GitHub `main`. The GitHub Actions workflow ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml)) builds `dist/` and deploys it to GitHub Pages automatically. (Note: Pages only deploys from `main` — work on a feature branch stays off the live site until merged.)
2. **Kiosk Connects to Internet:** The advisor connects the kiosk to Wi-Fi (e.g., at home before an event).
3. **Open the App:** The advisor opens the installed app **while online**.
4. **Background Download + Auto-Activate:** The Service Worker detects the newer files on GitHub, downloads them in the background, then activates the new version and **reloads the page on its own**. The advisor doesn't have to click anything.

> ⚠️ **Caveat — the auto-reload can interrupt a game in progress.** Because activation triggers a page reload, if someone is mid-game when the new version finishes downloading, their run resets. In practice this lands during the at-home "connect to Wi-Fi and open it" step, so it's low-risk — but for that reason, **always do your update check at home before an event, never during one.** While the kiosk is offline at an event it cannot update, so no surprise reloads can happen there.

> ✅ **Offline loading is confirmed working.** Tested by installing the PWA from the GitHub Pages URL, turning Wi-Fi off, and reopening — the app loads fully from cache. (This is the correct way to test offline; `npm run dev` is not a valid offline test.)

## 4. Handling Firebase (Offline/Online Synchronization)

> **Status:** The leaderboard backend is being migrated from Phase 1A (`localStorage` only) to **Phase 1B (Firebase Firestore with offline persistence)**. See [.claude/plans/the-website-advanced-mode-fluttering-dove.md](../../.claude/plans/the-website-advanced-mode-fluttering-dove.md) for the full design.

### The chosen model: Firestore offline persistence (one data layer, not two)

We use the Firebase Web SDK's **offline persistence** (an IndexedDB-backed local cache) as the *single* store. There is no separate localStorage event store anymore. How it behaves:

- **Online:** reads and writes go to Firestore and are mirrored into the local cache automatically.
- **Offline (at an event):** the app reads from the **last-synced cloud snapshot** in the local cache, and every score/team write is queued in Firestore's local mutation queue. The UI updates immediately as if online.
- **Reconnect (back home):** Firestore **automatically replays the queued writes to the cloud** — no manual export/import, no custom sync code. The offline event's scores merge into the global database, tagged with their `eventId`.
- **Statewide visibility is still gated by approval.** An offline event's scores stay invisible on the This-Month / All-Time leaderboards until you approve the teams in the admin panel — so an offline event feels isolated during play but isn't *lost* after sync.

### ⚠️ Two limits to plan around

1. **The cache only holds data you've already loaded while online.** Firestore does **not** bulk-download the whole database. If a kiosk is taken offline before it has ever loaded the leaderboard online, its cache is empty. → This is why the **warm-up step below is mandatory.**
2. **Two devices inventing the same team name offline create duplicates.** If two kiosks both add "Pierre HS" while offline, neither can see the other's pending team, so two team records sync up. Clean this up later with the admin panel's merge/rename. For a **single kiosk per event, this never happens** — the common case is safe.

### ✅ Host / admin checklist — guaranteeing data syncs properly

**Before the event (at home, online):**
1. Connect the kiosk to Wi-Fi and open the installed app. Let it auto-update (Section 3).
2. In Advanced Mode, **open the leaderboard (trophy icon) at least once** while online. This "warms" the local cache so the kiosk has the current cloud data to start from. *(If you set up the event from your laptop, also open it once on the actual kiosk.)*
3. In the admin panel, create/confirm the event and set it active on the kiosk.
4. Confirm you see existing teams/scores in the leaderboard — that proves the cache is populated.

**During the event (offline is fine):**
5. Let kids play normally. Scores accumulate in the local queue. Do **not** clear browser data or uninstall the app — that would wipe the unsynced queue. (The 120s/600s idle reset is safe; it only clears in-game progress, not the Firestore cache or queue.)
6. Keep the kiosk on the same installed app the whole event; don't open the site in a separate browser tab.

**After the event (back home, online):**
7. Connect the kiosk to Wi-Fi and open the app. **Leave it open for a minute or two** so Firestore can flush the queued writes to the cloud. (Watch the leaderboard counts climb / settle.)
8. Sign in to the admin panel and **approve the event's teams** so their scores appear on the statewide leaderboards.
9. (If multiple kiosks ran) scan the team list for duplicate school names and **merge** them in admin.

> **One-line rule of thumb:** *Open the leaderboard once online before the event, and leave the app open online for a couple minutes after the event.* Those two moments are what guarantee a clean sync.

### A note on the admin password

The Firebase web SDK config (apiKey, etc.) is safe to commit to the repo — it's public by design and access is enforced by Firestore security rules, not by hiding the config. The admin **password is never in the repo**; it lives hashed on Firebase's servers and is set/reset only from the Firebase Console.
