# RWD Window

A lightweight, desktop-only responsive viewport simulator for rapid frontend prototyping. Built with pure vanilla JavaScript — no frameworks, no bundlers, no build step.

## Features

- Dynamic device breakpoints loaded from `config.json`
- Device buttons with single-click (Max) and second-click (Min) width toggle
- Passive breakpoint range indicator — matching device button highlights during drag or manual input
- Drag-to-resize with smooth, `requestAnimationFrame`-throttled handles
- Manual width/height inputs with ± increment buttons (1px / 10px Shift / 50px Ctrl)
- Fit to Container mode — always measures real available space, correct on any screen size
- Dynamic input ceilings — `max` on width and height inputs updates in real time to match the live container
- Local and remote demo loading via dropdown
- **LocalStorage persistence** — viewport size, mode, active breakpoint, and current demo are saved and restored automatically across sessions
- **Reset to Defaults** button and `R` shortcut — clears persisted state and reloads the app
- Toast notifications for user feedback (replaces static feedback label)
- Splash screen (`splash.html`) — full keyboard and UI reference loaded directly in the viewport
- Keyboard shortcuts:
  - Arrow keys for precise resizing (with Shift/Ctrl modifiers)
  - `1–9` for quick breakpoint selection (second press toggles min-width)
  - `Tab` / `Shift+Tab` to cycle breakpoints
  - `H` to toggle between min and max height clamp
  - `F` for Fit to Container
  - `R` to Reset to Defaults (clears persistence and reloads)
  - `Esc` to clear current mode
  - `?` / `Shift+/` to load the splash reference page (second press restores previous content)
- Shortcut tooltips on all buttons
- Centralized configuration in `config.json`
- Full test suite — 116 tests across 9 suites (Vitest + happy-dom)

## Configuration (`config.json`)

The project uses a single `config.json` file at the root:

```json
{
  "app": {
    "clamping": { "minWidth": 320, "maxWidth": 1920, "minHeight": 640, "maxHeight": 1080 }
  },
  "ui_controls": {
    "fitToContainer": { "label": "Fit", "icon": "..." },
    "breakpoints": [ { "label": "Mobile Portrait", "minWidth": 320, "maxWidth": 477, "icon": "..." } ],
    "help": { "label": "Help", "icon": "..." },
    "reset": { "label": "Reset" }
  },
  "persistence": {
    "enabled": true,
    "storageKey": "rwd-window-state",
    "keysToPersist": ["viewport", "mode", "activeBreakpoint", "currentDemo"]
  },
  "files": [
    { "id": 1, "label": "My Project", "value": "./path/to/index.html" }
  ]
}
```

> **Note:** The `initialViewport` config key is not used for startup size. The viewport always initialises to fit the actual available container space.
> Set `persistence.enabled` to `false` to disable session restore entirely.

## Keyboard Shortcuts

Press `?` or click the help button to load the full reference page directly in the viewport. Press again to restore the previous content.

| Key | Action | Modifier extensions |
|-----|--------|-------------------|
| `← →` | Resize width ±1px | `+Shift` ×10, `+Ctrl` ×50 |
| `↑ ↓` | Resize height ±1px | `+Shift` ×10, `+Ctrl` ×50 |
| `1–9` | Select breakpoint (max-width) | 2nd press = min-width |
| `Tab` | Cycle breakpoints forward | `+Shift` = reverse |
| `H` | Toggle min / max height clamp | — |
| `F` | Fit to Container | — |
| `R` | Reset to Defaults | Clears persistence and reloads |
| `Esc` | Clear current mode | — |
| `?` | Load splash reference page | 2nd press restores previous |

## Usage

1. Open `index.html` in a browser (or serve with Live Server / any static server).
2. The viewport fits the available container space on load. The splash reference page is shown by default.
3. Select a demo from the dropdown to load it in the viewport.
4. Use the device buttons:
   - Click once → max width for that breakpoint
   - Click again → min width
5. Drag the resize handles or use the W / H inputs for manual control. The matching device button highlights as a passive range indicator.
6. Use `?` or the help button to toggle the splash reference page at any time.

## Project Structure

```text
assets/js/
├── core/
│   ├── AppState.js       — Reactive state singleton
│   ├── EventBus.js       — Pub/sub event system
│   └── UIFactory.js      — Dynamic UI element factory
├── managers/
│   ├── BreakpointManager.js
│   ├── IFrameController.js
│   ├── KeyboardManager.js
│   ├── LocalLoader.js
│   └── UIManager.js
├── App.js                — Bootstrap orchestrator
└── Utils.js              — Toast notifications and shared helpers
config.json               — Single source of truth for all settings
index.html                — Entry point
splash.html               — Keyboard and UI reference page
```

## Event System

The application uses a lightweight EventBus for decoupled communication between modules.

| Event | Emitted By | Listened By | Purpose |
|-------|-----------|------------|---------|
| `app:init` | `App.js` | `UIManager` | Signals singletons ready; UIManager builds the DOM |
| `app:managers:init` | `App.js` | `BreakpointManager`, `KeyboardManager`, `LocalLoader`, `IFrameController` | UI ready; managers initialise |
| `app:ready` | `App.js` | `BreakpointManager`, `IFrameController` | All managers ready; first fit-to-container runs |
| `state:viewportChanged` | `AppState` | `IFrameController`, `BreakpointManager` | Viewport width/height changed |
| `state:modeChanged` | `AppState` | `IFrameController`, `BreakpointManager` | Mode changed (`manual`, `device`, or `fit`) |
| `state:activeBreakpointChanged` | `AppState` | `IFrameController`, `BreakpointManager` | Active breakpoint or min/max state changed |
| `state:currentDemoChanged` | `AppState` | `LocalLoader` | Current demo URL changed |
| `state:containerWidthChanged` | `AppState` | `UIManager` | Live container width updated; syncs `widthInput.max` |
| `state:containerHeightChanged` | `AppState` | `UIManager` | Live container height updated; syncs `heightInput.max` |
| `breakpoint:activated` | `BreakpointManager` | `IFrameController` | Breakpoint activated with min/max info |
| `viewport:fit` | `UIManager`, `KeyboardManager`, `BreakpointManager` | `IFrameController` | Request fit-to-container |
| `demo:changed` | `UIFactory` (select), `LocalLoader` | `LocalLoader` | User selected a demo |
| `ui:helpClicked` | Help button (`UIFactory`) | `KeyboardManager` | User clicked the help button |
| `ui:resetClicked` | Reset button (`UIFactory`), `KeyboardManager` (`R` key) | `App.js` | User triggered reset — clears storage and reloads |
| `config:error` | `BreakpointManager`, `LocalLoader` | `App.js` | Configuration error (shown as toast) |
| `input:stepChanged` | `UIManager` | `IFrameController` | ± button click or arrow key in input |
| `input:stepCommit` | `UIManager` | `IFrameController` | Value committed on blur or Enter |

**Notes:**
- `state:*Changed` events are emitted only when the value actually changes (deep equality guard).
- The help button and `?` key both route through `ui:helpClicked` → `KeyboardManager#loadSplash()`.
- `BreakpointManager` listens to `state:viewportChanged` (range highlight during drag) and `state:modeChanged` (clear highlight on fit).

## Testing

```bash
npm test
```

116 tests across 9 suites using Vitest with happy-dom. All managers, core modules, and utilities are covered.

## Documentation

For detailed information, please refer to:

- **[Roadmap](docs/ROADMAP.md)** — Planned features and development direction for future versions.
- **[Changelog](docs/CHANGELOG.md)** — Complete version history and release notes.

---
