import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/problems
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.deBai.findMany({
      orderBy: { NgayTao: "desc" },
    });

    // Tránh BigInt trong JSON response
    res.json(
      data.map((p) => ({
        IdDeBai: p.IdDeBai.toString(),
        IdTaiKhoan: p.IdTaiKhoan.toString(),
        TieuDe: p.TieuDe,
        NoiDungDeBai: p.NoiDungDeBai,
        DoKho: p.DoKho,
        GioiHanThoiGian: p.GioiHanThoiGian,
        GioiHanBoNho: p.GioiHanBoNho,
        DangCongKhai: p.DangCongKhai,
        NgayTao: p.NgayTao,
        TrangThai: p.TrangThai,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load problems" });
  }
});

// POST /api/problems
router.post("/", async (req, res) => {
  const {
    IdTaiKhoan,
    TieuDe,
    NoiDungDeBai,
    DoKho,
    GioiHanThoiGian,
    GioiHanBoNho,
    DangCongKhai,
    TrangThai,
    topicIds,
  } = req.body;

  if (!IdTaiKhoan || !TieuDe || !NoiDungDeBai || !DoKho || !GioiHanThoiGian || !GioiHanBoNho) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const created = await prisma.deBai.create({
    data: {
      IdTaiKhoan,
      TieuDe,
      NoiDungDeBai,
      DoKho,
      GioiHanThoiGian,
      GioiHanBoNho,
      DangCongKhai: DangCongKhai ?? true,
      TrangThai: TrangThai ?? true,
      deBaiChuDes: topicIds?.length
        ? {
            create: topicIds.map((id: bigint) => ({
              IdChuDe: BigInt(id),
            })),
          }
        : undefined,
    },
  });
  res.json(created);
});

export default router;

