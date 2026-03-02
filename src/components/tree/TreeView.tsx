import { useConfigTree } from "../../context/ConfigTreeContext";
import { TreeNode } from "./TreeNode";

export function TreeView() {
  const { treeNodes, searchResults, searchQuery } = useConfigTree();

  if (searchQuery.trim() && searchResults.length > 0) {
    return (
      <div className="py-1">
        <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
        </div>
        {searchResults.map((result) => (
          <SearchResultNode key={result.file.path} result={result} />
        ))}
      </div>
    );
  }

  if (searchQuery.trim() && searchResults.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No results found
      </div>
    );
  }

  return (
    <div className="py-1">
      {treeNodes.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

import type { SearchResult } from "../../types/config-tree";

function SearchResultNode({ result }: { result: SearchResult }) {
  const { openFile } = useConfigTree();

  return (
    <div>
      <button
        onClick={() => openFile(result.file)}
        className="w-full text-left px-3 py-1 text-sm tree-node-hover"
      >
        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
          {result.file.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {result.file.path}
        </div>
      </button>
      {result.matches.slice(0, 3).map((match, i) => (
        <div
          key={i}
          className="px-5 py-0.5 text-xs text-gray-600 dark:text-gray-400 truncate font-mono"
        >
          <span className="text-gray-400 dark:text-gray-600 mr-1">
            {match.lineNumber}:
          </span>
          {match.lineContent}
        </div>
      ))}
    </div>
  );
}
