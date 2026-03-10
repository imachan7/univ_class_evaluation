const FRONT_EXPECTED_HOST = "localhost";
const API_BASE_URL = "http://localhost:3000";
const DEFAULT_GRADE = 3;
const DEFAULT_TERM = 0;
const ALLOWED_TERMS = new Set([0, 1]);
const PERIOD_POPUP_CONTEXT_KEY = "periodPopupContext";

const DAY_NAME_TO_NUMBER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

function parseIntOrFallback(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

function parseTermOrDefault(value) {
  const term = parseIntOrFallback(value, DEFAULT_TERM);
  return ALLOWED_TERMS.has(term) ? term : DEFAULT_TERM;
}

function parseDayOrDefault(value, fallback = 1) {
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (DAY_NAME_TO_NUMBER[lowered]) {
      return DAY_NAME_TO_NUMBER[lowered];
    }
  }

  const day = parseIntOrFallback(value, fallback);
  return day >= 1 && day <= 5 ? day : fallback;
}

function parsePeriodOrDefault(value, fallback = 1) {
  const period = parseIntOrFallback(value, fallback);
  return period >= 1 && period <= 5 ? period : fallback;
}

function getCurrentTermFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseTermOrDefault(params.get("term"));
}

function updateHomeUrl(term) {
  const normalizedTerm = parseTermOrDefault(term);
  const url = new URL(window.location.href);
  url.searchParams.set("term", String(normalizedTerm));
  url.searchParams.set("grade", String(DEFAULT_GRADE));
  window.history.replaceState(null, "", url.toString());
  return normalizedTerm;
}

function normalizeFrontendHost() {
  if (window.location.hostname === FRONT_EXPECTED_HOST) {
    return;
  }

  const targetUrl = `${window.location.protocol}//${FRONT_EXPECTED_HOST}:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(targetUrl);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSlotMap(lectures) {
  const map = new Map();

  for (const lecture of lectures) {
    const day = Number(lecture.day);
    const period = Number(lecture.period);
    if (!Number.isInteger(day) || !Number.isInteger(period)) {
      continue;
    }

    const key = `${day}-${period}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(lecture);
  }

  return map;
}

function renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade) {
  anchor.href = `period.html?day=${day}&period=${period}&term=${term}&grade=${grade}`;

  const count = Array.isArray(lecturesInSlot) ? lecturesInSlot.length : 0;
  const classLabel = count === 1 ? "class" : "classes";
  anchor.textContent = `${count} ${classLabel}`;
}

function openPeriodPopup(url) {
  const popupUrl = new URL(url, window.location.href);
  const context = {
    day: parseDayOrDefault(popupUrl.searchParams.get("day"), 1),
    period: parsePeriodOrDefault(popupUrl.searchParams.get("period"), 1),
    term: parseTermOrDefault(popupUrl.searchParams.get("term")),
    grade: DEFAULT_GRADE,
  };

  try {
    localStorage.setItem(PERIOD_POPUP_CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn("Failed to persist period popup context:", error);
  }

  const width = 900;
  const height = 700;
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

  const popup = window.open(
    popupUrl.toString(),
    "periodPopup",
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  if (!popup) {
    window.location.href = url;
  }
}

function setupCalendarPopupNavigation() {
  const table = document.querySelector(".calendar-home");
  if (!table) {
    return;
  }

  table.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a");
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    event.preventDefault();
    openPeriodPopup(anchor.href);
  });
}

function setupHomeFilterForm() {
  const form = document.getElementById("home-filter-form");
  const departmentSelect = document.getElementById("department-select");
  const gradeSelect = document.getElementById("grade-select");
  const termSelect = document.getElementById("term-select");

  if (!(form instanceof HTMLFormElement) ||
      !(departmentSelect instanceof HTMLSelectElement) ||
      !(gradeSelect instanceof HTMLSelectElement) ||
      !(termSelect instanceof HTMLSelectElement)) {
    return;
  }

  const term = getCurrentTermFromUrl();

  gradeSelect.value = String(DEFAULT_GRADE);
  departmentSelect.value = "information_engineering";
  termSelect.value = String(term);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedTerm = updateHomeUrl(termSelect.value);
    termSelect.value = String(selectedTerm);
    loadCalendarLectures();
  });

  termSelect.addEventListener("change", () => {
    const selectedTerm = updateHomeUrl(termSelect.value);
    termSelect.value = String(selectedTerm);
    loadCalendarLectures();
  });
}

async function loadCalendarLectures() {
  const table = document.querySelector(".calendar-home");
  if (!table) {
    return;
  }

  let status = document.getElementById("calendar-status");
  if (!status) {
    status = document.createElement("p");
    status.id = "calendar-status";
    table.parentElement?.insertBefore(status, table);
  }

  const grade = DEFAULT_GRADE;
  const term = getCurrentTermFromUrl();

  if (status) {
    status.textContent = "Loading lectures from backend...";
  }

  try {
    const query = new URLSearchParams({ grade: String(grade), term: String(term) });
    const response = await fetch(`${API_BASE_URL}/lectures?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lectures: ${response.status}`);
    }

    const lectures = await response.json();

    if (!Array.isArray(lectures)) {
      throw new Error("Lecture response is not an array");
    }

    const slotMap = buildSlotMap(lectures);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, rowIndex) => {
      const period = rowIndex + 1;
      const cells = row.querySelectorAll("td");

      cells.forEach((cell, cellIndex) => {
        const day = cellIndex + 1;
        let anchor = cell.querySelector("a");
        if (!anchor) {
          anchor = document.createElement("a");
          cell.replaceChildren(anchor);
        }

        const key = `${day}-${period}`;
        const lecturesInSlot = slotMap.get(key) || [];
        renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade);
      });
    });

    if (status) {
      status.textContent = `Loaded ${lectures.length} lectures (grade=${grade}, term=${term}).`;
    }
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent = "Failed to load lectures from backend. If you are using 127.0.0.1, switch to localhost and check CORS settings.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  normalizeFrontendHost();
  setupHomeFilterForm();
  setupCalendarPopupNavigation();
  loadCalendarLectures();
});
