import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface ZoomContextValue {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const ZoomContext = createContext<ZoomContextValue>({
  zoom: 1,
  zoomIn: () => {},
  zoomOut: () => {},
  resetZoom: () => {},
});

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(() => {
    const stored = localStorage.getItem("bunch-zoom");
    return stored ? parseFloat(stored) : 1;
  });

  useEffect(() => {
    localStorage.setItem("bunch-zoom", String(zoom));
    document.documentElement.style.fontSize = `${zoom * 16}px`;
  }, [zoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          zoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <ZoomContext.Provider value={{ zoom, zoomIn, zoomOut, resetZoom }}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  return useContext(ZoomContext);
}
