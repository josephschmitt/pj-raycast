import { Icon, LocalStorage, showToast, Toast } from "@raycast/api";
import { homedir } from "os";
import type { Project, StoredData } from "./types";

// Map pj icon names to Raycast icons or emojis
export function getProjectIcon(project: Project): string | Icon {
  // pj outputs nerd font icons, but we can use the icon string directly
  // as Raycast will display emoji/unicode characters
  if (project.icon && project.icon.trim()) {
    return project.icon;
  }

  // Fallback based on marker type
  switch (project.marker) {
    case ".git":
      return Icon.Box;
    case "package.json":
      return Icon.Box;
    case "Cargo.toml":
      return Icon.Box;
    case "go.mod":
      return Icon.Box;
    default:
      return Icon.Folder;
  }
}

// Format path for display (replace home dir with ~)
export function formatDisplayPath(path: string): string {
  const home = homedir();
  if (path.startsWith(home)) {
    return path.replace(home, "~");
  }
  return path;
}

// Format marker as a readable project type
export function formatProjectType(marker: string): string {
  const markerTypes: Record<string, string> = {
    ".git": "git",
    "package.json": "npm",
    "Cargo.toml": "cargo",
    "go.mod": "go",
    "pyproject.toml": "python",
    Makefile: "make",
    "flake.nix": "nix",
    "composer.json": "php",
    "build.gradle": "gradle",
    "pom.xml": "maven",
    Gemfile: "ruby",
    "mix.exs": "elixir",
    "deno.json": "deno",
    "pubspec.yaml": "dart",
  };
  return markerTypes[marker] || marker;
}

// Storage keys
const STORAGE_KEYS = {
  FAVORITES: "pj-favorites",
  RECENT_PROJECTS: "pj-recent-projects",
} as const;

// Get stored favorites
export async function getFavorites(): Promise<string[]> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Toggle favorite status
export async function toggleFavorite(projectPath: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    const index = favorites.indexOf(projectPath);

    if (index === -1) {
      favorites.push(projectPath);
      await LocalStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      await showToast({
        style: Toast.Style.Success,
        title: "Added to Favorites",
      });
      return true;
    } else {
      favorites.splice(index, 1);
      await LocalStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      await showToast({
        style: Toast.Style.Success,
        title: "Removed from Favorites",
      });
      return false;
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to update favorites",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

// Get recent projects
export async function getRecentProjects(): Promise<StoredData["recentProjects"]> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.RECENT_PROJECTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Add to recent projects
export async function addToRecentProjects(projectPath: string): Promise<void> {
  try {
    const recent = await getRecentProjects();

    // Remove if already exists
    const filtered = recent.filter((p) => p.path !== projectPath);

    // Add to beginning with timestamp
    filtered.unshift({
      path: projectPath,
      lastAccessed: Date.now(),
    });

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    await LocalStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to update recent projects:", error);
  }
}
