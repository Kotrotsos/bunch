import { useConfigTree } from "../../context/ConfigTreeContext";
import { EditorPanel } from "../editor/EditorPanel";
import { EditorTabs } from "../editor/EditorTabs";
import { InheritanceChain } from "../inheritance/InheritanceChain";

export function MainPanel() {
  const { tabs, activeTabId, inheritanceChain } = useConfigTree();

  if (inheritanceChain) {
    return (
      <div className="h-full flex flex-col">
        <InheritanceChain />
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <p className="text-lg font-medium">No file open</p>
          <p className="text-sm mt-1">
            Select a config file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="h-full flex flex-col">
      <EditorTabs />
      {activeTab && <EditorPanel tab={activeTab} />}
    </div>
  );
}
