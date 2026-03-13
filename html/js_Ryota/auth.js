// このファイルを保護ページの先頭で読み込む
// jwtがなければlogin.htmlへリダイレクト
(function () {
  if (!localStorage.getItem("jwt")) {
    window.location.replace("login.html");
  }
})();
