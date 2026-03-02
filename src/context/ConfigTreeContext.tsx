import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ConfigTree,
  EditorTab,
  InheritanceChain,
  SearchResult,
  ConfigFile,
  TreeNodeData,
} from "../types/config-tree";
import {
  scanConfigTree,
  scanGlobalOnly,
  scanProjectFolder,
  readConfigFile,
  writeConfigFile,
  deleteConfigFile,
  getInheritanceChain,
  searchConfigContent,
  startWatching,
} from "../lib/tauri-commands";
import { open } from "@tauri-apps/plugin-dialog";
import { buildTreeData, filterTreeByType } from "../lib/config-parser";
import { listen } from "@tauri-apps/api/event";

type FilterType = "claudemd" | "settings" | "agents" | "commands" | null;

interface ConfigTreeContextValue {
  tree: ConfigTree | null;
  treeNodes: TreeNodeData[];
  loading: boolean;
  error: string | null;
  tabs: EditorTab[];
  activeTabId: string | null;
  filter: FilterType;
  searchQuery: string;
  searchResults: SearchResult[];
  inheritanceChain: InheritanceChain | null;
  rescan: () => Promise<void>;
  scanProject: () => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  openFile: (file: ConfigFile) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  showInheritance: (projectPath: string) => Promise<void>;
  clearInheritance: () => void;
  setViewMode: (tabId: string, mode: "raw" | "split" | "preview") => void;
  toggleNodeExpanded: (nodeId: string) => void;
}

const ConfigTreeContext = createContext<ConfigTreeContextValue>(
  {} as ConfigTreeContextValue
);

// Collect expanded node IDs from a tree
function collectExpandedIds(nodes: TreeNodeData[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.expanded) ids.add(node.id);
    if (node.children.length > 0) {
      for (const id of collectExpandedIds(node.children)) {
        ids.add(id);
      }
    }
  }
  return ids;
}

// Apply expanded state to rebuilt tree nodes
function applyExpandedIds(
  nodes: TreeNodeData[],
  expandedIds: Set<string>
): TreeNodeData[] {
  return nodes.map((node) => ({
    ...node,
    expanded: expandedIds.has(node.id) || node.expanded,
    children:
      node.children.length > 0
        ? applyExpandedIds(node.children, expandedIds)
        : node.children,
  }));
}

