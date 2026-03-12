const params = new URLSearchParams(location.search);
const lectureId = params.get("serial_num");

const API = "http://localhost:3000";

const backLink = document.getElementById("backLink");
const lectureNameEl = document.getElementById("lectureName");
const teacherNameEl = document.getElementById("teacherName");
const evalListEl = document.getElementById("evalList");

const averageAttendanceEl = document.getElementById("averageAttendance");
const averageAssignmentsEl = document.getElementById("averageAssignments");
const averageExamDifficultyEl = document.getElementById("averageExamDifficulty");
const averageClarityEl = document.getElementById("averageClarity");
const averageInterestEl = document.getElementById("averageInterest");
const averageEasyCreditEl = document.getElementById("averageEasyCredit");

if (!lectureId) {

    lectureNameEl.textContent = "Error";
    teacherNameEl.textContent = "講義IDが指定されていません。";

    evalListEl.innerHTML =
        '<p class="error">URLに serial_num がありません。例: review.html?serial_num=12</p>';

} else {

    backLink.href = `detail_class.html?serial_num=${encodeURIComponent(lectureId)}`;

    loadPage();
}

async function loadPage() {
    try {

        await loadLectureInfo();
        await loadEvals();

    } catch (error) {

        console.error(error);

        evalListEl.innerHTML =
            '<p class="error">データの取得に失敗しました。</p>';
    }
}

async function loadLectureInfo() {

    const res = await fetch(`${API}/lectures/${encodeURIComponent(lectureId)}`);

    if (!res.ok) {
        throw new Error("講義情報の取得に失敗しました");
    }

    const data = await res.json();

    lectureNameEl.textContent = data.lec_name ?? "Class Name";
    teacherNameEl.textContent = `Teacher : ${data.teacher ?? "-"}`;

    const avg = data.average ?? data.avg ?? null;

    if (avg) {

        averageAttendanceEl.textContent =
            `Attendance Required : ${formatAverage(avg.attendance)}`;

        averageAssignmentsEl.textContent =
            `Assignments Amount : ${formatAverage(avg.assignments)}`;

        averageExamDifficultyEl.textContent =
            `Exam / Report Difficulty : ${formatAverage(avg.exam_difficulty)}`;

        averageClarityEl.textContent =
            `Clarity : ${formatAverage(avg.clarity)}`;

        averageInterestEl.textContent =
            `Interest : ${formatAverage(avg.interest)}`;

        averageEasyCreditEl.textContent =
            `Easy Credit : ${formatAverage(avg.easy_credit)}`;

    }
}

async function loadEvals() {

    const res =
        await fetch(`${API}/lectures/${encodeURIComponent(lectureId)}/evals`);

    if (!res.ok) {
        throw new Error("評価一覧の取得に失敗しました");
    }

    const data = await res.json();

    evalListEl.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {

        evalListEl.innerHTML =
            '<p class="empty">まだ評価がありません。</p>';

        return;
    }

    data.forEach((evaluation, index) => {

        const card = document.createElement("div");

        card.className = "evaluation-card";

        const userGrade = evaluation.user?.grade ?? "-";
        const userCourse = evaluation.user?.course ?? "-";

        const attendance = evaluation.attendance ?? "-";
        const assignments = evaluation.assignments ?? "-";
        const examDifficulty = evaluation.exam_difficulty ?? "-";
        const clarity = evaluation.clarity ?? "-";
        const interest = evaluation.interest ?? "-";
        const easyCredit = evaluation.easy_credit ?? "-";

        const comment = evaluation.comment ?? "";

        card.innerHTML = `
            <h3>Evaluation ${index + 1}</h3>

            <p><strong>Grade:</strong> ${escapeHtml(String(userGrade))}</p>

            <p><strong>Course:</strong> ${escapeHtml(String(userCourse))}</p>

            <p><strong>Attendance Required:</strong> ${escapeHtml(String(attendance))}</p>

            <p><strong>Assignments Amount:</strong> ${escapeHtml(String(assignments))}</p>

            <p><strong>Exam / Report Difficulty:</strong> ${escapeHtml(String(examDifficulty))}</p>

            <p><strong>Clarity:</strong> ${escapeHtml(String(clarity))}</p>

            <p><strong>Interest:</strong> ${escapeHtml(String(interest))}</p>

            <p><strong>Easy Credit:</strong> ${escapeHtml(String(easyCredit))}</p>

            <p><strong>Comment:</strong></p>

            <div class="comment">${escapeHtml(String(comment))}</div>
        `;

        evalListEl.appendChild(card);
    });
}

function formatAverage(value) {

    if (typeof value !== "number") {
        return "-";
    }

    return value.toFixed(2);
}

function escapeHtml(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}