import { useConfigTree } from "../../context/ConfigTreeContext";

const FILTERS = [
  { key: null, label: "All" },
  { key: "claudemd" as const, label: "CLAUDE.md" },
  { key: "settings" as const, label: "Settings" },
  { key: "agents" as const, label: "Agents" },
  { key: "commands" as const, label: "Commands" },
];

export function TreeFilter() {
  const { filter, setFilter } = useConfigTree();

  return (
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
  );
}
