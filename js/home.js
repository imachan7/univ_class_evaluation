// Expected frontend host name. Keep this as localhost to avoid CORS mismatch.
// const FRONT_EXPECTED_HOST = "localhost";
// Backend API base URL.
// API_BASE_URL は config.js で定義
// Fixed grade (Information Engineering, Year 3).
const DEFAULT_GRADE = 3;
// Default term when URL term is missing/invalid (0 = Spring).
const DEFAULT_TERM = 0;
// Allowed term values (0 = Spring, 1 = Fall).
const ALLOWED_TERMS = new Set([0, 1]);

// In-memory slot map for the currently loaded timetable.
// Key format: "day-period" (example: "2-3" for Tuesday period 3).
let currentSlotMap = new Map();

/**
 * Convert any value to integer, or return fallback when conversion fails.
 * Usage: parseIntOrFallback("3", 0) => 3 / parseIntOrFallback("x", 0) => 0
 */
function parseIntOrFallback(value, fallback) {
  // Attempt numeric conversion.
  const n = Number(value);
  // Return parsed integer if valid; otherwise return fallback.
  return Number.isInteger(n) ? n : fallback;
}

/**
 * Normalize term value to allowed values (0 or 1).
 * Usage: parseTermOrDefault("1") => 1 / parseTermOrDefault("9") => 0
 */
function parseTermOrDefault(value) {
  // Parse as integer first.
  const term = parseIntOrFallback(value, DEFAULT_TERM);
  // Keep only allowed values.
  return ALLOWED_TERMS.has(term) ? term : DEFAULT_TERM;
}

/**
 * Normalize day number to range 1-5.
 * Usage: parseDayOrDefault("2") => 2 / parseDayOrDefault("9", 1) => 1
 */
function parseDayOrDefault(value, fallback = 1) {
  // Parse and range-check day.
  const day = parseIntOrFallback(value, fallback);
  // Clamp invalid values to fallback.
  return day >= 1 && day <= 5 ? day : fallback;
}

/**
 * Normalize period number to range 1-5.
 * Usage: parsePeriodOrDefault("4") => 4 / parsePeriodOrDefault("0", 1) => 1
 */
function parsePeriodOrDefault(value, fallback = 1) {
  // Parse and range-check period.
  const period = parseIntOrFallback(value, fallback);
  // Clamp invalid values to fallback.
  return period >= 1 && period <= 5 ? period : fallback;
}

/**
 * Read current term from URL query string and normalize it.
 * Usage: const term = getCurrentTermFromUrl();
 */
function getCurrentTermFromUrl() {
  // Read URL query parameters.
  const params = new URLSearchParams(window.location.search);
  // Return normalized term.
  return parseTermOrDefault(params.get("term"));
}

/**
 * Update URL query to fixed grade=3 and selected term, without page reload.
 * Usage: const safeTerm = updateHomeUrl(termSelect.value);
 */
function updateHomeUrl(term) {
  // Normalize input term value.
  const normalizedTerm = parseTermOrDefault(term);
  // Create URL object from current location.
  const url = new URL(window.location.href);
  // Set term query.
  url.searchParams.set("term", String(normalizedTerm));
  // Keep grade fixed at 3.
  url.searchParams.set("grade", String(DEFAULT_GRADE));
  // Replace URL in address bar without navigation.
  window.history.replaceState(null, "", url.toString());
  // Return normalized term for caller sync.
  return normalizedTerm;
}

/**
 * Force frontend host to localhost.
 * Usage: call once on DOMContentLoaded.
 */
function normalizeFrontendHost() {
  // LAN公開のためリダイレクトを無効化
  return;
}

/**
 * Build a slot map from lecture list for quick lookup by day-period.
 * Usage: const slotMap = buildSlotMap(lectures);
 */
function buildSlotMap(lectures) {
  // Create empty map for grouped lecture data.
  const map = new Map();

  // Process each lecture record from API.
  for (const lecture of lectures) {
    // Read day as number.
    const day = Number(lecture.day);
    // Read period as number.
    const period = Number(lecture.period);
    // Skip malformed records.
    if (!Number.isInteger(day) || !Number.isInteger(period)) {
      continue;
    }

    // Build slot key.
    const key = `${day}-${period}`;
    // Initialize slot array when first seen.
    if (!map.has(key)) {
      map.set(key, []);
    }
    // Push lecture into slot bucket.
    map.get(key).push(lecture);
  }

  // Return grouped slot map.
  return map;
}

