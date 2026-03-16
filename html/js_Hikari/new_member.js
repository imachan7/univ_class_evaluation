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
function register() {
    const email = emailInput.value
    const password = passwordInput.value
    const name = nameInput.value
    const nickname = nicknameInput.value
    const gradeValue = grade.value
    const courseValue = course.value
    const programmingExperienceValue = programmingExperience.value

    // テストでコンソール画面に表示
    console.log("email:", email)
    console.log("password:", password)
    console.log("name:", name)
    console.log("nickname:", nickname)
    console.log("grade:", gradeValue)
    console.log("course:", courseValue)
    console.log("programming experience:", programmingExperienceValue)

    window.location.href = "../html/home.html"
}

new_member_back_button.addEventListener("click", back)
new_member_register_button.addEventListener("click", register)
