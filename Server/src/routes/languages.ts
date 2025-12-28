import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/languages
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.ngonNgu.findMany({
      include: {
        baiNops: {
          select: {
            TrangThaiCham: true,
            IdTaiKhoan: true
          }
        }
      }
    });

    const languagesWithStats = data.map((l) => {
      let successfulSubmissions = 0;
      
      l.baiNops.forEach(s => {
        if (s.TrangThaiCham) {
          try {
            const results = JSON.parse(s.TrangThaiCham);
            if (Array.isArray(results) && results.length > 0 && results.every(v => v === 0)) {
              successfulSubmissions++;
            }
          } catch (e) {
            if (s.TrangThaiCham === "accepted") successfulSubmissions++;
          }
        }
      });

      return {
        IdNgonNgu: l.IdNgonNgu.toString(),
        TenNgonNgu: l.TenNgonNgu,
        TenNhanDien: l.TenNhanDien,
        TrangThai: l.TrangThai,
        totalSubmissions: l.baiNops.length,
        successfulSubmissions: successfulSubmissions,
        uniqueUsers: new Set(l.baiNops.map(s => s.IdTaiKhoan.toString())).size
      };
    });

    // Tính toán Rank dựa trên số bài thành công (descending)
    const sortedData = [...languagesWithStats].sort((a, b) => b.successfulSubmissions - a.successfulSubmissions);
    
    const finalResult = languagesWithStats.map(l => {
      const rank = sortedData.findIndex(s => s.IdNgonNgu === l.IdNgonNgu) + 1;
      return { ...l, rank };
    });

    res.json(finalResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load languages" });
  }
});

// POST /api/languages
router.post("/", async (req, res) => {
  const { TenNgonNgu, TenNhanDien, TrangThai } = req.body;
  if (!TenNgonNgu || !TenNhanDien) return res.status(400).json({ error: "Missing fields" });
  const created = await prisma.ngonNgu.create({
    data: { TenNgonNgu, TenNhanDien, TrangThai: TrangThai ?? true },
  });
  res.json(created);
});

//PUT /api/languages/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { TenNgonNgu, TenNhanDien, TrangThai } = req.body;
  try {
    const updated = await prisma.ngonNgu.update({
      where: { IdNgonNgu: BigInt(id) },
      data: {
        ...(TenNgonNgu && { TenNgonNgu }),
        ...(TenNhanDien && { TenNhanDien }),
        ...(TrangThai !== undefined && { TrangThai }),
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update language" });
  }
});

export default router;

