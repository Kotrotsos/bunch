import { invoke } from "@tauri-apps/api/core";
import type {
  ConfigTree,
  InheritanceChain,
  SearchResult,
} from "../types/config-tree";

export async function scanConfigTree(): Promise<ConfigTree> {
  return invoke<ConfigTree>("scan_config_tree");
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

export async function startWatching(): Promise<void> {
  return invoke<void>("start_watching");
}

export async function stopWatching(): Promise<void> {
  return invoke<void>("stop_watching");
}
