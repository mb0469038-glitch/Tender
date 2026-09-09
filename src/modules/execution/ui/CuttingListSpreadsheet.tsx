import { useEffect, useRef } from "react";
import { LocaleType, LogLevel, mergeLocales, type IUniverConfig, type Plugin, type PluginCtor, Univer } from "@univerjs/core";
import { FUniver } from "@univerjs/core/facade";
import "@univerjs/sheets/facade";
import "@univerjs/sheets-ui/facade";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { UniverSheetsFilterPreset } from "@univerjs/preset-sheets-filter";
import UniverSheetsFilterEnUS from "@univerjs/preset-sheets-filter/locales/en-US";
import { UniverSheetsFindReplacePreset } from "@univerjs/preset-sheets-find-replace";
import UniverSheetsFindReplaceEnUS from "@univerjs/preset-sheets-find-replace/locales/en-US";
import { UniverSheetsSortPreset } from "@univerjs/preset-sheets-sort";
import UniverSheetsSortEnUS from "@univerjs/preset-sheets-sort/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs/preset-sheets-filter/lib/index.css";
import "@univerjs/preset-sheets-find-replace/lib/index.css";
import "@univerjs/preset-sheets-sort/lib/index.css";
import "./cuttingListSpreadsheet.css";

type PluginRegistration = PluginCtor<Plugin> | [PluginCtor<Plugin>, unknown];
type FreePreset = { plugins: PluginRegistration[] };

type FreeUniverConfig = IUniverConfig & {
  presets: FreePreset[];
};
export type CuttingListProfile = { code: string; name: string; photo: string };

const createFreeUniver = (config: FreeUniverConfig) => config;

const panelBorder = {
  t: { s: 1, cl: { rgb: "#1F1F1F" } }, r: { s: 1, cl: { rgb: "#1F1F1F" } },
  b: { s: 1, cl: { rgb: "#1F1F1F" } }, l: { s: 1, cl: { rgb: "#1F1F1F" } },
};
const greenTitleStyle = { bg: { rgb: "#6AA84F" }, cl: { rgb: "#FFFFFF" }, bl: 1, fs: 12, ht: 2, vt: 2, bd: panelBorder };
const openingPhotoStyle = { bg: { rgb: "#FFFFFF" }, bd: panelBorder };
const activeWindowColor = "#EAF4E5";
const inactiveWindowColor = "#E7E6E6";
const inactiveWindowStyle = { bg: { rgb: inactiveWindowColor }, ht: 2, vt: 2, bd: panelBorder };
const yellowTitleStyle = { bg: { rgb: "#F1C232" }, cl: { rgb: "#7F6000" }, bl: 1, fs: 12, ht: 2, vt: 2, bd: panelBorder };
const yellowLabelStyle = { bg: { rgb: "#FFF2CC" }, cl: { rgb: "#7F6000" }, bl: 1, ht: 2, vt: 2, tb: 1, bd: panelBorder };
const inactiveRuleStyle = { bg: { rgb: inactiveWindowColor }, ht: 2, vt: 2, bd: panelBorder };
const outputHeaderStyle = { bg: { rgb: "#1F4E78" }, cl: { rgb: "#FFFFFF" }, bl: 1, ht: 2, vt: 2, tb: 1 };
const firstProfileColumn = 4; // Column E
const finalProfileColumn = firstProfileColumn + 50 - 1; // Column BB
const firstWindowDataRow = 9;
const windowDataRowCount = 10;
const finalWindowDataRow = firstWindowDataRow + windowDataRowCount - 1;
const activeDimensionColor = "#EAF3F8";

const getColumnLabel = (columnIndex: number) => {
  let remaining = columnIndex + 1;
  let label = "";
  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return label;
};
const finalProfileColumnLabel = getColumnLabel(finalProfileColumn);

