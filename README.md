# RWD Window

A lightweight, desktop-only responsive viewport simulator for rapid frontend prototyping. Built with pure vanilla JavaScript.

## Features (v0.1.0-beta)
- Dynamic device breakpoints loaded from `config.json`
- Device buttons with single-click (Max) and second-click (Min) toggle
- Passive breakpoint range indicator — matching device button highlights during drag or manual input
- Drag-to-resize with smooth, `requestAnimationFrame`-throttled handles
- Manual width/height inputs with ± increment buttons
- Fit to Container mode — always measures real available space, correct on any screen size
- Feedback label shows active breakpoint name with `(Min)` suffix in min-width mode
- First configured demo auto-loads on startup
- Local and remote demo loading via dropdown
- Keyboard shortcuts:
  - Arrow keys for precise resizing (with Shift/Ctrl modifiers)
  - 1–9 for quick breakpoint selection (with toggle)
  - F for Fit to Container
  - Esc to clear mode
  - Tab/Shift+Tab to cycle breakpoints
  - H to toggle min/max height clamp
  - ? or Shift+/ for help overlay
- Shortcut tooltips on all buttons
- Centralized clamping settings in `config.json`
- User-friendly toast messages

## Configuration (`config.json`)

The project uses a unified single `config.json` file:

```json
{
  "app": {
    "clamping": { "minWidth": 320, "maxWidth": 1920, "minHeight": 640, "maxHeight": 1080 }
  },
  "ui_controls": {
    "fitToContainer": { ... },
    "breakpoints": [ ... ],
    "help": { ... }
  },
  "files": [ ... ]
}
```

> **Note:** The `initialViewport` config key is not used for startup size. The viewport always initialises to fit the actual available container space.

## Keyboard Shortcuts

Press `?` or click the help button (?) to see full list.

## Usage
1. Open `index.html` in a browser (or serve with Live Server).
2. The viewport fits to the available container space and loads the first configured demo automatically.
3. Use the device buttons:
   - Click once → Max width for that breakpoint
   - Click again → Min width (button label shows `(Min)` in the feedback bar)
   - Double-click → Fit to Container
4. Drag the resize handles or use the W/H inputs for manual control. The matching device button highlights as a range indicator while you drag.
5. Switch demos from the dropdown at any time.

## Project Structure

```text
assets/js/
├── core/
├──── AppState.js
├──── EventBus.js
├──── UIFactory.js
├── managers/
├──── BreakpointManager.js
├──── IFrameController.js
├──── KeyboardManager.js
├──── LocalLoader.js
├──── UIManager.js
├── App.js
└── Utils.js
config.json
index.html
```

## Event System

The application uses a lightweight EventBus for decoupled communication between modules. Below is a complete list of all registered events:

### Registered Events

| Event Name                        | Emitted By                        | Listened By                                   | Purpose |
|-----------------------------------|-----------------------------------|-----------------------------------------------|---------|
| `app:init`                        | `App.js`                          | `UIManager`                                   | Signals singletons are ready; UIManager begins building the DOM |
| `app:managers:init`               | `App.js`                          | `BreakpointManager`, `KeyboardManager`, `LocalLoader`, `IFrameController` | UI is ready; managers can initialise |
| `app:ready`                       | `App.js`                          | `BreakpointManager`, `IFrameController`       | All managers ready; app performs first fit-to-container |
| `state:viewportChanged`           | `AppState.js`                     | `IFrameController`, `BreakpointManager`       | Viewport size (width/height) has changed |
| `state:modeChanged`               | `AppState.js`                     | `IFrameController`, `BreakpointManager`       | Current mode changed (`manual`, `device`, or `fit`) |
| `state:activeBreakpointChanged`   | `AppState.js`                     | `IFrameController`, `BreakpointManager`       | Active breakpoint or its min/max state changed |
| `state:currentDemoChanged`        | `AppState.js`                     | `LocalLoader`                                 | Current demo URL changed |
| `breakpoint:activated`            | `BreakpointManager`               | `IFrameController`                            | A breakpoint was activated (includes min/max info) |
| `viewport:fit`                    | `UIManager`, `KeyboardManager`, `BreakpointManager` | `IFrameController`          | Request to switch to Fit to Container mode |
| `demo:changed`                    | `UIFactory` (select), `LocalLoader` | `LocalLoader`                               | User selected a demo or first demo auto-loaded |
| `ui:helpClicked`                  | Help button (`UIFactory`)         | `KeyboardManager`                             | User clicked the help button |
| `config:error`                    | `BreakpointManager`, `LocalLoader` | `App.js`                                     | Configuration loading error (shown as toast) |
| `input:stepChanged`               | `UIManager`                       | `IFrameController`                            | ± button click or arrow key increment request |
| `input:stepCommit`                | `UIManager`                       | `IFrameController`                            | User committed a value (on blur or Enter key) |

### Notes

- All events are handled through the central `EventBus`.
- `state:*Changed` events are automatically emitted by `AppState.set()` only when the value actually changes (strict equality check) — handlers will not fire for no-op updates.
- Input-related events (`input:stepChanged`, `input:stepCommit`) power the ± increment buttons and keyboard navigation inside the width/height fields.
- The help button and `?` key both emit `ui:helpClicked`.
- `BreakpointManager` listens to both `state:viewportChanged` (to highlight the matching range button during drag) and `state:modeChanged` (to clear highlights when entering fit mode).

This event system keeps the managers loosely coupled and makes the codebase easier to extend.

## Roadmap
- Orientation toggle (`up next`)
  - Restricted to mobile and tablet breakpoints, but config driven
- Configurable clamping limits UI
- Visual Overlays UI
  - Container Identification, including
    - the container name
    - the container type
    - the container dimensions
  - Grid identification
  - Outline mode
  - X-ray mode (probably a css filter??).
- LocalStorage persistence
- Export current viewport state
