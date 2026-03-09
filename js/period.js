const PERIOD_API_BASE_URL = "http://localhost:3000";

const DAY_NAME_TO_NUMBER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

const DAY_NUMBER_TO_NAME = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

function parseNumericOrDefault(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

function parseDayParam(dayValue) {
  if (!dayValue) {
    return 1;
  }

  const lowered = String(dayValue).toLowerCase();
  if (DAY_NAME_TO_NUMBER[lowered]) {
    return DAY_NAME_TO_NUMBER[lowered];
  }

  return parseNumericOrDefault(dayValue, 1);
}

function getPeriodQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const day = parseDayParam(params.get("day"));
  const period = parseNumericOrDefault(params.get("period"), 1);
  const term = parseNumericOrDefault(params.get("term"), 0);
  const grade = parseNumericOrDefault(params.get("grade"), 3);

  return { day, period, term, grade };
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

function setContextLabel(context) {
  const contextEl = document.getElementById("period-context");
  if (!contextEl) {
    return;
  }

  const dayName = DAY_NUMBER_TO_NAME[context.day] || "Unknown Day";
  contextEl.textContent = `Selected slot: ${dayName}, Period ${context.period} (Term ${context.term}, Grade ${context.grade})`;
}

function renderLectureButtons(lectures, context) {
  const container = document.getElementById("lecture-buttons");
  const status = document.getElementById("period-status");
  if (!container || !status) {
    return;
  }

  container.innerHTML = "";

  if (!lectures.length) {
    status.textContent = "No lecture candidates found for this slot.";
    return;
  }

  for (const lecture of lectures) {
    const link = document.createElement("a");
    link.className = "lecture-button";
    link.href = `detail_class.html?lecture_id=${lecture.id}&day=${context.day}&period=${context.period}&term=${context.term}&grade=${context.grade}`;
    link.textContent = lecture.lec_name || "Unnamed Lecture";
    container.appendChild(link);
  }

  status.textContent = `Loaded ${lectures.length} lecture candidate(s).`;
}

async function loadPeriodLectures() {
  const context = getPeriodQueryParams();
  setContextLabel(context);
  setupBackButton(context);

  const status = document.getElementById("period-status");
  if (status) {
    status.textContent = "Loading lectures...";
  }

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
    const statusEl = document.getElementById("period-status");
    if (statusEl) {
      statusEl.textContent = "Failed to load lecture candidates.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPeriodLectures();
});
