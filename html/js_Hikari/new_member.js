const new_member_back_button = document.getElementById("new_member_back_button")
const new_member_register_button = document.getElementById("new_member_register_button")

const emailInput = document.getElementById("new_member_emailInput")
const passwordInput = document.getElementById("new_member_passwordInput")
const nameInput = document.getElementById("new_member_nameInput")
const nicknameInput = document.getElementById("new_member_nicknameInput")

const grade = document.getElementById("grade")
const course = document.getElementById("course")
const programmingExperience = document.getElementById("programming_experience")

//Backボタンを押したときの処理を追加
function back() {
    // プロジェクトルート配下の html/login.html へ戻る
    window.location.href = './login.html'
}

// Registerボタンを押したときの処理を追加
// 入力情報をデータベースに追加する処理はここに追加
async function register() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput.value.trim();
    const gradeValue = grade.value;
    const courseValue = course.value;
    const programmingExperienceValue = programmingExperience.value;

    if (!email || !password || !name || !gradeValue || !courseValue) {
        alert('必須項目を入力してください');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name,
                grade: Number(gradeValue),
                course: Number(courseValue),
                prog_exp: Number(programmingExperienceValue) || 0,
            }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || '登録に失敗しました');
            return;
        }

        alert('登録が完了しました。ログイン画面に移動します。');
        window.location.href = './login.html';
    } catch (err) {
        console.error('Signup error:', err);
        alert('サーバーに接続できませんでした');
    }
}

new_member_back_button.addEventListener("click", back)
new_member_register_button.addEventListener("click", register)