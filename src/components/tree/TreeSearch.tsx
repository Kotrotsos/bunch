import { useConfigTree } from "../../context/ConfigTreeContext";

export function TreeSearch() {
  const { searchQuery, setSearchQuery } = useConfigTree();

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search configs..."
      className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
    />
  );
}
