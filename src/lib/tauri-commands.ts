import { invoke } from "@tauri-apps/api/core";
import type {
  ConfigTree,
  InheritanceChain,
  ProjectNode,
  SearchResult,
} from "../types/config-tree";

export async function scanConfigTree(): Promise<ConfigTree> {
  return invoke<ConfigTree>("scan_config_tree");
}

export async function scanGlobalOnly(): Promise<ConfigTree> {
  return invoke<ConfigTree>("scan_global_only");
}

export async function scanProjectFolder(
  path: string
): Promise<ProjectNode | null> {
  return invoke<ProjectNode | null>("scan_project_folder", { path });
}

export async function getInheritanceChain(
  projectPath: string
): Promise<InheritanceChain | null> {
  return invoke<InheritanceChain | null>("get_inheritance_chain", {
    projectPath,
  });
}

export async function readConfigFile(path: string): Promise<string> {
  return invoke<string>("read_config_file", { path });
}

export async function writeConfigFile(
  path: string,
  content: string
): Promise<void> {
  return invoke<void>("write_config_file", { path, content });
}

export async function searchConfigContent(
  query: string
): Promise<SearchResult[]> {
  return invoke<SearchResult[]>("search_config_content", { query });
}

export async function deleteConfigFile(path: string): Promise<void> {
  return invoke<void>("delete_config_file", { path });
}

export async function showInFolder(path: string): Promise<void> {
  return invoke<void>("show_in_folder", { path });
}

export async function startWatching(): Promise<void> {
  return invoke<void>("start_watching");
}

export async function stopWatching(): Promise<void> {
  return invoke<void>("stop_watching");
}
