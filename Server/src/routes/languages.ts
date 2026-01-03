import { Router } from "express";
import { prisma } from "../db";

const router = Router();

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

    const sortedData = [...languagesWithStats].sort((a, b) => b.successfulSubmissions - a.successfulSubmissions);
    
    const finalResult = languagesWithStats
      .sort((a, b) => b.successfulSubmissions - a.successfulSubmissions)
      .map((l, index) => ({
        ...l,
        rank: index + 1
      }));

    res.json(finalResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load languages" });
  }
});

router.get("/active", async (req, res) => {
  try {
    // Chỉ lấy các ngôn ngữ có TrangThai là true (Active)
    const activeLanguages = await prisma.ngonNgu.findMany({
      where: {
        TrangThai: true,
      },
      // Select đúng các trường mà interface Language yêu cầu
      select: {
        IdNgonNgu: true,
        TenNgonNgu: true,
        TenNhanDien: true,
        TrangThai: true,
      },
    });

    // Format lại dữ liệu (chuyển BigInt sang String nếu cần)
    const formattedData = activeLanguages.map((lang) => ({
      IdNgonNgu: lang.IdNgonNgu.toString(),
      TenNgonNgu: lang.TenNgonNgu,
      TenNhanDien: lang.TenNhanDien,
      TrangThai: lang.TrangThai,
    }));

    // Trả về kết quả
    res.json(formattedData);
  } catch (error: any) {
    console.error("Fetch Active Languages Error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách ngôn ngữ" });
  }
});

router.post("/", async (req, res) => {
  const { TenNgonNgu, TenNhanDien, TrangThai } = req.body;
  if (!TenNgonNgu || !TenNhanDien) return res.status(400).json({ error: "Missing fields" });
  const created = await prisma.ngonNgu.create({
    data: { TenNgonNgu, TenNhanDien, TrangThai: TrangThai ?? true },
  });
  res.json(created);
});

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

