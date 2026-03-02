import { useConfigTree } from "../../context/ConfigTreeContext";
import type { AgentPlatform } from "../../types/config-tree";

const FILTERS = [
  { key: null, label: "All" },
  { key: "claudemd" as const, label: "CLAUDE.md" },
  { key: "settings" as const, label: "Settings" },
  { key: "agents" as const, label: "Agents" },
  { key: "commands" as const, label: "Commands" },
  { key: "instructions" as const, label: "Instructions" },
  { key: "cursorrules" as const, label: "Cursor Rules" },
];

const PLATFORMS: { key: AgentPlatform; label: string; color: string }[] = [
  { key: "Claude", label: "Claude", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700" },
  { key: "Codex", label: "Codex", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700" },
  { key: "Cursor", label: "Cursor", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700" },
  { key: "AgentSpec", label: "AGENT.md", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-300 dark:border-violet-700" },
];

export function TreeFilter() {
  const { filter, setFilter, platformFilter, togglePlatform } = useConfigTree();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key ?? "all"}
            onClick={() => setFilter(f.key)}
            className={`filter-pill ${filter === f.key ? "filter-pill-active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => togglePlatform(p.key)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
              platformFilter.has(p.key)
                ? p.color
                : "bg-transparent text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 hover:text-gray-600 dark:hover:text-gray-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
