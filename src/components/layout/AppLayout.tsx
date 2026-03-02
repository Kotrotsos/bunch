import { useCallback, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MainPanel } from "./MainPanel";
import { StatusBar } from "./StatusBar";

export function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("bunch-sidebar-width");
    return stored ? parseInt(stored, 10) : 300;
  });
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(600, Math.max(200, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem("bunch-sidebar-width", String(newWidth));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      <div className="flex-1 flex min-h-0">
        <div style={{ width: sidebarWidth }} className="flex-shrink-0">
          <Sidebar />
        </div>

        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <MainPanel />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
