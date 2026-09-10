# AMA Design System & Architectural Guidelines

> **Brand Identity:** AMA Engineering & Architectural Design System  
> **Philosophy:** Modern Architectural & Engineering Minimalism — Clean, Precise, and Premium  
> **Distribution Rule:** 80% White / Soft Gray Canvas, 20% Structured Dark Navy & AMA Blue Accents  

---

## 1. Vision & Style Direction

The AMA aesthetic is rooted in modern architectural and structural engineering discipline:
* **Generous Whitespace:** Open breathing room that conveys confidence, clarity, and precision.
* **Refined Typography:** Strong, legible typographic hierarchy with crisp font weights.
* **Delicate Precision:** Thin, purposeful borders (`#E3E8EF`), avoiding thick dividing lines.
* **Controlled Curvature:** Slightly rounded cards and components with an **8px – 12px** border radius.
* **Restraint:** No heavy multi-color gradients, no excessive blurs or fuzzy shadows, and no oversized decorative clutter.
* **Photography & Assets:** High-resolution architectural photography, clean structural schematics, and technical line drawings.
* **Micro-Interactions:** Subtle, fluid hover transitions and focus rings (150ms–200ms ease-out).

---

## 2. Color Palette & Token System

### Core Palette

| Role | Color Name | Hex Code | Visual Usage |
|---|---|---|---|
| **Primary Navy** | Dark Navy | `#0B1F4D` | Headings, primary CTA buttons, high-priority navigation bars, dominant accents |
| **AMA Blue** | Brand Blue | `#165BAA` | Interactive states, primary links, brand markers, active tabs, secondary buttons |
| **Accent Blue** | Vivid Accent | `#2D8ACD` | Input focus rings, badges, subtle highlights, active progress indicators |
| **Main Background** | Pure White | `#FFFFFF` | Page canvas, card surfaces, modal content, input backgrounds |
| **Soft Background** | Off-White / Gray | `#F5F7FA` | App shells, alternating table rows, sidebars, secondary card backing |
| **Borders & Dividers**| Precision Border | `#E3E8EF` | Card outlines, table borders, input strokes, subtle separators |
| **Main Text** | Charcoal Ink | `#172033` | Primary body copy, table text, input text, form labels |
| **Secondary Text** | Slate Muted | `#667085` | Subtitles, helper text, timestamps, table column headers, breadcrumbs |

### The 80 / 20 Surface Rule
* **80% Canvas:** Keep page backgrounds, containers, and cards clean white (`#FFFFFF`) or subtle soft gray (`#F5F7FA`).
* **20% Accentuation:** Confine dark navy (`#0B1F4D`) and AMA blue (`#165BAA`) to:
  * Primary navigation items and header bars
  * Strong action buttons (CTAs)
  * Section headings and key metric callouts
  * Precise geometric accent lines and borders

---

## 3. UI Component Standards

### Cards & Containers
* **Background:** `#FFFFFF` on `#F5F7FA` canvas, or `#F5F7FA` on pure white.
* **Border:** `1px solid #E3E8EF`.
* **Border Radius:** `8px` (compact/technical) to `12px` (prominent/feature cards).
* **Shadow:** Minimal, crisp elevation only:  
  `box-shadow: 0 1px 3px 0 rgba(11, 31, 77, 0.04), 0 1px 2px -1px rgba(11, 31, 77, 0.04);`
* **Padding:** Uniform spacing using 16px, 24px, or 32px increments.

### Form Inputs & Fields
* **Container:** Clean white card background (`#FFFFFF`).
* **Labels:** Clean, bold typography in `#172033` with 12px–14px font size, uppercase tracking or medium weight.
* **Inputs:**
  * Height: 42px – 46px for spacious, accessible typing.
  * Border: `1px solid #E3E8EF`.
  * Text Color: `#172033` with placeholder in `#94A3B8`.
  * Background: `#FFFFFF`.
