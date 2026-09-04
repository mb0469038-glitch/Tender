import { useRef, useState } from 'react';
import { Icon } from './components/Icon';
import {
  ExcelJsWorkbookExporter,
  JsonWorkbookService,
  LocalStoragePersistence,
  SpreadsheetEditor,
  type SpreadsheetEditorHandle,
} from './spreadsheet';
import { createDemoWorkbook } from './spreadsheet/demoWorkbook';
import './app.css';

const persistence = new LocalStoragePersistence();
const jsonService = new JsonWorkbookService();
const xlsxExporter = new ExcelJsWorkbookExporter();

export default function App() {
  const editorRef = useRef<SpreadsheetEditorHandle>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Demo workbook ready');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      setBusy(true);
      await action();
      setStatus(success);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const snapshot = () => {
    if (!editorRef.current) throw new Error('The spreadsheet is still starting.');
    return editorRef.current.getWorkbookData();
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-icon"><Icon name="sheet" /></div>
          <div>
            <div className="eyebrow">WORKBOOK</div>
            <h1>Costing Studio</h1>
          </div>
        </div>
        <div className="action-bar" aria-label="Workbook actions">
          <button disabled={!ready || busy} onClick={() => run(async () => persistence.save(snapshot()), 'Saved in this browser')}>
            <Icon name="save" /> Save
          </button>
          <button disabled={!ready || busy} onClick={() => run(async () => {
            const data = await persistence.load();
            if (!data) throw new Error('No saved workbook was found in this browser.');
            editorRef.current?.loadWorkbook(data);
          }, 'Saved workbook loaded')}>
            <Icon name="load" /> Load
          </button>
          <span className="action-divider" />
          <button disabled={!ready || busy} onClick={() => run(() => jsonService.export(snapshot(), 'costing-workbook.json'), 'JSON downloaded')}>
            <Icon name="json" /> Export JSON
          </button>
          <button disabled={!ready || busy} onClick={() => importRef.current?.click()}>
            <Icon name="import" /> Import JSON
          </button>
          <button className="primary-action" disabled={!ready || busy} onClick={() => run(() => xlsxExporter.export(snapshot(), 'costing-workbook.xlsx'), 'Excel workbook downloaded')}>
            <Icon name="excel" /> Export XLSX
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void run(async () => editorRef.current?.loadWorkbook(await jsonService.import(file)), 'JSON workbook imported');
              event.target.value = '';
            }}
          />
        </div>
        <div className="status-pill" aria-live="polite">
          <span className={busy ? 'status-dot busy' : 'status-dot'} /> {busy ? 'Working…' : status}
        </div>
      </header>
      <section className="workspace" aria-label="Spreadsheet workspace">
        <SpreadsheetEditor
          ref={editorRef}
          initialData={createDemoWorkbook()}
          onReady={() => setReady(true)}
        />
      </section>
    </main>
  );
}
