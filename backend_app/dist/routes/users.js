"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 自分のプロフィール取得（要認証）
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { user_id: req.user_id },
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
    }
    catch (err) {
        console.error("[user me error]", err);
        res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
});
exports.default = router;
