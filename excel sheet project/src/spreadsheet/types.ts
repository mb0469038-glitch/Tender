import type { IWorkbookData } from '@univerjs/core';

export type WorkbookData = IWorkbookData;

export type PasteMode = 'all' | 'values' | 'formulas' | 'formatting' | 'column-widths' | 'without-borders';

export interface SpreadsheetEditorHandle {
  loadWorkbook(data: WorkbookData): void;
  getWorkbookData(): WorkbookData;
  getCellValue(sheetId: string, row: number, column: number): unknown;
  setCellValue(sheetId: string, row: number, column: number, value: unknown): void;
  getFormula(sheetId: string, row: number, column: number): string | null;
  setFormula(sheetId: string, row: number, column: number, formula: string): void;
  addSheet(name: string): string;
  deleteSheet(sheetId: string): boolean;
  paste(mode: PasteMode): Promise<boolean>;
}

export interface WorkbookPersistence {
  save(data: WorkbookData): Promise<void>;
  load(): Promise<WorkbookData | null>;
}

export interface WorkbookExporter {
  export(data: WorkbookData, filename: string): Promise<void>;
}
