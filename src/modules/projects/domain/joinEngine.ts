import type { Assembly, CanvasItem, WindowCorner } from "../../../domain/types";
import {
  allJoinedWindowGroup,
  joinedGroupBounds,
  realJoinedWindowGroup,
  windowCornerPoint,
  windowCorners,
} from "../../../domain/windowJoins";

/**
 * The window-joining / canvas-geometry engine: deciding when two openings can
 * form a "Real" join (structurally continuous, matching frame type) versus a
 * "Fake"/combination join (visually grouped only), and keeping the join graph
 * consistent as canvas items are added, moved, resized, or deleted.
 *
 * Relocated out of `App.tsx` (previously closures over `assemblies`/`project`
 * state) as part of Phase 2 of the modular-monolith refactor — see
 * docs/architecture/OVERVIEW.md. Every function here is pure: given the same
 * arguments, it returns the same result, with no React state of its own.
 *
 * `frameTypeForItem`-shaped logic is intentionally NOT implemented here: it
 * needs the full materials-aware formula-values bag (see
 * `modules/costing/domain/quantityEngine.ts`), which itself needs
 * `joinedSidesForItem`/`joinLengthForItem` from this file. To avoid a
 * circular module dependency, `realJoinCheck`/`reconcileRealJoins`/
 * `recheckCombinationJoins` take a `frameTypeForItem` resolver as an
 * explicit parameter instead of importing one — the caller (today, a thin
 * wrapper in `App.tsx`) composes both engines together.
 */

/** Must match the `TECHNAL_FYN_DATABASE` constant in App.tsx. */
const TECHNAL_FYN_DATABASE_ID = "technal-fyn";

export type FrameTypeResolver = (item: CanvasItem) => string | null;

export const isFynOpening = (item: CanvasItem, assemblies: Assembly[]) =>
  assemblies.find((assembly) => assembly.id === item.sourceId)?.databaseId === TECHNAL_FYN_DATABASE_ID;

export const realJoinCheck = (
  source: CanvasItem,
  target: CanvasItem,
  sourceCorner: WindowCorner,
  targetCorner: WindowCorner,
  canvasItems: CanvasItem[],
  assemblies: Assembly[],
  frameTypeForItem: FrameTypeResolver,
) => {
  const sourceGroup = realJoinedWindowGroup(canvasItems, source.id);
  const targetGroup = realJoinedWindowGroup(canvasItems, target.id);
  if ([...sourceGroup].some((id) => targetGroup.has(id))) return { valid: false, message: "These openings are already in the same real-join group." };
  const groupItems = canvasItems;
  if (![...sourceGroup, ...targetGroup].every((id) => isFynOpening(groupItems.find((item) => item.id === id)!, assemblies))) return { valid: false, message: "Real joins are allowed only between FYn openings." };
  const groupFrameTypes = (ids: Set<string>) => new Set([...ids].map((id) => {
    const item = groupItems.find((value) => value.id === id);
    return item ? frameTypeForItem(item) : null;
  }));
  const sourceFrameTypes = groupFrameTypes(sourceGroup);
  const targetFrameTypes = groupFrameTypes(targetGroup);
  if (sourceFrameTypes.has(null) || targetFrameTypes.has(null)) return { valid: false, message: "Define a matching Frame type for every opening before making a Real join." };
  if (sourceFrameTypes.size !== 1 || targetFrameTypes.size !== 1 || [...sourceFrameTypes][0] !== [...targetFrameTypes][0]) return { valid: false, message: "Real joins need the same Frame type." };
  const sourceHorizontal = sourceCorner.endsWith("left") ? "left" : "right";
  const targetHorizontal = targetCorner.endsWith("left") ? "left" : "right";
  const sourceVertical = sourceCorner.startsWith("top") ? "top" : "bottom";
  const targetVertical = targetCorner.startsWith("top") ? "top" : "bottom";
  const horizontalJoin = sourceHorizontal !== targetHorizontal;
  const verticalJoin = sourceVertical !== targetVertical;
  if (horizontalJoin === verticalJoin) return { valid: false, message: "A real join must connect matching full sides, not diagonal corners." };
  const groupRect = (ids: Set<string>) => {
    const members = [...ids].map((id) => groupItems.find((item) => item.id === id)!).filter(Boolean);
    const left = Math.min(...members.map((item) => item.x));
    const top = Math.min(...members.map((item) => item.y));
    const right = Math.max(...members.map((item) => item.x + (item.inputWidth ?? 1500)));
    const bottom = Math.max(...members.map((item) => item.y + (item.inputHeight ?? 1200)));
    return { left, top, right, bottom };
  };
  const sourceRect = groupRect(sourceGroup);
  const targetRect = groupRect(targetGroup);
  const fullSideAligned = horizontalJoin
    ? Math.abs((sourceHorizontal === "right" ? sourceRect.right : sourceRect.left) - (targetHorizontal === "right" ? targetRect.right : targetRect.left)) <= 1
      && Math.abs(sourceRect.top - targetRect.top) <= 1 && Math.abs(sourceRect.bottom - targetRect.bottom) <= 1
    : Math.abs((sourceVertical === "bottom" ? sourceRect.bottom : sourceRect.top) - (targetVertical === "bottom" ? targetRect.bottom : targetRect.top)) <= 1
      && Math.abs(sourceRect.left - targetRect.left) <= 1 && Math.abs(sourceRect.right - targetRect.right) <= 1;
  if (!fullSideAligned) return { valid: false, message: "Align the complete side of both openings before creating a Real join." };
  const sourceBounds = joinedGroupBounds(groupItems, sourceGroup);
  const targetBounds = joinedGroupBounds(groupItems, targetGroup);
  const requiredMatch: [number, number, "height" | "width"] = horizontalJoin
    ? [sourceBounds.height, targetBounds.height, "height"]
    : [sourceBounds.width, targetBounds.width, "width"];
  if (Math.abs(requiredMatch[0] - requiredMatch[1]) > 1) return { valid: false, message: `Real ${horizontalJoin ? "left/right" : "top/bottom"} joins need the same ${requiredMatch[2]} (±1 mm).` };
  return { valid: true, message: `Valid real join: matching ${[...sourceFrameTypes][0]} frame type, ${requiredMatch[2]}, and FYn series.` };
};

