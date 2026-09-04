import type { CanvasItem, WindowCorner } from "./types";

export const MAX_OPENING_DIMENSION = 50000;
export const windowCorners: WindowCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

export const windowCornerPoint = (item: CanvasItem, corner: WindowCorner) => ({
  x: item.x + (corner.includes("right") ? item.inputWidth ?? 1500 : 0),
  y: item.y + (corner.includes("bottom") ? item.inputHeight ?? 1200 : 0),
});

export const realJoinedWindowGroup = (items: CanvasItem[], startId: string) => {
  const connected = new Set<string>([startId]);
  const pending = [startId];
  while (pending.length) {
    const currentId = pending.pop()!;
    items.forEach((item) => {
      if ((item.id === currentId || item.realJoinedWindowIds?.includes(currentId)) && !connected.has(item.id)) {
        connected.add(item.id);
        pending.push(item.id);
      }
      if (item.id === currentId) (item.realJoinedWindowIds ?? []).forEach((id) => {
        if (!connected.has(id)) {
          connected.add(id);
          pending.push(id);
        }
      });
    });
  }
  return connected;
};

export const allJoinedWindowGroup = (items: CanvasItem[], startId: string) => {
  const connected = new Set<string>([startId]);
  const pending = [startId];
  while (pending.length) {
    const currentId = pending.pop()!;
    items.forEach((item) => {
      const links = [...(item.joinedWindowIds ?? []), ...(item.realJoinedWindowIds ?? [])];
      if ((item.id === currentId || links.includes(currentId)) && !connected.has(item.id)) {
        connected.add(item.id);
        pending.push(item.id);
      }
      if (item.id === currentId) links.forEach((id) => {
        if (!connected.has(id)) {
          connected.add(id);
          pending.push(id);
        }
      });
    });
  }
  return connected;
};

export const joinedGroupBounds = (items: CanvasItem[], ids: Set<string>) => {
  const group = items.filter((item) => ids.has(item.id));
  const left = Math.min(...group.map((item) => item.x));
  const top = Math.min(...group.map((item) => item.y));
  const right = Math.max(...group.map((item) => item.x + (item.inputWidth ?? 1500)));
  const bottom = Math.max(...group.map((item) => item.y + (item.inputHeight ?? 1200)));
  return { width: right - left, height: bottom - top };
};

export const realJoinSegments = (items: CanvasItem[]) => {
  const segments: { id: string; x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  const drawn = new Set<string>();
  items.forEach((first) => (first.realJoinedWindowIds ?? []).forEach((secondId) => {
    const second = items.find((item) => item.id === secondId);
    if (!second) return;
    const id = [first.id, second.id].sort().join("-");
    if (drawn.has(id)) return;
    drawn.add(id);
    const firstRight = first.x + (first.inputWidth ?? 1500);
    const firstBottom = first.y + (first.inputHeight ?? 1200);
    const secondRight = second.x + (second.inputWidth ?? 1500);
    const secondBottom = second.y + (second.inputHeight ?? 1200);
    const verticalEdge = Math.abs(firstRight - second.x) <= 2 || Math.abs(secondRight - first.x) <= 2;
    const horizontalEdge = Math.abs(firstBottom - second.y) <= 2 || Math.abs(secondBottom - first.y) <= 2;
    if (verticalEdge) {
      const y1 = Math.max(first.y, second.y);
      const y2 = Math.min(firstBottom, secondBottom);
      if (y2 > y1) segments.push({ id, x1: Math.abs(firstRight - second.x) <= 2 ? (firstRight + second.x) / 2 : (secondRight + first.x) / 2, y1, x2: Math.abs(firstRight - second.x) <= 2 ? (firstRight + second.x) / 2 : (secondRight + first.x) / 2, y2, color: first.color ?? "#98c379" });
    } else if (horizontalEdge) {
      const x1 = Math.max(first.x, second.x);
      const x2 = Math.min(firstRight, secondRight);
      if (x2 > x1) segments.push({ id, x1, y1: Math.abs(firstBottom - second.y) <= 2 ? (firstBottom + second.y) / 2 : (secondBottom + first.y) / 2, x2, y2: Math.abs(firstBottom - second.y) <= 2 ? (firstBottom + second.y) / 2 : (secondBottom + first.y) / 2, color: first.color ?? "#98c379" });
    }
  }));
  return segments;
};
