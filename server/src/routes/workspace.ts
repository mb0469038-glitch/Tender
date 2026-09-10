import { Router, Request, Response } from "express";
import { pool } from "../db.js";

export const workspaceRouter = Router();

// Load current workspace snapshot
workspaceRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT value FROM workspace_snapshot WHERE id = 'current'"
    );
    if (result.rows.length === 0) {
      return res.json({ snapshot: null });
    }
    res.json({ snapshot: result.rows[0].value });
  } catch (err: any) {
    console.error("Failed to load workspace snapshot:", err);
    res.status(500).json({ error: err.message || "Failed to load workspace" });
  }
});

// Save workspace snapshot
workspaceRouter.post("/", async (req: Request, res: Response) => {
  const { snapshot } = req.body;
  if (typeof snapshot !== "string") {
    return res.status(400).json({ error: "Snapshot string required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO workspace_snapshot (id, value, updated_at)
       VALUES ('current', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [snapshot]
    );

    await client.query(
      "INSERT INTO workspace_save_history (saved_at) VALUES (NOW())"
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to save workspace snapshot:", err);
    res.status(500).json({ error: err.message || "Failed to save workspace" });
  } finally {
    client.release();
  }
});

// Fetch recent save timestamps
workspaceRouter.get("/recent-saves", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT to_char(saved_at, 'YYYY-MM-DD HH24:MI:SS') as saved_at FROM workspace_save_history ORDER BY id DESC LIMIT 5"
    );
    const saves = result.rows.map((row) => row.saved_at);
    res.json({ saves });
  } catch (err: any) {
    console.error("Failed to fetch recent workspace saves:", err);
    res.status(500).json({ error: err.message || "Failed to fetch saves" });
  }
});
