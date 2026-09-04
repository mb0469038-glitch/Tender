import { LocaleType } from '@univerjs/core';
import type { WorkbookData } from './types';

const headerStyle = {
  bg: { rgb: '#176B4D' },
  cl: { rgb: '#FFFFFF' },
  bl: 1,
  ht: 2,
  vt: 2,
  bd: {
    b: { s: 1, cl: { rgb: '#0F5138' } },
    l: { s: 1, cl: { rgb: '#0F5138' } },
    r: { s: 1, cl: { rgb: '#0F5138' } },
    t: { s: 1, cl: { rgb: '#0F5138' } },
  },
};

const currencyStyle = { n: { pattern: '$#,##0.00;[Red]-$#,##0.00' } };

export const createDemoWorkbook = (): WorkbookData => ({
  id: 'costing-workbook',
  appVersion: '0.25.1',
  locale: LocaleType.EN_US,
  name: 'Costing workbook',
  sheetOrder: ['costing'],
  sheets: {
    costing: {
      id: 'costing',
      name: 'Costing',
      rowCount: 200,
      columnCount: 26,
      defaultRowHeight: 24,
      defaultColumnWidth: 100,
      freeze: { xSplit: 0, ySplit: 1, startRow: 1, startColumn: 0 },
      rowData: {
        0: { h: 34 },
        4: { h: 30 },
      },
      columnData: {
        0: { w: 90 },
        1: { w: 250 },
        2: { w: 110 },
        3: { w: 130 },
        4: { w: 150 },
      },
      cellData: {
        0: {
          0: { v: 'Item', s: headerStyle },
          1: { v: 'Description', s: headerStyle },
          2: { v: 'Quantity', s: headerStyle },
          3: { v: 'Unit Cost', s: headerStyle },
          4: { v: 'Total', s: headerStyle },
        },
        1: {
          0: { v: '001' },
          1: { v: 'Aluminium' },
          2: { v: 10 },
          3: { v: 25, s: currencyStyle },
          4: { f: '=C2*D2', s: currencyStyle },
        },
        2: {
          0: { v: '002' },
          1: { v: 'Glass' },
          2: { v: 5 },
          3: { v: 40, s: currencyStyle },
          4: { f: '=C3*D3', s: currencyStyle },
        },
        4: {
          3: { v: 'Grand total', s: { bl: 1, ht: 3 } },
          4: {
            f: '=SUM(E2:E3)',
            s: {
              ...currencyStyle,
              bl: 1,
              bg: { rgb: '#DDF3E9' },
              bd: { t: { s: 2, cl: { rgb: '#176B4D' } } },
            },
          },
        },
      },
      mergeData: [],
      showGridlines: 1,
    },
  },
  styles: {},
  resources: [],
});
