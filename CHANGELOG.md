# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Types of changes
- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

---

## [1.0.0] - 2026-04-12

First stable production release. This version represents a complete architectural overhaul from the beta, establishing a clean event-driven foundation with full test coverage, comprehensive JSDoc, and a polished user experience.

### Added
- **Full test suite** — 102 tests across 9 suites using Vitest + happy-dom, covering all managers, core modules, and utilities
- **JSDoc** on every `.js` file (modules, classes, methods, private fields, and parameters)
- **Splash screen** (`splash.html`) — a keyboard and UI reference page loaded directly in the viewport iframe on startup
- **Help button and `?` shortcut** now load the splash reference page into the viewport iframe; a second press restores the previous demo content
- **Toast notification system** (via `Utils.showToast`) — replaces the static feedback label with animated, auto-dismissing toasts; a new toast instantly dismisses any in-flight toast
- **Dynamic input max attributes** — `widthInput.max` and `heightInput.max` update in real time via `state:containerWidthChanged` / `state:containerHeightChanged` events to always reflect the live container size
- **`AppState.setContainerWidth()`** — mirrors the existing `setContainerHeight()` to emit `state:containerWidthChanged` with an equality guard
- **UIManager** as the single source of truth for all UI element creation and references
- **Advanced increment controls** — ± buttons for width and height with normal (1px), Shift (10px), and Ctrl/Cmd (50px) step sizes
- Arrow key support (`↑` / `↓`) inside the width and height input fields with the same step modifiers
- Shortcut tooltips on all UI buttons (e.g. `"Mobile Portrait (1)"`, `"Fit to Container (F)"`, `"Keyboard Shortcuts (?)"`)
- `Tab` / `Shift+Tab` to cycle through breakpoints
- `H` shortcut to toggle between min and max height clamping
- Centralized input event handling via `input:stepChanged` and `input:stepCommit`
- Breakpoint icon passive range indicator — the matching device button highlights during drag or manual input
- `is-dragging` CSS class applied to the viewport element during drag for external styling hooks

### Changed
- `App.js` simplified to a lightweight 5-phase bootstrap orchestrator
- All managers now obtain UI element references from `UIManager` instead of direct DOM queries
- Keyboard shortcuts fully mirror mouse behavior for `1–9` (first press = max width, second press = min width)
- Initial viewport always fits actual available container space on load — no longer hardcoded
- Drag-to-resize upgraded with `requestAnimationFrame` throttling; horizontal handles use a 2× delta multiplier
- Horizontal drag handles use a 2× delta multiplier for a more responsive feel
- `IFrameController` delegates fitBtn and input events to UIManager via EventBus, eliminating double-firing
- `AGENTS.md` updated to reflect current architecture, version, and test coverage

### Fixed
- Toast background colour was never applied — a malformed `transform(-50%)` declaration (missing property name and semicolon) caused the CSS parser to silently discard the `background` rule
- Toast CSS used unitless fallback values (`var(--space-32, 32)`) causing layout issues — corrected to `32px`
- Feedback label (`.app__masthead-feedback`) was non-functional after the refactor — removed and replaced with the toast system
- Iframe pointer events were never disabled during drag — element reference was unpopulated, causing the iframe to intercept mouse events mid-drag
- `state.get('isSecondClick')` referenced a non-existent AppState key — min/max toggle on device buttons was broken
- `widthInput.querySelector('input')` — widthInput is already the `<input>` element; the nested query always returned null, breaking commit-on-blur
- `UIFactory` ID and icon validation conditions were always `true` due to `||` instead of `&&`
- `classList = 'string'` assignment in `UIFactory.createSelectControl` silently failed — replaced with `className`
- Demo select dropdown never populated — `fileSelect.querySelector('#file-loader')` queried inside the select element itself
- Broken `App.js` promise chain — `FONTS_READY(INIT)` was invoked immediately rather than passed as a `.then()` callback
- `process.MODE_ENV` typo in `BreakpointManager` and `IFrameController` — `resetForTesting()` never fired in test environments (corrected to `process.env.NODE_ENV`)
- Fit-to-container now correctly clears the drag-range breakpoint highlight

### Removed
- `<span class="app__masthead-feedback">` and its CSS — replaced by the toast system
- Help overlay modal — replaced by the splash.html approach
- Dead `app:initialised` event emit from `App.js` (never had a listener)
- Dead `#handleDeviceButtonClick` method from `IFrameController`
- Unused private fields `#isDragging` and `#originalContainerHeight` from `IFrameController`
- Unimplemented `R` shortcut from the old keyboard help overlay

---

## [0.1.0-beta] - 2026-04-07

### Added
- Dynamic breakpoint management loaded from `config/breakpoints.json`
- Second-click toggle between min and max width on device buttons
- Double-click any resize handle to reset to "Fit to Container"
- Centralized viewport clamping via `config/viewport-config.json`
- New project structure: `assets/js/core/`, `assets/js/managers/`, `config/`
- Event-driven architecture using EventBus + AppState for better decoupling
- User-facing error toasts for configuration issues

### Changed
- Hardcoded device buttons removed (now fully dynamic)
- Clamping logic is now consistent across Fit mode and device breakpoints
- Initial viewport size loaded from config

### Fixed
- Max/Min toggle now reliably applies correct widths
- NaN errors when activating breakpoints eliminated
- Import paths updated after folder restructuring

---

## [0.0.1-beta] - 2026-04-05

### Added
- Initial desktop-only demo
- All UI states and feedback work in unison
- Resize the viewport from either the left or right side
- Resize the viewport from the bottom up
- Feedback elements
- UI info button (placeholder)
- Min/max height clamping
- Min/max width clamping
- Height and width input controls
- UI button active states
- Device toggles: Desktop, Laptop, Tablet Portrait, Mobile Landscape, Mobile Portrait
- Fit to Container
- File loading via select field
- Initial UI styled with focus, hover, and webkit states
- Initial skeleton structure
