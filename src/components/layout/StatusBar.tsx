import { useConfigTree } from "../../context/ConfigTreeContext";
import { useTheme } from "../../context/ThemeContext";
import { useZoom } from "../../context/ZoomContext";
import { shortenPath } from "../../lib/path-utils";
import { ThemeToggle } from "../settings/ThemeToggle";
import { ZoomControl } from "../settings/ZoomControl";

export function StatusBar() {
  const { tree, tabs, activeTabId, rescan } = useConfigTree();
  const { theme } = useTheme();
  const { zoom } = useZoom();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const projectCount = tree?.projects.length ?? 0;

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
        <span className="truncate flex-1">
          {shortenPath(activeTab.path)}
          {activeTab.isDirty && " *"}
        </span>
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
