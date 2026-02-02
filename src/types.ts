export type { Project } from "@joe-sh/pj";

export interface Preferences {
  pjPath: string;
  defaultAction: "finder" | "editor" | "terminal" | "copy";
  terminalApp: string;
  editorApp: string;
}

export interface FavoriteProject {
  path: string;
  lastAccessed?: number;
}

export interface StoredData {
  favorites: string[];
  recentProjects: FavoriteProject[];
}
