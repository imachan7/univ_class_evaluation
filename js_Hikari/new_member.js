const new_member_back_button = document.getElementById("new_member_back_button")
const new_member_register_button = document.getElementById("new_member_register_button")

//Backボタンを押したときの処理を追加
function back() {
    window.location.href = "../html/login.html"
}

// Registerボタンを押したときの処理を追加
// 入力情報をデータベースに追加する処理はここに追加
function register() {
    window.location.href = "../html/home.html"
}

new_member_back_button.addEventListener("click", back)
new_member_register_button.addEventListener("click", register)