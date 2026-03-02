import { useConfigTree } from "../../context/ConfigTreeContext";

export function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useConfigTree();

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-x-auto flex-shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-r border-gray-200 dark:border-gray-800 ${
            tab.id === activeTabId
              ? "tab-active bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="truncate max-w-[150px]">
            {tab.name}
            {tab.isDirty && (
              <span className="ml-1 text-amber-500">*</span>
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="ml-1 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity rounded"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
