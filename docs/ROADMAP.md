# Roadmap Implementation Plan 
We will execute this one feature at a time, with clear micro-tasks, so you can implement, test, and confirm completion before moving to the next. This keeps quality high and cognitive load low.

**Current Version:** v1.0.0

## Roadmap to [v1.1.0]
Make RWD Window feel faster and more convenient for daily use while staying lightweight and true to the minimalist philosophy.

**Prioritized Feature Breakdown with Micro-Tasks**

---
#### Feature 1 - LocalStorage Persistence (Highest Value – Do This First)

**Purpose:** Remember last demo, viewport size, mode, and active breakpoint across sessions.

**Proposed Value:** Eliminates repetitive setup every time you open the tool — biggest daily time saver.

**Micro-Tasks (in order):**
1. Add `persistence` section to `config.json` with `enabled: true` and `keysToPersist` array.
2. Extend `AppState.js` with:
  - `saveToStorage()` method
  - `loadFromStorage()` method
  - Automatic save on any `state:xxxChanged` event (debounced)
3. In `App.js`:
  - Call `loadFromStorage()` early in `init()`
  - Call `saveToStorage()` after `app:ready`
4. Add a visible **“Reset to Defaults”** button in the masthead (using UIFactory + UIManager).
5. Update `AppState.reset()` to also clear LocalStorage.
6. Add basic error handling if LocalStorage is disabled/quota exceeded.
7. pdate README with a short section explaining persistence behavior.
8. Add entry to CHANGELOG.md for v1.1.0.

**Estimated Effort:** 4–6 hours

---
#### Feature 2 - Improved Feedback & Visual Polish

**Purpose:** Clearly communicate current state (active breakpoint + min/max mode).

**Proposed Value:** Reduces mental guesswork during testing.

**Micro-Tasks:**
1. Enhance `#updateFeedback()` in `IFrameController.js` to show:
  - **“Fit to Container”** when in fit mode
  - “BreakpointName (Max)” or “BreakpointName (Min)” when active
2. Add visual indicator for Min-mode (e.g., subtle icon or border color change on active button).
3. Improve toast notification positioning and auto-dismiss timing in `Utils.js`.
4. Make feedback text clickable to copy current dimensions as CSS media query.
5. Test with extreme sizes and rapid mode switches.

**Estimated Effort:** 3–5 hours

---
#### Feature 3 - Orientation Toggle

**Purpose:** Quick portrait ↔ landscape switch for active breakpoint.

**Proposed Value:** Instant testing of orientation-specific layouts without manual editing.

**Micro-Tasks:**
1. Add Orientation button next to device buttons (using UIFactory).
2. In `BreakpointManager.js`: on click, swap minWidth ↔ maxWidth for the active breakpoint and re-emit event.
3. Persist orientation state in LocalStorage (from Feature 1).
4. Update feedback text to show “(Portrait)” or “(Landscape)”.

**Estimated Effort:** 3–4 hours

---
#### Feature 4 - Quick Reset Button + Live Dimensions Readout

**Purpose:** One-click full reset and always-visible current size.

**Proposed Value:** Faster context switching and precise size awareness.

**Micro-Tasks:**
1. Add “Reset All” button in masthead.
2. Add small live pixel readout next to W/H inputs (updates during drag).
3. Wire both to AppState and EventBus.

**Estimated Effort:** 2–3 hours

---

### Recommended Implementation Order (v1.1.0)
- LocalStorage Persistence ← Start here (biggest daily win)
- Improved Feedback & Visual Polish
- Orientation Toggle
- Quick Reset + Live Dimensions

**Total Estimated Effort:** 12–18 hours (spread over time)

---
### Success Criteria for v1.1.0 Release
- Opening the tool feels instant and familiar (persistence works).
- Users can test without constantly re-configuring.
- Shortcuts and orientation are discoverable.
- Config is simple to customize.

### Requested/Consideration Features
- Orientation toggle (restricted to mobile/tablet breakpoints, config-driven)
- Configurable clamping limits UI
- Visual overlays (container identification, grid lines, outline mode, x-ray mode)
- LocalStorage persistence
- Export current viewport state