import { ReactNode } from "react";

export type IconName =
  | "plus"
  | "box"
  | "layers"
  | "folder"
  | "copy"
  | "edit"
  | "trash"
  | "pen"
  | "move"
  | "close"
  | "search"
  | "arrow"
  | "warehouse"
  | "order"
  | "users"
  | "shield"
  | "key"
  | string;

export function Icon({
  name,
  size = 19,
}: {
  name: IconName;
  size?: number;
}) {
  const elements: Record<string, ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    box: (
      <>
        <path d="m4 7 8-4 8 4v10l-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4M12 11v10" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="1" />
        <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" />
      </>
    ),
    pen: (
      <>
        <path d="m14 4 6 6M4 20l4-1 11-11-6-6L5 13Z" />
        <path d="m4 20 5-5" />
      </>
    ),
    move: (
      <>
        <path d="M12 3v18M3 12h18" />
        <path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8 3 12l4 4M17 8l4 4-4 4" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    warehouse: (
      <>
        <path d="m3 10 9-6 9 6v10H3Z" />
        <path d="M8 20v-6h8v6M3 10h18" />
      </>
    ),
    order: (
      <>
        <path d="M4 5h16v15H4Z" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </>
    ),
    users: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" />,
    shield: <path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4Z" />,
    key: <path d="M14 2a6 6 0 0 0-5.9 7.1L2 15.2V20h4.8l1-1v-1.8h1.8l1.4-1.4a6 6 0 1 0 2.9-11.8Zm2 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />,
  };

  const body = elements[name];
  if (!body) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}
