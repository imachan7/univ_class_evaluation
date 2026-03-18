"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const lectures_1 = __importDefault(require("./routes/lectures"));
const evals_1 = __importDefault(require("./routes/evals"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
//cors回避のためのコード
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.length === 0)
            return callback(null, true);
        // フロントエンドからのアクセスを許可するためのワイルドカード（開発中のみ）
        // 本番環境では特定のドメインのみ許可するように変更してください
        // 一時的に全てのオリジンを許可して疎通確認を行う
        return callback(null, true);
        /*
        if (process.env.NODE_ENV !== "production" || origin.includes("azurestaticapps.net") || origin.includes("localhost")) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(
          Object.assign(new Error("Not allowed by CORS"), { status: 403 }),
        );
        */
    },
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello from Univ Class Evaluation API!");
});
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
app.use("/auth", auth_1.default);
app.use("/lectures", lectures_1.default);
app.use("/lectures/:id/evals", evals_1.default);
app.use("/users", users_1.default);
// グローバルエラーハンドラ
app.use((err, req, res, _next) => {
    console.error(err.stack);
    const status = err.status ?? 500;
    const message = status === 403
        ? "このオリジンからのアクセスは許可されていません"
        : "サーバーエラーが発生しました";
    res.status(status).json({ message });
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
