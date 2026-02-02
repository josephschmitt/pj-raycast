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
import { useState, useEffect } from "react";
import type { Project, Preferences } from "./types";
import { getProjectIcon, formatDisplayPath, formatProjectType, getRecentProjects, addToRecentProjects } from "./utils";

export default function QuickSwitch() {
  const preferences = getPreferenceValues<Preferences>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [editorApp, setEditorApp] = useState<Application | undefined>();

  // Load projects using @joe-sh/pj API
  async function loadProjects() {
    try {
      setIsLoading(true);

      // Ensure binary is installed
      await getBinaryManager().getBinaryPath();

      // Get recent projects
      const recent = await getRecentProjects();
      const recentPathList = recent.map((r) => r.path);
      setRecentPaths(recentPathList);

      // Discover all projects
      const discoveredProjects = await discover({ icons: true });

      // Sort projects: recent first (in order), then alphabetically
      const sortedProjects = [...discoveredProjects].sort((a, b) => {
        const aRecentIndex = recentPathList.indexOf(a.path);
        const bRecentIndex = recentPathList.indexOf(b.path);

        // Both are recent - sort by recency
        if (aRecentIndex !== -1 && bRecentIndex !== -1) {
          return aRecentIndex - bRecentIndex;
        }

        // Only a is recent
        if (aRecentIndex !== -1) return -1;

        // Only b is recent
        if (bRecentIndex !== -1) return 1;

        // Neither is recent - alphabetical
        return a.name.localeCompare(b.name);
      });

      setProjects(sortedProjects);
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

  // Find the configured editor application
  useEffect(() => {
    async function findApp() {
      const apps = await getApplications();
      const editorName = preferences.editorApp || "Visual Studio Code";
      const editor = apps.find(
        (app) =>
          app.name.toLowerCase() === editorName.toLowerCase() ||
          app.name.toLowerCase().includes(editorName.toLowerCase()),
      );
      setEditorApp(editor);
    }
    findApp();
  }, [preferences.editorApp]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Quick open in editor (primary action)
  async function openProject(project: Project) {
    try {
      if (editorApp) {
        await open(project.path, editorApp);
      } else {
        await open(project.path);
      }
      await addToRecentProjects(project.path);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open project",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Quick switch to project..."
      onSelectionChange={(id) => {
        // Preload for even faster switching
        if (id && !isLoading) {
          const project = projects.find((p) => p.path === id);
          if (project && editorApp) {
            // Prefetch application info for faster opening
            void editorApp.bundleId;
          }
        }
      }}
    >
      {projects.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No Projects Found"
          description="Make sure pj is installed and configured correctly."
        />
      ) : (
        projects.map((project) => {
          const isRecent = recentPaths.includes(project.path);
          const recentIndex = recentPaths.indexOf(project.path);

          return (
            <List.Item
              key={project.path}
              id={project.path}
              icon={getProjectIcon(project)}
              title={project.name}
              subtitle={formatDisplayPath(project.path)}
              accessories={[
                isRecent
                  ? {
                      tag: { value: `Recent #${recentIndex + 1}`, color: "#007AFF" },
                      tooltip: "Recently opened",
                    }
                  : null,
                { tag: formatProjectType(project.marker) },
              ].filter(Boolean)}
              actions={
                <ActionPanel>
                  <Action
                    title={editorApp ? `Open in ${editorApp.name}` : "Open"}
                    icon={Icon.Code}
                    onAction={() => openProject(project)}
                  />
                  <Action.ShowInFinder path={project.path} shortcut={{ modifiers: ["cmd"], key: "f" }} />
                  <Action.CopyToClipboard
                    title="Copy Path"
                    content={project.path}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action
                    title="Refresh Projects"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={loadProjects}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