export const fullSideTouching = (first: CanvasItem, second: CanvasItem) => {
  const firstRight = first.x + (first.inputWidth ?? 1500);
  const firstBottom = first.y + (first.inputHeight ?? 1200);
  const secondRight = second.x + (second.inputWidth ?? 1500);
  const secondBottom = second.y + (second.inputHeight ?? 1200);
  const vertical = (Math.abs(firstRight - second.x) <= 1 || Math.abs(secondRight - first.x) <= 1)
    && Math.min(firstBottom, secondBottom) - Math.max(first.y, second.y) > 1;
  const horizontal = (Math.abs(firstBottom - second.y) <= 1 || Math.abs(secondBottom - first.y) <= 1)
    && Math.min(firstRight, secondRight) - Math.max(first.x, second.x) > 1;
  return vertical || horizontal;
};

export const combinationTouching = (first: CanvasItem, second: CanvasItem) => fullSideTouching(first, second)
  || windowCorners.some((firstCorner) => windowCorners.some((secondCorner) => {
    const firstPoint = windowCornerPoint(first, firstCorner);
    const secondPoint = windowCornerPoint(second, secondCorner);
    return Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y) <= 1;
  }));

export const reconcileRealJoins = (items: CanvasItem[], assemblies: Assembly[], frameTypeForItem: FrameTypeResolver) => {
  const touchingOnly = items.map((item) => ({
    ...item,
    realJoinedWindowIds: (item.realJoinedWindowIds ?? []).filter((joinedId) => {
      const joined = items.find((value) => value.id === joinedId);
      if (!joined || !fullSideTouching(item, joined) || !isFynOpening(item, assemblies) || !isFynOpening(joined, assemblies)) return false;
      const itemFrameType = frameTypeForItem(item);
      const joinedFrameType = frameTypeForItem(joined);
      return Boolean(itemFrameType && itemFrameType === joinedFrameType);
    }),
  }));
  return touchingOnly.map((item) => {
    const group = realJoinedWindowGroup(touchingOnly, item.id);
    const touchingGroupMembers = [...group].filter((id) => {
      if (id === item.id) return false;
      const joined = touchingOnly.find((value) => value.id === id);
      return Boolean(joined && fullSideTouching(item, joined));
    });
    return { ...item, realJoinedWindowIds: [...new Set(touchingGroupMembers)] };
  });
};

