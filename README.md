# PJ

A Raycast extension for [pj](https://github.com/josephschmitt/pj) - a fast project finder that helps you quickly navigate to your projects.

## Prerequisites

The pj binary will be automatically downloaded when you first use the extension. Alternatively, you can install it manually via Homebrew:

```bash
brew install josephschmitt/tap/pj
```

Or download the binary directly from [GitHub releases](https://github.com/josephschmitt/pj/releases).

## Commands

### List Projects

The main command that displays all your projects with full functionality:

- Shows all projects discovered by pj
- Favorites appear at the top (star/unstar with Cmd+Shift+F)
- Project type tags (git, npm, cargo, go, etc.)
- Multiple actions for each project

### Quick Switch

Optimized for speed - quickly jump to any project:

- Shows recently opened projects first (last 10)
- Instant search across all projects
- Single action: open directly in your editor

### Search Projects

Advanced search with filtering capabilities:

- Filter by project type (git, npm, cargo, go, etc.)
- Filter to show only favorites
- Shows last modified date for each project
- Full action panel like List Projects

## Features

- **Favorites**: Star frequently used projects to pin them to the top
- **Recent Projects**: Quick Switch shows your most recently accessed projects first
- **Project Type Tags**: Instantly see what type each project is (git, npm, cargo, go, python, etc.)
- **Multiple Actions**:
  - **Open in Editor** (Cmd+E) - Opens in your configured editor
  - **Open in Finder** (Cmd+F) - Reveals in Finder
  - **Open in Terminal** (Cmd+T) - Opens in your configured terminal
  - **Copy Path** (Cmd+C) - Copies the project path to clipboard
  - **Open With** (Cmd+Shift+O) - Choose any application
  - **Add/Remove Favorites** (Cmd+Shift+F) - Toggle favorite status
- **Configurable Default Action**: Set which action triggers on Enter
- **Configurable Applications**: Choose your preferred editor and terminal

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
| Cmd+Shift+F | Toggle Favorite |
| Cmd+R | Refresh project list |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Build for production
npm run build
```

## License

MIT
