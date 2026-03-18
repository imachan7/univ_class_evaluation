"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSyllabus = fetchSyllabus;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const BASE_URL = 'https://syllabus.ict.nitech.ac.jp/search2.php';
function parsePage(html) {
    const $ = cheerio.load(html);
    const courses = [];
    $('table[bgcolor="lightgrey"] tr').not(':first-child').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 8)
            return;
        const shortnameFull = $(cells[1]).text().trim().split('\n').map((s) => s.trim()).filter(Boolean);
        const nameFull = $(cells[2]).text().trim().split('\n').map((s) => s.trim()).filter(Boolean);
        const syllabusLink = $(cells[3]).find('a').attr('href') || '';
        courses.push({
            category: $(cells[0]).text().trim().replace(/\s+/g, ' '),
            code: shortnameFull[0] || '',
            fullCode: shortnameFull[1]?.replace(/[()]/g, '').trim() || '',
            nameJa: nameFull[0] || '',
            nameEn: nameFull[1] || '',
            syllabusUrl: syllabusLink,
            grade: $(cells[4]).text().trim(),
            credits: $(cells[5]).text().trim(),
            teacher: $(cells[6]).text().trim(),
            schedule: $(cells[7]).text().trim(),
        });
    });
    return courses;
}
function getTotalPages(html) {
    const $ = cheerio.load(html);
    let maxPage = 1;
    $('.paging a').each((_, el) => {
        const match = $(el).attr('href')?.match(/paging\((\d+)\)/);
        if (match) {
            const page = parseInt(match[1], 10) + 1;
            if (page > maxPage)
                maxPage = page;
        }
    });
    return maxPage;
}
async function fetchSyllabus(params = {}) {
    const { nendo = '25', term = '', category = '', nenzi = '0', } = params;
    const basePostData = {
        sea_nendo: nendo,
        sea_term: term,
        sea_category: category,
        sea_nenzi: nenzi,
        sea_course_shortname: '',
        sea_course_fullname: '',
        sea_course_teachername: '',
        sea_keyword: '',
        search_submit: '検索',
        sort: 'sea_course',
        searchsubmit: 'searchsubmit',
        sesskey: '',
        perpage: '20',
        sea_noinput_check: '0',
        out_csv: '0',
        sea_work_experience: '0',
        sea_classmethod1: '0',
        sea_classmethod2: '0',
        sea_classmethod3: '0',
    };
    const toFormData = (obj) => new URLSearchParams(obj).toString();
    const firstRes = await axios_1.default.post(BASE_URL, toFormData({ ...basePostData, page: '0' }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const totalPages = getTotalPages(firstRes.data);
    let allCourses = parsePage(firstRes.data);
    for (let page = 1; page < totalPages; page++) {
        const res = await axios_1.default.post(BASE_URL, toFormData({ ...basePostData, page: String(page) }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        allCourses = allCourses.concat(parsePage(res.data));
        await new Promise(r => setTimeout(r, 500));
    }
    return allCourses;
}
