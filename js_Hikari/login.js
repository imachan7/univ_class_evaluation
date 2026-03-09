const login_signup_button = document.getElementById("login_signup_button")
const login_login_button = document.getElementById("login_login_button")

function signup() {
    window.location.href = "../html/new_member.html"
}
function login(){
    window.location.href = "../html/home.html"
}

login_signup_button.addEventListener("click", signup)
login_login_button.addEventListener("click", login)