export const recheckCombinationJoins = (items: CanvasItem[], assemblies: Assembly[], frameTypeForItem: FrameTypeResolver) => {
  // Existing valid Real joins are authoritative.  Do not erase and rebuild them
  // from the unordered combination pairs: that allowed a later join to replace
  // the first Real join when several combinations touched at the same time.
  const preservedRealJoins = reconcileRealJoins(items, assemblies, frameTypeForItem);
  const existingIds = new Set(items.map((item) => item.id));
  const joinedPairs = new Set<string>();
  items.forEach((item) => [...(item.joinedWindowIds ?? []), ...(item.realJoinedWindowIds ?? [])].forEach((joinedId) => {
    if (!existingIds.has(joinedId) || joinedId === item.id) return;
    const joined = items.find((value) => value.id === joinedId);
    if (joined && combinationTouching(item, joined)) joinedPairs.add([item.id, joinedId].sort().join("|"));
  }));
  const normalized: CanvasItem[] = items.map((item) => ({
    ...item,
    joinedWindowIds: [...joinedPairs].flatMap((pair) => pair.split("|").includes(item.id) ? pair.split("|").filter((id) => id !== item.id) : []),
    realJoinedWindowIds: preservedRealJoins.find((value) => value.id === item.id)?.realJoinedWindowIds ?? [],
  }));
  let classified = normalized;
  let addedRealJoin = true;
  while (addedRealJoin) {
    addedRealJoin = false;
    for (const pair of joinedPairs) {
      const [firstId, secondId] = pair.split("|");
      const first = classified.find((item) => item.id === firstId);
      const second = classified.find((item) => item.id === secondId);
      if (!first || !second || realJoinedWindowGroup(classified, first.id).has(second.id)) continue;
      const matchingCorners = windowCorners.flatMap((firstCorner) => windowCorners.map((secondCorner) => ({
        firstCorner,
        secondCorner,
        firstPoint: windowCornerPoint(first, firstCorner),
        secondPoint: windowCornerPoint(second, secondCorner),
      }))).filter(({ firstPoint, secondPoint }) => Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y) <= 1);
      const canBeReal = matchingCorners.some(({ firstCorner, secondCorner }) => realJoinCheck(first, second, firstCorner, secondCorner, classified, assemblies, frameTypeForItem).valid);
      if (!canBeReal) continue;
      classified = classified.map((item) => item.id === first.id
        ? { ...item, realJoinedWindowIds: [...new Set([...(item.realJoinedWindowIds ?? []), second.id])] }
        : item.id === second.id
          ? { ...item, realJoinedWindowIds: [...new Set([...(item.realJoinedWindowIds ?? []), first.id])] }
          : item);
      addedRealJoin = true;
    }
  }
  return reconcileRealJoins(classified, assemblies, frameTypeForItem);
};

/** Fixed catalogue of canvas-item properties an assembly can declare as
 * "shared across a joined group" (see `Assembly.realJoinPropertyMatches`/
 * `fakeJoinPropertyMatches` in domain/types.ts). */
export const JOIN_MATCH_PROPERTIES = [
  { value: "leaves", label: "Number of leaves" },
  { value: "openingType", label: "Opening type" },
  { value: "leafSize", label: "Leaf size" },
  { value: "frameSize", label: "Frame size" },
  { value: "hasArchitrave", label: "Architrave" },
  { value: "hasArchitraveAllowance", label: "Architrave allowance" },
  { value: "reinforced", label: "Reinforcement" },
  { value: "hasCoating", label: "Coating" },
] as const;
export const joinMatchPropertyKeys = new Set<string>(JOIN_MATCH_PROPERTIES.map((property) => property.value));

