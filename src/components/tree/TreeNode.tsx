import { useState, useCallback } from "react";
import { useConfigTree } from "../../context/ConfigTreeContext";
import { showInFolder } from "../../lib/tauri-commands";
import { ContextMenu } from "./ContextMenu";
import type { TreeNodeData, AgentOwner } from "../../types/config-tree";

interface ContextMenuState {
  x: number;
  y: number;
  filePath: string;
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  ClaudeMd: "M",
  SettingsJson: "S",
  SettingsLocalJson: "S",
  AgentMd: "A",
  CommandMd: "C",
};

const FILE_TYPE_COLORS: Record<string, string> = {
  ClaudeMd: "text-blue-500",
  SettingsJson: "text-amber-500",
  SettingsLocalJson: "text-amber-600",
  AgentMd: "text-purple-500",
  CommandMd: "text-green-500",
};

const OWNER_COLORS: Record<AgentOwner, string> = {
  Claude: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Codex: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cursor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Windsurf: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  Antigravity: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  User: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function TreeNode({ node, depth }: TreeNodeProps) {
  const { openFile, deleteFile, showInheritance, toggleNodeExpanded } =
    useConfigTree();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
    null
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, filePath: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, filePath });
    },
    []
  );

  const paddingLeft = depth * 16 + 8;

  if (node.type === "file" && node.configFile) {
    const fileType = node.configFile.fileType;
    const icon = FILE_TYPE_ICONS[fileType] || "?";
    const color = FILE_TYPE_COLORS[fileType] || "text-gray-500";
    const filePath = node.configFile.path;

    const owner = node.configFile.owner;

    return (
      <>
        <button
          onClick={() => openFile(node.configFile!)}
          onContextMenu={(e) => handleContextMenu(e, filePath)}
          className="w-full text-left py-1 pr-2 text-sm tree-node-hover flex items-center gap-2"
          style={{ paddingLeft }}
        >
          <span
            className={`w-4 h-4 flex items-center justify-center text-xs font-bold rounded ${color}`}
          >
            {icon}
          </span>
          <span className="truncate text-gray-700 dark:text-gray-300">
            {node.label}
          </span>
          {owner && owner !== "User" && (
            <span
              className={`ml-auto shrink-0 px-1.5 py-0 text-[10px] font-medium rounded ${OWNER_COLORS[owner]}`}
            >
              {owner}
            </span>
          )}
        </button>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              {
                label: "Show in Enclosing Folder",
                onClick: () => showInFolder(contextMenu.filePath),
              },
              {
                label: "Delete",
                danger: true,
                onClick: () => deleteFile(contextMenu.filePath),
              },
            ]}
          />
        )}
      </>
    );
  }

  const isExpandable = node.children.length > 0;
  const chevron = node.expanded ? "\u25BE" : "\u25B8";

  return (
    <div>
      <button
        onClick={() => toggleNodeExpanded(node.id)}
        onDoubleClick={() => {
          if (node.type === "project" && node.project) {
            showInheritance(node.project.path);
          }
        }}
        className="w-full text-left py-1 pr-2 text-sm tree-node-hover flex items-center gap-1"
        style={{ paddingLeft }}
      >
        {isExpandable && (
          <span className="w-4 text-center text-gray-400 dark:text-gray-500 text-xs">
            {chevron}
          </span>
        )}
        <span
          className={`truncate font-medium ${
            node.type === "root"
              ? "text-gray-800 dark:text-gray-200"
              : node.type === "group"
                ? "text-gray-600 dark:text-gray-400"
                : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {node.label}
        </span>
        {node.type === "project" && node.project && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
            {node.project.files.length}
          </span>
        )}
      </button>

      {node.expanded &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