const profilePhotoUrl = (photo: string) => {
  if (photo.startsWith("data:image/") || photo.startsWith("/materials/") || /^https?:\/\//i.test(photo)) return photo;
  const escapedPath = photo.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4f8f8"/><path d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" stroke="#dbe7e7" stroke-width=".55"/><path d="${escapedPath}" fill="none" stroke="#274e13" stroke-width="3"/></svg>`)}`;
};

// These cells describe the template. Users enter information only in the blank
// green rows and the blank yellow profile-rule cells.
const lockedTemplateRanges = [
  "A1:C1",
  `D1:${finalProfileColumnLabel}1`,
  `D2:${finalProfileColumnLabel}2`,
  "D3:D7",
  `A8:${finalProfileColumnLabel}8`,
];

const profileRuleColumns = Array.from(
  { length: finalProfileColumn - firstProfileColumn + 1 },
  (_, index) => getColumnLabel(firstProfileColumn + index),
);

const createCuttingListTemplate = () => {
  const cellData: Record<number, Record<number, object>> = {
    0: {
      0: { v: "opening photo", s: greenTitleStyle },
      3: { v: "CUTTING ENGINE", s: yellowTitleStyle },
    },
    1: {
      3: { v: "Rule", s: yellowLabelStyle },
    },
    2: { 3: { v: "Profile photo", s: yellowLabelStyle } },
    3: { 3: { v: "Profile ref.", s: yellowLabelStyle } },
    4: { 3: { v: "Qty", s: yellowLabelStyle } },
    5: { 3: { v: "Cut angle", s: yellowLabelStyle } },
    6: { 3: { v: "Formula", s: yellowLabelStyle } },
    7: {
      0: { v: "COSTING REF.", s: outputHeaderStyle },
      1: { v: "SITE REF.", s: outputHeaderStyle },
      2: { v: "WIDTH", s: outputHeaderStyle },
      3: { v: "HEIGHT", s: outputHeaderStyle },
    },
  };

  cellData[1][0] = { s: openingPhotoStyle };
  for (let column = firstProfileColumn; column <= finalProfileColumn; column += 1) {
    cellData[1][column] = { v: `Profile rule ${column - firstProfileColumn + 1}`, s: yellowLabelStyle };
    cellData[2][column] = { s: inactiveRuleStyle };
    cellData[3][column] = { s: inactiveRuleStyle };
    cellData[4][column] = { s: inactiveRuleStyle };
    cellData[5][column] = { s: inactiveRuleStyle };
    cellData[6][column] = { s: inactiveRuleStyle };
    cellData[7][column] = { s: outputHeaderStyle };
  }
  for (let row = firstWindowDataRow - 1; row < finalWindowDataRow; row += 1) {
    cellData[row] = {};
    for (let column = 0; column <= 3; column += 1) cellData[row][column] = { s: inactiveWindowStyle };
  }

  return {
    id: "cutting-list-workbook",
    appVersion: "0.25.1",
    locale: LocaleType.EN_US,
    name: "Cutting list",
    sheetOrder: ["cutting-list"],
    sheets: {
      "cutting-list": {
        id: "cutting-list",
        name: "Cutting List",
        rowCount: finalWindowDataRow + 50,
        columnCount: finalProfileColumn + 1,
        defaultRowHeight: 25,
        defaultColumnWidth: 100,
        freeze: { xSplit: 0, ySplit: 8, startRow: 8, startColumn: 0 },
        rowData: { 0: { h: 34 }, 1: { h: 30 }, 2: { h: 120 } },
        columnData: {
          0: { w: 115 }, 1: { w: 115 }, 2: { w: 95 }, 3: { w: 95 },
          ...Object.fromEntries(
            Array.from(
              { length: finalProfileColumn - firstProfileColumn + 1 },
              (_, index) => [firstProfileColumn + index, { w: 150 }],
            ),
          ),
        },
        cellData,
        mergeData: [
          { startRow: 0, endRow: 0, startColumn: 0, endColumn: 2 },
          { startRow: 0, endRow: 0, startColumn: 3, endColumn: finalProfileColumn },
          { startRow: 1, endRow: 6, startColumn: 0, endColumn: 2 },
        ],
        showGridlines: 1,
      },
    },
    styles: {},
    resources: [],
  };
};

const cuttingListTemplate = createCuttingListTemplate();

export function CuttingListSpreadsheet({ profileCatalog }: { profileCatalog: CuttingListProfile[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const profileCatalogRef = useRef(profileCatalog);
  const profilePhotoSourcesRef = useRef(new Map<number, string>());
  const profileImagesRef = useRef(new Map<string, HTMLImageElement>());
  profileCatalogRef.current = profileCatalog;

  useEffect(() => {
    if (!containerRef.current) return;
    const { presets, ...config } = createFreeUniver({
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
          ribbonType: "simple",
          sheets: { protectedRangeShadow: false },
          footer: { sheetBar: true, statisticBar: true, menus: true, zoomSlider: true },
        }),
        UniverSheetsFilterPreset(),
        UniverSheetsFindReplacePreset(),
        UniverSheetsSortPreset(),
      ],
    });
    const univer = new Univer({ logLevel: LogLevel.WARN, ...config });
    for (const preset of presets) {
      for (const registration of preset.plugins) {
        const [plugin, options] = Array.isArray(registration) ? registration : [registration, undefined];
        univer.registerPlugin(plugin, options as never);
      }
    }
    const univerApi = FUniver.newAPI(univer);
    const workbook = univerApi.createWorkbook(structuredClone(cuttingListTemplate));
    const worksheet = workbook.getSheetByName("Cutting List");
    let disposeEngineStatus: (() => void) | undefined;

    if (worksheet) {
      let previousProfileReferences = Array<string>(profileRuleColumns.length).fill("");
      let previousWindowRows = Array<boolean>(finalWindowDataRow - firstWindowDataRow + 1).fill(false);
      const profilePhotoRenderHook = univerApi.getSheetHooks().onCellRender([{
        drawWith: (context, info) => {
          if (info.row !== 2 || info.col < firstProfileColumn || info.col > finalProfileColumn) return;
          const source = profilePhotoSourcesRef.current.get(info.col);
          const image = source ? profileImagesRef.current.get(source) : undefined;
          if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;

          const { startX, startY, endX, endY } = info.primaryWithCoord;
          const cellWidth = endX - startX;
          const cellHeight = endY - startY;
          const scale = Math.min((cellWidth - 12) / image.naturalWidth, (cellHeight - 12) / image.naturalHeight);
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          const x = startX + (cellWidth - width) / 2;
          const y = startY + (cellHeight - height) / 2;

          context.save();
          context.beginPath();
          context.rect(startX + 2, startY + 2, cellWidth - 4, cellHeight - 4);
          context.clip();
          context.drawImage(image, x, y, width, height);
          context.restore();
        },
      }]);

      const updateProfilePhoto = (columnIndex: number, photoSource: string) => {
        const column = profileRuleColumns[columnIndex];
        const photoCell = worksheet.getRange(`${column}3`);
        if (!photoSource) {
          profilePhotoSourcesRef.current.delete(firstProfileColumn + columnIndex);
          photoCell.setCustomMetaData({ cuttingListPhoto: "" });
          return;
        }

        profilePhotoSourcesRef.current.set(firstProfileColumn + columnIndex, photoSource);
        if (!profileImagesRef.current.has(photoSource)) {
          const image = new Image();
          image.onload = () => {
            if (profilePhotoSourcesRef.current.get(firstProfileColumn + columnIndex) === photoSource) {
              photoCell.setCustomMetaData({ cuttingListPhoto: photoSource });
            }
          };
          profileImagesRef.current.set(photoSource, image);
          image.src = photoSource;
        }
        photoCell.setCustomMetaData({ cuttingListPhoto: photoSource });
      };

      const setProfileDimensionCells = (column: string, isProfileActive: boolean) => {
        worksheet.getRange(`${column}${firstWindowDataRow}:${column}${finalWindowDataRow}`).setBackground("#FFFFFF");
        if (!isProfileActive) return;

        let startRow: number | null = null;
        previousWindowRows.forEach((isActiveWindow, rowIndex) => {
          const rowNumber = firstWindowDataRow + rowIndex;
          if (isActiveWindow && startRow === null) startRow = rowNumber;
          if (startRow !== null && (!isActiveWindow || rowIndex === previousWindowRows.length - 1)) {
            const endRow = isActiveWindow ? rowNumber : rowNumber - 1;
            worksheet.getRange(`${column}${startRow}:${column}${endRow}`).setBackground(activeDimensionColor);
            startRow = null;
          }
        });
      };

      const refreshWindowRow = (rowIndex: number) => {
        const rowNumber = firstWindowDataRow + rowIndex;
        const isActiveWindow = worksheet.getRange(`B${rowNumber}`).getDisplayValue().trim().length > 0;
        if (isActiveWindow === previousWindowRows[rowIndex]) return;

        previousWindowRows[rowIndex] = isActiveWindow;
        worksheet.getRange(`A${rowNumber}:D${rowNumber}`).setBackground(isActiveWindow ? activeWindowColor : inactiveWindowColor);
        previousProfileReferences.forEach((profileReference, profileIndex) => {
          if (profileReference) worksheet.getRange(`${profileRuleColumns[profileIndex]}${rowNumber}`).setBackground(isActiveWindow ? activeDimensionColor : "#FFFFFF");
        });
      };

      const refreshProfileColumn = (profileIndex: number) => {
        const column = profileRuleColumns[profileIndex];
        const profileReference = worksheet.getRange(`${column}4`).getDisplayValue().trim();
        if (profileReference === previousProfileReferences[profileIndex]) return;

        previousProfileReferences[profileIndex] = profileReference;
        const isActive = profileReference.length > 0;
        worksheet.getRange(`${column}3:${column}7`).setBackground(isActive ? "#FFF9E6" : inactiveWindowColor);
        const matchingProfile = profileCatalogRef.current.find((profile) =>
          profile.code.trim().toLocaleLowerCase() === profileReference.toLocaleLowerCase(),
        );
        updateProfilePhoto(profileIndex, matchingProfile ? profilePhotoUrl(matchingProfile.photo) : "");
        setProfileDimensionCells(column, isActive);
      };

      const pendingProfileColumns = new Set<number>();
      const pendingWindowRows = new Set<number>();
      let refreshQueued = false;
      const queueTargetedRefresh = (profileColumns: Iterable<number>, windowRows: Iterable<number>) => {
        for (const column of profileColumns) pendingProfileColumns.add(column);
        for (const row of windowRows) pendingWindowRows.add(row);
        if (refreshQueued) return;
        refreshQueued = true;
        queueMicrotask(() => {
          refreshQueued = false;
          pendingWindowRows.forEach(refreshWindowRow);
          pendingProfileColumns.forEach(refreshProfileColumn);
          pendingWindowRows.clear();
          pendingProfileColumns.clear();
        });
      };

      const engineStatusCommandListener = univerApi.onCommandExecuted(({ id, params }) => {
        if (id !== "sheet.mutation.set-range-values") return;
        const cellValue = (params as { cellValue?: Record<string, Record<string, unknown>> }).cellValue;
        if (!cellValue) return;

        const changedProfileColumns = new Set<number>();
        const changedWindowRows = new Set<number>();
        Object.entries(cellValue).forEach(([rowKey, rowValues]) => {
          const row = Number(rowKey);
          Object.entries(rowValues ?? {}).forEach(([columnKey, value]) => {
            const column = Number(columnKey);
            const changesCellContent = value === null || (typeof value === "object" && value !== null && ("v" in value || "p" in value || "f" in value));
            if (!changesCellContent) return;
            if (row === 3 && column >= firstProfileColumn && column <= finalProfileColumn) changedProfileColumns.add(column - firstProfileColumn);
            if (column === 1 && row >= firstWindowDataRow - 1 && row < finalWindowDataRow) changedWindowRows.add(row - (firstWindowDataRow - 1));
          });
        });
        if (changedProfileColumns.size || changedWindowRows.size) queueTargetedRefresh(changedProfileColumns, changedWindowRows);
      });
      disposeEngineStatus = () => {
        engineStatusCommandListener.dispose();
        profilePhotoRenderHook.dispose();
      };

      void Promise.all(
        lockedTemplateRanges.map((rangeRef) =>
          worksheet.getRange(rangeRef).getRangePermission().protect({
            name: "Cutting List template",
            allowedUsers: [],
          }),
        ),
      ).catch((error: unknown) => {
        console.error("Unable to protect Cutting List title cells.", error);
      });

    }
    return () => {
      disposeEngineStatus?.();
      univer.dispose();
    };
  }, []);

  return <div className="cutting-list-spreadsheet" ref={containerRef} aria-label="Excel cutting list" />;
}
