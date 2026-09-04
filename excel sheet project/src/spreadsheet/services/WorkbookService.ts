import type { CellValue } from '@univerjs/core';
import type { FUniver } from '@univerjs/core/facade';
import type { PasteMode, WorkbookData } from '../types';

const pasteHooks: Record<PasteMode, string> = {
  all: 'default-paste',
  values: 'special-paste-value',
  formulas: 'special-paste-formula',
  formatting: 'special-paste-format',
  'column-widths': 'special-paste-col-width',
  'without-borders': 'special-paste-besides-border',
};

export class WorkbookService {
  constructor(private readonly api: FUniver) {}

  loadWorkbook(data: WorkbookData): void {
    this.api.getActiveWorkbook()?.dispose();
    this.api.createWorkbook(structuredClone(data));
  }

  getWorkbookData(): WorkbookData {
    const workbook = this.requireWorkbook();
    return structuredClone(workbook.save());
  }

  getCellValue(sheetId: string, row: number, column: number): unknown {
    return this.requireSheet(sheetId).getRange(row, column).getValue();
  }

  setCellValue(sheetId: string, row: number, column: number, value: unknown): void {
    this.requireSheet(sheetId).getRange(row, column).setValue(value as CellValue);
  }

  getFormula(sheetId: string, row: number, column: number): string | null {
    return this.requireSheet(sheetId).getRange(row, column).getFormula() || null;
  }

  setFormula(sheetId: string, row: number, column: number, formula: string): void {
    const normalized = formula.startsWith('=') ? formula : `=${formula}`;
    this.requireSheet(sheetId).getRange(row, column).setFormula(normalized);
  }

  addSheet(name: string): string {
    const workbook = this.requireWorkbook();
    const normalizedName = name.trim() || `Sheet ${workbook.getNumSheets() + 1}`;
    const sheet = workbook.create(normalizedName, 200, 26);
    sheet.activate();
    return sheet.getSheetId();
  }

  deleteSheet(sheetId: string): boolean {
    const workbook = this.requireWorkbook();
    if (workbook.getNumSheets() <= 1) {
      throw new Error('A workbook must contain at least one sheet.');
    }
    return workbook.deleteSheet(sheetId);
  }

  paste(mode: PasteMode): Promise<boolean> {
    return this.api.executeCommand<{ value: string }, boolean>('univer.command.paste', {
      value: pasteHooks[mode],
    });
  }

  private requireWorkbook() {
    const workbook = this.api.getActiveWorkbook();
    if (!workbook) throw new Error('The spreadsheet is not ready.');
    return workbook;
  }

  private requireSheet(sheetId: string) {
    const sheet = this.requireWorkbook().getSheetBySheetId(sheetId);
    if (!sheet) throw new Error(`Sheet "${sheetId}" was not found.`);
    return sheet;
  }
}
