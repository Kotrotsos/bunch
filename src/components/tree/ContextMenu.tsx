import { useEffect, useRef } from "react";

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 50,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
            item.danger
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
