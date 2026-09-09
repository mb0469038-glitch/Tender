export type OptimizationCut = {
  id: string;
  openingName: string;
  profileId: string;
  profileName: string;
  profileCode: string;
  length: number;
  quantity: number;
  angle: 45 | 90;
};

export type OptimizationPiece = {
  id: string;
  cutId: string;
  openingName: string;
  profileId: string;
  profileName: string;
  profileCode: string;
  length: number;
  used: number;
  angle: 45 | 90;
};

export type OptimizationBar = {
  id: string;
  profileId: string;
  profileName: string;
  profileCode: string;
  used: number;
  waste: number;
  pieces: OptimizationPiece[];
};

export type OptimizationResult = {
  stockLength: number;
  kerf: number;
  trim: number;
  arrangements: number;
  pieceCount: number;
  pieceLength: number;
  kerfTotal: number;
  trimTotal: number;
  material: number;
  waste: number;
  utilization: number;
  minimumProven: boolean;
  bars: OptimizationBar[];
};

export type StockLengthRecommendation = {
  length: number;
  result: OptimizationResult;
};

const tolerance = 0.000001;

const seededRandom = (seed: number) => () => {
  let value = seed += 0x6d2b79f5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const stableSeed = (value: string) => [...value].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619), 2166136261);

const score = (bars: OptimizationBar[]) => ({ count: bars.length, squaredWaste: bars.reduce((total, bar) => total + bar.waste ** 2, 0) });

const isBetter = (candidate: OptimizationBar[], current: OptimizationBar[]) => {
  const candidateScore = score(candidate);
  const currentScore = score(current);
  return candidateScore.count < currentScore.count || (candidateScore.count === currentScore.count && candidateScore.squaredWaste < currentScore.squaredWaste - tolerance);
};

const buildBars = (pieces: OptimizationPiece[], capacity: number, random?: () => number): OptimizationBar[] => {
  const remaining = [...pieces];
  const bars: OptimizationBar[] = [];
  while (remaining.length) {
    const pickIndex = random ? Math.floor(random() * Math.min(8, remaining.length)) : 0;
    const piece = remaining.splice(pickIndex, 1)[0];
    const feasible = bars
      .map((bar, index) => ({ bar, index, leftover: capacity - bar.used - piece.used }))
      .filter(({ leftover }) => leftover >= -tolerance)
      .sort((left, right) => left.leftover - right.leftover)
      .slice(0, random ? 4 : 1);
    const selected = feasible.length ? feasible[random && random() >= .82 ? Math.floor(random() * feasible.length) : 0].bar : undefined;
    if (selected) {
      selected.pieces.push(piece);
      selected.used += piece.used;
      selected.waste = capacity - selected.used;
    } else {
      bars.push({
        id: `${piece.profileId}-${bars.length + 1}`,
        profileId: piece.profileId,
        profileName: piece.profileName,
        profileCode: piece.profileCode,
        used: piece.used,
        waste: capacity - piece.used,
        pieces: [piece],
      });
    }
  }
  return bars.map((bar) => ({ ...bar, pieces: [...bar.pieces].sort((left, right) => right.length - left.length) }));
};

const verify = (bars: OptimizationBar[], pieces: OptimizationPiece[], capacity: number) => {
  const ids = new Set<string>();
  bars.forEach((bar) => {
    const used = bar.pieces.reduce((total, piece) => total + piece.used, 0);
    if (used > capacity + tolerance) throw new Error(`Optimization error: ${bar.profileCode || bar.profileName} exceeds the available stock length.`);
    if (bar.pieces.some((piece) => piece.profileId !== bar.profileId)) throw new Error("Optimization error: different profiles were mixed on one bar.");
    bar.pieces.forEach((piece) => ids.add(piece.id));
  });
  if (ids.size !== pieces.length) throw new Error("Optimization error: a requested cut was lost or duplicated.");
};

