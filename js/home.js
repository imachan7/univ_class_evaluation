const FRONT_EXPECTED_HOST = "localhost";
const API_BASE_URL = "http://localhost:3000";
const DEFAULT_GRADE = 3;
const DEFAULT_TERM = 0;

function parseIntOrFallback(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
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

  if (!lecturesInSlot || lecturesInSlot.length === 0) {
    anchor.textContent = "No class selected - View candidates";
    return;
  }

  const uniqueLectureNames = [...new Set(
    lecturesInSlot.map((lecture) => escapeHtml(lecture.lec_name ?? "Unnamed Lecture"))
  )];

  anchor.innerHTML = `${uniqueLectureNames.join("<br>")}<br>View candidates`;
}

function openPeriodPopup(url) {
  const width = 900;
  const height = 700;
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

  const popup = window.open(
    url,
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
  const status = document.getElementById("calendar-status");

  if (!(form instanceof HTMLFormElement) ||
      !(departmentSelect instanceof HTMLSelectElement) ||
      !(gradeSelect instanceof HTMLSelectElement)) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const grade = parseIntOrFallback(params.get("grade"), DEFAULT_GRADE);
  gradeSelect.value = String(grade);
  departmentSelect.value = "information_engineering";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const department = departmentSelect.value;
    const selectedGrade = parseIntOrFallback(gradeSelect.value, DEFAULT_GRADE);
    const currentTerm = parseIntOrFallback(params.get("term"), DEFAULT_TERM);

    if (department === "information_engineering" && selectedGrade === 3) {
      window.location.href = `home.html?term=${currentTerm}&grade=${selectedGrade}`;
      return;
    }

    if (status) {
      status.textContent = "Currently supported: Information Engineering, Year 3 only.";
    }
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

  const params = new URLSearchParams(window.location.search);
  const grade = parseIntOrFallback(params.get("grade"), DEFAULT_GRADE);
  const term = parseIntOrFallback(params.get("term"), DEFAULT_TERM);

  if (status) {
    status.textContent = "Loading lectures from backend...";
  }

  try {
    const queries = [
      new URLSearchParams({ grade: String(grade), term: String(term) }),
      new URLSearchParams({ term: String(term) }),
      new URLSearchParams(),
    ];

    let lectures = [];
    let lastError = null;

    for (const query of queries) {
      try {
        const url = query.toString()
          ? `${API_BASE_URL}/lectures?${query.toString()}`
          : `${API_BASE_URL}/lectures`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch lectures: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Lecture response is not an array");
        }

        lectures = data;
        if (lectures.length > 0) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lectures.length === 0 && lastError) {
      throw lastError;
    }

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
