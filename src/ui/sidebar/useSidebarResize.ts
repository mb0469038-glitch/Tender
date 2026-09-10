import { useState, useCallback, useRef } from "react";

const STORAGE_KEY = "ama_sidebar_width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 220;
const MAX_WIDTH = 480;

export function useSidebarResize(isCollapsed: boolean) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const startResizing = useCallback(
    (e: React.PointerEvent) => {
      if (isCollapsed) return;
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, moveEvent.clientX));
        setWidth(newWidth);
      };

      const onPointerUp = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          setIsDragging(false);
          setWidth((current) => {
            try {
              localStorage.setItem(STORAGE_KEY, String(current));
            } catch {
              // ignore
            }
            return current;
          });
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        document.body.style.removeProperty("user-select");
        document.body.style.removeProperty("cursor");
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [isCollapsed]
  );

  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    } catch {
      // ignore
    }
  }, []);

  return {
    width: isCollapsed ? 72 : width,
    isDragging,
    startResizing,
    resetWidth,
  };
}