export function ConfigTreeProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<ConfigTree | null>(null);
  const [rawTreeNodes, setRawTreeNodes] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [inheritanceChain, setInheritanceChain] =
    useState<InheritanceChain | null>(null);
  const [scannedProjectPaths, setScannedProjectPaths] = useState<string[]>([]);
  const treeRef = useRef<ConfigTree | null>(null);

  // Rebuild tree nodes from tree data, preserving expanded state
  const rebuildTreeNodes = useCallback(
    (newTree: ConfigTree) => {
      setRawTreeNodes((prev) => {
        const expandedIds = collectExpandedIds(prev);
        const freshNodes = buildTreeData(newTree);
        return applyExpandedIds(freshNodes, expandedIds);
      });
    },
    []
  );

  const rescan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanConfigTree();
      setTree(result);
      treeRef.current = result;
      rebuildTreeNodes(result);
      setScannedProjectPaths(result.projects.map((p) => p.decodedPath));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [rebuildTreeNodes]);

  const scanProject = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected) return;

      const projectNode = await scanProjectFolder(selected);
      if (!projectNode) return;

      const prev = treeRef.current;
      if (!prev) return;

      const existing = prev.projects.findIndex(
        (p) => p.decodedPath === projectNode.decodedPath
      );
      const projects =
        existing >= 0
          ? prev.projects.map((p, i) => (i === existing ? projectNode : p))
          : [...prev.projects, projectNode].sort((a, b) =>
              a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
      const updated = { ...prev, projects };
      setTree(updated);
      treeRef.current = updated;
      rebuildTreeNodes(updated);

      setScannedProjectPaths((prev) => {
        if (prev.includes(selected)) return prev;
        return [...prev, selected];
      });
    } catch (e) {
      setError(`Failed to scan project: ${e}`);
    }
  }, [rebuildTreeNodes]);

  const deleteFile = useCallback(
    async (path: string) => {
      try {
        await deleteConfigFile(path);
        // Close tab if open
        setTabs((prev) => prev.filter((t) => t.path !== path));
        // Remove from tree
        const prev = treeRef.current;
        if (!prev) return;
        const updated: ConfigTree = {
          ...prev,
          global: {
            files: prev.global.files.filter((f) => f.path !== path),
          },
          projects: prev.projects.map((p) => ({
            ...p,
            files: p.files.filter((f) => f.path !== path),
          })),
        };
        setTree(updated);
        treeRef.current = updated;
        rebuildTreeNodes(updated);
      } catch (e) {
        setError(`Failed to delete file: ${e}`);
      }
    },
    [rebuildTreeNodes]
  );

  // Rescan only loaded projects (global + scanned projects)
  const rescanLoaded = useCallback(async () => {
    try {
      const globalResult = await scanGlobalOnly();
      const projectNodes = await Promise.all(
        scannedProjectPaths.map((p) => scanProjectFolder(p))
      );
      const projects = projectNodes
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );

      const result: ConfigTree = {
        global: globalResult.global,
        projects,
        scanTimeMs: globalResult.scanTimeMs,
      };
      setTree(result);
      treeRef.current = result;
      rebuildTreeNodes(result);
    } catch (e) {
      console.error("Rescan loaded failed:", e);
    }
  }, [scannedProjectPaths, rebuildTreeNodes]);

  // Initial scan: global-only + file watcher
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await scanGlobalOnly();
        setTree(result);
        treeRef.current = result;
        rebuildTreeNodes(result);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();

    startWatching().catch(console.error);

    let unlisten: (() => void) | undefined;
    listen("config-file-changed", () => {
      rescanLoaded();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [rescanLoaded, rebuildTreeNodes]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const results = await searchConfigContent(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const treeNodes = filterTreeByType(rawTreeNodes, filter);

  const openFile = useCallback(
    async (file: ConfigFile) => {
      const existingTab = tabs.find((t) => t.path === file.path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      try {
        const content = await readConfigFile(file.path);
        const isMarkdown =
          file.fileType === "ClaudeMd" ||
          file.fileType === "AgentMd" ||
          file.fileType === "CommandMd";

        const tab: EditorTab = {
          id: file.path,
          path: file.path,
          name: file.name,
          content,
          originalContent: content,
          isDirty: false,
          fileType: file.fileType,
          viewMode: isMarkdown ? "split" : "raw",
        };

        setTabs((prev) => [...prev, tab]);
        setActiveTabId(tab.id);
      } catch (e) {
        setError(`Failed to open file: ${e}`);
      }
    },
    [tabs]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);

        if (activeTabId === tabId) {
          if (next.length > 0) {
            const newIdx = Math.min(idx, next.length - 1);
            setActiveTabId(next[newIdx].id);
          } else {
            setActiveTabId(null);
          }
        }

        return next;
      });
    },
    [activeTabId]
  );

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? { ...t, content, isDirty: content !== t.originalContent }
          : t
      )
    );
  }, []);

  const saveTab = useCallback(async (tabId: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab) return prev;

      writeConfigFile(tab.path, tab.content).catch(console.error);

      return prev.map((t) =>
        t.id === tabId
          ? { ...t, isDirty: false, originalContent: t.content }
          : t
      );
    });
  }, []);

  const showInheritance = useCallback(async (projectPath: string) => {
    try {
      const chain = await getInheritanceChain(projectPath);
      setInheritanceChain(chain);
    } catch (e) {
      console.error("Failed to get inheritance chain:", e);
    }
  }, []);

  const clearInheritance = useCallback(() => {
    setInheritanceChain(null);
  }, []);

  const setViewMode = useCallback(
    (tabId: string, mode: "raw" | "split" | "preview") => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, viewMode: mode } : t))
      );
    },
    []
  );

  const toggleNodeExpanded = useCallback((nodeId: string) => {
    setRawTreeNodes((prev) => toggleExpanded(prev, nodeId));
  }, []);

  return (
    <ConfigTreeContext.Provider
      value={{
        tree,
        treeNodes,
        loading,
        error,
        tabs,
        activeTabId,
        filter,
        searchQuery,
        searchResults,
        inheritanceChain,
        rescan,
        scanProject,
        deleteFile,
        openFile,
        closeTab,
        setActiveTab: setActiveTabId,
        updateTabContent,
        saveTab,
        setFilter,
        setSearchQuery,
        showInheritance,
        clearInheritance,
        setViewMode,
        toggleNodeExpanded,
      }}
    >
      {children}
    </ConfigTreeContext.Provider>
  );
}

function toggleExpanded(
  nodes: TreeNodeData[],
  nodeId: string
): TreeNodeData[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children.length > 0) {
      return { ...node, children: toggleExpanded(node.children, nodeId) };
    }
    return node;
  });
}

export function useConfigTree() {
  return useContext(ConfigTreeContext);
}
