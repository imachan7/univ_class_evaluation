import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

// ユーザー登録
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const grade = Number(req.body.grade);
    const course = Number(req.body.course);

    const isValidGrade = Number.isInteger(grade) && grade >= 1;
    const isValidCourse = Number.isInteger(course) && course >= 1;

    if (!email || !password || !name || !isValidGrade || !isValidCourse) {
      res.status(400).json({ message: '必須項目が不足しているか、型が正しくありません' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'このメールアドレスは既に使用されています' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash, name, grade, course },
    });

    res.status(201).json({ message: '登録完了', user_id: user.user_id });
  } catch (err) {
    console.error('[signup error]', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// ログイン
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'メールアドレスとパスワードを入力してください' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ message: 'サーバー設定エラーです' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています' });
      return;
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user_id: user.user_id, name: user.name });
  } catch (err) {
    console.error('[login error]', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

export default router;
