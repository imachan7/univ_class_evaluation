const login_signup_button = document.getElementById("login_signup_button")
const login_login_button = document.getElementById("login_login_button")

const login_emailInput = document.getElementById("login_emailInput")
const login_passInput = document.getElementById("login_passInput")

function signup() {
    window.location.href = "../html/new_member.html"
}

async function login() {
    const email = login_emailInput.value;
    const password = login_passInput.value;

    console.log("Email:", email);
    console.log("password:", password);

    try {
        const res = await fetch(`http://10.3.202.148:3000/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'ログインに失敗しました');
            return;
        }

        const data = await res.json();
        const token = data.token;
        if (!token) {
            alert('サーバー応答が不正です');
            return;
        }

        localStorage.setItem('jwt', token);
        console.log('ログイン成功');
        window.location.href = '../html/home.html';

    } catch (err) {
        console.error('Fetch error:', err);
        alert('サーバーに接続できませんでした');
    }
}

login_signup_button.addEventListener("click", signup)
login_login_button.addEventListener("click", login)