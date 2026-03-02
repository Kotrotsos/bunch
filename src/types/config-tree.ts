export type ConfigFileType =
  | "ClaudeMd"
  | "SettingsJson"
  | "SettingsLocalJson"
  | "AgentMd"
  | "CommandMd";

export type ConfigLevel = "Global" | "Project";

export type AgentOwner =
  | "Claude"
  | "Codex"
  | "Cursor"
  | "Windsurf"
  | "Antigravity"
  | "User";

export interface ConfigFile {
  path: string;
  fileType: ConfigFileType;
  level: ConfigLevel;
  name: string;
  size: number;
  modified: string | null;
  projectPath: string | null;
  owner: AgentOwner | null;
}

export interface ProjectNode {
  name: string;
  path: string;
  decodedPath: string;
  files: ConfigFile[];
}

export interface GlobalNode {
  files: ConfigFile[];
}

export interface ConfigTree {
  global: GlobalNode;
  projects: ProjectNode[];
  scanTimeMs: number;
}

export interface InheritanceChainLevel {
  level: ConfigLevel;
  label: string;
  files: ConfigFile[];
}

export interface InheritanceChain {
  projectName: string;
  projectPath: string;
  levels: InheritanceChainLevel[];
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
}

export interface SearchResult {
  file: ConfigFile;
  matches: SearchMatch[];
}

export interface TreeNodeData {
  id: string;
  label: string;
  type: "root" | "group" | "project" | "file";
  configFile?: ConfigFile;
  project?: ProjectNode;
  children: TreeNodeData[];
  expanded?: boolean;
}

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  fileType: ConfigFileType;
  viewMode: "raw" | "split" | "preview";
}
