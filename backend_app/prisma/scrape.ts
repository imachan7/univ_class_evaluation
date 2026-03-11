import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';
import { fetchSyllabus, ScrapedCourse } from '../src/lib/syllabusScraper';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

const DAY_MAP: Record<string, number> = {
  '月曜': 1, '火曜': 2, '水曜': 3, '木曜': 4, '金曜': 5,
};
const PERIOD_MAP: Record<string, number> = {
  '1': 1, '3': 2, '5': 3, '7': 4, '9': 5,
};
const TERM_MAP: Record<string, number> = {
  '前期': 0, '後期': 1,
};

function parseSchedule(schedule: string): { term: number; day: number; period: number } | null {
  const termKey = Object.keys(TERM_MAP).find(k => schedule.includes(k));
  const dayKey  = Object.keys(DAY_MAP).find(k => schedule.includes(k));
  const m       = schedule.match(/(\d+)-\d+限/);
  if (!termKey || !dayKey || !m) return null;
  const period = PERIOD_MAP[m[1]];
  if (!period) return null;
  return { term: TERM_MAP[termKey], day: DAY_MAP[dayKey], period };
}

function toRecord(course: ScrapedCourse, grade: number) {
  const schedule = parseSchedule(course.schedule);
  if (!schedule) return null;
  return {
    lec_name: course.nameJa,
    teacher:  course.teacher.replace(/\s*他$/, '').trim(),
    grade,
    ...schedule,
  };
}

async function main() {
  const gradeStr = process.argv[2] ?? '3';
  const grade = parseInt(gradeStr, 10);
  if (!Number.isInteger(grade) || grade < 1) {
    console.error('使い方: npm run scrape [年次]  例: npm run scrape 3');
    process.exit(1);
  }

  console.log(`${grade}年次の講義データを取得中...`);
  const courses: ScrapedCourse[] = [];
  for (const term of ['前期', '後期']) {
    console.log(`  ${term}を取得中...`);
    const result = await fetchSyllabus({
      nendo: '25',
      term,
      category: '工学部 情報工学科',
      nenzi: String(grade),
    });
    courses.push(...result);
  }
  console.log(`取得完了: ${courses.length} 件`);

  const records = courses.map(c => toRecord(c, grade)).filter(Boolean) as NonNullable<ReturnType<typeof toRecord>>[];
  console.log(`DBに保存可能: ${records.length} 件（時間割不明のものを除外）`);

  // 同じ学年の既存データを削除してから投入
  await prisma.$transaction(async (tx) => {
    const existing = await tx.lecture.findMany({ where: { grade }, select: { id: true } });
    const ids = existing.map(l => l.id);
    if (ids.length > 0) {
      await tx.lecEval.deleteMany({ where: { lecture_id: { in: ids } } });
      await tx.lecture.deleteMany({ where: { grade } });
      console.log(`既存の ${ids.length} 件を削除しました`);
    }
    await tx.lecture.createMany({ data: records });
  });

  console.log(`✅ ${records.length} 件の講義データをDBに保存しました`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
