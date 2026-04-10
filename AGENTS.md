# AGENTS.md

## Project Overview
**rwd-window** is a lightweight, desktop-only responsive viewport simulator designed for quick RWD (Responsive Web Design) testing without opening browser DevTools.

It features:
- Draggable and resizable iframe viewport
- Configurable device breakpoint presets (single-click = max width, double-click = min width)
- Manual width/height controls with step increments
- "Fit to Container" mode
- Local and remote demo loading via dropdown
- Comprehensive keyboard shortcuts
- Toast notifications for user feedback
- Help overlay with shortcut reference

The entire application is built with **pure vanilla JavaScript** using ES modules. There are **no frameworks**, **no bundlers**, **no build step**, and **no runtime dependencies**. Users can simply open `index.html` in a modern browser and the tool works immediately.

**Core architecture**:
- Centralized configuration in `config.json`
- Event-driven design using `EventBus` for loose coupling
- Reactive state management via `AppState` (emits `state:*Changed` events on any update)
- Manager pattern for feature isolation
- `App.js` as the bootstrap orchestrator that emits `app:ready`

**Philosophy**:
- Prioritize simplicity, instant usability, and zero configuration for end users.
- Maintain clean separation of concerns.
- Keep interactions smooth and responsive (drag handles, keyboard, toasts).
- All configurable values must live in `config.json` — never hard-code them.

**Current version**: 0.1.0-beta

## Repository Structure
```plain
.
├── AGENTS.md
├── assets
│   ├── app.css                         # All styles (if presentl otherwise inline/dynamic)
│   ├── app.js                          # Main initialiser and orchestrator
│   ├── css
│   │   ├── reset.css
│   │   ├── theme.css
│   │   └── utils.css                   # Shared utilities (toast, clamping, etc.)
│   ├── js
│   │   ├── App.js
│   │   ├── core
│   │   │   ├── AppState.js             # Reactive state container
│   │   │   ├── EventBus.js             # Pub/Sub event system
│   │   │   └── UIFactory.js            # Dynamic UI element creation
│   │   ├── managers
│   │   │   ├── BreakpointManager.js
│   │   │   ├── IFrameController.js
│   │   │   ├── KeyboardManager.js
│   │   │   ├── LocalLoader.js
│   │   │   └── UIManager.js
│   │   └── Utils.js
│   └── svg
├── CHANGELOG.md
├── config.json                         # Single source of truth for all settings
├── index.html                          # Main entry point
├── LICENSE
├── package.json
├── public
│   └── demo-01                         # Example local demo files
└── README.md
```

## Setup & Development Workflow
No installation or build process is required.

Edit `config.json` then...

```bash
# Clone and run
git clone https://github.com/apexshift/rwd-window.git
cd rwd-window

# Open the app (recommended methods)
# Option 1: Double-click index.html
# Option 2: Use a static server (best for development)
npx live-server .          # or: python -m http.server 8080
```

**Development tips:**

Hard-refresh (Ctrl+Shift+R) after significant JavaScript changes.
Keep browser DevTools open for inspecting the iframe content and console logs.
Test all interactions: drag handles, device buttons (single/double click), keyboard shortcuts, demo switching, and toasts.

## Code Style & Conventions

**Architecture (Strictly Enforce)**

EventBus is mandatory for all inter-module communication. Managers must not call methods directly on each other.
AppState is the only source of truth for reactive data. Use AppState.set(key, value) — this automatically emits the appropriate state:*Changed event.
Managers initialize after receiving the app:ready event.
Configuration is loaded from config.json (likely via fetch in App.js) and distributed to managers.
UI elements should be created via UIFactory when possible for consistency.

**Naming Conventions**

Files & Classes: PascalCase.js (e.g., BreakpointManager.js)
Methods & Variables: camelCase
Events: domain:action format
Examples: state:viewportChanged, breakpoint:activated, viewport:fit, input:stepChanged, ui:helpClicked
Private fields: Use # prefix where encapsulation is needed.
Constants: UPPER_SNAKE_CASE

**Preferred Patterns**

Small, focused methods and classes.
Composition over inheritance.
Use Utils helpers for common operations (e.g., clamping dimensions, showing toasts).
Toast feedback: Always use Utils.showToast(message, type) for user-visible messages (success, error, info).
Handle dual behavior on breakpoint buttons (single vs. double click) consistently with existing implementation.

**What to Avoid**

Adding any npm dependencies (runtime or dev).
Introducing a build tool or transpiler — the "open index.html and run" experience is a core value proposition.
Hard-coding values that belong in config.json.
Tight coupling between managers.
console.log statements in user-facing paths (use toasts instead).
Breaking keyboard shortcuts or drag/resize smoothness.

### Configuration

All settings are defined in the single `config.json` file at the root:

- app.clamping — Viewport size limits
- app.initialViewport — Default size and mode
- ui_controls.breakpoints — Device presets (label, width, icon, etc.)
- ui_controls.fitToContainer — Fit mode behavior
- files — Array of demo options for the loader

When modifying or extending configuration:

- Update config.json first.
- Ensure managers correctly read and react to the new values.
- Update README.md and this AGENTS.md if the change affects user behavior.

### Quality & Testing

- No automated tests exist yet (npm test is a placeholder).
- No linting or formatting configuration is present.
- Recommended next step: Introduce Vitest for testing managers and Utils, plus basic integration tests for viewport resizing and event flows.

### Git & Contribution Workflow

- Use conventional commit messages: feat:, fix:, chore:, docs:, etc.
- Branch names: feature/xxx, bugfix/yyy, chore/config
- Pull requests must:
    - Preserve all existing keyboard shortcuts and interaction behaviors.
    - Include updates to CHANGELOG.md.
    - Be focused on one logical change.

Always manually verify changes by opening `index.html` and testing:
- Drag/resize handles
- Device button single/double-click behavior
- Keyboard shortcuts (arrows, 1-9, F, H, ?, etc.)
- Demo loading and toasts

### Boundaries for Agents

- Do not add dependencies or build steps without explicit discussion.
- Do not refactor the EventBus + AppState core unless the task specifically requires architectural change.
- Maintain the desktop-only focus for now.
- When adding features, also update README.md, CHANGELOG.md, and this file.
- Keep changes small and respectful of the lightweight, zero-config spirit.

## Agent-Specific Instructions

- Read config.json, App.js, and the core/managers files early in any session.
- Provide concise, focused diffs that follow the existing patterns.
- After modifications, always instruct the user (or simulate) testing the key interactions listed above.
- Keep this AGENTS.md updated whenever new conventions or features are introduced.