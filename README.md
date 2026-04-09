# RWD Window

A lightweight, desktop-only responsive viewport simulator for rapid frontend prototyping. Built with pure vanilla JavaScript.

## Features (v0.1.0-beta)
- Dynamic device breakpoints loaded from `config.json`
- Device buttons with single-click (Max) and second-click (Min) toggle
- Drag-to-resize with smooth handles
- Manual width/height inputs with ± increment buttons
- Fit to Container mode
- Local and remote demo loading
- Keyboard shortcuts:
  - Arrow keys for precise resizing (with Shift/Ctrl modifiers)
  - 1–9 for quick breakpoint selection (with toggle)
  - F for Fit to Container
  - Esc to clear mode
  - Tab/Shift+Tab to cycle breakpoints
  - H to toggle min/max height clamp
  - ? or Shift+/ for help overlay
- Shortcut tooltips on all buttons
- Centralized clamping and initial viewport settings in `config.json`
- User-friendly toast messages

## Configuration (`config.json`)

The project uses a unified single `config.json` file:

```json
{
  "app": {
    "clamping": { ... },
    "initialViewport": { ... }
  },
  "ui_controls": {
    "fitToContainer": { ... },
    "breakpoints": [ ... ],
    "help": { ... }
  },
  "files": [ ... ]
}
```

## Keyboard Shortcuts

Press `?` or click the help button (?) to see full list.

## Usage
1. Open `index.html` in a browser (or serve with Live Server).
2. Use the device buttons
 - Click once -> Max width
 - Click again -> Min width
 - Double Click -> Fit to container
3. Drag the resize handles or use width/height inputs for manual control.
4. Select demos from the dropdown.

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

| Event Name                        | Emitted By                  | Listened By                          | Purpose |
|-----------------------------------|-----------------------------|--------------------------------------|-------|
| `app:ready`                       | `App.js`                    | `BreakpointManager`, `UIManager`     | Signals that initialization is complete and managers can set up |
| `state:viewportChanged`           | `AppState.js`               | `IFrameController`                   | Viewport size (width/height) has changed |
| `state:modeChanged`               | `AppState.js`               | `IFrameController`                   | Current mode changed (`manual`, `device`, or `fit`) |
| `state:activeBreakpointChanged`   | `AppState.js`               | `IFrameController`, `BreakpointManager` | Active breakpoint or its min/max state changed |
| `state:currentDemoChanged`        | `AppState.js`               | `LocalLoader`                        | Current demo URL changed |
| `breakpoint:activated`            | `BreakpointManager`         | `IFrameController`                   | A breakpoint was activated (includes min/max info) |
| `viewport:fit`                    | `KeyboardManager`, Fit button | `IFrameController`                 | Request to switch to Fit to Container mode |
| `ui:helpClicked`                  | Help button (`UIFactory`)   | `KeyboardManager`                    | User clicked the help button |
| `config:error`                    | `BreakpointManager`, `App.js` | `App.js`                           | Configuration loading error (shown as toast) |
| `input:stepChanged`               | `UIManager`                 | `IFrameController`                   | ± button click or arrow key increment request |
| `input:stepCommit`                | `UIManager`                 | `IFrameController`                   | User committed a value (on blur or Enter key) |

### Notes

- All events are handled through the central `EventBus`.
- `state:*Changed` events are automatically emitted whenever `AppState.set()` is called.
- Input-related events (`input:stepChanged`, `input:stepCommit`) power the ± increment buttons and keyboard navigation inside the width/height fields.
- The help button and `?` key both emit `ui:helpClicked`.

This event system keeps the managers loosely coupled and makes the codebase easier to extend.

## Roadmap
- Orientation toggle
- Configurable clamping limits UI
- LocalStorage persistence
- Export current viewport state