/**
 * Pure calculation helper for table zoom styles in PriceBook and Material databases.
 * Inward Core Domain: Zero React dependencies.
 */
export function getTableStyle(
  zoomPercentage: number = 100,
  isGlass: boolean = false
): Record<string, string> {
  const zoom = Math.max(50, Math.min(200, zoomPercentage || 100)) / 100;

  return {
    "--table-font-size": `${(isGlass ? 16 : 10.5) * zoom}px`,
    "--table-header-size": `${(isGlass ? 10 : 8.5) * zoom}px`,
    "--table-row-height": `${(isGlass ? 205 : 52) * zoom}px`,
    "--table-padding-y": `${(isGlass ? 8 : 6) * zoom}px`,
    "--table-padding-x": `${10 * zoom}px`,
    "--table-thumbnail": `${(isGlass ? 180 : 42) * zoom}px`,
    "--table-thumbnail-gap": `${(isGlass ? 16 : 10) * zoom}px`,
    "--table-action-size": `${26 * zoom}px`,
    "--table-secondary-size": `${(isGlass ? 14 : 9) * zoom}px`,
    "--table-price-input-width": `${62 * zoom}px`,
  };
}
