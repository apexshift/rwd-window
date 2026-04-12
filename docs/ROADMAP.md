# Roadmap Implementation Plan 
We will execute this one feature at a time, with clear micro-tasks, so you can implement, test, and confirm completion before moving to the next. This keeps quality high and cognitive load low.

**Current Version:** v1.0.0 → v1.1.0 in progress

## Roadmap to [v1.1.0]
Make RWD Window feel faster and more convenient for daily use while staying lightweight and true to the minimalist philosophy.

**Prioritized Feature Breakdown with Micro-Tasks**

---
#### Feature 1 - Improved Feedback & Visual Polish

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
#### Feature 2 - Orientation Toggle

**Purpose:** Quick portrait ↔ landscape switch for active breakpoint.

**Proposed Value:** Instant testing of orientation-specific layouts without manual editing.

**Micro-Tasks:**
1. Add Orientation button next to device buttons (using UIFactory).
2. In `BreakpointManager.js`: on click, swap minWidth ↔ maxWidth for the active breakpoint and re-emit event.
3. Persist orientation state in LocalStorage (from Feature 1).
4. Update feedback text to show “(Portrait)” or “(Landscape)”.

**Estimated Effort:** 3–4 hours

---
#### Feature 3 - Live Dimensions Readout

**Purpose:** Always-visible current viewport size during drag and manual input.

**Proposed Value:** Precise size awareness without needing to focus the W/H inputs.

**Micro-Tasks:**
1. Add small live pixel readout next to W/H inputs (updates during drag).
2. Wire to `state:viewportChanged` via EventBus.

**Estimated Effort:** 1–2 hours

---

### Recommended Implementation Order (v1.1.0)
- ~~LocalStorage Persistence~~ ✅ Complete
- Improved Feedback & Visual Polish
- Orientation Toggle
- Live Dimensions Readout

**Total Estimated Effort:** 8–11 hours remaining

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
- Export current viewport state