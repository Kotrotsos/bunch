import { useConfigTree } from "../../context/ConfigTreeContext";
import { useTheme } from "../../context/ThemeContext";
import { useZoom } from "../../context/ZoomContext";
import { shortenPath } from "../../lib/path-utils";
import { ThemeToggle } from "../settings/ThemeToggle";
import { ZoomControl } from "../settings/ZoomControl";

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English/code
  return Math.ceil(text.length / 4);
}

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function StatusBar() {
  const { tree, tabs, activeTabId, rescan } = useConfigTree();
  const { theme } = useTheme();
  const { zoom } = useZoom();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const projectCount = tree?.projects.length ?? 0;

  const fileStats = activeTab
    ? {
        tokens: estimateTokens(activeTab.content),
        paragraphs: countParagraphs(activeTab.content),
        size: formatSize(new TextEncoder().encode(activeTab.content).length),
        lines: activeTab.content.split("\n").length,
      }
    : null;

  return (
    <div className="h-7 flex items-center px-3 text-xs bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 gap-4 flex-shrink-0">
      <button
        onClick={rescan}
        className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        title="Rescan configs"
      >
        Rescan
      </button>

      <span>{projectCount} projects</span>

      {tree && <span>{tree.scanTimeMs}ms</span>}

      {activeTab && (
        <span className="truncate">
          {shortenPath(activeTab.path)}
          {activeTab.isDirty && " *"}
        </span>
      )}

      {fileStats && (
        <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
          <span>{fileStats.size}</span>
          <span>{fileStats.lines} lines</span>
          <span>{fileStats.paragraphs} paragraphs</span>
          <span title="Estimated tokens (~4 chars/token)">
            ~{fileStats.tokens.toLocaleString()} tokens
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <ZoomControl />
        <span>{Math.round(zoom * 100)}%</span>
        <ThemeToggle />
        <span className="uppercase">{theme}</span>
      </div>
    </div>
  );
}
