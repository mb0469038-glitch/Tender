# Local Development & Hot Reload Workflow Rule

## Directive
When the user says **"run local host"**, **"run localhost"**, or requests to see local changes:

1. **Launch the Local Vite Dev Server Directly:**
   * Command: `cmd.exe /c "npm run dev"` (running as a daemon / background task).
   * URL: `http://localhost:1420`.
2. **Do Not Rebuild or Restart Docker Containers:**
   * Container restarts are slow and unnecessary for frontend iterative work.
   * Vite provides instant **Hot Module Replacement (HMR)** — any changes saved in `src/` appear in the browser within milliseconds.
3. **Backend API Proxy:**
   * Ensure `vite.config.ts` maintains the `/api` proxy forwarding to `http://213.199.37.145` (or local port 4000 if backend is run locally).
   * This guarantees that login, database queries, and snapshot saves work out of the box on `http://localhost:1420` without requiring local database or container setups.
