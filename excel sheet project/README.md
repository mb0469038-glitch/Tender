# Univer Spreadsheet Editor

A reusable, browser-based spreadsheet module built with React, TypeScript, Vite, and the free Apache-2.0 Univer packages. The demo is a full-viewport costing workbook with browser persistence, lossless Univer JSON snapshots, and a basic custom `.xlsx` exporter.

No `@univerjs-pro/*` package is declared, installed, or used. The small local `createFreeUniver` factory is intentional: Univer's umbrella `@univerjs/presets` package depends on its entire preset catalog, including Pro packages, while this project registers only the selected free presets.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. For a production check and optimized bundle:

```bash
npm run build
npm run preview
```

## Architecture

```text
src/
├── App.tsx                                  demo page and file actions
├── components/Icon.tsx                     small app-level icon set
└── spreadsheet/
    ├── SpreadsheetEditor.tsx               reusable Univer React component
    ├── demoWorkbook.ts                     replaceable demo snapshot
    ├── types.ts                            public API and service contracts
    └── services/
        ├── WorkbookService.ts              typed workbook operations
        ├── LocalStoragePersistence.ts       current persistence adapter
        ├── JsonWorkbookService.ts           lossless JSON import/export
        └── ExcelJsWorkbookExporter.ts       basic free XLSX export adapter
```

`SpreadsheetEditor` owns only the Univer lifecycle and delegates workbook operations to `WorkbookService`. `App` owns page chrome, notifications, and file buttons. Persistence and export are interfaces, so neither the editor nor workbook service knows about local storage, HTTP, or downloaded files.

## Embed in another React application

Copy `src/spreadsheet` into the host project and install the dependencies listed in `package.json`. The editor fills its parent, so give that parent an explicit height.

```tsx
import { useRef } from 'react';
import {
  SpreadsheetEditor,
  type SpreadsheetEditorHandle,
  type WorkbookData,
} from './spreadsheet';

export function CostingPage({ initialWorkbook }: { initialWorkbook: WorkbookData }) {
  const spreadsheet = useRef<SpreadsheetEditorHandle>(null);

  return (
    <div style={{ height: 700 }}>
      <SpreadsheetEditor ref={spreadsheet} initialData={initialWorkbook} />
      <button onClick={() => {
        spreadsheet.current?.setFormula('costing', 4, 4, '=SUM(E2:E4)');
      }}>
        Update total
      </button>
    </div>
  );
}
```

Rows and columns in the integration API are zero-based. The exposed ref provides:

```ts
loadWorkbook(data)
getWorkbookData()
getCellValue(sheetId, row, column)
setCellValue(sheetId, row, column, value)
getFormula(sheetId, row, column)
setFormula(sheetId, row, column, formula)
addSheet(name)
deleteSheet(sheetId)
paste(mode)
```

Call the API after `onReady` fires. `initialData` is intentionally read once because replacing a live workbook is an explicit operation through `loadWorkbook`.

## Persistence and a future backend

`getWorkbookData()` uses Univer's workbook snapshot. This is the canonical persistence format and preserves cell values, formulas, styles, merged ranges, row metadata, column metadata, freeze settings, sheet order, and other supported workbook resources.

`LocalStoragePersistence` implements this small contract:

```ts
interface WorkbookPersistence {
  save(data: WorkbookData): Promise<void>;
  load(): Promise<WorkbookData | null>;
}
```

Replace it with an HTTP adapter without changing the editor:

```ts
class ApiWorkbookPersistence implements WorkbookPersistence {
  async save(data: WorkbookData) {
    const response = await fetch('/api/workbooks/costing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Save failed');
  }

  async load(): Promise<WorkbookData | null> {
    const response = await fetch('/api/workbooks/costing');
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Load failed');
    return response.json();
  }
}
```

ASP.NET, Django, Laravel, and Node backends can store the JSON as a document/blob or in a JSON-capable column. Validate authentication, workbook ownership, payload size, and the snapshot schema on the server. For concurrent editing, add revision numbers or ETags before accepting writes.

## Feature ownership

Univer's open-source presets provide the grid, editing, selection, scrolling, clipboard behavior, undo/redo, formula engine and formula bar, font/fill/borders/alignment, number/currency/percentage formats, merge/unmerge, resizable rows and columns, frozen panes, and sheet tab management. The additional free presets add find/replace, range sorting, and filtering.

This project implements the React lifecycle wrapper, imperative integration API, demo costing snapshot, app action bar, an inline Excel-style Paste Options icon row in the cell context menu backed by Univer's native clipboard commands, localStorage adapter, lossless JSON files, error/status UI, and custom ExcelJS export.

## XLSX import/export roadmap

The included ExcelJS exporter maps values, formulas, common number/font/fill/alignment styles, merged cells, row heights, column widths, sheet names/order, and frozen panes. It is intentionally an adapter and does not use Univer's paid exchange/export functionality. Advanced Univer resources and every Excel style feature are not yet translated.

For production-grade exchange:

1. Expand the ExcelJS mapping for borders, dates, rich text, hidden rows/columns, validations, filters, and named ranges.
2. Add an `ExcelJsWorkbookImporter` that reads an `ArrayBuffer` and converts worksheets to `WorkbookData`.
3. Put bidirectional conversions in pure mapping functions with fixture-based tests.
4. Keep Univer JSON as the canonical save format. XLSX is an interchange format and may not represent every Univer feature exactly.

SheetJS Community Edition can be used instead, but ExcelJS was selected here because its style and merge APIs make the initial browser exporter straightforward.

## Notes

- Keep all Univer packages pinned to the same version.
- The Vite output is large because a capable spreadsheet editor and formula engine are substantial; ExcelJS is loaded only when Export XLSX is clicked.
- Local storage is per browser/origin and is suitable only for the current demo persistence requirement.
