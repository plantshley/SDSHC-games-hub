# SDSHC Games Hub — Kiosk Setup Guide

**For:** Ashley's advisor (non-technical setup guide)
**Machine:** Dell OptiPlex 7480 AIO Touchscreen, Windows 11 Pro

---

## Overview

There are two ways to run this website:

| Method | When to use | Internet required? |
|--------|-------------|-------------------|
| **GitHub Pages** (online) | Simplest — just set a URL | Yes, at the event |
| **Localhost** (offline) | No internet at the venue | No |

Both methods end the same way: the computer boots up and goes straight into the game hub full-screen, touchscreen-ready, with no way for attendees to navigate away.

---

## Part 1: Getting the Files onto the Machine

You only need the files on the machine if you plan to run it **offline (localhost)**. If you're using the GitHub Pages URL, skip this section entirely.

### Option A: Download from GitHub (recommended)

**Step 1: Install Git**

1. Go to **https://git-scm.com/download/win** — the download starts automatically.
2. Run the installer. Click **Next** through all screens, keeping all defaults. No changes needed.
3. Click **Install**, then **Finish**.

**Step 2: Install Node.js**

1. Go to **https://nodejs.org/en/download** and download the **Windows Installer (.msi)** — choose the **LTS** version (the one labeled "Recommended For Most Users").
2. Run the installer. Click **Next** through all screens, keeping all defaults.
3. Click **Install** (approve the administrator prompt), then **Finish**.

**Step 3: Download the website files**

1. Press the **Windows key**, type `cmd`, and open **Command Prompt**.
2. Type the following and press Enter:
   ```
   cd C:\Users\%USERNAME%\Documents
   ```
3. Then type this and press Enter:
   ```
   git clone https://github.com/plantshley/SDSHC-games-hub.git
   ```
4. Wait for it to finish. A folder called `SDSHC-games-hub` will appear in your Documents folder.
5. Then type:
   ```
   cd SDSHC-games-hub
   npm install
   ```
6. Wait for it to finish (may take a minute). You'll see a `node_modules` folder appear. The files are ready.

> **In the future:** To get any updates Ashley has made, open Command Prompt, navigate to the folder (`cd C:\Users\%USERNAME%\Documents\SDSHC-games-hub`), and run `git pull`. Then run `npm install` again if prompted.

---

### Option B: Download from Box

If Ashley has uploaded the files to Box as a ZIP:

1. Open Edge, go to Box, and download the ZIP file Ashley shared.
2. Once downloaded, right-click the ZIP file and choose **Extract All**.
3. Extract it to `C:\Users\%USERNAME%\Documents\SDSHC-games-hub`.

**Step 2: Install Node.js** (same as Option A, Step 2 above)

**Step 3: Install dependencies**

1. Press the **Windows key**, type `cmd`, open **Command Prompt**.
2. Type:
   ```
   cd C:\Users\%USERNAME%\Documents\SDSHC-games-hub
   npm install
   ```
3. Wait for it to finish.

> **Note:** The Box method does not include automatic updates. To get a newer version, Ashley will need to re-upload and you'll repeat these steps.

---

## Part 2: Setting Up Kiosk Mode

Kiosk mode makes the computer automatically boot into a single full-screen browser window — no taskbar, no desktop, no way to navigate away. This section covers setup for both the online (GitHub Pages) and offline (localhost) methods.

### Before you begin

- Make sure you're signed into an **administrator account** (not the kiosk account you're about to create).
- Have a **physical keyboard** available. You'll need it to exit kiosk mode later.

---

### Method A: GitHub Pages (Online — Simplest)

Use this if the event venue has reliable internet.

**The GitHub Pages URL for this site is:**
```
https://plantshley.github.io/SDSHC-games-hub/
```

**Setting up kiosk mode:**

1. Press **Windows key + I** to open Settings.
2. In the search bar at the top of Settings, type `kiosk` and click **Set up a kiosk (assigned access)**.
3. Click **Get started**.
4. In the **Create an account** box, type a username: `KioskUser`. Click **Next**.
5. On **Choose a kiosk app**, scroll down and select **Microsoft Edge**. Click **Next**.
6. On **How will this kiosk be used?**, choose **As a digital sign or interactive display**. Click **Next**.
7. In the URL field, enter:
   ```
   https://plantshley.github.io/SDSHC-games-hub/
   ```
   Click **Next**.
8. Click **Close**.
9. **Restart the computer.**

When it restarts, it will automatically log in as KioskUser and open Edge full-screen on the game hub. Done!

**To exit kiosk mode** (e.g., to shut down or access admin features):
- Press **Ctrl + Alt + Delete** on the keyboard, then sign in with your administrator account.

