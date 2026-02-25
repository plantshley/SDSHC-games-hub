# SDSHC Games Hub - Living Plan

This document serves as the master plan for the South Dakota Soil Health Coalition (SDSHC) Games Hub. It will be updated continuously as we refine the project.

## 1. Project Overview & Context
- **Goal**: Build a gallery of interactive, educational games for kids about soil health to be played at SDSHC events.
- **Aesthetic**: Retro 8-bit farming theme (inspired by Stardew Valley / Harvest Moon).
- **Hardware**: 23.8-inch All-in-One Touchscreen (Dell OptiPlex 7410). Resolution: 1920x1080 (FHD).
- **Architecture**: Single Page Application (SPA) using HTML, CSS, and Vanilla JavaScript. Runs completely offline via localhost with zero loading screens between games.
- **Deployment**: Automatic deployment to GitHub Pages via Actions.

## 2. Core Kiosk Requirements & Architecture
We handle the specific constraints of the Dell OptiPlex touchscreen in the code:

### A. Touch Kiosk Safety
Kids will be tapping wildly. We must prevent the web browser from acting like a web browser.
- **Implementation**: We use strict CSS rules applied globally:
  - `user-select: none;` (Prevents text from being highlighted)
  - `-webkit-touch-callout: none;` (Prevents the iOS/Touch "press and hold" context menus)
  - `touch-action: manipulation;` (Disables double-tap-to-zoom)
  - `overflow: hidden;` (Disables scrolling completely)

### B. Inactivity Timer
If a user walks away mid-game, the kiosk must reset for the next person.
- **Implementation**: A global JavaScript timer (`inactivityTimer`) counts down 60 seconds. If it reaches zero, `switchState(0)` is called to return to the Home screen. Passive event listeners for `touchstart` and `click` are attached to the entire `document.body`. Any touch resets the 60-second clock.

### C. Application Flow & State Management
Navigating between HTML pages causes loading times and white flashes.
- **Implementation**: The app uses a State Machine approach within a single `index.html` file. All screens are loaded into hidden `<div>` containers. The `switchState()` function simply swaps CSS `.hidden` and `.active` classes to transition instantaneously.
  - **State 0**: Idle/Attract Mode -> Bouncing pixel logo: "SDSHC Games Hub". "Tap to Start!"
  - **State 1**: Grade Selection -> 3 Giant Buttons ("Little Sprouts", "Earth Explorers", "Agro-Heroes"). Includes a yellow "Back" button to return to State 0.
  - **State 2**: Game Selection -> Displays specific games for the chosen grade.
  - **State 3**: Active Game -> The interactive game UI.
  - **State 4**: Reward Screen -> "Great Job!" animation before returning to State 1.

### D. Responsive Scaling
- **Implementation**: UI scales perfectly to a 16:9 ratio (1920x1080) using relative viewport units (`vh`, `vw`) and flexbox. Touch targets (buttons) are massive, strictly enforcing a minimum size of 80x80 pixels for kids' fingers.

## 3. Game Logic & Extracted PDF Content

### Level 1: Little Sprouts (Pre-K to 2nd Grade)
*Focus: Visuals, dragging, tapping, and zero-to-low reading.*
- **Game 1A: Soil Cake Builder (Drag & Drop)**
  - *Logic*: Kids drag soil "cake" layers onto a plate from bottom to top (C Horizon -> B -> A -> O).
  - *Reward*: Earthworm pops out and cheers.
- **Game 1B: Dot-to-Dot Constellations (Tracing)**
  - *Logic*: Kids connect glowing stars with their fingers sequentially (1, 2, 3...) to reveal shapes (Mug, Bee, Bison) and learn simple soil facts.

### Level 2: Earth Explorers (3rd to 5th Grade)
*Focus: Matching, simple trivia, and cause-and-effect.*
- **Game 2A: The Three Sisters Garden (Matching/Sequence)**
  - *Logic*: A planting bed simulator. Prompts ask for specific functional plants (e.g., "I need a plant that grows tall..."). Kids tap the correct seed bag (Corn, Beans, Squash).
- **Game 2B: Spin the CLORPT & Cover Crop Wheel!**
  - *Logic*: A digital wheel (Climate, Organisms, Relief, etc.). Kids swipe to spin. It stops and presents a simple multiple-choice question.

### Level 3: Agro-Heroes (Middle & High School)
*Focus: Complex systems, careers, and challenging trivia.*
- **Game 3A: Farm Manager Simulator (Scenario/Strategy)**
  - *Logic*: A scenario is presented (e.g., "Drainage tile water has too many nutrients"). Users must select the right practice (Bioreactor) or career. Success turns a pixel river from muddy brown to sparkling blue.
- **Game 3B: Fast-Paced Trivia Challenge**
  - *Logic*: A fast-paced, 60-second multiple-choice trivia game testing knowledge of Indigenous framing, soil principles, careers, and biology. Uses an external decoupled `triviaDatabase.js` file for easy question updates.

---
*Document last updated: February 24, 2026. Will continue to add visual refinement notes and adjusted mechanics here based on feedback.*
