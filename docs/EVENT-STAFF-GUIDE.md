# SDSHC Games Hub — Event Staff Guide

Everything you need to run the Games Hub with students at a school visit, fair booth, or field day.

**Live site:** https://plantshley.github.io/SDSHC-games-hub/
**Admin panel:** https://plantshley.github.io/SDSHC-games-hub/#advanced/admin
**Printable one-page cheat sheet:** [event-cheat-sheet.html](event-cheat-sheet.html) — open it in a browser and print. Keep a copy in the event bag.

> **Read this first.** There is exactly one thing that reliably goes wrong, and it isn't obvious:
>
> **Creating an event does not turn it on for your device.** Events are stored in the cloud and shared, but *"which event is active on this laptop/kiosk"* is saved **on that device only**. If Ashley creates the event a week early, your laptop still knows nothing about it. You must open the Admin panel **on the device you're bringing**, sign in, and pick the event from the **"Set kiosk to"** dropdown. Every device you bring needs this, separately.
>
> If you skip that step, students never see the Team Play prompt and every score is recorded as casual, tied to no team. The games all still work — but nothing lands on the leaderboard.
>
> *(A change is planned that will let a device join the open event automatically, with no admin sign-in. Until it ships, the step above is required.)*

---

## Table of contents

1. [Step 0 — Tell Ashley about the event](#step-0--tell-ashley-about-the-event)
2. [What the hub is](#what-the-hub-is)
3. [Choose your event shape](#choose-your-event-shape) ← **do this before anything else**
4. [Before the event — device prep](#before-the-event--device-prep)
5. [Bringing more than one device](#bringing-more-than-one-device)
6. [Setting up an event yourself](#setting-up-an-event-yourself)
7. [Running the event — what students see](#running-the-event--what-students-see)
8. [Teams: the student end vs. the admin end](#teams-the-student-end-vs-the-admin-end)
9. [Online vs. offline (and blocked school Wi-Fi)](#online-vs-offline-and-blocked-school-wi-fi)
10. [After the event](#after-the-event)
11. [Which device should I bring?](#which-device-should-i-bring)
12. [Running the room — practical playbook](#running-the-room--practical-playbook)
13. [Troubleshooting](#troubleshooting)
14. [Quick reference](#quick-reference)

---

## Step 0 — Tell Ashley about the event

**Before you do anything else, let Ashley know an event is coming.** She'll register the event in the system ahead of time so you don't have to.

> **Contact:** ashley@sdsoil.org · text 605-251-4364
> **Lead time:** a few days ahead — earlier is better.

Include:

- **Event name** (this becomes the leaderboard tab students see — e.g. `Lincoln HS Ag Day` or `FFA State Convention 2026`)
- **Date and rough time window**
- **Which [event shape](#choose-your-event-shape) you want** — school vs. school, class teams, or one school team
- **School(s) attending**, spelled how they should appear
- **Roughly how many students**, and what grades
- **How many devices you're bringing** — each one needs its own setup
- **Whether you'll have reliable Wi-Fi** — assume you won't; see [Online vs. offline](#online-vs-offline-and-blocked-school-wi-fi)

Ashley creates and opens the event, and can pre-create the teams. **You still have to point each device at the event** (see [device prep](#before-the-event--device-prep), step 3).

Short notice? You can create the event yourself — see [Setting up an event yourself](#setting-up-an-event-yourself).

---

## What the hub is

Two modes, chosen on the opening screen:

- **Kid Mode** — pixel-art games for Pre-K through middle school. No teams, no leaderboard, no setup. Tap and play.
- **Advanced Mode** — sleek, dark-themed games for high school and college. **This is the mode with teams, events, and the leaderboard.** Everything in this guide is about Advanced Mode.

**Advanced Mode has 6 games, all 1–4 players:**

| Game | What it is |
|---|---|
| ☉ Spin the Wheel | Spin, pick a category, answer soil science questions |
| ⚡ Trivia Blitz | Timed multiple-choice rounds |
| ✦ Soil Jeopardy | Category grid with point values and Daily Doubles |
| ℵ Word or Worm? | Wheel-of-Fortune style — guess soil terms letter by letter |
| ☘ Field Guide | Identify SD plants, crops, wildlife, soils, and equipment from photos |
| ⧉ Conservation Connections | Sort 16 tiles into 4 hidden groups |

All six count equally toward the leaderboard. Scores are **normalized** — each game's points are divided by that game's "par," so a strong Jeopardy run (thousands of raw points) is worth about the same as a strong Connections run (tens). Students don't need to hunt for the high-scoring game.

Games are silent by design, run fully offline once prepped, and never need the internet to *play*. The internet is only used to save scores to the shared leaderboard — and even that queues safely offline.

---

## Choose your event shape

**"Team" doesn't mean the same thing at every event.** Pick one of these three before you set anything up — they need different prep, different approvals, and different cleanup.

| | **A. School vs. School** | **B. Class Teams** | **C. One School, One Team** |
|---|---|---|---|
| **Who's coming** | Several schools | One classroom | One school |
| **A "team" is** | Each school | Each small group of students | The whole school |
| **Who creates teams** | You, beforehand | You, beforehand (recommended) | You, beforehand |
| **How many teams** | 2–10 | 4–8 | 1 |
| **Approve for event** | Yes, each school | Yes, each group | Yes |
| **Approve statewide** | Yes | **No** | Yes |
| **After the event** | Nothing | Merge the groups into the school | Nothing |
| **Competition happens** | Between schools, live | Between groups, live | Statewide, over time |

The two approval buttons exist precisely so these can differ — see [the two approvals](#the-two-approvals).

### Path A — School vs. School

Two or more schools in the room, each racking up points for their school.

1. **Before the event, online:** Advanced Mode → Team Play → on the roster screen add each school by name, giving each a distinct color pair. Tap **"+ Add team"** for each.
2. **Admin → Active event roster:** tap **"Approve for event"** on every school. This is what puts them in the Team dropdown students see.
3. Also tap **"Approve statewide"** on each, so the points reach the All-Time board.
4. **Students** pick their school from the dropdown. No typing.
5. **After:** nothing to do. Check for duplicates if you ran multiple devices offline.

Different players on one device can be on different teams — a 2v2 between two schools on a single machine is a great demo.

### Path B — Class Teams (one classroom, groups compete)

One school, students split into small groups that compete against each other in the room.

The temptation is to let students invent their own team names live. **You can, but the room runs much better if you pre-create the groups.** Here's why: the Team dropdown on each game's intro screen lists **only teams already approved for this event**. Pre-create and approve them, and every student just picks their group from a list. Skip it, and each group types a name by hand, those names arrive as *pending*, and **the event leaderboard stays empty until you approve each one** — meaning you're tapping Approve on a second device while trying to teach.

1. **Name the groups with the school as a prefix:** `Lincoln – Table 1`, `Lincoln – Table 2`, … **Not** bare `Table 1`. See the warning below — this one bites hard.
2. **Before class, online:** add each group on the roster screen, one color pair each.
3. **Admin → Active event roster** → **"Approve for event"** on each. Do **not** approve them statewide.
4. **Students** pick their group from the dropdown; the event leaderboard fills up live as they play.
5. **After:** [roll the groups up into one school team](#rolling-class-teams-into-a-school-team) so the school gets combined credit on the All-Time board and `Lincoln – Table 3` doesn't live on the statewide leaderboard forever.

> ⚠️ **Team names are global, not per-event.** The app looks a team up by name across the *entire* database, not just your event. If you create a bare `Table 1` today for Lincoln and someone creates `Table 1` next month for Brookings, **they resolve to the same team and the two schools' scores merge together.** Always prefix class-team names with the school. (Capitalization and extra spaces are ignored, so `table 1` and `Table  1` are the same team — but spelling is not.)

If you *do* want students naming their own groups, prefix still applies, tell them to include the school, and keep the admin panel open on a second device to approve each group as it registers.

### Path C — One School, One Team

Everyone at the school plays under a single team name, pooling every point.

1. **Before, online:** add the school as one team on the roster screen.
2. **Admin:** **"Approve for event"** and **"Approve statewide"**.
3. **Students** pick the school every time, and type their own first name in the player field.
4. **After:** nothing.

**Be aware of the tradeoff:** with one team, the event leaderboard has exactly one row, so there is no in-room competition to watch. This shape is for driving the school up the **All-Time** board, not for a competitive classroom hour. If you want both, run Path B and merge afterward — you get the live competition *and* the pooled statewide score.

---

## Before the event — device prep

**Do all of this at home, on good Wi-Fi, on the exact device you're bringing.** About 10 minutes. You cannot do it on-site.

### 1. Install the app

1. Open **Microsoft Edge** or **Google Chrome** and go to https://plantshley.github.io/SDSHC-games-hub/
2. Look at the far right of the address bar for an **"Install"** or **"App available"** icon. Click it and confirm.
3. You now have a desktop/Start Menu shortcut. **Use that shortcut from now on**, not the browser tab.

Installing gives you a full-screen app with no URL bar, and — more importantly — it's what lets the app run with no internet.

### 2. Cache the games for offline

The app downloads its code automatically, but the ~107 MB of photos, sprites, and diagrams are fetched on demand. Force them all down now:

1. Open the installed app **while online**. Let it sit a few seconds — it auto-updates in the background.
2. Go to **Advanced Mode → trophy icon 🏆 → Admin** (or type the admin URL directly).
3. Enter the **admin password**. (Ask Ashley. One shared password; the device remembers it after the first sign-in.)
4. Scroll to **Offline readiness** → tap **"Cache for offline"**.
5. Wait for **"✓ All assets cached — ready to go offline."**

> ⚠️ **Re-do this after every app update.** A new version means new files, and the old cache no longer covers them. Tapping the button again when already cached is harmless and fast.

### 3. Point the device at the event ← the step everyone forgets

Still in the Admin panel:

1. Find **"Active event on this kiosk"** at the top.
2. In the **"Set kiosk to"** dropdown, choose your event.
3. The line beside it should now read **"Currently active: *Your Event Name*"**.

**Only events with status `open` appear in this dropdown.** If the event was *scheduled* for a future date rather than started, it won't be listed — and **scheduled events do not open themselves when their time arrives.** Scroll to the **Events** section, find it, tap **"Open now"**, then come back and set it active.

### 4. Warm the leaderboard

Back out to **Advanced Mode** and tap the **trophy icon 🏆** once while still online. This pulls the current teams and scores into the device's local cache so the leaderboard isn't empty offline. Seeing real teams and scores is your proof it worked.

### 5. Create and approve your teams

Follow the recipe for [your event shape](#choose-your-event-shape). Do this **online**, and do it **once** — not once per device. Teams live in the cloud and every prepped device will see them.

### Pre-flight checklist

The night before, per device:

- [ ] App is **installed** (opened from the desktop shortcut, not a browser tab)
- [ ] Admin → Offline readiness shows **"✓ All assets cached"**
- [ ] Admin → Active event shows **"Currently active: *Your Event*"**
- [ ] Trophy icon shows real teams/scores (not empty, not "Loading…")
- [ ] Your teams appear on the event roster marked **✓ Event**
- [ ] Opening a game's intro screen shows those teams **in the Team dropdown**
- [ ] Device is **charged**, and you have the charger
- [ ] You know the admin password

That sixth item is the one that catches Path B — if the dropdown is empty, you approved the teams statewide but not *for the event*.

---

## Bringing more than one device

Perfectly supported, and the right call for a class of 25. A few rules:

- **Events and teams are shared** through the cloud. Create them once.
- **The active-event pointer is per-device.** Every laptop, tablet, and kiosk must be walked through [prep steps 1–4](#before-the-event--device-prep) on its own — install, cache, admin sign-in, "Set kiosk to."
- **Pre-create the teams once, online, before the event.** Then every device shows the same dropdown, nobody types a name, and you cannot get duplicates.
- **If devices are offline and students type team names by hand, you will get duplicates.** Each device's cache can't see a team another device invented while offline, so two "Lincoln HS" records sync up later. [Merge them afterward.](#after-the-event)
- Don't point two devices at *different* events at the same gathering unless you mean to.

Four students per device, per game. Two devices comfortably serve a class of 8 groups on rotation.

---

## Setting up an event yourself

You have the admin password, so you can do everything Ashley does. Go to **Admin** (trophy icon 🏆 → "Admin" link at the bottom of the leaderboard) and sign in.

### Create the event

In **"Active event on this kiosk"**, bottom row:

1. Type an **event name**. Students see this as their leaderboard tab, so name it for humans: `Brookings Middle School Visit`, not `event3`.
2. Choose **"Start now"** or **"Schedule for"** + a date/time.
3. Tap **"Create event"**.

| Choice | What happens |
|---|---|
| **Start now** | Event opens immediately **and is set active on this device**. Other devices still need step 3. |
| **Schedule for** | Event is created with status `scheduled`. It is **not** active, **won't appear** in the "Set kiosk to" dropdown, and **will not open by itself** when the scheduled time arrives. |

> **Scheduling is a reminder, not an automation.** On event day someone must open **Events → "Open now"** before any device can join. If you don't need the calendar entry, "Start now" on the morning of is simpler.

### Managing events

The **Events** section lists everything with status badges:

| Status | Meaning | Actions |
|---|---|---|
| `scheduled` | Created for later, not running | **Open now**, Delete |
| `open` | Running — can be set active, accepts scores | **End**, Delete |
| `ended` | Finished, still on the leaderboard | **Reopen**, Delete |

- **End** closes the event. If it was active on your device, that's cleared. Other devices notice and stand down next time they're online.
- **Reopen** un-ends it (ended by accident, or a two-day event).
- **Delete** ⚠️ **permanently destroys the event *and every score tagged to it*.** No undo. When an event is simply over, use **End**.

> **Events never close themselves.** An event you forget to End stays `open` forever and keeps showing up in every device's dropdown. Get in the habit of ending it the evening of.

---

## Running the event — what students see

```
Opening screen
     │
     └── Advanced Mode
            │
            ├── "How do you want to play?"      ← only if an event is
            │      │                               active on this device
            │      ├── Team Play  → Team Roster screen → Game Select
            │      └── Casual Play ───────────────────→ Game Select
            │
            └── (no active event) ─────────────────────→ Game Select
                                                          │
                                                          └── pick a game
                                                                 │
                                                                 └── player names
                                                                     + team dropdown
                                                                        → play → scores saved
```

### The play-mode prompt

If the device has an active, open event, the first thing after Advanced Mode is **"How do you want to play?"**

- **Team Play** — scores roll up to a team. Goes to the roster screen next.
- **Casual Play** — no team tracking. The team field is hidden everywhere, and scores are recorded but **never appear on any leaderboard.**

**This choice lasts for the browser session, not forever.** After **10 minutes** idle the app returns to the opening screen, which clears the choice — so the next group is asked fresh. To force a reset between groups, tap **Back** to the opening screen.

Use **Casual Play** for walk-up booths at fairs. Use **Team Play** for classrooms and anything competitive.

### The roster screen (Team Play only)

Students type a school or team name, optionally pick two accent colors, and tap **"+ Add team"**, then **"Start playing →"**.

- Autocomplete here suggests teams **approved statewide** from past events, so returning schools don't get duplicated.
- A brand-new name creates the team as **pending**, on the event roster as **pending**.
- Rude names are blocked on the spot.
- Reachable later via **"Manage roster"** in the game-select header.

**If you pre-created your teams, students should skip past this screen** — just tap "Start playing →". They'll pick their team on the game intro instead.

### Player + team entry on each game

Every game's intro has a row per player (up to 4): a **name**, and in Team Play a **Team** dropdown.

- The dropdown lists **only teams approved for this event.**
- Students can still **type** a team that isn't listed. It resolves correctly and tags their scores.
- After typing, a marker appears: **"✓ on roster"** or **"↻ awaiting approval"**.

### Scores

Scores save silently. Students see nothing on success. If a save genuinely fails, a small pill appears: **"Couldn't save score — tell an organizer."** Offline saves queue quietly and succeed later, so this is rare.

**Scores from a pending team are recorded correctly.** They just don't show publicly until the team is approved. Nothing is lost if you forget — approve afterward and the points appear.

### The leaderboard (trophy icon 🏆)

Two tabs:

- **Your event's name** — top-3 podium plus the rest. Only teams **approved for this event** appear.
- **All-Time** — statewide, across all events. Only teams **approved statewide** appear.

Two score columns: **Score (Normalized)**, the ranking metric, and **Raw**, the actual points earned, greyed out.

> The leaderboard footer has an **Admin** link. It's password-gated, so a curious student just hits a sign-in screen.

---

## Teams: the student end vs. the admin end

Teams can be created from two places. Both create the team as **pending**.

| | Where | Autocomplete shows | Result |
|---|---|---|---|
| **Students** | Roster screen after choosing Team Play | Statewide-approved teams | pending team + pending roster entry |
| **Students** | The "Team" field on any game's intro | Teams approved **for this event** | pending team + pending roster entry |
| **You** | Admin → Active event roster | — | Approve, rename, recolor, remove |

### The two approvals

These are different buttons controlling different things, and the whole [event-shape](#choose-your-event-shape) system depends on the distinction:

| Button | Where | What it unlocks |
|---|---|---|
| **Approve for event** | Admin → Active event roster | Team appears on the **event leaderboard tab**, and in the **Team dropdown** on game intros |
| **Approve statewide** | Admin → Active event roster, or Pending team names | Team appears on the **All-Time leaderboard** |

Approving for one event does not commit a team statewide, or vice versa. Path B relies on exactly this: class groups get **Approve for event** so they compete live, and are deliberately **not** approved statewide.

### Naming — say this out loud to students

> "Use the name on the screen, spelled the same way every time."

Points only add up if the name matches. Capitalization and extra spaces are ignored; spelling is not. `Pierre HS` and `Pierre High` are two different teams.

And remember [team names are global](#path-b--class-teams-one-classroom-groups-compete) — a generic name like `Table 1` or `Red Team` will collide with some other school's identical name. Prefix with the school.

### Fixing duplicates, typos, and roll-ups

In **Admin → All teams**, use **Rename**. **If you rename a team to a name that already exists, the two merge** — every score and roster entry moves to the surviving team. That's the intended way to clean up duplicates, and the mechanism behind the Path B roll-up.

**Delete** ⚠️ removes the team **and all of its scores**, permanently. Only for junk entries — never for a real team you want to tidy.

---

## Online vs. offline (and blocked school Wi-Fi)

**The games never need the internet.** After the offline prep, every game runs fully from the device. The internet only matters for saving scores to the shared leaderboard, and those saves queue and replay later.

### The three situations you'll actually be in

| Situation | What to do | What happens to scores |
|---|---|---|
| **Good, open Wi-Fi** | Nothing special. Play. | Saved to the cloud immediately. Leaderboard is live. |
| **No Wi-Fi at all** | Nothing special. Play. | Queued on the device. Sync automatically when you get home and open the app online. |
| **Wi-Fi exists but the school blocks the site** | **Disconnect from the Wi-Fi entirely.** Turn it off. | Same as "no Wi-Fi" — clean, predictable, queued. |

### Why "just turn the Wi-Fi off" is the right answer

Some schools block outside sites on their guest network. **Connected but blocked** is the worst state: the device believes it's online, so the app keeps reaching for a server it can't see. The leaderboard may not load and saves may sit there. Your scores still end up queued and are not lost, but you're flying blind.

**Disconnecting removes the ambiguity.** The app sees "offline," queues everything locally, and behaves exactly as designed. It all syncs when you're back on a network you trust.

If you want live sync at a blocked school, use a **phone hotspot** rather than the school's Wi-Fi.

> 🚨 **If you didn't prep the device at home and the site is blocked, there is nothing you can do on-site.** The app won't load at all. Always bring a prepped device.

### Offline rules — do not break these

While offline with unsynced scores on the device:

- **Don't clear browser data / cookies / site data.** This wipes the queued scores permanently.
- **Don't uninstall the app.** Same result.
- **Don't open the site in a second browser tab** while the installed app is running. The offline database supports one tab at a time.
- **The 10-minute idle reset is completely safe.** It clears in-game progress, never the score queue.

---

## After the event

1. Get the device on trusted Wi-Fi and **open the app**. **Leave it open a minute or two** — this is when queued scores flush to the cloud. Watch the leaderboard counts climb. Do this for **every device** you ran.
2. **Merge duplicates.** Admin → All teams. If two devices were offline and students typed the school name twice, you'll see near-identical rows. **Rename** one to exactly match the other; they merge.
3. **Approve statewide** the teams that should reach the All-Time board (Paths A and C).
4. **Path B only:** [roll the class teams into the school](#rolling-class-teams-into-a-school-team).
5. **End the event.** Admin → Events → **End**. (**End**, not Delete.)
6. Tell Ashley how it went — especially anything confusing, and any game that felt too easy or too hard.

> **The one-line rule:** *Open the leaderboard once online before the event, and leave the app open online for a couple of minutes after it.* Those two moments guarantee a clean sync.

### Rolling class teams into a school team

After a Path B event, you have `Lincoln – Table 1` … `Lincoln – Table 6`, each holding some points. To give Lincoln HS the combined total on the All-Time board:

1. Make sure every device has synced (step 1 above). **Do not merge before the scores land**, or you'll be merging incomplete totals.
2. Admin → **All teams** → find `Lincoln – Table 1` → **Rename** it to `Lincoln HS`.
3. Repeat for each remaining group, renaming every one to exactly `Lincoln HS`. Each rename detects the existing team and **merges into it**, carrying its scores across.
4. When only `Lincoln HS` remains, tap **Approve statewide**.

The event leaderboard tab will now show a single Lincoln HS row instead of six — that's expected, the groups no longer exist as separate teams.

> ⚠️ **Merging cannot be undone.** If you want a record of which group won, screenshot the event leaderboard before you start.

---

## Which device should I bring?

| Device | Verdict |
|---|---|
| **The Dell kiosk touchscreen** | ✅ Best. Built for it. Prep once, stays prepped. 1920×1080, full-screen, touch-first. |
| **Your own Windows laptop** | ✅ Great. Needs its own full prep: install, cache, admin sign-in, set active event. |
| **Tablet / large phone** | ⚠️ Works, with limits. **Game screens won't load below ~600px wide** — they show a "screen too narrow" message. Field Guide needs ~900px. **Use landscape.** Menus, roster, and admin work at any size. |
| **A school's computer** | 🚫 Don't plan on it. You can't install or pre-cache it, and it's the machine most likely to have the site blocked. If it happens to be online and unblocked it works fine — but never make it the plan. |

---

## Running the room — practical playbook

### Setting up

- **One device serves up to 4 students at a time.** Size your groups to that; beyond 4, someone is spectating.
- With multiple devices, set up **stations** and rotate. Time one game round during prep so you can plan rotations for real.
- Put devices where **you** can see them. You want to catch a stuck group before they give up.
- Charge everything. No sound, so no speakers to worry about.

### What to say to students

Three points, and no more:

1. **"Pick your team from the dropdown."** (If you pre-created teams — which you should have.) If they must type, stress exact spelling.
2. **"You can play any game. They're all worth the same."** Scores are normalized.
3. **"Your name is just for you — the points go to your team."**

### Keeping energy up

- **Show the leaderboard between rotations.** Tap the trophy and put it on the big screen. Nothing motivates a class like watching their row move.
- Two schools in the room? Say so out loud. Head-to-head does the work for you.
- Players on **one device can be on different teams** — set up a 2v2 on a single machine.
- Some games end with a short conservation takeaway. Let it sit a beat before the next group. That's the actual point of the whole thing.

### Choosing a mode for the setting

| Setting | Shape | Why |
|---|---|---|
| Two or more schools together | Path A + Team Play | Real competition, and it means something afterward |
| One classroom, one period | Path B + Team Play | Live competition between groups; roll up into the school after |
| One school, chasing the statewide board | Path C + Team Play | Every point pools to the school |
| Fair booth, walk-up traffic | **Casual Play** | No name-entry friction; nobody's tracking a stranger's points |
| Elementary students | **Kid Mode** | Different mode entirely, no setup |

### Things to watch for

- **Joke team names.** The filter catches profanity, not "Mr. Johnson Stinks." Your real gate is **Approve for event** — nothing reaches a leaderboard without it. Pre-creating teams sidesteps this entirely.
- **A group that walks away mid-game.** The screen resets after 10 minutes.
- **A student wandering into Admin.** It's password-gated; they'll see a password box and bounce.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **No "How do you want to play?" prompt** | No active event on *this device* | Admin → **"Set kiosk to"** → your event |
| **My event isn't in the "Set kiosk to" dropdown** | It's `scheduled`, not `open` | Admin → Events → **"Open now"**, then set it active |
| **Team dropdown empty on game intros** | No teams approved **for this event** | Admin → Active event roster → **"Approve for event"** |
| **Event leaderboard stays empty during class** | Students' typed teams are still `pending` | Approve each **for the event** — or pre-create them next time |
| **A school isn't on the All-Time board** | Team isn't approved **statewide** | Admin → approve statewide |
| **Two schools' points ended up on one team** | A generic team name (`Table 1`) collided globally | Prefix names with the school. Untangling mixed scores needs per-score deletes in Admin |
| **Two rows for the same school** | Typed differently, or offline on two devices | Admin → All teams → **Rename** one to exactly match the other; they merge |
| **Leaderboard empty / "Loading…" forever** | Device never cached leaderboard data online | Go online, open the trophy, wait. Then it works offline. |
| **Photos missing in Field Guide** | Offline cache never warmed, or app updated since | Online → Admin → Offline readiness → **"Cache for offline"** |
| **"Couldn't save score — tell an organizer"** | A genuine save failure | Note the team + game. Scores usually still queue; check after syncing. |
| **Game says "screen too narrow"** | Narrower than ~600px (Field Guide: ~900px) | Rotate to landscape, or use a bigger device |
| **App won't load at the school** | Site blocked and device never prepped | Nothing on-site. Prep at home next time. |
| **App reloaded itself mid-game** | It auto-updated while online | Harmless — and why you **update at home, never at an event** |
| **Admin keeps signing me out** | Cleared site data, or a different browser/device | Sign in again. Each device signs in separately. |

---

## Quick reference

| Thing | Value |
|---|---|
| Live site | https://plantshley.github.io/SDSHC-games-hub/ |
| Admin panel | `…/#advanced/admin` |
| Admin password | Ask Ashley — one shared password, remembered per device |
| Active event | **Per-device.** Set it on every device you bring |
| Teams & events | **Shared in the cloud.** Create them once |
| Team names | **Global, matched by name.** Prefix class teams with the school |
| Rename onto an existing name | **Merges** the two teams |
| Delete a team or event | **Destroys its scores.** Use End, not Delete |
| Scheduled events | Do **not** open themselves — tap "Open now" |
| Open events | Do **not** close themselves — tap "End" |
| Idle reset (Advanced Mode) | 10 minutes → opening screen |
| Idle reset (Kid Mode) | 2 minutes |
| Idle reset (Admin panel) | Disabled |
| Players per game | 1–4 |
| Minimum screen width | ~600px (Field Guide: ~900px) |
| Contact | ashley@sdsoil.org · 605-251-4364 |

---

*Companion: [event-cheat-sheet.html](event-cheat-sheet.html) — a one-page printable summary. Open it in any browser and hit Print; it's laid out to fit a single sheet of Letter paper, and has no dependencies, so you can email it to staff as-is.*
