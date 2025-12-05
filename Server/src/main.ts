import express from "express";
import dotenv from "dotenv";
import { router as apiRouter } from "./routes";
import { JobQueueManager } from "./redis/main";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.send("API is running. Use /api/* endpoints.");
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

// Init Redis queue manager on startup
JobQueueManager.initialize().catch((err) => {
  console.error("Redis init error:", err);
});
