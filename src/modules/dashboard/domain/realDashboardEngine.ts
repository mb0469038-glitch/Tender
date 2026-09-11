import type {
  RealDashboardSummary,
  RealOpeningItem,
  RealProjectSummary,
  RealSystemShare,
  RealCatalogCategory,
} from "./dashboardTypes";

export function getSystemDisplayName(sourceId?: string, assemblyPage?: string): string {
  const page = (assemblyPage || "").toLowerCase();
  const id = (sourceId || "").toLowerCase();

  if (page === "two-rail-window" || id.includes("2rail") || id.includes("slider")) {
    return "Soleal GYn 2-Rail System";
  }
  if (page === "tilt-and-turn" || id.includes("tilt")) {
    return "Soleal FYn Tilt & Turn";
  }
  if (page === "fixed-window" || id.includes("fixed")) {
    return "Soleal FYn Fixed Window";
  }
  if (page === "hinge-window" || id.includes("hinge")) {
    return "Soleal FYn Hinged Window";
  }
  if (page === "fly-screen" || id.includes("fly")) {
    return "Soleal GYn Fly Screen";
  }
  return "Soleal Aluminum System";
}

const SYSTEM_COLORS: Record<string, string> = {
  "Soleal GYn 2-Rail System": "#0B1F4D", // Primary Navy
  "Soleal FYn Tilt & Turn": "#165BAA",   // Brand Blue
  "Soleal FYn Fixed Window": "#2D8ACD",  // Accent Sky
  "Soleal FYn Hinged Window": "#0F766E", // Deep Teal
  "Soleal GYn Fly Screen": "#F59E0B",    // Amber Gold
  "Soleal Aluminum System": "#475569",   // Slate Steel
};

export function computeRealDashboardSummary(snapshot: any): RealDashboardSummary {
  if (!snapshot || typeof snapshot !== "object") {
    return {
      totalProjects: 0,
      totalOpenings: 0,
      totalGlazingM2: 0,
      totalPerimeterM: 0,
      totalMaterials: 0,
      totalAssemblies: 0,
      totalExecutionProjects: 0,
      totalMarkupRules: 0,
      projects: [],
      openings: [],
      systemsShare: [],
      catalogCategories: [],
      manpowerHourlyRates: [],
    };
  }

  const rawProjects: any[] = Array.isArray(snapshot.projects) ? snapshot.projects : [];
  const rawMaterials: any[] = Array.isArray(snapshot.materials) ? snapshot.materials : [];
  const rawAssemblies: any[] = Array.isArray(snapshot.assemblies) ? snapshot.assemblies : [];
  const rawExecutionProjects: any[] = Array.isArray(snapshot.executionProjects) ? snapshot.executionProjects : [];
  const rawMarkupRates: any[] = Array.isArray(snapshot.markupRates) ? snapshot.markupRates : [];
  const rawManpowerCosts: any[] = Array.isArray(snapshot.manpowerCosts) ? snapshot.manpowerCosts : [];

  const openings: RealOpeningItem[] = [];
  const systemTotals: Record<string, { areaM2: number; count: number }> = {};

  const projects: RealProjectSummary[] = rawProjects.map((p) => {
    const items: any[] = Array.isArray(p.items) ? p.items : [];
    let pArea = 0;
    let pPerimeter = 0;
    const sysCounts: Record<string, number> = {};

    items.forEach((item, idx) => {
      const w = Number(item.inputWidth || item.width || 0);
      const h = Number(item.inputHeight || item.height || 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      const area = (w * h * qty) / 1_000_000;
      const perimeter = (2 * (w + h) * qty) / 1_000;

      pArea += area;
      pPerimeter += perimeter;

      const systemName = getSystemDisplayName(item.sourceId, item.assemblyPage);
      sysCounts[systemName] = (sysCounts[systemName] || 0) + 1;

      if (!systemTotals[systemName]) {
        systemTotals[systemName] = { areaM2: 0, count: 0 };
      }
      systemTotals[systemName].areaM2 += area;
      systemTotals[systemName].count += qty;

      openings.push({
        id: item.id || `item-${idx}`,
        name: item.name || `W-${String(idx + 1).padStart(2, "0")}`,
        projectName: p.name || "Untitled Project",
        widthMm: w,
        heightMm: h,
        quantity: qty,
        areaM2: Number(area.toFixed(2)),
        perimeterM: Number(perimeter.toFixed(2)),
        systemName,
        glassLabel: item.glassLabel || "Standard Glazing",
        color: item.color || "#98C379",
        leaves: item.leaves || 1,
      });
    });

    const primarySystem =
      Object.entries(sysCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Soleal System";

    return {
      id: p.id,
      name: p.name || "Untitled Project",
      client: p.client || "Direct Client",
      location: p.location || "Lebanon",
      year: p.year || "2026",
      itemsCount: items.length,
      totalGlazingM2: Number(pArea.toFixed(2)),
      totalPerimeterM: Number(pPerimeter.toFixed(2)),
      primarySystem,
    };
  });

  const totalGlazingM2 = projects.reduce((sum, p) => sum + p.totalGlazingM2, 0);
  const totalPerimeterM = projects.reduce((sum, p) => sum + p.totalPerimeterM, 0);

  const systemsShare: RealSystemShare[] = Object.entries(systemTotals).map(([system, val]) => {
    const pct = totalGlazingM2 > 0 ? Math.round((val.areaM2 / totalGlazingM2) * 100) : 0;
    return {
      system,
      areaM2: Number(val.areaM2.toFixed(2)),
      percentage: pct,
      openingsCount: val.count,
      color: SYSTEM_COLORS[system] || "#475569",
    };
  });

  // Materials categories breakdown
  const catCountMap: Record<string, number> = {};
  rawMaterials.forEach((m) => {
    const cat = (m.category || "General").trim();
    catCountMap[cat] = (catCountMap[cat] || 0) + 1;
  });

  const palette = ["#0B1F4D", "#165BAA", "#2D8ACD", "#0F766E", "#F59E0B", "#64748B", "#8B5CF6"];
  const totalMaterials = rawMaterials.length;
  const catalogCategories: RealCatalogCategory[] = Object.entries(catCountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count], idx) => ({
      category,
      count,
      percentage: totalMaterials > 0 ? Math.round((count / totalMaterials) * 100) : 0,
      color: palette[idx % palette.length],
    }));

  const manpowerHourlyRates = rawManpowerCosts.map((c) => ({
    name: c.name || "Labor",
    rate: Number(c.rate || 0),
  }));

  return {
    totalProjects: projects.length,
    totalOpenings: openings.length,
    totalGlazingM2: Number(totalGlazingM2.toFixed(2)),
    totalPerimeterM: Number(totalPerimeterM.toFixed(2)),
    totalMaterials: rawMaterials.length,
    totalAssemblies: rawAssemblies.length,
    totalExecutionProjects: rawExecutionProjects.length,
    totalMarkupRules: rawMarkupRates.length,
    projects,
    openings,
    systemsShare,
    catalogCategories,
    manpowerHourlyRates,
  };
}
