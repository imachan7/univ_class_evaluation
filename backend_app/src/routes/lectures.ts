import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// クエリパラメータを安全に整数へ変換するヘルパー
function parseIntParam(param: unknown): number | null | undefined {
  if (param === undefined) return undefined;
  if (Array.isArray(param) || typeof param !== 'string' || param.trim() === '') return null;
  const n = Number(param.trim());
  return Number.isInteger(n) ? n : null;
}

// 講義一覧取得（クエリパラメータで絞り込み可）
router.get('/', async (req: Request, res: Response) => {
  try {
    const { day, period, grade, term } = req.query;

    const parsedDay    = parseIntParam(day);
    const parsedPeriod = parseIntParam(period);
    const parsedGrade  = parseIntParam(grade);
    const parsedTerm   = parseIntParam(term);

    if (parsedDay === null || parsedPeriod === null || parsedGrade === null || parsedTerm === null) {
      res.status(400).json({ message: 'クエリパラメータが不正です' });
      return;
    }

    const lectures = await prisma.lecture.findMany({
      where: {
        ...(parsedDay    !== undefined && { day:    parsedDay }),
        ...(parsedPeriod !== undefined && { period: parsedPeriod }),
        ...(parsedGrade  !== undefined && { grade:  parsedGrade }),
        ...(parsedTerm   !== undefined && { term:   parsedTerm }),
      },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    });

    res.json(lectures);
  } catch (err) {
    console.error('[lectures list error]', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// 講義詳細取得（評価の平均値付き）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ message: '講義IDが不正です' });
      return;
    }

    const lecture = await prisma.lecture.findUnique({ where: { id } });
    if (!lecture) {
      res.status(404).json({ message: '講義が見つかりません' });
      return;
    }

    const evals = await prisma.lecEval.findMany({ where: { lecture_id: id } });
    const total = evals.length;

    const avg = total === 0 ? null : {
      attendance:      avg_field(evals, 'attendance'),
      assignments:     avg_field(evals, 'assignments'),
      exam_difficulty: avg_field(evals, 'exam_difficulty'),
      clarity:         avg_field(evals, 'clarity'),
      interest:        avg_field(evals, 'interest'),
      easy_credit:     avg_field(evals, 'easy_credit'),
    };

    res.json({ ...lecture, total_evals: total, avg });
  } catch (err) {
    console.error('[lecture detail error]', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

type EvalKey = 'attendance' | 'assignments' | 'exam_difficulty' | 'clarity' | 'interest' | 'easy_credit';

function avg_field(evals: { [key: string]: unknown }[], field: EvalKey): number {
  const sum = evals.reduce((acc, e) => acc + (e[field] as number), 0);
  return Math.round((sum / evals.length) * 10) / 10;
}

export default router;
