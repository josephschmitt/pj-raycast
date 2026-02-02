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
import { useExec } from "@raycast/utils";
import { homedir } from "os";
import { useState, useEffect } from "react";
import type { Project } from "@joe-sh/pj";

interface PJOutput {
  projects: Project[];
}

interface Preferences {
  pjPath: string;
  defaultAction: "finder" | "editor" | "terminal" | "copy";
  terminalApp: string;
  editorApp: string;
}

// Map pj icon names to Raycast icons or emojis
function getProjectIcon(project: Project): string | Icon {
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
function formatDisplayPath(path: string): string {
  const home = homedir();
  if (path.startsWith(home)) {
    return path.replace(home, "~");
  }
  return path;
}

// Format marker as a readable project type
function formatProjectType(marker: string): string {
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

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const pjCommand = preferences.pjPath || "pj";

  const [terminalApp, setTerminalApp] = useState<Application | undefined>();
  const [editorApp, setEditorApp] = useState<Application | undefined>();

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

  const { isLoading, data, error, revalidate } = useExec(pjCommand, ["--json", "--icons"], {
    shell: true,
    parseOutput: ({ stdout }) => {
      if (!stdout || stdout.trim() === "") {
        return { projects: [] };
      }
      try {
        const parsed = JSON.parse(stdout) as PJOutput;
        return parsed;
      } catch (e) {
        console.error("Failed to parse pj output:", e);
        return { projects: [] };
      }
    },
  });

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to run pj",
      message: error.message,
    });
  }

  const projects = data?.projects || [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects...">
      {projects.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No Projects Found"
          description="Make sure pj is installed and configured correctly."
        />
      ) : (
        projects.map((project, index) => (
          <List.Item
            key={`${project.path}-${index}`}
            icon={getProjectIcon(project)}
            title={project.name}
            subtitle={formatDisplayPath(project.path)}
            accessories={[{ tag: formatProjectType(project.marker) }, { icon: Icon.Folder, tooltip: project.path }]}
            actions={
              <ProjectActions
                project={project}
                preferences={preferences}
                terminalApp={terminalApp}
                editorApp={editorApp}
                onRefresh={revalidate}
              />
            }
          />
        ))
      )}
    </List>
  );
}

interface ProjectActionsProps {
  project: Project;
  preferences: Preferences;
  terminalApp: Application | undefined;
  editorApp: Application | undefined;
  onRefresh: () => void;
}

function ProjectActions({ project, preferences, terminalApp, editorApp, onRefresh }: ProjectActionsProps) {
  const openInFinder = <Action.ShowInFinder path={project.path} shortcut={{ modifiers: ["cmd"], key: "f" }} />;

  const openInEditor = editorApp ? (
    <Action.Open
      title={`Open in ${editorApp.name}`}
      icon={Icon.Code}
      target={project.path}
      application={editorApp}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
    />
  ) : (
    <Action
      title="Open in Default Editor"
      icon={Icon.Code}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      onAction={async () => {
        await open(project.path);
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
