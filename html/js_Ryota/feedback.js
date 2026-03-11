const params = new URLSearchParams(location.search)
const lectureId = params.get("serial_num")

const API = "http://localhost:3000"

document.getElementById("evalForm").addEventListener("submit", async e => {
    e.preventDefault()

    const form = new FormData(e.target)
    
    const body = {
        attendance: Number(form.get("attendance")),
        assignments: Number(form.get("assignments")),
        exam_difficulty: Number(form.get("exam_difficulty")),
        clarity: Number(form.get("clarity")),
        interest: Number(form.get("interest")),
        easy_credit: Number(form.get("easy_credit")),
        comment: form.get("comment")
    }


    const token = localStorage.getItem("token")

    const res = await fetch(`${API}/lectures/${lectureId}/evals`,{
        
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
        },
        body:JSON.stringify(body)
    })

    if(res.ok){
        alert("Evaluation submitted")
        location.href = `review.html?id=${lectureId}`
    }else{
        alert("Failed to submit evaluation")
    }

    const errorData = await res.json().catch(() => ({}));

    if (res.status === 409) {
      alert(errorData.message ?? "すでに評価済みです。編集機能を使ってください。");
    } else {
      alert(errorData.message ?? "Failed to submit evaluation");
    }

})