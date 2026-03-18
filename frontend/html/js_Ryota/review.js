// API_BASE_URL は config.js で定義

const params = new URLSearchParams(location.search);
const lectureId = params.get("lecture_id");

const backLink = document.getElementById("backLink");
const lectureNameEl = document.getElementById("lectureName");
const messageTextEl = document.getElementById("messageText");
const evalListEl = document.getElementById("evalList");

if (!lectureId) {
  alert("講義IDが指定されていません。");
  window.location.href = "detail_class.html";
} else {
  backLink.href = `detail_class.html?lecture_id=${encodeURIComponent(lectureId)}`;
  loadReviews();
}

async function loadReviews() {
  try {
    // 講義名を取得
    const lectureRes = await fetch(`${API_BASE_URL}/lectures/${encodeURIComponent(lectureId)}`);
    if (lectureRes.ok) {
      const lecture = await lectureRes.json();
      lectureNameEl.textContent = lecture.lec_name ?? "Lecture";
    }

    // 評価一覧を取得
    const res = await fetch(`${API_BASE_URL}/lectures/${encodeURIComponent(lectureId)}/evals`);
    if (!res.ok) throw new Error(`取得失敗 (${res.status})`);

    const evals = await res.json();

    if (!Array.isArray(evals) || evals.length === 0) {
      messageTextEl.textContent = "まだ評価がありません。";
      return;
    }

    messageTextEl.textContent = `${evals.length}件の評価`;

    evalListEl.innerHTML = evals.map((e, i) => `
      <div style="border:1px solid #ccc; padding:12px; margin:8px 0;">
        <strong>#${i + 1}</strong>
        <ul>
          <li>Attendance Required: ${e.attendance ?? "-"}</li>
          <li>Assignments Amount: ${e.assignments ?? "-"}</li>
          <li>Exam / Report Difficulty: ${e.exam_difficulty ?? "-"}</li>
          <li>Clarity: ${e.clarity ?? "-"}</li>
          <li>Interest: ${e.interest ?? "-"}</li>
          <li>Easy Credit: ${e.easy_credit ?? "-"}</li>
        </ul>
        ${e.comment ? `<p>Comment: ${escapeHtml(e.comment)}</p>` : ""}
        <small>${new Date(e.created_at).toLocaleDateString("ja-JP")}</small>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    messageTextEl.textContent = `エラー: ${err.message}`;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
