# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Raycast extension for [pj](https://github.com/josephschmitt/pj) - a fast project finder. The extension provides three commands for navigating to projects on the user's system.

## Commands

```bash
npm run dev          # Run in development mode (opens in Raycast)
npm run build        # Build for production
npm run lint         # Lint with ray lint (ESLint + Prettier)
npm run fix-lint     # Auto-fix lint issues
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Architecture

### Key Dependencies

- **@joe-sh/pj** - TypeScript API for the pj CLI. Use `discover()` for project discovery and `getBinaryManager().getBinaryPath()` to ensure the binary is installed. Never shell out to pj directly.
- **@raycast/api** - Raycast extension API for UI components, actions, and preferences.

### Source Files

- `src/list-projects.tsx` - Main command with full functionality (favorites, all actions)
- `src/quick-switch.tsx` - Speed-optimized command showing recent projects first
- `src/search-projects.tsx` - Advanced search with type filtering and date display
- `src/types.ts` - Shared TypeScript interfaces (re-exports `Project` from @joe-sh/pj)
- `src/utils.ts` - Shared utilities (icon mapping, path formatting, LocalStorage helpers)

### Data Flow

1. Commands call `getBinaryManager().getBinaryPath()` to ensure pj binary exists (auto-downloads if needed)
2. Commands call `discover({ icons: true })` from @joe-sh/pj to get project list
3. Favorites and recent projects are stored in Raycast's LocalStorage
4. User preferences (editor app, terminal app, default action) come from `getPreferenceValues<Preferences>()`

### Testing

Tests are in `src/utils.test.ts`. Due to Raycast API mocking complexity, tests focus on pure utility functions by reimplementing the logic without Raycast dependencies. When adding tests, follow this pattern rather than trying to mock @raycast/api.

## Pre-push Hook

Husky runs `npm run lint && npm test && npm run build` before push. All three must pass.
