"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
// 評価一覧取得
router.get("/", async (req, res) => {
    try {
        const lecture_id = Number(req.params.id);
        if (!Number.isInteger(lecture_id) || lecture_id < 1) {
            res.status(400).json({ message: "講義IDが不正です" });
            return;
        }
        const evals = await prisma_1.default.lecEval.findMany({
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
                // ユーザー情報はニックネームのみ公開
                user: { select: { name: true } },
            },
            orderBy: { created_at: "desc" },
        });
        res.json(evals);
    }
    catch (err) {
        console.error("[evals list error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
// 評価投稿（要認証）
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const lecture_id = Number(req.params.id);
        const user_id = req.user_id;
        const { attendance, assignments, exam_difficulty, clarity, interest, easy_credit, comment, } = req.body;
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
                res.status(400).json({
                    message: `${key} は 1〜5 の整数で入力してください`,
                });
                return;
            }
        }
        const lecture = await prisma_1.default.lecture.findUnique({
            where: { id: lecture_id },
        });
        if (!lecture) {
            res.status(404).json({ message: "講義が見つかりません" });
            return;
        }
        const existing = await prisma_1.default.lecEval.findUnique({
            where: { lecture_id_user_id: { lecture_id, user_id } },
        });
        if (existing) {
            res.status(409).json({
                message: "この講義にはすでに評価を投稿済みです。編集してください。",
            });
            return;
        }
        const eval_ = await prisma_1.default.lecEval.create({
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
    }
    catch (err) {
        console.error("[eval create error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
// 評価編集（要認証）
router.put("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const lecture_id = Number(req.params.id);
        const user_id = req.user_id;
        const { attendance, assignments, exam_difficulty, clarity, interest, easy_credit, comment, } = req.body;
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
            if (val === undefined)
                continue;
            const n = Number(val);
            if (!Number.isInteger(n) || n < 1 || n > 5) {
                res.status(400).json({
                    message: `${key} は 1〜5 の整数で入力してください`,
                });
                return;
            }
        }
        const existing = await prisma_1.default.lecEval.findUnique({
            where: { lecture_id_user_id: { lecture_id, user_id } },
        });
        if (!existing) {
            res.status(404).json({ message: "編集対象の評価が見つかりません" });
            return;
        }
        const updated = await prisma_1.default.lecEval.update({
            where: { lecture_id_user_id: { lecture_id, user_id } },
            data: {
                ...(attendance !== undefined && {
                    attendance: Number(attendance),
                }),
                ...(assignments !== undefined && {
                    assignments: Number(assignments),
                }),
                ...(exam_difficulty !== undefined && {
                    exam_difficulty: Number(exam_difficulty),
                }),
                ...(clarity !== undefined && { clarity: Number(clarity) }),
                ...(interest !== undefined && { interest: Number(interest) }),
                ...(easy_credit !== undefined && {
                    easy_credit: Number(easy_credit),
                }),
                ...(comment !== undefined && {
                    comment: typeof comment === "string" ? comment : null,
                }),
            },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("[eval update error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
exports.default = router;
