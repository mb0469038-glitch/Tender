import {
  RangeDirective,
  RangesDirective,
  SheetDirective,
  SheetsDirective,
  SpreadsheetComponent,
} from "@syncfusion/ej2-react-spreadsheet";

export function ExcelWorkspace() {
  const sampleRows = [
    { Item: "Aluminium profile", Quantity: 24, UnitPrice: 18.5, Total: "=B2*C2" },
    { Item: "Glass panel", Quantity: 12, UnitPrice: 42, Total: "=B3*C3" },
    { Item: "Installation", Quantity: 8, UnitPrice: 30, Total: "=B4*C4" },
  ];

  return (
    <section className="excel-page" aria-labelledby="excel-page-title">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Standalone test area</p>
          <h1 id="excel-page-title">Excel</h1>
          <p>Syncfusion Spreadsheet is running independently from your tender workspace.</p>
        </div>
      </header>
      <div className="excel-workspace">
        <SpreadsheetComponent
          aria-label="Excel spreadsheet test workspace"
          showRibbon
          showFormulaBar
          showSheetTabs
          allowEditing
          allowUndoRedo
        >
          <SheetsDirective>
            <SheetDirective name="Test Sheet" selectedRange="A1:D4">
              <RangesDirective>
                <RangeDirective dataSource={sampleRows} startCell="A1" />
              </RangesDirective>
            </SheetDirective>
          </SheetsDirective>
        </SpreadsheetComponent>
      </div>
    </section>
  );
}
