import type { CellValue, FillPattern, Workbook as ExcelWorkbook } from 'exceljs';
import type { WorkbookData, WorkbookExporter } from '../types';
import { downloadBlob } from './JsonWorkbookService';

type JsonMap = Record<string, unknown>;

export class ExcelJsWorkbookExporter implements WorkbookExporter {
  async export(data: WorkbookData, filename: string): Promise<void> {
    const { default: ExcelJS } = await import('exceljs');
    const workbook: ExcelWorkbook = new ExcelJS.Workbook();
    workbook.creator = 'Univer Spreadsheet Editor';
    workbook.created = new Date();

    for (const sheetId of data.sheetOrder ?? Object.keys(data.sheets ?? {})) {
      const source = data.sheets?.[sheetId];
      if (!source) continue;
      const worksheet = workbook.addWorksheet(source.name || 'Sheet');
      const rowData = source.rowData as Record<number, { h?: number }> | undefined;
      const columnData = source.columnData as Record<number, { w?: number }> | undefined;

      Object.entries(rowData ?? {}).forEach(([index, row]) => {
        if (row.h) worksheet.getRow(Number(index) + 1).height = row.h;
      });
      Object.entries(columnData ?? {}).forEach(([index, column]) => {
        if (column.w) worksheet.getColumn(Number(index) + 1).width = pixelsToExcelWidth(column.w);
      });

      Object.entries(source.cellData ?? {}).forEach(([rowIndex, row]) => {
        Object.entries(row ?? {}).forEach(([columnIndex, sourceCell]) => {
          if (!sourceCell) return;
          const cell = worksheet.getCell(Number(rowIndex) + 1, Number(columnIndex) + 1);
          const raw = sourceCell as JsonMap;
          const formula = typeof raw.f === 'string' ? raw.f.replace(/^=/, '') : undefined;
          const result = raw.v as string | number | boolean | undefined;
          cell.value = formula ? { formula, result } : (raw.v as CellValue);
          applyStyle(cell, resolveStyle(raw.s, data.styles as Record<string, unknown> | undefined));
        });
      });

      for (const merge of source.mergeData ?? []) {
        worksheet.mergeCells(merge.startRow + 1, merge.startColumn + 1, merge.endRow + 1, merge.endColumn + 1);
      }
      if (source.freeze) {
        worksheet.views = [{
          state: 'frozen',
          xSplit: source.freeze.xSplit,
          ySplit: source.freeze.ySplit,
          topLeftCell: `${columnName(source.freeze.startColumn)}${source.freeze.startRow + 1}`,
        }];
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename,
    );
  }
}

function resolveStyle(style: unknown, styles?: Record<string, unknown>): JsonMap | undefined {
  if (typeof style === 'string') return styles?.[style] as JsonMap | undefined;
  return style && typeof style === 'object' ? (style as JsonMap) : undefined;
}

function applyStyle(cell: import('exceljs').Cell, style?: JsonMap): void {
  if (!style) return;
  const color = (value: unknown) => {
    const rgb = (value as { rgb?: string } | undefined)?.rgb;
    return rgb ? { argb: `FF${rgb.replace('#', '').toUpperCase()}` } : undefined;
  };
  const fontColor = color(style.cl);
  cell.font = {
    name: typeof style.ff === 'string' ? style.ff : undefined,
    size: typeof style.fs === 'number' ? style.fs : undefined,
    bold: Boolean(style.bl),
    italic: Boolean(style.it),
    underline: Boolean(style.ul),
    color: fontColor,
  };
  const background = color(style.bg);
  if (background) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: background } as FillPattern;
  const horizontal = ['left', 'center', 'right'][Number(style.ht) - 1] as 'left' | 'center' | 'right' | undefined;
  const vertical = ['top', 'middle', 'bottom'][Number(style.vt) - 1] as 'top' | 'middle' | 'bottom' | undefined;
  cell.alignment = { horizontal, vertical, wrapText: Boolean(style.tb) };
  const numberFormat = (style.n as { pattern?: string } | undefined)?.pattern;
  if (numberFormat) cell.numFmt = numberFormat;
}

function pixelsToExcelWidth(pixels: number): number {
  return Math.max(1, Math.round(((pixels - 5) / 7) * 100) / 100);
}

function columnName(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}
