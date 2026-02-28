# AgentGuard Desktop

Wails (Go + React TypeScript) desktop app for AgentGuard. Manages the AgentGuard daemon and provides a native UI for monitoring, configuration, and MCP IDE protection.

## Architecture

```
main.go      — Wails app entry, window config, lifecycle
app.go       — All Wails-bound methods (React ↔ Go bridge), AppVersion constant
daemon.go    — Daemon binary download, start/stop, health probe, PID tracking
frontend/    — React + TypeScript + Vite frontend
```

### Data Flow

Desktop app never reads config files directly. All data flows through AgentGuard core API:

```
React UI → window.go.main.App.Method() → Go backend → HTTP to localhost:10180 → AgentGuard Core
```

### Daemon Lifecycle

- Daemon runs as detached process (survives app exit)
- `Probe()` checks `localhost:10180/agentguard/stats` to detect already-running daemons
- PID file: `~/.agentguard/desktop/agentguard.pid`
- Binary: `~/.agentguard/desktop/agentguard`
- Version: `~/.agentguard/desktop/version.txt`
- App shutdown does NOT kill the daemon

## Design Philosophy: Invisible Shield

- **Quiet & Calm**: No aggressive alerts or hacker aesthetics. Minimal visual noise.
- **Trust through Clarity**: Clean whitespace, precise typography, understated color.
- **Action-Oriented**: Max 1-2 primary actions per screen. Hide complexity behind "Advanced" toggles.
- **Low Density**: Hero metrics first, details second. Generous spacing.

### Color Palette

- Background: `#18181a` (deep grey, not pure black)
- Card: `#222224` with `#333336` border
- Text: `#ededed` primary, `#a1a1aa` secondary, `#71717a` muted
- Accent: `#60a5fa` (soft blue)
- Success: `#10b981`, Danger: `#ef4444`, Warning: `#f59e0b`

### User-Facing Language

Use plain language, not developer jargon:
- Tab names: Dashboard, Configuration, Pending Actions, IDE Protection
- Buttons: "Protect" (not "Wrap"), "Remove" (not "Unwrap")
- Badges: "Protected" / "Unprotected" (not "wrapped")
- Every PageHeader must have a `description` prop explaining the tab's purpose
- Empty states must include icon + title + actionable description

## Frontend Structure

```
frontend/src/
  App.tsx              — Orchestrator (state, loaders, handlers only)
  types.ts             — All TypeScript interfaces
  hooks/useTimeSince.ts
  components/
    shared/            — Card, Badge, Toggle, StatBox, ListItemCard,
                         PageHeader, EmptyState, LoadingSpinner, Toast, ConfirmDialog
    tabs/              — MonitoringTab, SettingsTab, ApprovalsTab, McpTab
```

### Component Conventions

- Props interfaces: `<ComponentName>Props`
- Event handler props: `on<Action>` (onSaveConfig, onRefresh)
- Shared components define their API in props; no global state
- StatBox auto-shrinks font for long values (>6 chars)

## Go Backend Conventions

- All Wails-bound methods return JSON string
- Success: `{"status":"ok"}` or raw API response
- Error: `{"error":"<message>"}`
- Use `fetchAPI(url)` for GET, `postAPI(url, body)` for POST

## Build & Run

```bash
# Dev mode (hot reload)
wails dev

# Production build (.app)
wails build
open build/bin/agentguard-desktop.app

# Format frontend
cd frontend && npx oxfmt src/
```

## Code Conventions

- Oxfmt for frontend formatting
- No trailing whitespace
- Logger and comments only where necessary
