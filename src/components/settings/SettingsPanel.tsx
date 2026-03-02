import { useTheme } from "../../context/ThemeContext";
import { useZoom } from "../../context/ZoomContext";

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Settings
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "light" ? "Switch to Dark" : "Switch to Light"}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zoom ({Math.round(zoom * 100)}%)
          </label>
          <div className="flex gap-2">
            <button onClick={zoomOut} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-700">
              -
            </button>
            <button onClick={resetZoom} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-700">
              Reset
            </button>
            <button onClick={zoomIn} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-700">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