/** Must match the assembly-page id constants of the same name in App.tsx. */
const TWO_RAIL_WINDOW_PAGE = "two-rail-window";
const FLY_SCREEN_PAGE = "fly-screen";
const HINGE_WINDOW_PAGE = "hinge-window";
const FIXED_WINDOW_PAGE = "fixed-window";
const TILT_AND_TURN_PAGE = "tilt-and-turn";

export const joinMatchPropertiesForAssembly = (assemblyPage?: string, assemblyId?: string) => {
  const page = assemblyPage ?? (assemblyId === "fly-screen-2rail" ? FLY_SCREEN_PAGE : undefined);
  const propertyNames = page === FLY_SCREEN_PAGE
    ? ["hasCoating"]
    : page === TWO_RAIL_WINDOW_PAGE
      ? ["leaves", "openingType", "hasArchitrave", "reinforced", "hasArchitraveAllowance", "hasCoating"]
      : page === HINGE_WINDOW_PAGE
        ? ["leaves", "openingType", "leafSize", "frameSize", "hasArchitrave", "reinforced", "hasArchitraveAllowance", "hasCoating"]
        : page === FIXED_WINDOW_PAGE || page === TILT_AND_TURN_PAGE
          ? ["leafSize", "frameSize", "hasArchitrave", "reinforced", "hasArchitraveAllowance", "hasCoating"]
          : JOIN_MATCH_PROPERTIES.map((property) => property.value);
  return JOIN_MATCH_PROPERTIES.filter((property) => propertyNames.includes(property.value));
};

export const synchronizeCombinationDetails = (items: CanvasItem[], assemblies: Assembly[]) => {
  const groupByItemId = new Map<string, { reference?: number; combinationName?: string; quantity: number }>();
  const matchedPropertiesByItemId = new Map<string, Partial<CanvasItem>>();
  const visited = new Set<string>();
  items.forEach((item) => {
    if (visited.has(item.id)) return;
    const group = allJoinedWindowGroup(items, item.id);
    group.forEach((id) => visited.add(id));
    if (group.size < 2) return;
    const members = items.filter((candidate) => group.has(candidate.id));
    const references = members.map((member) => member.reference).filter((reference): reference is number => typeof reference === "number" && reference > 0);
    const reference = references.length ? Math.min(...references) : undefined;
    const combinationName = members.map((member) => member.combinationName?.trim()).find(Boolean);
    // A combination is supplied as one unit, so every joined opening shares Qty.
    const quantity = Math.max(1, Math.round(members[0]?.quantity ?? 1));
    members.forEach((member) => groupByItemId.set(member.id, {
      reference,
      combinationName,
      quantity,
    }));
  });
  (["real", "fake"] as const).forEach((kind) => {
    const linksFor = (item: CanvasItem) => kind === "real" ? item.realJoinedWindowIds ?? [] : item.joinedWindowIds ?? [];
    const rulesFor = (item: CanvasItem) => {
      const assembly = assemblies.find((value) => value.id === item.sourceId);
      return kind === "real" ? assembly?.realJoinPropertyMatches ?? [] : assembly?.fakeJoinPropertyMatches ?? [];
    };
    joinMatchPropertyKeys.forEach((property) => {
      const seen = new Set<string>();
      items.forEach((start) => {
        if (seen.has(start.id)) return;
        const component = new Set<string>();
        const pending = [start.id];
        while (pending.length) {
          const currentId = pending.pop()!;
          if (component.has(currentId)) continue;
          component.add(currentId);
          seen.add(currentId);
          const current = items.find((item) => item.id === currentId);
          if (!current) continue;
          linksFor(current).forEach((neighbourId) => {
            const neighbour = items.find((item) => item.id === neighbourId);
            if (!neighbour) return;
            const currentMatches = rulesFor(current).some((rule) => rule.property === property && rule.withAssemblyIds.includes(neighbour.sourceId));
            const neighbourMatches = rulesFor(neighbour).some((rule) => rule.property === property && rule.withAssemblyIds.includes(current.sourceId));
            if (currentMatches || neighbourMatches) pending.push(neighbourId);
          });
        }
        if (component.size < 2) return;
        // A match must converge on one value.  The lowest drawing reference is
        // the stable authority when the join is first made; later edits are
        // propagated directly by updateRealJoinSettings/updateCombinationGlazedSettings.
        const members = items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => component.has(item.id))
          .sort((first, second) => (first.item.reference ?? Number.MAX_SAFE_INTEGER) - (second.item.reference ?? Number.MAX_SAFE_INTEGER) || first.index - second.index);
        const value = members[0]?.item[property as keyof CanvasItem];
        members.forEach(({ item }) => {
          matchedPropertiesByItemId.set(item.id, { ...matchedPropertiesByItemId.get(item.id), [property]: value });
        });
      });
    });
  });
  return items.map((item) => {
    const details = groupByItemId.get(item.id);
    const matchedProperties = matchedPropertiesByItemId.get(item.id);
    return details || matchedProperties ? { ...item, ...details, ...matchedProperties } : item;
  });
};

