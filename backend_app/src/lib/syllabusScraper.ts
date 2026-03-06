import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://syllabus.ict.nitech.ac.jp/search2.php';

export interface ScrapedCourse {
  category: string;
  code: string;      // 時間割番号 (例: 2601)
  fullCode: string;  // 時間割コード (例: 202512601)
  nameJa: string;
  nameEn: string;
  syllabusUrl: string;
  grade: string;
  credits: string;
  teacher: string;
  schedule: string;  // 例: 前期 火曜1-2限
}

export interface FetchSyllabusParams {
  nendo?: string;    // 年度 (例: '25')
  term?: string;     // 学期 (例: '前期', '後期', '' で全学期)
  category?: string; // 区分 (例: '工学部 情報工学科')
  nenzi?: string;    // 年次 (例: '3', '0' で全年次)
}

function parsePage(html: string): ScrapedCourse[] {
  const $ = cheerio.load(html);
  const courses: ScrapedCourse[] = [];

  $('table[bgcolor="lightgrey"] tr').not(':first-child').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 8) return;

    const shortnameFull = $(cells[1]).text().trim().split('\n').map((s: string) => s.trim()).filter(Boolean);
    const nameFull = $(cells[2]).text().trim().split('\n').map((s: string) => s.trim()).filter(Boolean);
    const syllabusLink = $(cells[3]).find('a').attr('href') || '';

    courses.push({
      category:    $(cells[0]).text().trim().replace(/\s+/g, ' '),
      code:        shortnameFull[0] || '',
      fullCode:    shortnameFull[1]?.replace(/[()]/g, '').trim() || '',
      nameJa:      nameFull[0] || '',
      nameEn:      nameFull[1] || '',
      syllabusUrl: syllabusLink,
      grade:       $(cells[4]).text().trim(),
      credits:     $(cells[5]).text().trim(),
      teacher:     $(cells[6]).text().trim(),
      schedule:    $(cells[7]).text().trim(),
    });
  });

  return courses;
}

function getTotalPages(html: string): number {
  const $ = cheerio.load(html);
  let maxPage = 1;
  $('.paging a').each((_, el) => {
    const match = $(el).attr('href')?.match(/paging\((\d+)\)/);
    if (match) {
      const page = parseInt(match[1], 10) + 1;
      if (page > maxPage) maxPage = page;
    }
  });
  return maxPage;
}

export async function fetchSyllabus(params: FetchSyllabusParams = {}): Promise<ScrapedCourse[]> {
  const {
    nendo    = '25',
    term     = '',
    category = '',
    nenzi    = '0',
  } = params;

  const basePostData: Record<string, string> = {
    sea_nendo:              nendo,
    sea_term:               term,
    sea_category:           category,
    sea_nenzi:              nenzi,
    sea_course_shortname:   '',
    sea_course_fullname:    '',
    sea_course_teachername: '',
    sea_keyword:            '',
    search_submit:          '検索',
    sort:                   'sea_course',
    searchsubmit:           'searchsubmit',
    sesskey:                '',
    perpage:                '20',
    sea_noinput_check:      '0',
    out_csv:                '0',
    sea_work_experience:    '0',
    sea_classmethod1:       '0',
    sea_classmethod2:       '0',
    sea_classmethod3:       '0',
  };

  const toFormData = (obj: Record<string, string>) => new URLSearchParams(obj).toString();

  const firstRes = await axios.post<string>(BASE_URL, toFormData({ ...basePostData, page: '0' }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const totalPages = getTotalPages(firstRes.data);
  let allCourses = parsePage(firstRes.data);

  for (let page = 1; page < totalPages; page++) {
    const res = await axios.post<string>(BASE_URL, toFormData({ ...basePostData, page: String(page) }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    allCourses = allCourses.concat(parsePage(res.data));
    await new Promise(r => setTimeout(r, 500));
  }

  return allCourses;
}
