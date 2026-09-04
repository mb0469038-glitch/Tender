import {
  IUniverInstanceService,
  ICommandService,
  Inject,
  Injector,
  Plugin,
  UniverInstanceType,
  Workbook,
  toDisposable,
} from '@univerjs/core';
import {
  FormulaDataModel,
  ISheetClipboardService,
  LexerTreeBuilder,
  SetRangeValuesCommand,
  SheetsSelectionsService,
} from '@univerjs/preset-sheets-core';
import {
  ComponentManager,
  IContextMenuService,
  IMenuManagerService,
  MenuItemType,
} from '@univerjs/ui';
import type { KeyboardEvent } from 'react';

const COMPONENT_NAME = 'costing-paste-options-row';

const pasteOptions = [
  { title: 'Paste all', hook: 'default-paste', mark: '' },
  { title: 'Values only', hook: 'special-paste-value', mark: '123' },
  { title: 'Formulas only', hook: 'special-paste-formula', mark: 'fx' },
  { title: 'Without borders', hook: 'special-paste-besides-border', mark: '↔' },
  { title: 'Formatting only', hook: 'special-paste-format', mark: '✎' },
  { title: 'Column widths', hook: 'special-paste-col-width', mark: '↔' },
] as const;

export class PasteOptionsContextMenuPlugin extends Plugin {
  static override pluginName = 'COSTING_PASTE_OPTIONS_CONTEXT_MENU';
  static override packageName = 'costing-studio';
  static override version = '0.25.1';
  static override type = UniverInstanceType.UNIVER_SHEET;

  constructor(
    _config: undefined,
    protected override readonly _injector: Injector,
    private readonly menuManager: IMenuManagerService,
    private readonly componentManager: ComponentManager,
    private readonly commandService: ICommandService,
    private readonly contextMenuService: IContextMenuService,
  ) {
    super();
  }

  override onReady(): void {
    this.installClickControlledSubmenus();

    const paste = async (hook: string) => {
      try {
        const clipboardService = this._injector.get(ISheetClipboardService);
        const copyId = clipboardService.copyContentCache().getLastCopyId();

        // Univer already owns rich cell data for copies made inside the sheet.
        // Using that cache avoids browser clipboard-read permission failures and
        // preserves formulas, formats, borders, and column widths for each mode.
        if (copyId && hook === 'special-paste-formula') {
          await this.pasteFormulasOnly(copyId);
        } else if (copyId) {
          await clipboardService.pasteByCopyId(copyId, hook);
        } else {
          await this.commandService.executeCommand('univer.command.paste', { value: hook });
        }
      } finally {
        this.contextMenuService.hideContextMenu();
      }
    };

    this.disposeWithMe(this.componentManager.register(COMPONENT_NAME, () => (
      <div className="paste-context-row" onClick={(event) => event.stopPropagation()}>
        <strong>Paste Options:</strong>
        <span className="paste-context-actions">
          {pasteOptions.map((option) => (
            <span
              key={option.hook}
              className="paste-context-action"
              role="button"
              tabIndex={0}
              title={option.title}
              aria-label={option.title}
              onClick={(event) => {
                event.stopPropagation();
                void paste(option.hook);
              }}
              onKeyDown={(event) => handleKey(event, () => void paste(option.hook))}
            >
              <ClipboardGlyph mark={option.mark} />
            </span>
          ))}
        </span>
      </div>
    )));

    this.menuManager.mergeMenu({
      contextMenu: {
        'contextMenu.mainArea': {
          'contextMenu.format': {
            'costing.paste-options-row': {
              order: 0,
              menuItemFactory: () => ({
                id: 'costing.paste-options-row',
                type: MenuItemType.BUTTON,
                label: {
                  name: COMPONENT_NAME,
                  hoverable: false,
                  selectable: false,
                },
              }),
            },
          },
        },
      },
    });
  }

  /** Keeps Univer's right-side context submenus open until an outside click. */
  private installClickControlledSubmenus(): void {
    let activeTrigger: HTMLButtonElement | null = null;
    let activeTriggerKey: string | null = null;
    let activeSubmenu: HTMLElement | null = null;
    let lastClosed: { key: string; submenu: HTMLElement } | null = null;

    const getRootTrigger = (target: EventTarget | null): HTMLButtonElement | null => {
      if (!(target instanceof Element)) return null;
      const button = target.closest<HTMLButtonElement>('button');
      if (
        !button ||
        button.closest('[data-u-context-menu-submenu]') ||
        !button.closest('section.univer-popup') ||
        !button.querySelector('.univerjs-icon-more-icon')
      ) {
        return null;
      }
      return button;
    };

    const hideSubmenu = (submenu: HTMLElement) => {
      submenu.style.visibility = 'hidden';
      submenu.style.pointerEvents = 'none';
    };

    const closeActiveSubmenu = (relatedTarget: EventTarget | null) => {
      const trigger = activeTrigger;
      const key = activeTriggerKey;
      const submenu = activeSubmenu;
      activeTrigger = null;
      activeTriggerKey = null;
      activeSubmenu = null;

      if (submenu && key) {
        hideSubmenu(submenu);
        lastClosed = { key, submenu };
      }

      // Let Univer update its own React state to closed as well.
      trigger?.dispatchEvent(new MouseEvent('mouseout', {
        bubbles: true,
        relatedTarget: relatedTarget instanceof EventTarget ? relatedTarget : null,
      }));
    };

    const onMouseOver = (event: MouseEvent) => {
      // Disable Univer's hover-to-open behavior for root submenu rows.
      if (getRootTrigger(event.target)) event.stopPropagation();
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!activeTrigger) return;
      if (
        activeTrigger.contains(event.target as Node) ||
        activeSubmenu?.contains(event.target as Node)
      ) {
        // A clicked submenu stays open when the pointer leaves it.
        event.stopPropagation();
      }
    };

