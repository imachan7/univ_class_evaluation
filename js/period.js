const PERIOD_API_BASE_URL = "http://localhost:3000";
const PERIOD_POPUP_CONTEXT_KEY = "periodPopupContext";

const DAY_NAME_TO_NUMBER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

function parseNumericOrDefault(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

function parseTermOrDefault(value) {
  const term = parseNumericOrDefault(value, 0);
  return term === 1 ? 1 : 0;
}

function parsePeriodOrDefault(value) {
  const period = parseNumericOrDefault(value, 1);
  return period >= 1 && period <= 5 ? period : 1;
}

function parseDayParam(dayValue) {
  if (!dayValue) {
    return 1;
  }

  const lowered = String(dayValue).toLowerCase();
  if (DAY_NAME_TO_NUMBER[lowered]) {
    return DAY_NAME_TO_NUMBER[lowered];
  }

  const day = parseNumericOrDefault(dayValue, 1);
  return day >= 1 && day <= 5 ? day : 1;
}

function readStoredPopupContext() {
  try {
    const raw = localStorage.getItem(PERIOD_POPUP_CONTEXT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const day = parseDayParam(parsed.day);
    const period = parsePeriodOrDefault(parsed.period);
    const term = parseTermOrDefault(parsed.term);

    return { day, period, term, grade: 3 };
  } catch (error) {
    console.warn("Failed to read period popup context:", error);
    return null;
  }
}

function getPeriodQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const hasDay = params.has("day");
  const hasPeriod = params.has("period");

  if (hasDay && hasPeriod) {
    const day = parseDayParam(params.get("day"));
    const period = parsePeriodOrDefault(params.get("period"));
    const term = parseTermOrDefault(params.get("term"));
    return { day, period, term, grade: 3 };
  }

  const stored = readStoredPopupContext();
  if (stored) {
    return stored;
  }

  const day = parseDayParam(params.get("day"));
  const period = parsePeriodOrDefault(params.get("period"));
  const term = parseTermOrDefault(params.get("term"));
  return { day, period, term, grade: 3 };
}

function setupBackButton(context) {
  const button = document.getElementById("back-button");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.addEventListener("click", () => {
    const homeUrl = `home.html?term=${context.term}&grade=${context.grade}`;

    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = homeUrl;
  });
}

function renderLectureButtons(lectures, context) {
  const container = document.getElementById("lecture-buttons");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!lectures.length) {
    return;
  }

  for (const lecture of lectures) {
    const link = document.createElement("a");
    link.className = "lecture-button";
    link.href = `detail_class.html?lecture_id=${lecture.id}&day=${context.day}&period=${context.period}&term=${context.term}&grade=${context.grade}`;

    const lectureName = lecture.lec_name || "Unnamed Lecture";
    const teacherName = lecture.teacher ? lecture.teacher : "TBA";
    link.textContent = `${lectureName} / Instructor: ${teacherName}`;
    container.appendChild(link);
  }
}

async function loadPeriodLectures() {
  const context = getPeriodQueryParams();
  setupBackButton(context);

  try {
    const query = new URLSearchParams({
      day: String(context.day),
      period: String(context.period),
      term: String(context.term),
      grade: String(context.grade),
    });

    const response = await fetch(`${PERIOD_API_BASE_URL}/lectures?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lectures: ${response.status}`);
    }

    const lectures = await response.json();
    if (!Array.isArray(lectures)) {
      throw new Error("Lecture response is not an array");
    }

    renderLectureButtons(lectures, context);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPeriodLectures();
});
