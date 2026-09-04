import type { Material } from "./types";

export type CalculationResult = { value: number; error?: string };

export const calculateFormula = (formula: string, widthMm: number, heightMm: number, parameters: Record<string, number> = {}): CalculationResult => {
  if (!formula.trim()) return { value: 0, error: "No quantity formula is defined." };
  const width = Math.max(0, widthMm) / 1000;
  const height = Math.max(0, heightMm) / 1000;
  const perimeter = 2 * (width + height);
  const area = width * height;
  let expression = formula
    .trim()
    .replace(/^=\s*/, "")
    .toLowerCase()
    .replace(/peremetr|peremeter/g, "perimeter")
    .replace(/hight/g, "height")
    .replace(/perimeter/g, String(perimeter))
    .replace(/area/g, String(area))
    .replace(/width/g, String(width))
    .replace(/height/g, String(height))
    .replace(/round\s*\+\s*\(\s*([^)]+)\s*\)/g, "Math.ceil($1)")
    .replace(/round\s*-\s*\(\s*([^)]+)\s*\)/g, "Math.floor($1)")
    .replace(/ceiling\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "Math.ceil(($1) / ($2)) * ($2)")
    .replace(/if\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*,\s*([^()]+)\s*\)/g, "(($1) ? ($2) : ($3))");
  Object.entries(parameters).forEach(([name, value]) => {
    expression = expression.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi"), String(Math.max(0, Number(value) || 0)));
  });
  if (!/^[0-9+*/().\sMathceilfloor?:<>=!-]+$/.test(expression)) return { value: 0, error: "Unsupported formula syntax." };
  try {
    const result = Function(`\"use strict\"; return (${expression});`)();
    if (!Number.isFinite(result) || result < 0) return { value: 0, error: "Formula produced an invalid quantity." };
    return { value: Number(result) };
  } catch {
    return { value: 0, error: "Formula could not be evaluated." };
  }
};

export const conditionMatches = (condition: string | undefined, widthMm: number, heightMm: number, parameters: Record<string, number>) => {
  if (!condition?.trim()) return true;
  const width = Math.max(0, widthMm) / 1000;
  const height = Math.max(0, heightMm) / 1000;
  const area = width * height;
  const perimeter = 2 * (width + height);
  let expression = condition.trim().toLowerCase()
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    .replace(/peremetr|peremeter/g, "perimeter")
    .replace(/hight/g, "height")
    .replace(/perimeter/g, String(perimeter))
    .replace(/area/g, String(area))
    .replace(/width/g, String(width))
    .replace(/height/g, String(height));
  Object.entries(parameters).forEach(([name, value]) => {
    expression = expression.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi"), String(Math.max(0, Number(value) || 0)));
  });
  expression = expression.replace(/(?<![<>=!])=(?![=>])/g, "==");
  if (!/^[0-9+*/().\s<>=!&|?-]+$/.test(expression)) return false;
  try { return Boolean(Function(`"use strict"; return (${expression});`)()); } catch { return false; }
};

export const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
export const money = (value: number) => `${number(value)} $`;
export const unitPriceWithShipping = (material: Material, shippingPercentage = material.shippingPercentage ?? 0) => material.cost * (1 + Math.max(0, shippingPercentage) / 100);
