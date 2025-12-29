import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/available", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const problems = await prisma.deBai.findMany({
      where: {
        IdTaiKhoan: BigInt(userId as string),
      },
      orderBy: { NgayTao: "desc" },
      select: {
        IdDeBai: true,
        TieuDe: true,
        DoKho: true,
        GioiHanThoiGian: true,
        GioiHanBoNho: true,
        DangCongKhai: true,
        TrangThai: true,
        NgayTao: true,
        IdTaiKhoan: true, 
      },
    });

    res.json(
      problems.map((p) => ({
        IdDeBai: p.IdDeBai.toString(),
        TieuDe: p.TieuDe,
        DoKho: p.DoKho,
        GioiHanThoiGian: p.GioiHanThoiGian,
        GioiHanBoNho: p.GioiHanBoNho,
        DangCongKhai: p.DangCongKhai,
        TrangThai: p.TrangThai,
        NgayTao: p.NgayTao,
        IdTaiKhoan: p.IdTaiKhoan.toString(),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch available problems" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    TieuDe,
    NoiDungDeBai,
    DoKho,
    GioiHanThoiGian,
    GioiHanBoNho,
    DangCongKhai,
    TrangThai,
    topicIds,
  } = req.body;

  try {
    await prisma.deBai_ChuDe.deleteMany({
      where: { IdDeBai: BigInt(id) },
    });

    const updated = await prisma.deBai.update({
      where: { IdDeBai: BigInt(id) },
      data: {
        TieuDe,
        NoiDungDeBai,
        DoKho,
        GioiHanThoiGian,
        GioiHanBoNho,
        DangCongKhai,
        TrangThai,
        
        deBaiChuDes: topicIds?.length
          ? {
              create: topicIds.map((tid: number) => ({
                IdChuDe: BigInt(tid),
              })),
            }
          : undefined,
      },
    });

    res.json({ message: "Update success", IdDeBai: updated.IdDeBai.toString() });
  } catch (error: any) {
    console.error("Update problem error:", error);
    res.status(500).json({ error: "Failed to update problem" });
  }
});

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

  try {
    const created = await prisma.deBai.create({
      data: {
        IdTaiKhoan: BigInt(IdTaiKhoan),
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

    res.json({
      IdDeBai: created.IdDeBai.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString(),
      TieuDe: created.TieuDe,
      NoiDungDeBai: created.NoiDungDeBai,
      DoKho: created.DoKho,
      GioiHanThoiGian: created.GioiHanThoiGian,
      GioiHanBoNho: created.GioiHanBoNho,
      DangCongKhai: created.DangCongKhai,
      TrangThai: created.TrangThai,
      NgayTao: created.NgayTao,
    });
  } catch (error: any) {
    console.error("Create problem error:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
});

export default router;