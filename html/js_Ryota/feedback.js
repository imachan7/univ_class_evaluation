const params = new URLSearchParams(location.search);
const lectureId = params.get("serial_num");

const API = "http://localhost:3000";

const formEl = document.getElementById("evalForm");

if (!lectureId) {
    alert("URLに serial_num がありません。例: feedback.html?serial_num=12");
} else {
    formEl.addEventListener("submit", async e => {
        e.preventDefault();

        const form = new FormData(e.target);

        const body = {
            attendance: Number(form.get("attendance")),
            assignments: Number(form.get("assignments")),
            exam_difficulty: Number(form.get("exam_difficulty")),
            clarity: Number(form.get("clarity")),
            interest: Number(form.get("interest")),
            easy_credit: Number(form.get("easy_credit")),
            comment: String(form.get("comment") ?? "").trim()
        };

        const values = [
            body.attendance,
            body.assignments,
            body.exam_difficulty,
            body.clarity,
            body.interest,
            body.easy_credit
        ];

        const invalid = values.some(value =>
            !Number.isInteger(value) || value < 1 || value > 5
        );

        if (invalid) {
            alert("各評価項目は1〜5で入力してください。");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            alert("評価投稿にはログインが必要です。");
            return;
        }

        try {
            let res = await fetch(`${API}/lectures/${encodeURIComponent(lectureId)}/evals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            // すでに投稿済みなら PUT で更新
            if (res.status === 409) {
                res = await fetch(`${API}/lectures/${encodeURIComponent(lectureId)}/evals`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                });
            }

            if (res.ok) {
                alert("Evaluation submitted");
                location.href = `review.html?serial_num=${encodeURIComponent(lectureId)}`;
                return;
            }

            const errorData = await res.json().catch(() => ({}));
            alert(errorData.message ?? "Failed to submit evaluation");
        } catch (error) {
            console.error(error);
            alert("Network error");
        }
    });
}