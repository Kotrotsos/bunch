import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";
import { useZoom } from "../../context/ZoomContext";
import { useConfigTree } from "../../context/ConfigTreeContext";
import { getLanguageFromPath } from "../../lib/path-utils";
import type { EditorTab } from "../../types/config-tree";
import { useEffect, useRef } from "react";

interface MonacoEditorProps {
  tab: EditorTab;
}

export function MonacoEditorWrapper({ tab }: MonacoEditorProps) {
  const { theme } = useTheme();
  const { zoom } = useZoom();
  const { updateTabContent, saveTab } = useConfigTree();
  const editorRef = useRef<unknown>(null);

  const language = getLanguageFromPath(tab.path);
  const fontSize = Math.round(14 * zoom);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveTab(tab.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveTab, tab.id]);

  return (
    <Editor
      height="100%"
      language={language}
      value={tab.content}
      theme={theme === "dark" ? "vs-dark" : "light"}
      onChange={(value) => updateTabContent(tab.id, value ?? "")}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
        minimap: { enabled: false },
        lineNumbers: "on",
        wordWrap: "on",
        scrollBeyondLastLine: false,
        padding: { top: 8 },
        renderLineHighlight: "gutter",
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}
