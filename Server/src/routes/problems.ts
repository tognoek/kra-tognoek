import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/problems
router.get("/", async (_req, res) => {
  const data = await prisma.deBai.findMany({
    include: { taiKhoan: true, deBaiChuDes: { include: { chuDe: true } } },
    orderBy: { NgayTao: "desc" },
  });
  res.json(data);
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

