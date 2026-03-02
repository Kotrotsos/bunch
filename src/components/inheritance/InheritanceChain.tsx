import { useConfigTree } from "../../context/ConfigTreeContext";
import { InheritanceNode } from "./InheritanceNode";

export function InheritanceChain() {
  const { inheritanceChain, clearInheritance } = useConfigTree();

  if (!inheritanceChain) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Inheritance Chain
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {inheritanceChain.projectName} &mdash;{" "}
            {inheritanceChain.projectPath}
          </p>
        </div>
        <button
          onClick={clearInheritance}
          className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>

      <div className="space-y-0">
        {inheritanceChain.levels.map((level, i) => (
          <div key={i}>
            <InheritanceNode level={level} />
            {i < inheritanceChain.levels.length - 1 && (
              <div className="flex flex-col items-center py-2">
                <div className="inheritance-arrow" />
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  inherits into
                </div>
                <div className="inheritance-arrow" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
