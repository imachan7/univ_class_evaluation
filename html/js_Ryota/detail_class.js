const API_BASE_URL = "http://localhost:3000";

const params = new URLSearchParams(location.search);
const lectureId = params.get("serial_num");

const lectureNameEl = document.getElementById("lectureName");
const teacherNameEl = document.getElementById("teacherName");
const lectureMetaEl = document.getElementById("lectureMeta");
const messageTextEl = document.getElementById("messageText");

const avgAttendanceEl = document.getElementById("avgAttendance");
const avgAssignmentsEl = document.getElementById("avgAssignments");
const avgExamDifficultyEl = document.getElementById("avgExamDifficulty");
const avgClarityEl = document.getElementById("avgClarity");
const avgInterestEl = document.getElementById("avgInterest");
const avgEasyCreditEl = document.getElementById("avgEasyCredit");

const reviewLinkEl = document.getElementById("reviewLink");
const feedbackLinkEl = document.getElementById("feedbackLink");
const backLinkEl = document.getElementById("backLink");

if (!lectureId) {
  showError("URLに ?serial_num=講義ID を付けてください");
} else {
  reviewLinkEl.href = `review.html?serial_num=${encodeURIComponent(lectureId)}`;
  feedbackLinkEl.href = `feedback.html?serial_num=${encodeURIComponent(lectureId)}`;
  backLinkEl.href = "period_classes.html";
  loadLectureDetail();
}

async function loadLectureDetail() {
  try {
    messageTextEl.classList.remove("error");

    const response = await fetch(`${API_BASE_URL}/lectures/${encodeURIComponent(lectureId)}`);

    if (!response.ok) {
      throw new Error("講義情報の取得に失敗しました");
    }

    const lecture = await response.json();

    lectureNameEl.textContent = lecture.lec_name ?? "Class Name";
    teacherNameEl.textContent = `Teacher : ${lecture.teacher ?? "-"}`;

    const metaParts = [];

    if (typeof lecture.grade === "number")
      metaParts.push(`Grade : ${lecture.grade}`);

    if (lecture.term === 0)
      metaParts.push("Term : First");
    else if (lecture.term === 1)
      metaParts.push("Term : Second");

    if (typeof lecture.day === "number")
      metaParts.push(`Day : ${formatDay(lecture.day)}`);

    if (typeof lecture.period === "number")
      metaParts.push(`Period : ${lecture.period}`);

    lectureMetaEl.textContent = metaParts.join(" / ");

    const average = lecture.average ?? lecture.avg ?? null;

    if (average) {
      avgAttendanceEl.textContent = `Attendance Required : ${formatAverage(average.attendance)}`;
      avgAssignmentsEl.textContent = `Assignments Amount : ${formatAverage(average.assignments)}`;
      avgExamDifficultyEl.textContent = `Exam Difficulty : ${formatAverage(average.exam_difficulty)}`;
      avgClarityEl.textContent = `Clarity : ${formatAverage(average.clarity)}`;
      avgInterestEl.textContent = `Interest : ${formatAverage(average.interest)}`;
      avgEasyCreditEl.textContent = `Easy Credit : ${formatAverage(average.easy_credit)}`;
      messageTextEl.textContent = "講義情報を読み込みました";
    } else {
      resetAverageDisplay();
      messageTextEl.textContent = "平均評価はまだありません";
    }
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

function formatAverage(value) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function formatDay(day) {
  const dayMap = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
  };
  return dayMap[day] ?? String(day);
}

function resetAverageDisplay() {
  avgAttendanceEl.textContent = "Attendance Required : -";
  avgAssignmentsEl.textContent = "Assignments Amount : -";
  avgExamDifficultyEl.textContent = "Exam Difficulty : -";
  avgClarityEl.textContent = "Clarity : -";
  avgInterestEl.textContent = "Interest : -";
  avgEasyCreditEl.textContent = "Easy Credit : -";
}

function showError(message) {
  lectureNameEl.textContent = "Error";
  teacherNameEl.textContent = "";
  lectureMetaEl.textContent = "";
  resetAverageDisplay();
  messageTextEl.textContent = message;
  messageTextEl.classList.add("error");
}