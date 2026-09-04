import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { UniverSheetsFilterPreset } from '@univerjs/preset-sheets-filter';
import UniverSheetsFilterEnUS from '@univerjs/preset-sheets-filter/locales/en-US';
import { UniverSheetsFindReplacePreset } from '@univerjs/preset-sheets-find-replace';
import UniverSheetsFindReplaceEnUS from '@univerjs/preset-sheets-find-replace/locales/en-US';
import { UniverSheetsSortPreset } from '@univerjs/preset-sheets-sort';
import UniverSheetsSortEnUS from '@univerjs/preset-sheets-sort/locales/en-US';
import { LocaleType, mergeLocales } from '@univerjs/core';
import { WorkbookService } from './services/WorkbookService';
import type { SpreadsheetEditorHandle, WorkbookData } from './types';
import { createFreeUniver } from './univerFactory';
import { PasteOptionsContextMenuPlugin } from './plugins/PasteOptionsContextMenuPlugin';

import '@univerjs/preset-sheets-core/lib/index.css';
import '@univerjs/preset-sheets-filter/lib/index.css';
import '@univerjs/preset-sheets-find-replace/lib/index.css';
import '@univerjs/preset-sheets-sort/lib/index.css';
import './spreadsheet.css';

export interface SpreadsheetEditorProps {
  initialData: WorkbookData;
  className?: string;
  onReady?: (editor: SpreadsheetEditorHandle) => void;
}

export const SpreadsheetEditor = forwardRef<SpreadsheetEditorHandle, SpreadsheetEditorProps>(
  function SpreadsheetEditor({ initialData, className = '', onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const serviceRef = useRef<WorkbookService | null>(null);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      loadWorkbook: (data) => serviceRef.current?.loadWorkbook(data),
      getWorkbookData: () => requireService(serviceRef.current).getWorkbookData(),
      getCellValue: (sheetId, row, column) => requireService(serviceRef.current).getCellValue(sheetId, row, column),
      setCellValue: (sheetId, row, column, value) => requireService(serviceRef.current).setCellValue(sheetId, row, column, value),
      getFormula: (sheetId, row, column) => requireService(serviceRef.current).getFormula(sheetId, row, column),
      setFormula: (sheetId, row, column, formula) => requireService(serviceRef.current).setFormula(sheetId, row, column, formula),
      addSheet: (name) => requireService(serviceRef.current).addSheet(name),
      deleteSheet: (sheetId) => requireService(serviceRef.current).deleteSheet(sheetId),
      paste: (mode) => requireService(serviceRef.current).paste(mode),
    }), []);

    useEffect(() => {
      if (!containerRef.current) return;
      const { univerAPI } = createFreeUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(
            UniverSheetsCoreEnUS,
            UniverSheetsFilterEnUS,
            UniverSheetsFindReplaceEnUS,
            UniverSheetsSortEnUS,
          ),
        },
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
            header: true,
            toolbar: true,
            ribbonType: 'simple',
            menu: {
              'sheet.menu.copy-special': { hidden: true },
              'sheet.menu.paste-special': { hidden: true },
            },
            footer: {
              sheetBar: true,
              statisticBar: true,
              menus: true,
              zoomSlider: true,
            },
          }),
          UniverSheetsFilterPreset(),
          UniverSheetsFindReplacePreset(),
          UniverSheetsSortPreset(),
        ],
        plugins: [PasteOptionsContextMenuPlugin],
      });

      const service = new WorkbookService(univerAPI);
      serviceRef.current = service;
      univerAPI.createWorkbook(structuredClone(initialData));
      onReadyRef.current?.(createHandle(service));

      return () => {
        serviceRef.current = null;
        univerAPI.dispose();
      };
      // initialData is intentionally consumed only during editor creation. Use loadWorkbook for later changes.
    }, []);

    return <div ref={containerRef} className={`spreadsheet-editor ${className}`} />;
  },
);

function requireService(service: WorkbookService | null): WorkbookService {
  if (!service) throw new Error('The spreadsheet is not ready.');
  return service;
}

function createHandle(service: WorkbookService): SpreadsheetEditorHandle {
  return {
    loadWorkbook: (data) => service.loadWorkbook(data),
    getWorkbookData: () => service.getWorkbookData(),
    getCellValue: (sheetId, row, column) => service.getCellValue(sheetId, row, column),
    setCellValue: (sheetId, row, column, value) => service.setCellValue(sheetId, row, column, value),
    getFormula: (sheetId, row, column) => service.getFormula(sheetId, row, column),
    setFormula: (sheetId, row, column, formula) => service.setFormula(sheetId, row, column, formula),
    addSheet: (name) => service.addSheet(name),
    deleteSheet: (sheetId) => service.deleteSheet(sheetId),
    paste: (mode) => service.paste(mode),
  };
}
