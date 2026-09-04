import type { WorkbookData, WorkbookPersistence } from '../types';

export class LocalStoragePersistence implements WorkbookPersistence {
  constructor(private readonly storageKey = 'univer-spreadsheet-workbook-v1') {}

  async save(data: WorkbookData): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async load(): Promise<WorkbookData | null> {
    const serialized = localStorage.getItem(this.storageKey);
    return serialized ? (JSON.parse(serialized) as WorkbookData) : null;
  }
}
