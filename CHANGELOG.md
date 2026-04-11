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

## [unreleased]

### Added
- **UIManager** as the single source of truth for all UI element creation and references
- **Advanced Input Controls**: ± increment buttons for width and height with support for normal click (1px), Shift+click (10px), and Ctrl+click (50px)
- Arrow key support (`↑`/`↓`) inside the width and height input fields (with same step modifiers)
- Shortcut tooltips on all UI buttons (e.g. "Mobile Portrait (1)", "Fit to Container (F)", "Keyboard Shortcuts (?)")
- Pure EventBus wiring for the help button (`ui:helpClicked`)
- `Tab` / `Shift+Tab` to cycle through breakpoints
- `H` shortcut to toggle between min and max height clamping
- Centralized input event handling (`input:stepChanged`, `input:stepCommit`)
- Breakpoint icon passive range indicator — the matching device button highlights during drag or manual input as micro-feedback
- First configured demo auto-loads on startup (iframe no longer starts on `about:blank`)
- `is-dragging` CSS class applied to viewport element during drag for styling hooks

### Changed
- `App.js` simplified to a lightweight orchestrator (removed manual UI creation logic)
- All managers now request UI elements from `UIManager` instead of direct DOM queries
- Improved input field synchronization so numeric values always reflect the current viewport state
- Keyboard shortcuts now fully mirror mouse behavior for 1–9 (first press = Max, second press = Min)
- Initial viewport now always fits actual available container space — no longer hardcoded to 1920×1080; correct on any screen size from first load
- Drag-to-resize upgraded with `requestAnimationFrame` throttling for smooth performance
- Horizontal drag handles use a 2× delta multiplier for a more responsive feel
- Feedback text now shows `(Min)` suffix when a breakpoint is in min-width mode (e.g. "Mobile Portrait (Min)")
- `IFrameController` no longer registers duplicate direct listeners on fitBtn and inputs — UIManager owns these via EventBus, eliminating double-firing on every interaction
- `UIManager` now exposes `feedback` element so IFrameController can update it reactively

### Fixed
- Feedback display (`.app__masthead-feedback`) was completely non-functional — element reference was never populated after the refactor
- Iframe pointer events were never disabled during drag — element reference was never populated, causing the iframe to intercept mouse events mid-drag
- `state.get('isSecondClick')` referenced a non-existent AppState key — min/max toggle on device buttons was broken
- `widthInput.querySelector('input')` — widthInput is already the `<input>` element; nested query always returned null, breaking commit-on-blur
- `UIFactory` ID and icon validation conditions were always `true` due to `||` instead of `&&`
- `classList = 'string'` assignment in `UIFactory.createSelectControl` silently failed — replaced with `className`
- Demo select dropdown never populated — `fileSelect.querySelector('#file-loader')` queried inside the select element itself (already the select)
- Broken `app.js` promise chain — `FONTS_READY(INIT)` was invoked immediately rather than passed as a `.then()` callback, bypassing the font-ready sequence
- `process.MODE_ENV` typo in `BreakpointManager` and `IFrameController` — `resetForTesting()` never fired in test environments (corrected to `process.env.NODE_ENV`)
- Fit-to-container now correctly clears the drag-range breakpoint highlight — previously the device button and fit button could both show as active simultaneously

### Removed
- Dead `app:initialised` event emit from `App.js` (never had a listener)
- Unimplemented `R` shortcut removed from the keyboard help overlay (only `F` is handled)
- Dead `#handleDeviceButtonClick` method from `IFrameController` — `BreakpointManager` owns device button interactions
- Unused private fields `#isDragging` and `#originalContainerHeight` from `IFrameController`

### Notes
- Double-click on device buttons behavior preserved (triggers Fit to Container)
- Project structure remains clean with `core/`, `managers/`, and single `config.json`


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

## [0.0.1-beta] - 2026-04-05

### Added
- added initial desktop only demo 01
- all ui states and feedback work in unison
- resize the viewport from either the left or right side
- resize the viewport from the bottom up
- feedback elements
- ui info button (placeholder only at the moment) - will load modal with power moves
- clamp min and max height of viewport
- clamp min and max width of viewport
- height input control
- width input control
- ui buttons active state
- desktop/laptop landscape device toggle
- tablet portrait device toggle
- mobile landscape device toggle
- mobile portrait device toggle
- Fit to container implemented
- file loading via select field
- Initial UI has been styled complete with focus, hover and webkit updates for consistancy.
- Created initial skeleton structure for the app and it's initial features.