# RWD Window

A lightweight, desktop-only responsive viewport simulator for rapid frontend prototyping. Built with pure vanilla JavaScript.

## Features (v0.1.0-beta)
- Dynamic device breakpoints loaded from `config.json`
- Device buttons with single-click (Max) and second-click (Min) toggle
- Drag-to-resize with smooth handles
- Manual width/height inputs with ± increment buttons (coming soon)
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

## Roadmap
- Advanced input controls (± buttons, improved keyboard navigation inside inputs)
- Orientation toggle
- Configurable clamping limits UI
- LocalStorage persistence
- Export current viewport state