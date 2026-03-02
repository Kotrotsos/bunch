import { useConfigTree } from "../../context/ConfigTreeContext";
import { TreeView } from "../tree/TreeView";
import { TreeFilter } from "../tree/TreeFilter";
import { TreeSearch } from "../tree/TreeSearch";

export function Sidebar() {
  const { loading, error } = useConfigTree();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
          BUNCH
        </h1>
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
