const login_signup_button = document.getElementById("login_signup_button")
const login_login_button = document.getElementById("login_login_button")

const login_nameInput = document.getElementById("login_nameInput")
const login_passInput = document.getElementById("login_passInput")

function signup() {
    window.location.href = "../html/new_member.html"
}
function login(){

    const name = login_nameInput.value
    const password = login_passInput.value

    //　テストでコンソール画面に表示
    console.log("Name:", name)
    console.log("password:", password)
    
    window.location.href = "../html/home.html"
}

login_signup_button.addEventListener("click", signup)
login_login_button.addEventListener("click", login)