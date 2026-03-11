import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// 自分のプロフィール取得（要認証）
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user_id! },
      select: {
        user_id: true,
        email: true,
        name: true,
        grade: true,
        course: true,
        prog_exp: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "ユーザーが見つかりません" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("[user me error]", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = Number(req.params.id);
    if (!Number.isInteger(user_id) || user_id < 1) {
      res.status(400).json({ message: "ユーザーIDが不正です" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        name: true,
        grade: true,
        course: true,
        prog_exp: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "ユーザーが見つかりません" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("[user get error]", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

export default router;