/**
 * Split lecture name into Japanese and English lines.
 * Usage: const { japanese, english } = splitLectureName(lecture.lec_name);
 */
function splitLectureName(name) {
  // Normalize to trimmed string.
  const raw = String(name || "").trim();
  // Handle empty input.
  if (!raw) {
    return { japanese: "Unnamed Lecture", english: "" };
  }

  // Support "Japanese | English" format.
  const pipeParts = raw.split("|").map((part) => part.trim()).filter(Boolean);
  // Use first part as Japanese and remainder as English.
  if (pipeParts.length >= 2) {
    return {
      japanese: pipeParts[0],
      english: pipeParts.slice(1).join(" | "),
    };
  }

  // Support merged format like "情報ネットワークInformation Networks".
  const firstAsciiIndex = raw.search(/[A-Za-z]/);
  // Split at first ASCII character when found.
  if (firstAsciiIndex > 0) {
    return {
      japanese: raw.slice(0, firstAsciiIndex).trim(),
      english: raw.slice(firstAsciiIndex).trim(),
    };
  }

  // Fallback: Japanese only.
  return { japanese: raw, english: "" };
}

/**
 * Render timetable cell anchor text and store slot metadata for modal open.
 * Usage: renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade);
 */
function renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade) {
  // Keep anchor clickable without leaving the page.
  anchor.href = "#";
  // Save day metadata for click handling.
  anchor.dataset.day = String(day);
  // Save period metadata for click handling.
  anchor.dataset.period = String(period);
  // Save term metadata for click handling.
  anchor.dataset.term = String(term);
  // Save grade metadata for click handling.
  anchor.dataset.grade = String(grade);

  // Count lectures in this slot.
  const count = Array.isArray(lecturesInSlot) ? lecturesInSlot.length : 0;
  // Singular/plural label.
  const classLabel = count === 1 ? "class" : "classes";
  // Display count text.
  anchor.textContent = `${count} ${classLabel}`;
}

/**
 * Close the in-page lecture candidate modal.
 * Usage: closePeriodModal();
 */
function closePeriodModal() {
  // Resolve modal root.
  const modal = document.getElementById("period-modal");
  // Return when modal is not present.
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  // Hide modal section.
  modal.hidden = true;
  // Update aria-hidden for accessibility.
  modal.setAttribute("aria-hidden", "true");
  // Restore body scroll.
  document.body.style.overflow = "";
}

/**
 * Render lecture candidate buttons inside modal.
 * Usage: renderModalLectureButtons(lectures, context);
 */
function renderModalLectureButtons(lectures, context) {
  // Get modal button container.
  const container = document.getElementById("modal-lecture-buttons");
  // Stop if container is missing.
  if (!(container instanceof HTMLElement)) {
    return;
  }

  // Clear previous buttons.
  container.innerHTML = "";

  // When no lecture exists, leave container empty.
  if (!lectures.length) {
    return;
  }

  // Create one button link per lecture candidate.
  for (const lecture of lectures) {
    // Create clickable candidate link.
    const link = document.createElement("a");
    // Attach CSS class.
    link.className = "lecture-button";
    // Build destination URL for detail page.
    link.href = `detail_class.html?lecture_id=${lecture.id}&day=${context.day}&period=${context.period}&term=${context.term}&grade=${context.grade}`;

    // Extract display name safely.
    const lectureName = lecture.lec_name || "Unnamed Lecture";
    // Extract teacher display text.
    const teacherName = lecture.teacher ? lecture.teacher : "TBA";
    // Split name into Japanese and English lines.
    const { japanese, english } = splitLectureName(lectureName);

    // Create Japanese line span.
    const japaneseLine = document.createElement("span");
    // Make it block so it breaks line.
    japaneseLine.style.display = "block";
    // Set Japanese text.
    japaneseLine.textContent = japanese;
    // Append to button.
    link.appendChild(japaneseLine);

    // Add English line only when present.
    if (english) {
      // Create English line span.
      const englishLine = document.createElement("span");
      // Make it block so it breaks line.
      englishLine.style.display = "block";
      // Set English text.
      englishLine.textContent = english;
      // Append to button.
      link.appendChild(englishLine);
    }

    // Create instructor line span.
    const teacherLine = document.createElement("span");
    // Make it block so it breaks line.
    teacherLine.style.display = "block";
    // Set instructor text.
    teacherLine.textContent = `Instructor: ${teacherName}`;
    // Append to button.
    link.appendChild(teacherLine);

    // Append completed button to container.
    container.appendChild(link);
  }
}

