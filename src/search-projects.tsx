import {
  ActionPanel,
  Action,
  List,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  open,
  Application,
  getApplications,
} from "@raycast/api";
import { discover, getBinaryManager } from "@joe-sh/pj";
import { useState, useEffect, useMemo } from "react";
import type { Project, Preferences } from "./types";
import {
  getProjectIcon,
  formatDisplayPath,
  formatProjectType,
  getFavorites,
  toggleFavorite,
  addToRecentProjects,
} from "./utils";
import { statSync } from "fs";

interface ProjectWithStats extends Project {
  lastModified?: Date;
  size?: number;
}

export default function SearchProjects() {
  const preferences = getPreferenceValues<Preferences>();

  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [terminalApp, setTerminalApp] = useState<Application | undefined>();
  const [editorApp, setEditorApp] = useState<Application | undefined>();

  // Load projects with stats
  async function loadProjects() {
    try {
      setIsLoading(true);

      // Ensure binary is installed
      await getBinaryManager().getBinaryPath();

      // Discover projects
      const discoveredProjects = await discover({ icons: true });

      // Load favorites
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);

      // Add stats to projects
      const projectsWithStats: ProjectWithStats[] = discoveredProjects.map((project) => {
        try {
          const stats = statSync(project.path);
          return {
            ...project,
            lastModified: stats.mtime,
            size: stats.size,
          };
        } catch {
          return project;
        }
      });

      // Sort by last modified date
      projectsWithStats.sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return b.lastModified.getTime() - a.lastModified.getTime();
      });

      setProjects(projectsWithStats);
    } catch (error) {
      console.error("Failed to load projects:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load projects",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Get unique project types
  const projectTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach((p) => types.add(formatProjectType(p.marker)));
    return Array.from(types).sort();
  }, [projects]);

  // Filter projects by selected type
  const filteredProjects = useMemo(() => {
    if (selectedType === "all") return projects;
    if (selectedType === "favorites") {
      return projects.filter((p) => favorites.includes(p.path));
    }
    return projects.filter((p) => formatProjectType(p.marker) === selectedType);
  }, [projects, selectedType, favorites]);

  // Find the configured terminal and editor applications
  useEffect(() => {
    async function findApps() {
      const apps = await getApplications();

      // Find terminal app
      const terminalName = preferences.terminalApp || "Terminal";
      const terminal = apps.find(
        (app) =>
          app.name.toLowerCase() === terminalName.toLowerCase() ||
          app.name.toLowerCase().includes(terminalName.toLowerCase()),
      );
      setTerminalApp(terminal);

      // Find editor app
      const editorName = preferences.editorApp || "Visual Studio Code";
      const editor = apps.find(
        (app) =>
          app.name.toLowerCase() === editorName.toLowerCase() ||
          app.name.toLowerCase().includes(editorName.toLowerCase()),
      );
      setEditorApp(editor);
    }
    findApps();
  }, [preferences.terminalApp, preferences.editorApp]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Format date for display
  function formatDate(date: Date | undefined): string {
    if (!date) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search projects by name or path..."
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by project type" value={selectedType} onChange={setSelectedType}>
          <List.Dropdown.Item title="All Projects" value="all" />
          {favorites.length > 0 && (
            <List.Dropdown.Item
              title={`Favorites (${projects.filter((p) => favorites.includes(p.path)).length})`}
              value="favorites"
              icon={Icon.Star}
            />
          )}
          <List.Dropdown.Section title="Project Types">
            {projectTypes.map((type) => (
              <List.Dropdown.Item
                key={type}
                title={`${type} (${projects.filter((p) => formatProjectType(p.marker) === type).length})`}
                value={type}
              />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {filteredProjects.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title={selectedType === "all" ? "No Projects Found" : `No ${selectedType} Projects Found`}
          description={
            selectedType === "all"
              ? "Make sure pj is installed and configured correctly."
              : "Try selecting a different filter."
          }
        />
      ) : (
        filteredProjects.map((project) => {
          const isFavorite = favorites.includes(project.path);

          return (
            <List.Item
              key={project.path}
              icon={getProjectIcon(project)}
              title={project.name}
              subtitle={formatDisplayPath(project.path)}
              accessories={[
                isFavorite ? { icon: Icon.Star, tooltip: "Favorite" } : null,
                project.lastModified ? { text: formatDate(project.lastModified), tooltip: "Last modified" } : null,
                { tag: formatProjectType(project.marker) },
              ].filter(Boolean)}
              actions={
                <ProjectActions
                  project={project}
                  isFavorite={isFavorite}
                  preferences={preferences}
                  terminalApp={terminalApp}
                  editorApp={editorApp}
                  onRefresh={loadProjects}
                  onToggleFavorite={async () => {
                    await toggleFavorite(project.path);
                    await loadProjects();
                  }}
                />
              }
            />
          );
        })
      )}
    </List>
  );
}

interface ProjectActionsProps {
  project: Project;
  isFavorite: boolean;
  preferences: Preferences;
  terminalApp: Application | undefined;
  editorApp: Application | undefined;
  onRefresh: () => void;
  onToggleFavorite: () => void;
}

function ProjectActions({
  project,
  isFavorite,
  preferences,
  terminalApp,
  editorApp,
  onRefresh,
  onToggleFavorite,
}: ProjectActionsProps) {
  const openInFinder = <Action.ShowInFinder path={project.path} shortcut={{ modifiers: ["cmd"], key: "f" }} />;

  const openInEditor = editorApp ? (
    <Action.Open
      title={`Open in ${editorApp.name}`}
      icon={Icon.Code}
      target={project.path}
      application={editorApp}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      onOpen={async () => {
        await addToRecentProjects(project.path);
      }}
    />
  ) : (
    <Action
      title="Open in Default Editor"
      icon={Icon.Code}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      onAction={async () => {
        await open(project.path);
        await addToRecentProjects(project.path);
      }}
    />
  );

  const openInTerminal = terminalApp ? (
    <Action.Open
      title={`Open in ${terminalApp.name}`}
      icon={Icon.Terminal}
      target={project.path}
      application={terminalApp}
      shortcut={{ modifiers: ["cmd"], key: "t" }}
      onOpen={async () => {
        await addToRecentProjects(project.path);
      }}
    />
  ) : (
    <Action.OpenWith path={project.path} shortcut={{ modifiers: ["cmd"], key: "t" }} />
  );

  const copyPath = <Action.CopyToClipboard content={project.path} shortcut={{ modifiers: ["cmd"], key: "c" }} />;

  // Order actions based on default preference
  const actions = [];
  switch (preferences.defaultAction) {
    case "finder":
      actions.push(openInFinder, openInEditor, openInTerminal, copyPath);
      break;
    case "editor":
      actions.push(openInEditor, openInFinder, openInTerminal, copyPath);
      break;
    case "terminal":
      actions.push(openInTerminal, openInFinder, openInEditor, copyPath);
      break;
    case "copy":
      actions.push(copyPath, openInFinder, openInEditor, openInTerminal);
      break;
    default:
      actions.push(openInFinder, openInEditor, openInTerminal, copyPath);
  }

  return (
    <ActionPanel>
      <ActionPanel.Section title="Open Project">{actions}</ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          icon={isFavorite ? Icon.StarDisabled : Icon.Star}
          shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
          onAction={onToggleFavorite}
        />
        <Action.OpenWith path={project.path} shortcut={{ modifiers: ["cmd", "shift"], key: "o" }} />
        <Action
          title="Refresh Projects"
          icon={Icon.ArrowClockwise}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={onRefresh}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
