import type { WorkbookData, WorkbookExporter } from '../types';

export class JsonWorkbookService implements WorkbookExporter {
  async export(data: WorkbookData, filename: string): Promise<void> {
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
  }

  async import(file: File): Promise<WorkbookData> {
    const parsed: unknown = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || !('sheets' in parsed)) {
      throw new Error('This file is not a valid Univer workbook snapshot.');
    }
    return parsed as WorkbookData;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