/**
 * Open in-page modal for selected timetable slot.
 * Usage: openPeriodModal({ day: 1, period: 2, term: 0, grade: 3 });
 */
function openPeriodModal(context) {
  // Get modal root.
  const modal = document.getElementById("period-modal");
  // Stop if modal element is missing.
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  // Build slot key from clicked day/period.
  const slotKey = `${context.day}-${context.period}`;
  // Resolve lectures from current slot map.
  const lectures = currentSlotMap.get(slotKey) || [];
  // Render candidate buttons for this slot.
  renderModalLectureButtons(lectures, context);

  // Show modal.
  modal.hidden = false;
  // Update accessibility state.
  modal.setAttribute("aria-hidden", "false");
  // Prevent background scroll while modal is open.
  document.body.style.overflow = "hidden";

  // Focus the back button for keyboard users.
  const closeButton = document.getElementById("modal-back-button");
  if (closeButton instanceof HTMLButtonElement) {
    closeButton.focus();
  }
}

/**
 * Set up modal close events (back button, backdrop, Escape key).
 * Usage: setupPeriodModal();
 */
function setupPeriodModal() {
  // Resolve modal root once.
  const modal = document.getElementById("period-modal");
  // Resolve modal back button.
  const backButton = document.getElementById("modal-back-button");
  // Abort setup when required elements are missing.
  if (!(modal instanceof HTMLElement) || !(backButton instanceof HTMLButtonElement)) {
    return;
  }

  // Back button closes modal.
  backButton.addEventListener("click", () => {
    closePeriodModal();
  });

  // Click on backdrop area closes modal.
  modal.addEventListener("click", (event) => {
    // Resolve event target.
    const target = event.target;
    // Ignore non-element targets.
    if (!(target instanceof Element)) {
      return;
    }
    // Close only when backdrop is clicked.
    if (target.closest("[data-modal-close='true']")) {
      closePeriodModal();
    }
  });

  // Escape key closes modal.
  document.addEventListener("keydown", (event) => {
    // Trigger only for Escape key.
    if (event.key !== "Escape") {
      return;
    }
    // Skip when modal is currently hidden.
    if (modal.hidden) {
      return;
    }
    // Close modal.
    closePeriodModal();
  });
}

/**
 * Set up click navigation on timetable cells to open in-page modal.
 * Usage: setupCalendarModalNavigation();
 */
function setupCalendarModalNavigation() {
  // Resolve timetable table element.
  const table = document.querySelector(".calendar-home");
  // Exit when table is not found.
  if (!(table instanceof HTMLTableElement)) {
    return;
  }

  // Use event delegation for all cell anchors.
  table.addEventListener("click", (event) => {
    // Resolve click target.
    const target = event.target;
    // Ignore non-element targets.
    if (!(target instanceof Element)) {
      return;
    }

    // Find nearest anchor from clicked target.
    const anchor = target.closest("a");
    // Ignore clicks outside anchor.
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    // Prevent default anchor navigation.
    event.preventDefault();

    // Read day from data attribute and normalize.
    const day = parseDayOrDefault(anchor.dataset.day, 1);
    // Read period from data attribute and normalize.
    const period = parsePeriodOrDefault(anchor.dataset.period, 1);
    // Read term from data attribute and normalize.
    const term = parseTermOrDefault(anchor.dataset.term);
    // Grade is fixed to 3 by product rule.
    const grade = DEFAULT_GRADE;

    // Open in-page lecture candidate modal.
    openPeriodModal({ day, period, term, grade });
  });
}

/**
 * Initialize fixed department/grade and selectable term UI behavior.
 * Usage: setupHomeFilterForm();
 */
