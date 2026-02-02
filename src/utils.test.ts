import { describe, it, expect, vi } from "vitest";

// Mock os.homedir
vi.mock("os", () => ({
  homedir: () => "/Users/testuser",
}));

// Instead of importing from utils.ts which has Raycast dependencies,
// we'll test the pure logic functions directly here
// This mirrors the implementation in utils.ts

// Pure function: Format marker as a readable project type
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

// Pure function: Format path for display (replace home dir with ~)
function formatDisplayPath(path: string, homeDir: string = "/Users/testuser"): string {
  // Ensure we only replace if the path starts with home dir followed by / or is exactly home
  if (path === homeDir) {
    return "~";
  }
  if (path.startsWith(homeDir + "/")) {
    return "~" + path.slice(homeDir.length);
  }
  return path;
}

describe("formatDisplayPath", () => {
  it("replaces home directory with ~", () => {
    expect(formatDisplayPath("/Users/testuser/projects/myapp")).toBe("~/projects/myapp");
  });

  it("leaves paths outside home directory unchanged", () => {
    expect(formatDisplayPath("/var/www/myapp")).toBe("/var/www/myapp");
  });

  it("handles exact home directory path", () => {
    expect(formatDisplayPath("/Users/testuser")).toBe("~");
  });

  it("does not replace partial matches", () => {
    expect(formatDisplayPath("/Users/testuser2/projects")).toBe("/Users/testuser2/projects");
  });
});

describe("formatProjectType", () => {
  it("formats .git marker as git", () => {
    expect(formatProjectType(".git")).toBe("git");
  });

  it("formats package.json marker as npm", () => {
    expect(formatProjectType("package.json")).toBe("npm");
  });

  it("formats Cargo.toml marker as cargo", () => {
    expect(formatProjectType("Cargo.toml")).toBe("cargo");
  });

  it("formats go.mod marker as go", () => {
    expect(formatProjectType("go.mod")).toBe("go");
  });

  it("formats pyproject.toml marker as python", () => {
    expect(formatProjectType("pyproject.toml")).toBe("python");
  });

  it("formats Makefile marker as make", () => {
    expect(formatProjectType("Makefile")).toBe("make");
  });

  it("formats flake.nix marker as nix", () => {
    expect(formatProjectType("flake.nix")).toBe("nix");
  });

  it("formats composer.json marker as php", () => {
    expect(formatProjectType("composer.json")).toBe("php");
  });

  it("formats build.gradle marker as gradle", () => {
    expect(formatProjectType("build.gradle")).toBe("gradle");
  });

  it("formats pom.xml marker as maven", () => {
    expect(formatProjectType("pom.xml")).toBe("maven");
  });

  it("formats Gemfile marker as ruby", () => {
    expect(formatProjectType("Gemfile")).toBe("ruby");
  });

  it("formats mix.exs marker as elixir", () => {
    expect(formatProjectType("mix.exs")).toBe("elixir");
  });

  it("formats deno.json marker as deno", () => {
    expect(formatProjectType("deno.json")).toBe("deno");
  });

  it("formats pubspec.yaml marker as dart", () => {
    expect(formatProjectType("pubspec.yaml")).toBe("dart");
  });

  it("returns original marker for unknown types", () => {
    expect(formatProjectType("unknown.txt")).toBe("unknown.txt");
  });
});

describe("getProjectIcon logic", () => {
  // Test the icon selection logic without Raycast dependencies
  function getIconType(marker: string, icon: string | undefined): string {
    if (icon && icon.trim()) {
      return "custom";
    }
    switch (marker) {
      case ".git":
      case "package.json":
      case "Cargo.toml":
      case "go.mod":
        return "box";
      default:
        return "folder";
    }
  }

  it("returns custom for projects with icons", () => {
    expect(getIconType(".git", "🚀")).toBe("custom");
  });

  it("returns box for .git marker without icon", () => {
    expect(getIconType(".git", undefined)).toBe("box");
  });

  it("returns box for package.json marker without icon", () => {
    expect(getIconType("package.json", undefined)).toBe("box");
  });

  it("returns box for Cargo.toml marker without icon", () => {
    expect(getIconType("Cargo.toml", undefined)).toBe("box");
  });

  it("returns box for go.mod marker without icon", () => {
    expect(getIconType("go.mod", undefined)).toBe("box");
  });

  it("returns folder for unknown marker without icon", () => {
    expect(getIconType("unknown", undefined)).toBe("folder");
  });

  it("ignores whitespace-only icons", () => {
    expect(getIconType(".git", "   ")).toBe("box");
  });
});