    const onClick = (event: MouseEvent) => {
      const trigger = getRootTrigger(event.target);

      if (trigger) {
        const key = trigger.textContent?.trim() ?? '';
        if (activeTrigger && activeTrigger !== trigger) closeActiveSubmenu(trigger);

        activeTrigger = trigger;
        activeTriggerKey = key;

        requestAnimationFrame(() => {
          const visibleSubmenus = Array.from(
            document.querySelectorAll<HTMLElement>('[data-u-context-menu-submenu]'),
          ).filter((submenu) => getComputedStyle(submenu).visibility !== 'hidden');

          activeSubmenu = visibleSubmenus.at(-1) ?? null;
          if (!activeSubmenu && lastClosed?.key === key && lastClosed.submenu.isConnected) {
            activeSubmenu = lastClosed.submenu;
            activeSubmenu.style.visibility = 'visible';
            activeSubmenu.style.pointerEvents = 'auto';
          }
        });
        return;
      }

      if (
        activeSubmenu &&
        event.target instanceof Node &&
        !activeSubmenu.contains(event.target)
      ) {
        closeActiveSubmenu(event.target);
      }
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('click', onClick, true);
    this.disposeWithMe(toDisposable(() => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('click', onClick, true);
    }));
  }

  private async pasteFormulasOnly(copyId: string): Promise<boolean> {
    const clipboardService = this._injector.get(ISheetClipboardService);
    const copied = clipboardService.copyContentCache().get(copyId);
    const selection = this._injector.get(SheetsSelectionsService).getCurrentLastSelection();
    const workbook = this._injector
      .get(IUniverInstanceService)
      .getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
    const worksheet = workbook?.getActiveSheet();

    if (!copied?.matrix || !selection || !workbook || !worksheet) return false;

    const formulas: Record<number, Record<number, { f: string; v: null; si: null; p: null }>> = {};
    const formulaData = this._injector.get(FormulaDataModel);
    const lexer = this._injector.get(LexerTreeBuilder);
    const sourceRows = copied.range.rows;
    const sourceColumns = copied.range.cols;
    const targetRow = selection.range.startRow;
    const targetColumn = selection.range.startColumn;

    copied.matrix.forValue((rowOffset, columnOffset, cell) => {
      const sourceRow = sourceRows[rowOffset % sourceRows.length];
      const sourceColumn = sourceColumns[columnOffset % sourceColumns.length];
      const formula = typeof cell.f === 'string'
        ? cell.f
        : typeof cell.si === 'string'
          ? formulaData.getFormulaStringByCell(sourceRow, sourceColumn, copied.subUnitId, copied.unitId)
          : null;

      if (!formula) return;

      const row = targetRow + rowOffset;
      const column = targetColumn + columnOffset;
      const shifted = lexer.moveFormulaRefOffset(
        formula,
        column - sourceColumn,
        row - sourceRow,
      );

      formulas[row] ??= {};
      formulas[row][column] = { f: shifted, v: null, si: null, p: null };
    });

    if (Object.keys(formulas).length === 0) return false;

    return this.commandService.executeCommand(SetRangeValuesCommand.id, {
      unitId: workbook.getUnitId(),
      subUnitId: worksheet.getSheetId(),
      value: formulas,
    });
  }
}

// Apply Univer's dependency-injection metadata without decorator syntax so Vite's
// React development transform and the production TypeScript build behave identically.
Inject(Injector)(PasteOptionsContextMenuPlugin, undefined, 1);
Inject(IMenuManagerService)(PasteOptionsContextMenuPlugin, undefined, 2);
Inject(ComponentManager)(PasteOptionsContextMenuPlugin, undefined, 3);
Inject(ICommandService)(PasteOptionsContextMenuPlugin, undefined, 4);
Inject(IContextMenuService)(PasteOptionsContextMenuPlugin, undefined, 5);

function handleKey(event: KeyboardEvent<HTMLSpanElement>, action: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
    action();
  }
}

function ClipboardGlyph({ mark }: { mark: string }) {
  return (
    <span className="context-clipboard" aria-hidden="true">
      <span className="context-clip-tab" />
      <span className="context-paper" />
      {mark && <span className="context-paste-mark">{mark}</span>}
    </span>
  );
}
