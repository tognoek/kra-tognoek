import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { router as apiRouter } from "./routes";
import { JobQueueManager } from "./redis/main";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({ message: "API is running. Frontend at http://localhost:3000" });
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

JobQueueManager.initialize().catch((err) => {
  console.error("Redis init error:", err);
});
