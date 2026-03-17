const new_member_back_button = document.getElementById("new_member_back_button")
const new_member_register_button = document.getElementById(
    "new_member_register_button",
)

const emailInput = document.getElementById("new_member_emailInput")
const passwordInput = document.getElementById("new_member_passwordInput")
const nameInput = document.getElementById("new_member_nameInput")
const nicknameInput = document.getElementById("new_member_nicknameInput")

const grade = document.getElementById("grade")
const course = document.getElementById("course")
const programmingExperience = document.getElementById("programming_experience")

//Backボタンを押したときの処理を追加
function back() {
    window.location.href = "../html/login.html"
}

// Registerボタンを押したときの処理を追加
// 入力情報をデータベースに追加する処理はここに追加
async function register() {
    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()
    const name = nameInput.value.trim()
    const gradeValue = Number(grade.value)
    const courseValue = Number(course.value)
    const progExpValue = Number(programmingExperience.value)

    if (!email || !password || !name || !gradeValue || !courseValue || !progExpValue) {
        alert("すべての項目を入力してください")
        return
    }

    try {
        const res = await fetch("http://10.3.202.148:3000/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
                name: name,
                grade: gradeValue,
                course: courseValue,
                prog_exp: progExpValue, // ←ここ重要
            }),
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            alert(err.message || "登録に失敗しました")
            return
        }

        alert("登録成功！ログインしてください")
        //window.location.href = "../html/login.html"

    } catch (err) {
        console.error(err)
        alert("サーバーに接続できませんでした")
    }
}

new_member_back_button.addEventListener("click", back)
new_member_register_button.addEventListener("click", register)
