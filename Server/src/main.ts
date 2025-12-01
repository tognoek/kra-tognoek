import express, { Request, Response } from "express";
import { getJobQueue } from "./redis/main";

const app = express();
const port = 3000;
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello API!");
});
app.get("/add-job-queue", async (req: Request, res: Response) => {
  try {
    const { task, data } = req.query;
    //      ↑     ↑
    //      Từ URL: /add-job-queue?task=1&data=sum
    
    if (!task) {
      return res.status(400).json({
        success: false,
        error: "Task is required"
      });
    }
    
    const jobId = await getJobQueue().addJob({
      task: task as string,
      data: data || ""
    });
    
    res.json({
      success: true,
      jobId,
      message: "Job added to queue"
    });
    
  } catch (error: any) {
    console.error("Error adding job:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.post("/echo", (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
