import type { SVGProps } from 'react';

export type IconName = 'save' | 'load' | 'json' | 'import' | 'excel' | 'sheet';

const paths: Record<IconName, React.ReactNode> = {
  save: <><path d="M5 3h12l2 2v14H5z"/><path d="M8 3v6h8V3M8 19v-6h8v6"/></>,
  load: <><path d="M4 18h16M6 15V5h12v10"/><path d="m9 11 3 3 3-3M12 14V7"/></>,
  json: <><path d="M8 3H5v18h3M16 3h3v18h-3"/><path d="M10 8h4M10 12h4M10 16h4"/></>,
  import: <><path d="M4 18h16M12 4v10"/><path d="m8 10 4 4 4-4"/></>,
  excel: <><path d="M5 3h10l4 4v14H5zM15 3v5h4"/><path d="m8 11 6 6M14 11l-6 6"/></>,
  sheet: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11M3 14h18"/></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
