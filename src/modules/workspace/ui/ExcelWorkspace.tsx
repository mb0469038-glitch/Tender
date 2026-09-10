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
    <section className="min-h-[calc(100vh-69px)] bg-[#f5f7f8]" aria-labelledby="excel-page-title">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-5 pt-8 pb-5 md:px-12 md:pt-10">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">Standalone test area</p>
          <h1 id="excel-page-title" className="m-0 text-[#11262a] text-4xl tracking-[-0.035em] font-bold">Excel</h1>
          <p className="max-w-[650px] mt-1.5 mb-0 text-[#61777b] text-sm">Syncfusion Spreadsheet is running independently from your tender workspace.</p>
        </div>
      </header>
      <div className="min-h-[660px] mx-5 md:mx-12 mb-10 overflow-hidden border border-[#cbdcdc] rounded-[10px] bg-white shadow-[0_10px_28px_rgba(22,61,65,0.08)]">
        <SpreadsheetComponent
          aria-label="Excel spreadsheet test workspace"
          height="660px"
          className="!border-0"
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
