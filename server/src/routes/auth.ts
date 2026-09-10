import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool, PERMISSION_CATALOG } from "../db.js";

export const authRouter = Router();

const SESSION_COOKIE = "tender_session";

// Helper to fetch session info
async function getSessionFromCookie(req: Request) {
  const sessionId = req.cookies[SESSION_COOKIE];
  if (!sessionId) return null;

  const sessionRes = await pool.query(
    `SELECT s.id, s.user_id, u.username, u.display_name, u.is_active
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );

  if (sessionRes.rows.length === 0) return null;
  const user = sessionRes.rows[0];
  if (!user.is_active) return null;

  // Fetch roles
  const rolesRes = await pool.query(
    "SELECT role_id FROM user_roles WHERE user_id = $1",
    [user.user_id]
  );
  const roleIds = rolesRes.rows.map((r) => r.role_id);

  // Fetch distinct permissions for those roles
  const permRes = await pool.query(
    `SELECT DISTINCT rp.permission_id
     FROM role_permissions rp
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1`,
    [user.user_id]
  );
  const permissions = permRes.rows.map((p) => p.permission_id);

  return {
    user_id: user.user_id,
    username: user.username,
    display_name: user.display_name,
    role_ids: roleIds,
    permissions,
  };
}

// 1. Login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }

  const userRes = await pool.query(
    "SELECT id, username, display_name, password_hash, is_active FROM users WHERE username = $1",
    [username.trim().toLowerCase()]
  );

  if (userRes.rows.length === 0) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const user = userRes.rows[0];
  if (!user.is_active) {
    return res.status(403).json({ error: "User account is deactivated." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  // Create session
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, user.id, expiresAt]
  );

  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
  });

  // Get roles & permissions
  const rolesRes = await pool.query(
    "SELECT role_id FROM user_roles WHERE user_id = $1",
    [user.id]
  );
  const roleIds = rolesRes.rows.map((r) => r.role_id);

  const permRes = await pool.query(
    `SELECT DISTINCT rp.permission_id
     FROM role_permissions rp
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1`,
    [user.id]
  );
  const permissions = permRes.rows.map((p) => p.permission_id);

  res.json({
    user_id: user.id,
    username: user.username,
    display_name: user.display_name,
    role_ids: roleIds,
    permissions,
  });
});

// 2. Logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  const sessionId = req.cookies[SESSION_COOKIE];
  if (sessionId) {
    await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

// 3. Current Session
authRouter.get("/session", async (req: Request, res: Response) => {
  const session = await getSessionFromCookie(req);
  res.json(session);
});

// 4. Change Password
authRouter.post("/change-password", async (req: Request, res: Response) => {
  const session = await getSessionFromCookie(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Missing passwords" });
  }

  const userRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [session.user_id]);
  const user = userRes.rows[0];

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: "Incorrect old password." });

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, session.user_id]);

  res.json({ ok: true });
});

// 5. Users Management
authRouter.get("/users", async (_req: Request, res: Response) => {
  const usersRes = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.is_active,
            COALESCE(array_agg(ur.role_id) FILTER (WHERE ur.role_id IS NOT NULL), '{}') as role_ids
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     GROUP BY u.id
     ORDER BY u.created_at ASC`
  );
  res.json(usersRes.rows);
});

authRouter.post("/users", async (req: Request, res: Response) => {
  const { username, displayName, password, roleIds } = req.body;
  if (!username || !displayName || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, username, display_name, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())`,
      [userId, username.trim().toLowerCase(), displayName.trim(), passwordHash]
    );

    if (Array.isArray(roleIds)) {
      for (const roleId of roleIds) {
        await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [userId, roleId]);
      }
    }
    await client.query("COMMIT");

    res.json({
      id: userId,
      username: username.trim().toLowerCase(),
      display_name: displayName.trim(),
      is_active: true,
      role_ids: roleIds || [],
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message || "Failed to create user" });
  } finally {
    client.release();
  }
});

authRouter.put("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { displayName } = req.body;

  const result = await pool.query(
    `UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, username, display_name, is_active`,
    [displayName.trim(), id]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

  const rolesRes = await pool.query("SELECT role_id FROM user_roles WHERE user_id = $1", [id]);
  res.json({
    ...result.rows[0],
    role_ids: rolesRes.rows.map((r) => r.role_id),
  });
});

authRouter.post("/users/:id/deactivate", async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query("UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1", [id]);
  await pool.query("DELETE FROM sessions WHERE user_id = $1", [id]);
  res.json({ ok: true });
});

authRouter.put("/users/:id/roles", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roleIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
    if (Array.isArray(roleIds)) {
      for (const roleId of roleIds) {
        await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [id, roleId]);
      }
    }
    await client.query("COMMIT");

    const userRes = await pool.query("SELECT id, username, display_name, is_active FROM users WHERE id = $1", [id]);
    res.json({
      ...userRes.rows[0],
      role_ids: roleIds || [],
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 6. Roles Management
authRouter.get("/roles", async (_req: Request, res: Response) => {
  const rolesRes = await pool.query(
    `SELECT r.id, r.name, r.description, r.is_system,
            COALESCE(array_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '{}') as permission_ids
     FROM roles r
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     GROUP BY r.id
     ORDER BY r.name ASC`
  );
  res.json(rolesRes.rows);
});

authRouter.post("/roles", async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Role name required" });

  const roleId = `role-${uuidv4().substring(0, 8)}`;
  await pool.query(
    "INSERT INTO roles (id, name, description, is_system, created_at, updated_at) VALUES ($1, $2, $3, FALSE, NOW(), NOW())",
    [roleId, name.trim(), description || ""]
  );

  res.json({
    id: roleId,
    name: name.trim(),
    description: description || "",
    is_system: false,
    permission_ids: [],
  });
});

authRouter.put("/roles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const result = await pool.query(
    `UPDATE roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3
     RETURNING id, name, description, is_system`,
    [name.trim(), description || "", id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Role not found" });

  const permsRes = await pool.query("SELECT permission_id FROM role_permissions WHERE role_id = $1", [id]);
  res.json({
    ...result.rows[0],
    permission_ids: permsRes.rows.map((p) => p.permission_id),
  });
});

authRouter.delete("/roles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const roleRes = await pool.query("SELECT is_system FROM roles WHERE id = $1", [id]);
  if (roleRes.rows.length === 0) return res.status(404).json({ error: "Role not found" });
  if (roleRes.rows[0].is_system) return res.status(400).json({ error: "Cannot delete system role" });

  await pool.query("DELETE FROM roles WHERE id = $1", [id]);
  res.json({ ok: true });
});

authRouter.put("/roles/:id/permissions", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissionIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [id]);
    if (Array.isArray(permissionIds)) {
      for (const permId of permissionIds) {
        await client.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [id, permId]);
      }
    }
    await client.query("COMMIT");

    const roleRes = await pool.query("SELECT id, name, description, is_system FROM roles WHERE id = $1", [id]);
    res.json({
      ...roleRes.rows[0],
      permission_ids: permissionIds || [],
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 7. Permissions Catalog
authRouter.get("/permissions", async (_req: Request, res: Response) => {
  const permsRes = await pool.query("SELECT id, module, label, description FROM permissions ORDER BY module, id");
  res.json(permsRes.rows);
});
