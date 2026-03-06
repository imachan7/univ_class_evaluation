import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error("Not allowed by CORS"), { status: 403 }));
    },
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

// グローバルエラーハンドラ
app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const status = err.status ?? 500;
  const message = status === 403 ? 'このオリジンからのアクセスは許可されていません' : 'サーバーエラーが発生しました';
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
