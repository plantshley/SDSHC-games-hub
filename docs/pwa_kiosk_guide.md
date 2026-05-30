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

The update process is largely automatic, driven by the background Service Worker.

1. **You Push an Update:** You push new code to GitHub, which automatically updates the live website.
2. **Kiosk Connects to Internet:** The advisor connects the kiosk to Wi-Fi (e.g., at home before an event).
3. **Open the App:** The advisor opens the installed app.
4. **Background Download:** In the background, the Service Worker detects that the files on GitHub are newer than the local cached files. It quietly downloads the new assets.
5. **Apply the Update:** 
   - Once the background download finishes, the new version is ready.
   - The advisor simply needs to **close the app and reopen it**, or refresh the page, to see the new changes. 
   - *(Note: We can also add a small "Update Available! Click to refresh" button in the UI to make this obvious).*

## 4. Handling Firebase (Offline/Online Synchronization)

Currently, your project is in "Phase 1A", relying entirely on local browser storage (`localStorage`), which is perfect for offline PWA functionality. The data will persist locally across offline sessions.

When you are ready to integrate Firebase for global team score tracking, you will use the browser's connectivity state (`navigator.onLine`) to handle offline tracking seamlessly.

### The Logic Flow

```javascript
// Example logic when a team finishes a game and submits their score
function submitTeamScore(scoreData) {
  
  if (navigator.onLine) {
    // DEVICE IS ONLINE
    // 1. Send the score directly to Firebase
    // 2. (Optional) Check localStorage for any pending offline scores and sync them to Firebase now.
    pushToFirebase(scoreData);
  } else {
    // DEVICE IS OFFLINE (At an event)
    // 1. Save the score locally to continue tracking the current event isolated.
    saveToLocalStorage(scoreData);
  }
}
```

### Firebase Native Offline Persistence
Alternatively, the Firebase Web SDK has a feature called **Offline Persistence**. When enabled, Firebase automatically handles the caching and synchronization:
- If the device is offline, any `set()` or `add()` commands are cached locally by Firebase.
- Firebase triggers local events so your UI updates immediately.
- When the device connects to the internet later, Firebase automatically syncs all the cached changes to the cloud without you needing to write custom sync logic. 

**Conclusion:** Local offline tracking will not be disrupted by adding Firebase. The PWA environment ensures `localStorage` is preserved reliably.
