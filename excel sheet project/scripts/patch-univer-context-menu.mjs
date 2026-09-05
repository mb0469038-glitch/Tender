import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  'node_modules/@univerjs/ui/lib/es/index.js',
  'node_modules/@univerjs/ui/lib/index.js',
];

const replacements = [
  {
    name: 'hover-to-open handler',
    pattern: /onMouseEnter: \(\) => \{\s*clearSubmenuCloseTimer\(\);\s*if \(hasSubmenu && !disabled\) \{\s*setSubmenuPositionReady\(false\);\s*setSubmenuVisible\(true\);\s*\}\s*\},/,
    replacement: 'onMouseEnter: clearSubmenuCloseTimer,',
  },
  {
    name: 'root mouse-leave close handler',
    pattern: /onMouseLeave: \(event\) => \{\s*if \(hasSubmenu\) \{\s*var _submenuElementRef\$cu;\s*const nextTarget = event\.relatedTarget;\s*if \(nextTarget && \(\(_submenuElementRef\$cu = submenuElementRef\.current\) === null \|\| _submenuElementRef\$cu === void 0 \? void 0 : _submenuElementRef\$cu\.contains\(nextTarget\)\)\) return;\s*scheduleSubmenuClose\(\);\s*\}\s*\},/,
    replacement: 'onMouseLeave: clearSubmenuCloseTimer,',
  },
  {
    name: 'submenu mouse-leave close handler',
    pattern: /onMouseLeave: \(event\) => \{\s*var _menuItemElementRef\$c;\s*const nextTarget = event\.relatedTarget;\s*if \(nextTarget && \(\(_menuItemElementRef\$c = menuItemElementRef\.current\) === null \|\| _menuItemElementRef\$c === void 0 \? void 0 : _menuItemElementRef\$c\.contains\(nextTarget\)\)\) return;\s*scheduleSubmenuClose\(\);\s*\},/,
    replacement: 'onMouseLeave: clearSubmenuCloseTimer,',
  },
  {
    name: 'single active submenu listener',
    pattern: /useEffect\(\(\) => \(\) => clearSubmenuCloseTimer\(\), \[clearSubmenuCloseTimer\]\);/,
    replacement: `useEffect(() => () => clearSubmenuCloseTimer(), [clearSubmenuCloseTimer]);
\tuseEffect(() => {
\t\tconst closeOtherSubmenu = (event) => {
\t\t\tif (event.detail === menuKey) return;
\t\t\tclearSubmenuCloseTimer();
\t\t\tsetSubmenuVisible(false);
\t\t};
\t\twindow.addEventListener("univer-context-submenu-open", closeOtherSubmenu);
\t\treturn () => window.removeEventListener("univer-context-submenu-open", closeOtherSubmenu);
\t}, [menuKey, clearSubmenuCloseTimer]);`,
  },
  {
    name: 'single active submenu click dispatch',
    pattern: /if \(hasSubmenu\) \{\s*if \(canExecuteItem\)/,
    replacement: `if (hasSubmenu) {
\t\t\t\t\twindow.dispatchEvent(new CustomEvent("univer-context-submenu-open", { detail: menuKey }));
\t\t\t\t\tif (canExecuteItem)`,
  },
  {
    name: 'left-click-only submenu guard',
    pattern: /onClick: \(\) => \{\s*clearSubmenuCloseTimer\(\);\s*if \(hasSubmenu\)/,
    replacement: `onClick: (event) => {
\t\t\t\tif (event.button !== 0) return;
\t\t\t\tclearSubmenuCloseTimer();
\t\t\t\tif (hasSubmenu)`,
  },
  {
    name: 'outside pointer close handler',
    pattern: /\}, \[menuKey, clearSubmenuCloseTimer\]\);\s*useEffect\(\(\) => \{\s*if \(!submenuVisible\) \{/,
    replacement: `}, [menuKey, clearSubmenuCloseTimer]);
\tuseEffect(() => {
\t\tif (!submenuVisible) return;
\t\tconst closeOnOutsidePointerDown = (event) => {
\t\t\tconst target = event.target;
\t\t\tif (!(target instanceof Node)) return;
\t\t\tif (menuItemElementRef.current && menuItemElementRef.current.contains(target)) return;
\t\t\tif (submenuElementRef.current && submenuElementRef.current.contains(target)) return;
\t\t\tclearSubmenuCloseTimer();
\t\t\tsetSubmenuVisible(false);
\t\t};
\t\tdocument.addEventListener("pointerdown", closeOnOutsidePointerDown, true);
\t\treturn () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown, true);
\t}, [submenuVisible, clearSubmenuCloseTimer]);
\tuseEffect(() => {
\t\tif (!submenuVisible) {`,
  },
];

for (const relativePath of files) {
  const path = resolve(relativePath);
  let source = readFileSync(path, 'utf8');

  for (const { name, pattern, replacement } of replacements) {
    if (pattern.test(source)) {
      source = source.replace(pattern, replacement);
    } else if (!source.includes(replacement)) {
      throw new Error(`Could not patch Univer ${name} in ${relativePath}.`);
    }
  }

  writeFileSync(path, source);
}

console.log('Univer context-menu submenus now use one click-controlled side panel.');
