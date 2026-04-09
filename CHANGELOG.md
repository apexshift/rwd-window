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
- Shortcut tooltips on all UI buttons (Style A: e.g. "Mobile Portrait (1)", "Fit to Container (F / R)", "Keyboard Shortcuts (?)")
- Pure EventBus wiring for the help button (`ui:helpClicked`)
- `Tab` / `Shift+Tab` to cycle through breakpoints
- `H` shortcut to toggle between min and max height clamping
- Centralized input event handling (`input:stepChanged`, `input:stepCommit`)

### Changed
- `App.js` simplified to a lightweight orchestrator (removed manual UI creation logic)
- All managers now request UI elements from `UIManager` instead of direct DOM queries
- Improved input field synchronization so numeric values always reflect the current viewport state
- Keyboard shortcuts now fully mirror mouse behavior for 1–9 (first press = Max, second press = Min)

### Fixed
- Help button now reliably opens the keyboard shortcuts modal
- Reduced UI creation duplication between `App.js` and managers
- Input fields no longer revert to previous values after external changes (buttons, keyboard, etc.)

### Notes
- Double-click on device buttons behavior preserved (only resize handles trigger Fit to Container)
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