* **Focus State:**
  * Border Color: `#165BAA`.
  * Ring / Glow: `box-shadow: 0 0 0 3px rgba(45, 138, 205, 0.18)`.
* **Action Button (CTA):**
  * Background: `#0B1F4D` (hover: `#165BAA`).
  * Text: `#FFFFFF`, semibold, crisp letter spacing.
  * Radius: `8px` – `10px`.
  * No heavy glow; sharp and definitive.

---

## 4. Code Tokens Reference

### CSS Custom Properties
```css
:root {
  /* Brand Colors */
  --ama-navy: #0B1F4D;
  --ama-blue: #165BAA;
  --ama-accent: #2D8ACD;

  /* Surfaces */
  --ama-bg-main: #FFFFFF;
  --ama-bg-soft: #F5F7FA;
  --ama-border: #E3E8EF;

  /* Typography */
  --ama-text-main: #172033;
  --ama-text-muted: #667085;

  /* Radii */
  --ama-radius-sm: 8px;
  --ama-radius-md: 10px;
  --ama-radius-lg: 12px;

  /* Elevation */
  --ama-shadow-subtle: 0 1px 3px 0 rgba(11, 31, 77, 0.04), 0 1px 2px -1px rgba(11, 31, 77, 0.04);
  --ama-shadow-hover: 0 4px 6px -1px rgba(11, 31, 77, 0.06), 0 2px 4px -2px rgba(11, 31, 77, 0.04);
}
```

### Tailwind Config Token Extension
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        ama: {
          navy: "#0B1F4D",
          blue: "#165BAA",
          accent: "#2D8ACD",
          surface: "#FFFFFF",
          soft: "#F5F7FA",
          border: "#E3E8EF",
          ink: "#172033",
          muted: "#667085",
        },
      },
      borderRadius: {
        'ama-sm': '8px',
        'ama-md': '10px',
        'ama-lg': '12px',
      },
    },
  },
};
```

---

## 5. Iconography Standards (Lucide Icons)

When the UI or design requires icons, use **Lucide Icons** (`lucide-react`).

### Design & Visual Fit
* **Style:** Modern, minimal, clean, technical, architectural with a consistent, crisp outline aesthetic.
* **Stroke Width:** `strokeWidth={1.8}` (or `1.5`–`1.8` for ultra-clean technical precision).
* **Standard Size:** `size={20}` or `size={22}` for standard actions; `size={16}` for inline badges/helpers.

### Installation
```bash
npm install lucide-react
```

### Usage Example
```tsx
import {
  Building2,
  Ruler,
  Layers3,
  Factory,
  Wrench,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Users
} from "lucide-react";

<Building2 size={22} strokeWidth={1.8} className="text-[#0B1F4D]" />
```

### Recommended AMA Domain Icon Mappings

| Icon | Purpose / Semantic Area |
|---|---|
| `<Building2 />` | Projects, construction, developments |
| `<Layers3 />` | Façades, building envelope systems, cladding |
| `<Ruler />` | Engineering, architectural design, takeoffs |
| `<Factory />` | Fabrication, plant operations, manufacturing |
| `<Wrench />` | Installation, on-site assembly, maintenance |
| `<ShieldCheck />` | Quality assurance, compliance, structural certifications |
| `<FileText />` | Tenders, BOQs, estimation docs, specs |
| `<Users />` | Team, project managers, engineering personnel |
| `<MapPin />` | Site locations, regional branches |
| `<Phone />` / `<Mail />` | Client contacts, communication channels |

### Icon Library Ranking
1. **Lucide Icons (`lucide-react`)** — **Best overall** for the public AMA architectural website.
2. **Phosphor Icons** — Slightly more stylish and expressive.
3. **Tabler Icons** — Very clean, excellent for internal ERP & deep data dashboards.
4. **Heroicons** — Clean if tightly coupling with Tailwind CSS primitives.
5. **Font Awesome** — Massive library, but visually heavier and less architectural.
