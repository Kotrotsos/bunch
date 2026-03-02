import type { EditorTab } from "../../types/config-tree";
import { EditorToolbar } from "./EditorToolbar";
import { MonacoEditorWrapper } from "./MonacoEditor";
import { MarkdownPreview } from "./MarkdownPreview";

interface EditorPanelProps {
  tab: EditorTab;
}

const isMarkdown = (tab: EditorTab) =>
  tab.fileType === "ClaudeMd" ||
  tab.fileType === "AgentMd" ||
  tab.fileType === "CommandMd";

export function EditorPanel({ tab }: EditorPanelProps) {
  const showMarkdownControls = isMarkdown(tab);
  const viewMode = showMarkdownControls ? tab.viewMode : "raw";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <EditorToolbar tab={tab} />

      <div className="flex-1 min-h-0">
        {viewMode === "raw" && (
          <MonacoEditorWrapper tab={tab} />
        )}

        {viewMode === "split" && (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-800">
              <MonacoEditorWrapper tab={tab} />
            </div>
            <div className="w-1/2">
              <MarkdownPreview content={tab.content} />
            </div>
          </div>
        )}

        {viewMode === "preview" && (
          <MarkdownPreview content={tab.content} />
        )}
      </div>
    </div>
  );
}
