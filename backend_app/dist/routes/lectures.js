"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
// クエリパラメータを安全に整数へ変換するヘルパー
function parseIntParam(param) {
    if (param === undefined)
        return undefined;
    if (Array.isArray(param) ||
        typeof param !== "string" ||
        param.trim() === "")
        return null;
    const n = Number(param.trim());
    return Number.isInteger(n) ? n : null;
}
// 講義一覧取得（クエリパラメータで絞り込み可）
router.get("/", async (req, res) => {
    try {
        const { day, period, grade, term } = req.query;
        const parsedDay = parseIntParam(day);
        const parsedPeriod = parseIntParam(period);
        const parsedGrade = parseIntParam(grade);
        const parsedTerm = parseIntParam(term);
        if (parsedDay === null ||
            parsedPeriod === null ||
            parsedGrade === null ||
            parsedTerm === null) {
            res.status(400).json({ message: "クエリパラメータが不正です" });
            return;
        }
        const lectures = await prisma_1.default.lecture.findMany({
            where: {
                ...(parsedDay !== undefined && { day: parsedDay }),
                ...(parsedPeriod !== undefined && { period: parsedPeriod }),
                ...(parsedGrade !== undefined && { grade: parsedGrade }),
                ...(parsedTerm !== undefined && { term: parsedTerm }),
            },
            orderBy: [{ day: "asc" }, { period: "asc" }],
        });
        res.json(lectures);
    }
    catch (err) {
        console.error("[lectures list error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
// 講義詳細取得（評価の平均値付き）
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            res.status(400).json({ message: "講義IDが不正です" });
            return;
        }
        const lecture = await prisma_1.default.lecture.findUnique({ where: { id } });
        if (!lecture) {
            res.status(404).json({ message: "講義が見つかりません" });
            return;
        }
        const evals = await prisma_1.default.lecEval.findMany({
            where: { lecture_id: id },
        });
        const total = evals.length;
        const avg = total === 0
            ? null
            : {
                attendance: avg_field(evals, "attendance"),
                assignments: avg_field(evals, "assignments"),
                exam_difficulty: avg_field(evals, "exam_difficulty"),
                clarity: avg_field(evals, "clarity"),
                interest: avg_field(evals, "interest"),
                easy_credit: avg_field(evals, "easy_credit"),
            };
        res.json({ ...lecture, total_evals: total, avg });
    }
    catch (err) {
        console.error("[lecture detail error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
function avg_field(evals, field) {
    const sum = evals.reduce((acc, e) => acc + e[field], 0);
    return Math.round((sum / evals.length) * 10) / 10;
}
exports.default = router;
