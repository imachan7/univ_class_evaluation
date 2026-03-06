import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

const lectures = [
  // 前期 (term: 0)
  { lec_name: '情報ネットワーク', teacher: '布目 敏郎', day: 2, period: 1, grade: 3, term: 0 },
  { lec_name: '情報ネットワーク', teacher: '伊藤 嘉浩', day: 2, period: 1, grade: 3, term: 0 },
  { lec_name: '電気電子回路', teacher: '平野 智', day: 1, period: 4, grade: 3, term: 0 },
  { lec_name: 'プログラミング言語論', teacher: '福嶋 慶繁', day: 4, period: 3, grade: 3, term: 0 },
  { lec_name: 'マルチエージェントシステム', teacher: '櫻井 祐子', day: 5, period: 3, grade: 3, term: 0 },
  { lec_name: 'ウェブインテリジェンス', teacher: '白松 俊', day: 5, period: 2, grade: 3, term: 0 },
  { lec_name: '機械学習論', teacher: '烏山 昌幸', day: 1, period: 2, grade: 3, term: 0 },
  { lec_name: 'パターン認識', teacher: '本谷 秀堅', day: 4, period: 2, grade: 3, term: 0 },
  { lec_name: '画像情報処理', teacher: '佐藤 淳', day: 1, period: 3, grade: 3, term: 0 },
  { lec_name: '言語処理工学', teacher: '李 晃伸', day: 4, period: 4, grade: 3, term: 0 },
  { lec_name: 'プログラミング応用', teacher: '福嶋 慶繁', day: 2, period: 3, grade: 3, term: 0 },
  { lec_name: 'ネットワーク系演習Ⅰ', teacher: '小泉 透', day: 3, period: 1, grade: 3, term: 0 },
  { lec_name: '知能プログラミング演習Ⅰ', teacher: '加藤 昇平', day: 3, period: 1, grade: 3, term: 0 },
  { lec_name: 'メディア系演習Ⅰ', teacher: '分野全教員', day: 5, period: 2, grade: 3, term: 0 },
  { lec_name: 'ソフトウェア工学', teacher: '玉木 徹', day: 4, period: 1, grade: 3, term: 0 },
  // 後期 (term: 1)
  { lec_name: '実践研究セミナー', teacher: '情報工学科全教員', day: 3, period: 3, grade: 3, term: 1 },
  { lec_name: '分散システム論', teacher: '布目 敏郎', day: 4, period: 1, grade: 3, term: 1 },
  { lec_name: '知識表現と推論', teacher: '加藤 昇平', day: 2, period: 2, grade: 3, term: 1 },
  { lec_name: '知識表現と推論', teacher: '加藤 昇平', day: 2, period: 1, grade: 3, term: 1 },
  { lec_name: 'データベース論', teacher: '白松 俊', day: 3, period: 2, grade: 3, term: 1 },
  { lec_name: 'データベース論', teacher: '犬塚 信博', day: 2, period: 3, grade: 3, term: 1 },
  { lec_name: '知能ロボット制御論', teacher: '加藤 昇平', day: 5, period: 2, grade: 3, term: 1 },
  { lec_name: '音声情報処理', teacher: '徳田 恵一', day: 1, period: 4, grade: 3, term: 1 },
  { lec_name: '情報セキュリティ', teacher: '齋藤 彰一', day: 2, period: 3, grade: 3, term: 1 },
  { lec_name: 'メディアセンシング', teacher: '黒柳 奨', day: 4, period: 2, grade: 3, term: 1 },
  { lec_name: '情報セキュリティ', teacher: '齋藤 彰一', day: 3, period: 2, grade: 3, term: 1 },
  { lec_name: 'ネットワーク系演習Ⅱ', teacher: '中井 彩乃', day: 5, period: 3, grade: 3, term: 1 },
  { lec_name: '知能プログラミング演習Ⅱ', teacher: '大囿 忠親', day: 1, period: 2, grade: 3, term: 1 },
  { lec_name: 'メディア系演習Ⅱ', teacher: '分野全教員', day: 5, period: 3, grade: 3, term: 1 },
  { lec_name: '知識システム', teacher: '大囿 忠親', day: 4, period: 3, grade: 3, term: 1 },
];

async function main() {
  console.log('既存の講義データを削除中...');
  await prisma.lecture.deleteMany();
  console.log('シードデータを投入中...');
  await prisma.lecture.createMany({ data: lectures });
  console.log(`${lectures.length} 件の講義データを投入しました`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
