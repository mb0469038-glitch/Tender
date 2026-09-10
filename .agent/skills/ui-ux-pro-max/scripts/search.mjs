import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");

const CSV_CONFIG = {
  style: {
    file: "styles.csv",
    search_cols: ["Style Category", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
    output_cols: ["Style Category", "Type", "Keywords", "Primary Colors", "Effects & Animation", "Best For"]
  },
  color: {
    file: "colors.csv",
    search_cols: ["Product Type", "Notes"],
    output_cols: ["Product Type", "Primary (Hex)", "Secondary (Hex)", "CTA (Hex)", "Background (Hex)", "Text (Hex)", "Notes"]
  },
  chart: {
    file: "charts.csv",
    search_cols: ["Data Type", "Keywords", "Best Chart Type", "Accessibility Notes"],
    output_cols: ["Data Type", "Keywords", "Best Chart Type", "Secondary Options", "Color Guidance", "Accessibility Notes"]
  },
  landing: {
    file: "landing.csv",
    search_cols: ["Pattern Name", "Keywords", "Conversion Optimization", "Section Order"],
    output_cols: ["Pattern Name", "Keywords", "Section Order", "Primary CTA Placement", "Color Strategy", "Conversion Optimization"]
  },
  product: {
    file: "products.csv",
    search_cols: ["Product Type", "Keywords", "Primary Style Recommendation", "Key Considerations"],
    output_cols: ["Product Type", "Keywords", "Primary Style Recommendation", "Secondary Styles", "Landing Page Pattern"]
  },
  ux: {
    file: "ux-guidelines.csv",
    search_cols: ["Category", "Issue", "Description", "Platform"],
    output_cols: ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Severity"]
  },
  typography: {
    file: "typography.csv",
    search_cols: ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For", "Heading Font", "Body Font"],
    output_cols: ["Font Pairing Name", "Category", "Heading Font", "Body Font", "Mood/Style Keywords", "Best For", "Notes"]
  },
  icons: {
    file: "icons.csv",
    search_cols: ["Category", "Icon Name", "Keywords", "Best For"],
    output_cols: ["Category", "Icon Name", "Keywords", "Library", "Import Code", "Usage", "Best For"]
  }
};

function parseCSV(content) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentToken.trim());
      currentToken = "";
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken.trim());
    lines.push(row);
  }

  if (lines.length === 0) return [];
  const headers = lines[0];
  return lines.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] || "";
    });
    return obj;
  });
}

function searchDomain(domainName, query, maxResults = 3) {
  const config = CSV_CONFIG[domainName];
  if (!config) return [];
  const filePath = path.join(DATA_DIR, config.file);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf8");
  const rows = parseCSV(raw);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = rows.map(r => {
    let score = 0;
    const textToSearch = config.search_cols.map(c => r[c] || "").join(" ").toLowerCase();
    for (const term of terms) {
      if (textToSearch.includes(term)) {
        score += 1;
      }
    }
    return { score, row: r };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.row);
}

const args = process.argv.slice(2);
const query = args.find(a => !a.startsWith("-")) || "minimal";
const domainArg = args.indexOf("-d") !== -1 ? args[args.indexOf("-d") + 1] : args.indexOf("--domain") !== -1 ? args[args.indexOf("--domain") + 1] : null;

if (domainArg) {
  const results = searchDomain(domainArg, query);
  console.log(`\n=== Results for [${domainArg}] matching "${query}": ===\n`);
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(`\n=== UI/UX Pro Max Intelligence for: "${query}" ===\n`);
  for (const domain of ["style", "color", "typography", "ux", "landing"]) {
    const res = searchDomain(domain, query, 2);
    if (res.length > 0) {
      console.log(`--- [${domain.toUpperCase()}] ---`);
      res.forEach((r, idx) => {
        console.log(`\n#${idx + 1}:`);
        for (const [k, v] of Object.entries(r)) {
          if (v && v.length > 0) console.log(`  ${k}: ${v}`);
        }
      });
      console.log("");
    }
  }
}
