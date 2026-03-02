import { useConfigTree } from "../../context/ConfigTreeContext";
import type { InheritanceChainLevel } from "../../types/config-tree";

interface InheritanceNodeProps {
  level: InheritanceChainLevel;
}

export function InheritanceNode({ level }: InheritanceNodeProps) {
  const { openFile } = useConfigTree();

  const isGlobal = level.level === "Global";
  const borderColor = isGlobal
    ? "border-blue-300 dark:border-blue-700"
    : "border-green-300 dark:border-green-700";
  const bgColor = isGlobal
    ? "bg-blue-50 dark:bg-blue-950"
    : "bg-green-50 dark:bg-green-950";
  const headerColor = isGlobal
    ? "text-blue-700 dark:text-blue-300"
    : "text-green-700 dark:text-green-300";

  return (
    <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-4`}>
      <h3 className={`text-sm font-semibold ${headerColor} mb-3`}>
        {level.label}
      </h3>

      {level.files.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          No config files at this level
        </p>
      ) : (
        <div className="space-y-1">
          {level.files.map((file) => (
            <button
              key={file.path}
              onClick={() => openFile(file)}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors flex items-center gap-2"
            >
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {file.fileType === "ClaudeMd"
                  ? "MD"
                  : file.fileType === "AgentMd"
                    ? "AGT"
                    : file.fileType === "CommandMd"
                      ? "CMD"
                      : "SET"}
              </span>
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {file.name}
              </span>
              {file.size > 0 && (
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
                  {formatSize(file.size)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
