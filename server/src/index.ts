import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { runMigrations } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { workspaceRouter } from "./routes/workspace.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true, // Reflect request origin
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/workspace", workspaceRouter);

async function startServer() {
  let retries = 10;
  while (retries > 0) {
    try {
      console.log("Connecting to PostgreSQL and running migrations...");
      await runMigrations();
      break;
    } catch (err) {
      console.error(`Database not ready yet. Retrying in 3 seconds... (${retries} retries left)`);
      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 TenderStudio Backend API running on port ${PORT}`);
  });
}

startServer();
