import { useConfigTree } from "../../context/ConfigTreeContext";
import { TreeView } from "../tree/TreeView";
import { TreeFilter } from "../tree/TreeFilter";
import { TreeSearch } from "../tree/TreeSearch";

export function Sidebar() {
  const { loading, error, rescan, scanProject } = useConfigTree();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
          BUNCH
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={scanProject}
            className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Scan a project folder"
          >
            + Project
          </button>
          <button
            onClick={rescan}
            className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Scan all projects"
          >
            Scan All
          </button>
        </div>
      </div>

      <div className="px-3 py-2 space-y-2 border-b border-gray-200 dark:border-gray-800">
        <TreeSearch />
        <TreeFilter />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
            Scanning...
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && <TreeView />}
      </div>
    </div>
  );
}