export const normalizeCombinationReferences = (items: CanvasItem[]) => {
  const visited = new Set<string>();
  const groups: { ids: Set<string>; firstIndex: number; reference: number }[] = [];
  items.forEach((item, firstIndex) => {
    if (visited.has(item.id)) return;
    const ids = allJoinedWindowGroup(items, item.id);
    ids.forEach((id) => visited.add(id));
    const references = items.filter((candidate) => ids.has(candidate.id)).map((candidate) => candidate.reference).filter((reference): reference is number => typeof reference === "number" && Number.isSafeInteger(reference) && reference > 0);
    groups.push({ ids, firstIndex, reference: references.length ? Math.min(...references) : Number.MAX_SAFE_INTEGER });
  });
  groups.sort((first, second) => first.reference - second.reference || first.firstIndex - second.firstIndex);
  const referenceByItemId = new Map<string, number>();
  groups.forEach((group, index) => group.ids.forEach((id) => referenceByItemId.set(id, index + 1)));
  return items.map((item) => ({ ...item, reference: referenceByItemId.get(item.id) ?? item.reference }));
};

export const joinedSidesForItem = (item: CanvasItem, allItems: CanvasItem[]) => [...new Set((item.realJoinedWindowIds ?? []).flatMap((joinedId) => {
  const joined = allItems.find((value) => value.id === joinedId);
  if (!joined) return [] as ("top" | "bottom" | "left" | "right")[];
  const right = item.x + (item.inputWidth ?? 1500);
  const bottom = item.y + (item.inputHeight ?? 1200);
  const joinedRight = joined.x + (joined.inputWidth ?? 1500);
  const joinedBottom = joined.y + (joined.inputHeight ?? 1200);
  if (Math.abs(item.x - joinedRight) <= 2) return ["left"] as const;
  if (Math.abs(right - joined.x) <= 2) return ["right"] as const;
  if (Math.abs(item.y - joinedBottom) <= 2) return ["top"] as const;
  if (Math.abs(bottom - joined.y) <= 2) return ["bottom"] as const;
  return [] as ("top" | "bottom" | "left" | "right")[];
}))];

export const joinLengthForItem = (item: CanvasItem, allItems: CanvasItem[]) => {
  const joinedIds = new Set([...(item.joinedWindowIds ?? []), ...(item.realJoinedWindowIds ?? [])]);
  const right = item.x + (item.inputWidth ?? 1500);
  const bottom = item.y + (item.inputHeight ?? 1200);
  return [...joinedIds].reduce((total, joinedId) => {
    const joined = allItems.find((value) => value.id === joinedId);
    if (!joined) return total;
    const joinedRight = joined.x + (joined.inputWidth ?? 1500);
    const joinedBottom = joined.y + (joined.inputHeight ?? 1200);
    const verticalEdge = Math.abs(right - joined.x) <= 2 || Math.abs(joinedRight - item.x) <= 2;
    if (verticalEdge) return total + Math.max(0, Math.min(bottom, joinedBottom) - Math.max(item.y, joined.y)) / 1000;
    const horizontalEdge = Math.abs(bottom - joined.y) <= 2 || Math.abs(joinedBottom - item.y) <= 2;
    if (horizontalEdge) return total + Math.max(0, Math.min(right, joinedRight) - Math.max(item.x, joined.x)) / 1000;
    return total;
  }, 0);
};
