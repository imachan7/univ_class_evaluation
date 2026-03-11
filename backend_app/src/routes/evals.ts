import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });

// 評価一覧取得
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const lecture_id = Number(req.params.id);
    if (!Number.isInteger(lecture_id) || lecture_id < 1) {
      res.status(400).json({ message: "講義IDが不正です" });
      return;
    }

    const evals = await prisma.lecEval.findMany({
      where: { lecture_id },
      select: {
        id: true,
        attendance: true,
        assignments: true,
        exam_difficulty: true,
        clarity: true,
        interest: true,
        easy_credit: true,
        comment: true,
        created_at: true,
        updated_at: true,
        // ユーザー情報はニックネームとidを返す
        user: { select: { name: true, user_id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(evals);
  } catch (err) {
    console.error("[evals list error]", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// 評価投稿（要認証）
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lecture_id = Number(req.params.id);
    const user_id = req.user_id!;
    const {
      attendance,
      assignments,
      exam_difficulty,
      clarity,
      interest,
      easy_credit,
      comment,
    } = req.body;

    if (!Number.isInteger(lecture_id) || lecture_id < 1) {
      res.status(400).json({ message: "講義IDが不正です" });
      return;
    }

    const fields = {
      attendance,
      assignments,
      exam_difficulty,
      clarity,
      interest,
      easy_credit,
    };
    for (const [key, val] of Object.entries(fields)) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        res
          .status(400)
          .json({ message: `${key} は 1〜5 の整数で入力してください` });
        return;
      }
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: lecture_id },
    });
    if (!lecture) {
      res.status(404).json({ message: "講義が見つかりません" });
      return;
    }

    const existing = await prisma.lecEval.findUnique({
      where: { lecture_id_user_id: { lecture_id, user_id } },
    });
    if (existing) {
      res.status(409).json({
        message: "この講義にはすでに評価を投稿済みです。編集してください。",
      });
      return;
    }

    const eval_ = await prisma.lecEval.create({
      data: {
        lecture_id,
        user_id,
        attendance: Number(attendance),
        assignments: Number(assignments),
        exam_difficulty: Number(exam_difficulty),
        clarity: Number(clarity),
        interest: Number(interest),
        easy_credit: Number(easy_credit),
        comment: typeof comment === "string" ? comment : null,
      },
    });

    res.status(201).json(eval_);
  } catch (err) {
    console.error("[eval create error]", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// 評価編集（要認証）
router.put("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lecture_id = Number(req.params.id);
    const user_id = req.user_id!;
    const {
      attendance,
      assignments,
      exam_difficulty,
      clarity,
      interest,
      easy_credit,
      comment,
    } = req.body;

    if (!Number.isInteger(lecture_id) || lecture_id < 1) {
      res.status(400).json({ message: "講義IDが不正です" });
      return;
    }

    const fields = {
      attendance,
      assignments,
      exam_difficulty,
      clarity,
      interest,
      easy_credit,
    };
    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined) continue;
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        res
          .status(400)
          .json({ message: `${key} は 1〜5 の整数で入力してください` });
        return;
      }
    }

    const existing = await prisma.lecEval.findUnique({
      where: { lecture_id_user_id: { lecture_id, user_id } },
    });
    if (!existing) {
      res.status(404).json({ message: "編集対象の評価が見つかりません" });
      return;
    }

    const updated = await prisma.lecEval.update({
      where: { lecture_id_user_id: { lecture_id, user_id } },
      data: {
        ...(attendance !== undefined && { attendance: Number(attendance) }),
        ...(assignments !== undefined && { assignments: Number(assignments) }),
        ...(exam_difficulty !== undefined && {
          exam_difficulty: Number(exam_difficulty),
        }),
        ...(clarity !== undefined && { clarity: Number(clarity) }),
        ...(interest !== undefined && { interest: Number(interest) }),
        ...(easy_credit !== undefined && { easy_credit: Number(easy_credit) }),
        ...(comment !== undefined && {
          comment: typeof comment === "string" ? comment : null,
        }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("[eval update error]", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

export default router;
