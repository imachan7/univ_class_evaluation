// API_BASE_URL は config.js で定義

const params = new URLSearchParams(location.search);
const lectureId = params.get("lecture_id");

// 講義IDがなければ詳細ページへ戻す
if (!lectureId) {
  alert("講義IDが指定されていません。");
  window.location.href = "detail_class.html";
}

// Backリンクに講義IDを引き継ぐ
const backLink = document.getElementById("backLink");
if (backLink) {
  backLink.href = `detail_class.html?lecture_id=${encodeURIComponent(lectureId)}`;
}

document.getElementById("reviewForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("jwt");
  if (!token) {
    alert("ログインが必要です。");
    window.location.href = "login.html";
    return;
  }

  const form = e.target;
  const body = {
    attendance:      Number(form.attendance.value),
    assignments:     Number(form.assignments.value),
    exam_difficulty: Number(form.exam_difficulty.value),
    clarity:         Number(form.clarity.value),
    interest:        Number(form.interest.value),
    easy_credit:     Number(form.easy_credit.value),
    comment:         form.comment.value.trim() || null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/lectures/${encodeURIComponent(lectureId)}/evals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.status === 409) {
      // すでに評価済みの場合はPUTで更新
      const updateRes = await fetch(`${API_BASE_URL}/lectures/${encodeURIComponent(lectureId)}/evals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.message);
      }

      alert("評価を更新しました。");
      window.location.href = `detail_class.html?lecture_id=${encodeURIComponent(lectureId)}`;
      return;
    }

    if (!res.ok) {
      throw new Error(data.message);
    }

    alert("評価を送信しました。");
    window.location.href = `detail_class.html?lecture_id=${encodeURIComponent(lectureId)}`;
  } catch (err) {
    console.error(err);
    alert(`エラー: ${err.message}`);
  }
});
