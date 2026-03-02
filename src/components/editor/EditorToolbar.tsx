import { useConfigTree } from "../../context/ConfigTreeContext";
import { shortenPath } from "../../lib/path-utils";
import type { EditorTab } from "../../types/config-tree";

interface EditorToolbarProps {
  tab: EditorTab;
}

const isMarkdown = (tab: EditorTab) =>
  tab.fileType === "ClaudeMd" ||
  tab.fileType === "AgentMd" ||
  tab.fileType === "CommandMd";

export function EditorToolbar({ tab }: EditorToolbarProps) {
  const { saveTab, setViewMode } = useConfigTree();

  return (
    <div className="flex items-center px-3 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm flex-shrink-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 font-mono">
        {shortenPath(tab.path)}
      </span>

      {isMarkdown(tab) && (
        <div className="flex gap-1 mr-3">
          {(["raw", "split", "preview"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(tab.id, mode)}
              className={`px-2 py-0.5 text-xs rounded ${
                tab.viewMode === mode
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {mode === "raw" ? "Raw" : mode === "split" ? "Split" : "Preview"}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => saveTab(tab.id)}
        disabled={!tab.isDirty}
        className={`px-3 py-0.5 text-xs rounded ${
          tab.isDirty
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        }`}
      >
        Save
      </button>
    </div>
  );
}
