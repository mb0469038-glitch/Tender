# TenderStudio / Tender Helping System

Enterprise Estimation, Material Catalogs, 2D Canvas Takeoff, Assemblies, and Cutting Optimizer system for Atelier Moderne.

---

## 🚀 Quick Start (Run Locally in 1 Step)

Make sure **Docker Desktop** is open, then run:

```bash
docker compose up -d --build
```

Then open your browser at **[http://localhost](http://localhost)**.

* **Default Username:** `admin`
* **Default Password:** `admin123`

👉 **Full instructions & troubleshooting:** See [docs/RUNNING_LOCALLY.md](docs/RUNNING_LOCALLY.md).

---

## 🏗 Architecture & Documentation

- **[Running Locally Guide](docs/RUNNING_LOCALLY.md)**: Easy, step-by-step guide for non-technical users and AI agents.
- **[Architecture Overview](docs/architecture/OVERVIEW.md)**: Decomposed modular monolith structure, clean architecture layers, and Docker container breakdown.
- **[Architectural Rules for AI Agents](AGENTS.md)**: Rules ensuring zero code density, strict separation of concerns, and anti-bloat ceilings.
- **[RBAC & Permissions](docs/architecture/RBAC.md)**: Roles and permissions security model.

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS.
- **Backend Server:** Node.js (Express, TypeScript) with dual-mode support for Tauri IPC and HTTP REST.
- **Database:** PostgreSQL 16 Alpine with automatic schema migrations & persistence.
- **Reverse Proxy:** Nginx Alpine with SPA fallback routing.
- **Desktop (Optional):** Tauri v2 (Rust).
