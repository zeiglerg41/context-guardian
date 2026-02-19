# Context Guardian - VS Code Extension

## What This Is

The **Context Guardian VS Code Extension** automatically watches your project's dependency files (like `package.json`, `requirements.txt`, `Cargo.toml`) and triggers the Context Guardian CLI to regenerate your `.guardian.md` playbook whenever dependencies change.

## How It Fits Into The Bigger Picture

This extension provides **seamless integration** between Context Guardian and your development workflow:

1. You add/update a dependency
2. Extension detects the change
3. CLI runs automatically in the background
4. Playbook updates
5. AI assistant gets fresh context

**No manual intervention required.**

## Features

- ✅ **Auto-sync on dependency changes** - Watches package.json, requirements.txt, Cargo.toml, Gemfile, go.mod
- ✅ **Manual sync command** - Trigger sync anytime via Command Palette
- ✅ **Notifications** - Get notified when playbook updates
- ✅ **View playbook** - Quick command to open `.guardian.md`
- ✅ **Enable/disable auto-sync** - Toggle automatic syncing
- ✅ **Configurable** - Customize CLI path and notification settings

## Installation

### From VSIX (Development)

```bash
code --install-extension context-guardian-0.1.0.vsix
```

### From VS Code Marketplace (Future)

Search for "Context Guardian" in the Extensions view.

## Prerequisites

The Context Guardian CLI must be installed:

```bash
npm install -g @context-guardian/cli
```

## Usage

### Automatic Sync

By default, the extension automatically syncs your playbook when dependency files change:

1. Edit `package.json` (or other dependency file)
2. Save the file
3. Extension detects change and runs `guardian sync`
4. Notification appears when complete

### Manual Sync

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
Context Guardian: Sync Playbook
```

### View Playbook

Open Command Palette and run:

```
Context Guardian: View Playbook
```

### Enable/Disable Auto-Sync

Open Command Palette and run:

```
Context Guardian: Enable Auto-Sync
```

or

```
Context Guardian: Disable Auto-Sync
```

## Configuration

Open VS Code Settings and search for "Context Guardian":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `contextGuardian.autoSync` | boolean | `true` | Automatically sync playbook when dependencies change |
| `contextGuardian.cliPath` | string | `guardian` | Path to Context Guardian CLI executable |
| `contextGuardian.showNotifications` | boolean | `true` | Show notifications when playbook is updated |

### Example Configuration

```json
{
  "contextGuardian.autoSync": true,
  "contextGuardian.cliPath": "/usr/local/bin/guardian",
  "contextGuardian.showNotifications": true
}
```

## Watched Files

The extension watches the following dependency files:

- `package.json` (npm, yarn, pnpm)
- `requirements.txt` (pip)
- `Cargo.toml` (Rust)
- `Gemfile` (Ruby)
- `go.mod` (Go)

Changes to these files trigger an automatic sync (if auto-sync is enabled).

## Commands

| Command | Description |
|---------|-------------|
| `Context Guardian: Sync Playbook` | Manually sync playbook |
| `Context Guardian: Enable Auto-Sync` | Enable automatic syncing |
| `Context Guardian: Disable Auto-Sync` | Disable automatic syncing |
| `Context Guardian: View Playbook` | Open `.guardian.md` file |

## Development

### Setup

```bash
cd ~/context-guardian/apps/vscode-extension
npm install
```

### Compile

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Run Extension

Press `F5` in VS Code to launch the Extension Development Host.

### Package

```bash
npm run package
```

This creates a `.vsix` file that can be installed in VS Code.

## Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── fileWatcher.ts         # File watching logic
│   ├── cliRunner.ts           # CLI execution
│   └── playbookManager.ts     # Playbook metadata
├── .vscode/
│   ├── launch.json            # Debug configuration
│   └── tasks.json             # Build tasks
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

## Troubleshooting

### Extension doesn't activate

- Check that you have a workspace folder open
- Check the Output panel (View → Output → Context Guardian)

### CLI not found

- Ensure CLI is installed: `npm install -g @context-guardian/cli`
- Verify CLI path in settings: `contextGuardian.cliPath`
- Test CLI manually: `guardian --version`

### Auto-sync not working

- Check that auto-sync is enabled in settings
- Check that you're editing a watched file (package.json, etc.)
- Check the Output panel for errors

### Playbook not updating

- Run manual sync: `Context Guardian: Sync Playbook`
- Check CLI output for errors
- Verify `.guardian.md` file exists in workspace root

## Monorepo Location

This extension should be placed in:

```
context-guardian/
└── apps/
    └── vscode-extension/    ← This extension
```

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.

## License

MIT
