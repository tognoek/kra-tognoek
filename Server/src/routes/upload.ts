import { Router, Request, Response } from "express";
import FormData from "form-data";
import fetch from "node-fetch";
import { prisma } from "../db";

const router = Router();
const S3_BASE_URL = process.env.S3_BASE_URL || "http://127.0.0.1:3001";

router.post("/code", async (req: Request, res: Response) => {
  try {
    const { code, filename, language } = req.body;

    if (!code || !filename) {
      return res.status(400).json({ error: "Code and filename are required" });
    }

    const ext = language === "c" ? "c" : "cpp";
    const fileId = filename.replace(/\.(cpp|c)$/i, "");
    const fullFilename = `${fileId}.${ext}`;

    const formData = new FormData();
    formData.append("file", Buffer.from(code, "utf-8"), {
      filename: fullFilename,
      contentType: "text/plain",
    });
    formData.append("name", fileId);

    const s3Response = await fetch(`${S3_BASE_URL}/upload/code`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      return res.status(s3Response.status).json({ 
        error: `S3 upload failed: ${errorText}` 
      });
    }

    const s3Result = await s3Response.text();
    const fileUrl = `${S3_BASE_URL}/data/code/${fullFilename}`;
    
    res.json({
      success: true,
      filename: fileId,
      url: fileUrl,
      message: s3Result,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload file" });
  }
});

router.post("/test", async (req: Request, res: Response) => {
  try {
    const { fileBase64, originalName, 
      problemId, inputPath, 
      outputPath, checkerPath } = req.body;

    if (!fileBase64 || !problemId) {
      return res.status(400).json({ error: "fileBase64 và problemId là bắt buộc" });
    }

    const idDeBai = BigInt(problemId);

    const boTest = await prisma.boTest.create({
      data: {
        IdDeBai: idDeBai,
        DuongDanInput: inputPath || null,  
        DuongDanOutput: outputPath || null, 
        DuongDanCode: checkerPath || "",
      },
    });

    const testId = boTest.IdBoTest.toString();
    const filename = `${testId}.zip`;

    const buffer = Buffer.from(fileBase64, "base64");

    const formData = new FormData();
    formData.append("file", buffer, {
      filename,
      contentType: "application/zip",
    });
    formData.append("name", testId);

    const s3Response = await fetch(`${S3_BASE_URL}/upload/test`, {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      return res.status(s3Response.status).json({
        error: `S3 upload failed: ${errorText}`,
      });
    }

    const s3Result = await s3Response.text();

    res.json({
      success: true,
      message: s3Result,
    });
  } catch (error: any) {
    console.error("Upload test error:", error);
    res.status(500).json({ error: error.message || "Failed to upload test file" });
  }
});

export default router;