export const optimizeCuts = ({ stockLength, kerf, trim, cuts, arrangements = 1000 }: { stockLength: number; kerf: number; trim: number; cuts: OptimizationCut[]; arrangements?: number }): OptimizationResult => {
  if (!Number.isFinite(stockLength) || stockLength <= 0) throw new Error("Enter a valid stock length in millimeters.");
  if (!Number.isFinite(kerf) || kerf < 0) throw new Error("Saw kerf must be zero or greater.");
  if (!Number.isFinite(trim) || trim < 0 || trim >= stockLength) throw new Error("End trim must be smaller than the stock length.");
  const capacity = stockLength - trim;
  const pieces = cuts.flatMap((cut) => {
    if (!cut.profileId) throw new Error("Choose a profile for every cutting row.");
    if (!Number.isFinite(cut.length) || cut.length <= 0) throw new Error("Every cut length must be greater than zero.");
    if (!Number.isFinite(cut.quantity) || cut.quantity < 1) throw new Error("Every cut quantity must be at least one.");
    const used = cut.length + kerf;
    if (used > capacity + tolerance) throw new Error(`${cut.profileCode || cut.profileName} has a cut longer than the available stock length.`);
    return Array.from({ length: Math.floor(cut.quantity) }, (_, index): OptimizationPiece => ({
      id: `${cut.id}-${index + 1}`,
      cutId: cut.id,
      openingName: cut.openingName,
      profileId: cut.profileId,
      profileName: cut.profileName,
      profileCode: cut.profileCode,
      length: cut.length,
      used,
      angle: cut.angle,
    }));
  });
  if (!pieces.length) throw new Error("Add at least one required cut before optimizing.");

  const bars = [...pieces
    .reduce((groups, piece) => {
      const group = groups.get(piece.profileId) ?? [];
      group.push(piece);
      groups.set(piece.profileId, group);
      return groups;
    }, new Map<string, OptimizationPiece[]>())
    .values()]
    .flatMap((profilePieces) => {
      const ordered = [...profilePieces].sort((left, right) => right.used - left.used || left.id.localeCompare(right.id));
      let best = buildBars(ordered, capacity);
      const lowerBound = Math.max(1, Math.ceil(ordered.reduce((total, piece) => total + piece.used, 0) / capacity - tolerance));
      const random = seededRandom(stableSeed(`${ordered[0].profileId}:${ordered.length}`));
      for (let arrangement = 2; arrangement <= Math.max(1, Math.floor(arrangements)) && best.length > lowerBound; arrangement += 1) {
        const candidate = buildBars(ordered, capacity, random);
        if (isBetter(candidate, best)) best = candidate;
      }
      return best;
    })
    .sort((left, right) => left.profileCode.localeCompare(right.profileCode) || right.used - left.used)
    .map((bar, index) => ({ ...bar, id: `bar-${index + 1}` }));

  verify(bars, pieces, capacity);
  const pieceLength = pieces.reduce((total, piece) => total + piece.length, 0);
  const material = bars.length * stockLength;
  const kerfTotal = pieces.length * kerf;
  const trimTotal = bars.length * trim;
  const waste = material - pieceLength - kerfTotal - trimTotal;
  const lowerBoundByProfile = [...pieces.reduce((groups, piece) => {
    const group = groups.get(piece.profileId) ?? [];
    group.push(piece);
    groups.set(piece.profileId, group);
    return groups;
  }, new Map<string, OptimizationPiece[]>()).values()].reduce((total, group) => total + Math.ceil(group.reduce((sum, piece) => sum + piece.used, 0) / capacity - tolerance), 0);
  return { stockLength, kerf, trim, arrangements: Math.max(1, Math.floor(arrangements)), pieceCount: pieces.length, pieceLength, kerfTotal, trimTotal, material, waste, utilization: material ? pieceLength / material * 100 : 0, minimumProven: bars.length === lowerBoundByProfile, bars };
};

export const recommendStockLength = ({ minimum, maximum, increment, kerf, trim, cuts }: { minimum: number; maximum: number; increment: number; kerf: number; trim: number; cuts: OptimizationCut[] }): StockLengthRecommendation | undefined => {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || !Number.isFinite(increment) || increment <= 0 || minimum > maximum) throw new Error("Enter a valid stock-length range.");
  const candidates: StockLengthRecommendation[] = [];
  for (let length = minimum; length <= maximum + tolerance; length += increment) {
    try { candidates.push({ length, result: optimizeCuts({ stockLength: length, kerf, trim, cuts, arrangements: 1 }) }); } catch { /* A cut does not fit this candidate length. */ }
  }
  return candidates.sort((left, right) => left.result.material - right.result.material || left.result.bars.length - right.result.bars.length || left.result.waste - right.result.waste || left.length - right.length)[0];
};
