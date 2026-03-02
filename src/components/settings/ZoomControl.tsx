import { useZoom } from "../../context/ZoomContext";

export function ZoomControl() {
  const { zoomIn, zoomOut, resetZoom } = useZoom();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={zoomOut}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-xs"
        title="Zoom out (Cmd+-)"
      >
        -
      </button>
      <button
        onClick={resetZoom}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-xs"
        title="Reset zoom (Cmd+0)"
      >
        0
      </button>
      <button
        onClick={zoomIn}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-xs"
        title="Zoom in (Cmd+=)"
      >
        +
      </button>
    </div>
  );
}
