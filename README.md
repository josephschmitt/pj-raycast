# PJ

A Raycast extension for [pj](https://github.com/josephschmitt/pj) - a fast project finder that helps you quickly navigate to your projects.

## Prerequisites

You need to have `pj` installed on your system. Install it via Homebrew:

```bash
brew install josephschmitt/tap/pj
```

Or download the binary directly from [GitHub releases](https://github.com/josephschmitt/pj/releases).

## Features

- Lists all projects discovered by pj
- Shows project type (git, npm, cargo, go, etc.) as a tag
- Multiple actions for each project:
  - **Open in Editor** (Cmd+E) - Opens in your configured editor
  - **Open in Finder** (Cmd+F) - Reveals in Finder
  - **Open in Terminal** (Cmd+T) - Opens in your configured terminal
  - **Copy Path** (Cmd+C) - Copies the project path to clipboard
  - **Open With** (Cmd+Shift+O) - Choose any application
- Configurable default action
- Configurable editor and terminal applications

## Configuration

### Extension Preferences

| Preference | Description | Default |
|------------|-------------|---------|
| PJ Binary Path | Path to the pj binary | `pj` (uses PATH) |
| Default Action | Primary action when pressing Enter | Open in Editor |
| Editor Application | Application for opening projects | Visual Studio Code |
| Terminal Application | Terminal for opening projects | Terminal |

### pj Configuration

Configure pj by creating `~/.config/pj/config.yaml`:

```yaml
paths:
  - ~/development
  - ~/projects

markers:
  - .git
  - package.json
  - Cargo.toml
  - go.mod

exclude:
  - node_modules
  - .git
  - vendor

max_depth: 5
```

See the [pj documentation](https://github.com/josephschmitt/pj) for more configuration options.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Default action (configurable) |
| Cmd+E | Open in Editor |
| Cmd+F | Open in Finder |
| Cmd+T | Open in Terminal |
| Cmd+C | Copy Path |
| Cmd+Shift+O | Open With... |
| Cmd+R | Refresh project list |
