# RWD Window

A lightweight, desktop-only responsive viewport simulator for rapid frontend prototyping. Built with vanilla JavaScript — no frameworks, no bloat.

## Features (v0.1.0-beta)

- **Dynamic breakpoints** — Loaded from `config/breakpoints.json`
- **Device button behavior**:
  - Single click → Set to max width
  - Second click on same button → Toggle to min width
- **Resize handle behavior**:
  - honours global clamp settings
  - double click any handle → Fit-to-container
- **Fit to Container** mode with consistent clamping
- **Drag resizing** with smooth handles and visual feedback
- **Manual width/height inputs** (supports blur + Enter, '-' shortcut for fit)
- **Local demo loader** via `config/file-loader.json`
- **Centralized clamping** configurable in `config/viewport-config.json`
- **User-friendly error toasts** for configuration issues

## Configuration

### 1. Breakpoints (`config/breakpoints.json`)

```json
{
  "breakpoints": [
    {
      "label": "Mobile Portrait",
      "minWidth": 320,
      "maxWidth": 477,
      "icon": "./assets/svg/ui-mobile-portrait-icon.svg"
    },
    {
      "label": "Mobile Landscape",
      "minWidth": 478,
      "maxWidth": 767,
      "icon": "./assets/svg/ui-mobile-landscape-icon.svg"
    },
    {
      "label": "Tablet Portrait",
      "minWidth": 768,
      "maxWidth": 991,
      "icon": "./assets/svg/ui-tablet-portrait-icon.svg"
    },
    {
      "label": "Laptop",
      "minWidth": 992,
      "maxWidth": 1920,
      "icon": "./assets/svg/ui-laptop-icon.svg"
    }
  ]
}
```

### 2. Viewport Settings (`config/viewport-config.json`)

```json
{
  "clamping": {
    "minWidth": 320,
    "maxWidth": 1920,
    "minHeight": 640,
    "maxHeight": 1080
  },
  "initialViewport": {
    "width": 1920,
    "height": 1080
  }
}
```

### 3. Local Demos (`config/file-laoder.json`)

```json
{
  "files": [
    {
      "id": 1,
      "label": "Shipped Demo",
      "value": "./public/demo-01/index.html"
    }
  ]
}
```

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
config/
├── breakpoints.json
├── file-loader.json
└── viewport-config.json

assets/js/
├── core/           # EventBus, AppState, UIFactory
├── managers/       # LocalLoader, IFrameController, BreakpointManager
└── Utils.js
```

## Roadmap

See the full roadmap in the project for upcoming features (keyboard shortcuts, orientation toggle, LocalStorage persistence, etc.).