function setupHomeFilterForm() {
  // Resolve filter form.
  const form = document.getElementById("home-filter-form");
  // Resolve department select.
  const departmentSelect = document.getElementById("department-select");
  // Resolve grade select.
  const gradeSelect = document.getElementById("grade-select");
  // Resolve term select.
  const termSelect = document.getElementById("term-select");

  // Abort when required form controls are missing.
  if (!(form instanceof HTMLFormElement) ||
      !(departmentSelect instanceof HTMLSelectElement) ||
      !(gradeSelect instanceof HTMLSelectElement) ||
      !(termSelect instanceof HTMLSelectElement)) {
    return;
  }

  // Load current term from URL.
  const term = getCurrentTermFromUrl();
  // Keep grade fixed to Year 3.
  gradeSelect.value = String(DEFAULT_GRADE);
  // Keep department fixed to Information Engineering.
  departmentSelect.value = "information_engineering";
  // Reflect current term in select.
  termSelect.value = String(term);

  // Handle Apply button click.
  form.addEventListener("submit", (event) => {
    // Stop normal form submit/reload.
    event.preventDefault();
    // Normalize and write selected term into URL.
    const selectedTerm = updateHomeUrl(termSelect.value);
    // Sync select UI with normalized value.
    termSelect.value = String(selectedTerm);
    // Close modal if open to avoid stale slot display after term change.
    closePeriodModal();
    // Reload timetable for new term.
    loadCalendarLectures();
  });

  // Handle immediate reload when term changes.
  termSelect.addEventListener("change", () => {
    // Normalize and write selected term into URL.
    const selectedTerm = updateHomeUrl(termSelect.value);
    // Sync select UI with normalized value.
    termSelect.value = String(selectedTerm);
    // Close modal if open to avoid stale slot display after term change.
    closePeriodModal();
    // Reload timetable for new term.
    loadCalendarLectures();
  });
}

/**
 * Fetch lectures from backend and render timetable counts.
 * Usage: await loadCalendarLectures();
 */
async function loadCalendarLectures() {
  // Resolve timetable table.
  const table = document.querySelector(".calendar-home");
  // Abort if table is missing.
  if (!(table instanceof HTMLTableElement)) {
    return;
  }

  // Grade is fixed to 3.
  const grade = DEFAULT_GRADE;
  // Read current term from URL.
  const term = getCurrentTermFromUrl();

  try {
    // Build query with fixed grade and selected term.
    const query = new URLSearchParams({ grade: String(grade), term: String(term) });
    // Fetch lecture list from backend.
    const response = await fetch(`${API_BASE_URL}/lectures?${query.toString()}`);
    // Throw when HTTP status is not OK.
    if (!response.ok) {
      throw new Error(`Failed to fetch lectures: ${response.status}`);
    }

    // Parse JSON payload.
    const lectures = await response.json();
    // Validate expected array shape.
    if (!Array.isArray(lectures)) {
      throw new Error("Lecture response is not an array");
    }

    // Rebuild in-memory slot map for current term.
    currentSlotMap = buildSlotMap(lectures);

    // Collect all timetable rows.
    const rows = table.querySelectorAll("tbody tr");
    // Iterate each period row.
    rows.forEach((row, rowIndex) => {
      // Period index starts from 1.
      const period = rowIndex + 1;
      // Collect weekday cells in this row.
      const cells = row.querySelectorAll("td");
      // Iterate weekday cells.
      cells.forEach((cell, cellIndex) => {
        // Day index starts from 1.
        const day = cellIndex + 1;
        // Resolve lectures for this slot.
        const lecturesInSlot = currentSlotMap.get(`${day}-${period}`) || [];
        // If no lecture exists, keep cell empty and non-clickable.
        if (lecturesInSlot.length === 0) {
          cell.replaceChildren();
          return;
        }

        // Resolve existing anchor.
        let anchor = cell.querySelector("a");
        // Create anchor if it does not exist.
        if (!(anchor instanceof HTMLAnchorElement)) {
          anchor = document.createElement("a");
          cell.replaceChildren(anchor);
        }

        // Render count text and slot metadata.
        renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade);
      });
    });
  } catch (error) {
    // Keep diagnostics in console for development.
    console.error(error);
    // Clear slot map on failure to avoid stale data in modal.
    currentSlotMap = new Map();
  }
}

// Run initial setup after DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  // Ensure frontend host is normalized to localhost.
  normalizeFrontendHost();
  // Initialize term filter form behavior.
  setupHomeFilterForm();
  // Initialize in-page modal events.
  setupPeriodModal();
  // Initialize cell click-to-modal behavior.
  setupCalendarModalNavigation();
  // Load and render timetable data.
  loadCalendarLectures();
  // Set up logout button.
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton instanceof HTMLButtonElement) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("jwt");
      window.location.href = "login.html";
    });
  }
});