**To remove kiosk mode entirely:**
- Go to Settings → Accounts → Other users → scroll to the **Kiosk** section → click the kiosk entry and choose **Remove kiosk**.

---

### Method B: Localhost (Offline — No Internet Required)

Use this if the event venue has no reliable internet.

This method requires a one-time extra setup: a startup script that automatically starts the website server before the kiosk account loads.

> **Prerequisite:** You must have completed Part 1 (files downloaded + `npm install` done) before this step.

#### Step 1: Create a startup script

1. Press **Windows key**, type `notepad`, open Notepad.
2. Paste the following exactly:
   ```bat
   @echo off
   cd /d "C:\Users\%USERNAME%\Documents\SDSHC-games-hub"
   start "" npm run dev
   ```
3. Go to **File → Save As**.
4. In the Save As window:
   - Navigate to `C:\Users\%USERNAME%\Documents\`
   - Change **Save as type** to **All Files**
   - Name the file: `start-games-hub.bat`
   - Click **Save**.

#### Step 2: Schedule it to run at startup (before kiosk logs in)

1. Press **Windows key**, type `Task Scheduler`, and open it.
2. In the right panel, click **Create Basic Task**.
3. Name it `Start Games Hub Server` and click **Next**.
4. For trigger, select **When the computer starts**. Click **Next**.
5. For action, select **Start a program**. Click **Next**.
6. Click **Browse**, navigate to `C:\Users\%USERNAME%\Documents\`, and select `start-games-hub.bat`. Click **Open**, then **Next**.
7. Click **Finish**.
8. Find the task you just created in the list, right-click it, and choose **Properties**.
9. Under the **General** tab:
   - Change **"Run only when user is logged on"** to **"Run whether user is logged on or not"**
   - Check **"Run with highest privileges"**
10. Under the **Settings** tab, uncheck **"Stop the task if it runs longer than"**.
11. Click **OK**. Enter your administrator password if prompted.

#### Step 3: Set up kiosk mode (same steps as Method A, but different URL)

1. Follow the same kiosk setup steps as Method A above (steps 1–9).
2. In step 7, use this URL instead:
   ```
   http://localhost:5173
   ```

#### Step 4: Restart the computer

When the computer restarts, it will:
1. Run the startup script (starting the web server in the background)
2. Automatically log in as KioskUser
3. Open Edge full-screen to `http://localhost:5173`

> **If the browser shows an error page on first load:** The server may still be starting up. Wait 10–15 seconds and press the **refresh button** or tap the URL bar and press Enter. This is only an issue on first boot — the server is always running while the machine is on.

**To exit kiosk mode:** Press **Ctrl + Alt + Delete**, sign in as administrator.

---

## Part 3: Power and Display Settings (Recommended for Events)

To keep the kiosk running all day without going to sleep:

1. Press **Windows key + I** → **System** → **Power & sleep**.
2. Set **Screen** to **Never** (under both "On battery power" and "When plugged in").
3. Set **Sleep** to **Never**.

To have the machine turn on automatically at a set time each day:

1. Restart the computer and press **F2** at the Dell logo to enter BIOS Setup.
2. Navigate to **Power Management** → **Auto On Time**.
3. Set the time you want the machine to power on each morning.
4. Save and exit.

---

## Quick Reference Card

| Task | Instructions |
|------|-------------|
| Start kiosk (online) | Restart computer — boots automatically |
| Start kiosk (offline) | Restart computer — server starts automatically |
| Exit kiosk | Ctrl + Alt + Delete → sign in as admin |
| Remove kiosk mode | Settings → Accounts → Other users → Kiosk section → Remove |
| Update files (GitHub) | Open Command Prompt → `cd C:\Users\%USERNAME%\Documents\SDSHC-games-hub` → `git pull` → `npm install` |
| GitHub Pages URL | `https://plantshley.github.io/SDSHC-games-hub/` |
| Localhost URL | `http://localhost:5173` |

---

## Troubleshooting

**The screen is blank or shows an Edge error page**
- If using localhost: the server may still be starting. Wait 15 seconds and refresh.
- If using GitHub Pages: check that the venue has internet access.

**Can't exit kiosk mode**
- You need a physical keyboard connected. Press Ctrl + Alt + Delete.

**Touch isn't working**
- Open Device Manager (search for it in the Start menu), find the touchscreen under **Human Interface Devices**, right-click, and choose **Update driver → Search automatically**.

**Need to make changes to kiosk settings**
- Exit kiosk mode (Ctrl + Alt + Delete), go to Settings → Accounts → Other users, and remove/reconfigure the kiosk.

**Git clone fails with authentication error**
- The repository may be private. In that case, use Option B (Box) to transfer files instead.
