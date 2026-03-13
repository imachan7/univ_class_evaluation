const new_member_back_button = document.getElementById(
    "new_member_back_button",
);
const new_member_register_button = document.getElementById(
    "new_member_register_button",
);

const emailInput = document.getElementById("new_member_emailInput");
const passwordInput = document.getElementById("new_member_passwordInput");
const nameInput = document.getElementById("new_member_nameInput");
const nicknameInput = document.getElementById("new_member_nicknameInput");

const grade = document.getElementById("grade");
const course = document.getElementById("course");
const programmingExperience = document.getElementById("programming_experience");

//Backボタンを押したときの処理を追加
function back() {
    window.location.href = "../html/login.html";
}

// Registerボタンを押したときの処理を追加
// 入力情報をデータベースに追加する処理はここに追加
function register() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const gradeValue = grade.value;
    const courseValue = course.value;
    const programmingExperienceValue = programmingExperience.value;

    const checks = [
        { el: emailInput, ok: !!email, label: "Email" },
        { el: passwordInput, ok: !!password, label: "Password" },
        { el: nameInput, ok: !!name, label: "Name" },
        { el: nicknameInput, ok: !!nickname, label: "Nickname" },
        { el: grade, ok: !!gradeValue, label: "Grade" },
        { el: course, ok: !!courseValue, label: "Course" },
        { el: programmingExperience, ok: !!programmingExperienceValue, label: "Programming Experience" },
    ];

    const missing = checks.filter(c => !c.ok).map(c => c.label);
    if (missing.length > 0) {
        const msg = "以下の項目を入力または選択してください:\n・" + missing.join('\n・');
        alert(msg);
        const firstMissingEl = checks.find(c => !c.ok).el;
        try { firstMissingEl.focus(); } catch (e) {}
        return;
    }

    // テストでコンソール画面に表示
    console.log("email:", email);
    console.log("password:", password);
    console.log("name:", name);
    console.log("nickname:", nickname);
    console.log("grade:", gradeValue);
    console.log("course:", courseValue);
    console.log("programming experience:", programmingExperienceValue);

    window.location.href = "../html/home.html";
}

new_member_back_button.addEventListener("click", back);
new_member_register_button.addEventListener("click", register);
