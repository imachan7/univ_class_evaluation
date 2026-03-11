// フロントエンドの想定ホスト名（localhost固定で運用するための定数）
const FRONT_EXPECTED_HOST = "localhost";
// バックエンドAPIのベースURL
const API_BASE_URL = "http://localhost:3000";
// この画面で固定する学年（情報工学科3年）
const DEFAULT_GRADE = 3;
// デフォルト学期（0=前期）
const DEFAULT_TERM = 0;
// 許可する学期値の集合（0=前期, 1=後期）
const ALLOWED_TERMS = new Set([0, 1]);
// ポップアップ画面へ渡すコンテキストを保存するlocalStorageキー
const PERIOD_POPUP_CONTEXT_KEY = "periodPopupContext";

// 曜日文字列を数値に変換するための対応表（monday -> 1 など）
const DAY_NAME_TO_NUMBER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

/**
 * 数値変換ユーティリティ。
 * 使い方: parseIntOrFallback("3", 0) -> 3 / parseIntOrFallback("abc", 0) -> 0
 * @param {unknown} value 変換したい値
 * @param {number} fallback 変換失敗時の代替値
 * @returns {number} 整数または代替値
 */
function parseIntOrFallback(value, fallback) {
  // Number(...) で数値化を試みる
  const n = Number(value);
  // 整数ならそのまま返し、そうでなければfallbackを返す
  return Number.isInteger(n) ? n : fallback;
}

/**
 * 学期パラメータを安全に正規化する関数。
 * 使い方: parseTermOrDefault("1") -> 1, parseTermOrDefault("9") -> 0
 * @param {unknown} value URLなどから取得したterm値
 * @returns {number} 0または1
 */
function parseTermOrDefault(value) {
  // まず整数として解釈する（失敗時はDEFAULT_TERM）
  const term = parseIntOrFallback(value, DEFAULT_TERM);
  // 許可値ならそのまま、許可外ならDEFAULT_TERMを返す
  return ALLOWED_TERMS.has(term) ? term : DEFAULT_TERM;
}

/**
 * 曜日値を1-5の範囲で正規化する関数。
 * 使い方: parseDayOrDefault("monday") -> 1, parseDayOrDefault("8", 1) -> 1
 * @param {unknown} value 曜日（文字列または数値）
 * @param {number} fallback 不正値時に使う曜日番号
 * @returns {number} 1-5の曜日番号
 */
function parseDayOrDefault(value, fallback = 1) {
  // 文字列の場合は曜日名マップで判定する
  if (typeof value === "string") {
    // 大文字小文字差異を吸収する
    const lowered = value.toLowerCase();
    // 曜日名が一致した場合は対応する番号を返す
    if (DAY_NAME_TO_NUMBER[lowered]) {
      return DAY_NAME_TO_NUMBER[lowered];
    }
  }

  // 数値として解釈する（不正ならfallback）
  const day = parseIntOrFallback(value, fallback);
  // 1-5の範囲内なら採用し、範囲外ならfallbackを返す
  return day >= 1 && day <= 5 ? day : fallback;
}

/**
 * 時限値を1-5の範囲で正規化する関数。
 * 使い方: parsePeriodOrDefault("2") -> 2, parsePeriodOrDefault("0", 1) -> 1
 * @param {unknown} value 時限値
 * @param {number} fallback 不正値時に使う時限
 * @returns {number} 1-5の時限
 */
function parsePeriodOrDefault(value, fallback = 1) {
  // 数値化して範囲チェックを行う
  const period = parseIntOrFallback(value, fallback);
  // 1-5以外はfallbackを返す
  return period >= 1 && period <= 5 ? period : fallback;
}

/**
 * 現在URLからtermを取得し、0/1に正規化して返す関数。
 * 使い方: const term = getCurrentTermFromUrl();
 * @returns {number} 0または1
 */
function getCurrentTermFromUrl() {
  // クエリ文字列を扱うためのURLSearchParamsを作成する
  const params = new URLSearchParams(window.location.search);
  // termを取り出して安全な値へ変換する
  return parseTermOrDefault(params.get("term"));
}

/**
 * home画面のURLクエリを更新する関数（term/gradeの同期用）。
 * 使い方: const selected = updateHomeUrl(termSelect.value);
 * @param {unknown} term 更新したいterm値
 * @returns {number} 実際に採用したterm（0または1）
 */
function updateHomeUrl(term) {
  // termを正規化する
  const normalizedTerm = parseTermOrDefault(term);
  // 現在URLをURLオブジェクトとして扱う
  const url = new URL(window.location.href);
  // termを更新する
  url.searchParams.set("term", String(normalizedTerm));
  // gradeは常に3で固定する
  url.searchParams.set("grade", String(DEFAULT_GRADE));
  // ページ遷移なしでURLのみ置き換える
  window.history.replaceState(null, "", url.toString());
  // 呼び出し元で使えるように採用termを返す
  return normalizedTerm;
}

/**
 * フロントホストをlocalhostに揃える関数（CORS・運用差異回避）。
 * 使い方: DOMContentLoaded時に一度実行する。
 */
function normalizeFrontendHost() {
  // すでに期待ホストなら何もしない
  if (window.location.hostname === FRONT_EXPECTED_HOST) {
    return;
  }

  // 現在のパス・クエリ・ハッシュを保持したままホストだけ置き換える
  const targetUrl = `${window.location.protocol}//${FRONT_EXPECTED_HOST}:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`;
  // 正規化したURLへ移動する
  window.location.replace(targetUrl);
}

/**
 * HTMLエスケープ関数（将来のinnerHTML利用時の安全対策用）。
 * 使い方: const safe = escapeHtml(userInput);
 * @param {unknown} text エスケープしたい文字列
 * @returns {string} エスケープ済み文字列
 */
function escapeHtml(text) {
  // 文字列化し、危険文字をHTMLエンティティへ変換する
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * 講義配列を「day-period」キーで引けるMapへ変換する関数。
 * 使い方: const slotMap = buildSlotMap(lectures);
 * @param {Array<{day:number,period:number}>} lectures 講義配列
 * @returns {Map<string, Array<object>>} 例: key "1-2" -> 月曜2限の講義配列
 */
function buildSlotMap(lectures) {
  // スロットごとの講義配列を格納するMap
  const map = new Map();

  // 受け取った講義を1件ずつ処理する
  for (const lecture of lectures) {
    // day/periodを数値化する
    const day = Number(lecture.day);
    const period = Number(lecture.period);
    // 不正データはスキップする
    if (!Number.isInteger(day) || !Number.isInteger(period)) {
      continue;
    }

    // スロットキーを作る（例: "2-3" = 火曜3限）
    const key = `${day}-${period}`;
    // 初回出現キーなら空配列を作る
    if (!map.has(key)) {
      map.set(key, []);
    }
    // 該当スロット配列へ講義を追加する
    map.get(key).push(lecture);
  }

  // 構築したMapを返す
  return map;
}

/**
 * カレンダーセル内リンク（aタグ）の表示と遷移先を更新する関数。
 * 使い方: renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade);
 * @param {HTMLAnchorElement} anchor 対象リンク要素
 * @param {Array<object>} lecturesInSlot そのスロットの講義配列
 * @param {number} day 曜日番号
 * @param {number} period 時限
 * @param {number} term 学期
 * @param {number} grade 学年
 */
function renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade) {
  // クリック時に開くperiod画面URLを設定する
  anchor.href = `period.html?day=${day}&period=${period}&term=${term}&grade=${grade}`;

  // 講義件数を計算する（配列でない場合は0件）
  const count = Array.isArray(lecturesInSlot) ? lecturesInSlot.length : 0;
  // 単数・複数の英語ラベルを切り替える
  const classLabel = count === 1 ? "class" : "classes";
  // 例: "0 classes", "1 class", "2 classes"
  anchor.textContent = `${count} ${classLabel}`;
}

/**
 * period画面をポップアップで開く関数。
 * 使い方: openPeriodPopup(anchor.href);
 * @param {string} url 開きたいURL
 */
function openPeriodPopup(url) {
  // 相対URLにも対応できるようにURLオブジェクト化する
  const popupUrl = new URL(url, window.location.href);
  // period側がクエリを失っても復元できるようにコンテキストを作る
  const context = {
    // dayを正規化して保存
    day: parseDayOrDefault(popupUrl.searchParams.get("day"), 1),
    // periodを正規化して保存
    period: parsePeriodOrDefault(popupUrl.searchParams.get("period"), 1),
    // termを正規化して保存
    term: parseTermOrDefault(popupUrl.searchParams.get("term")),
    // gradeは固定値を保存
    grade: DEFAULT_GRADE,
  };

  try {
    // contextをlocalStorageへ保存する（period側の復元用途）
    localStorage.setItem(PERIOD_POPUP_CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    // 保存失敗時は警告だけ出し、画面遷移は継続する
    console.warn("Failed to persist period popup context:", error);
  }

  // ポップアップ幅
  const width = 900;
  // ポップアップ高さ
  const height = 700;
  // 画面中央付近へ表示するためのleft位置
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  // 画面中央付近へ表示するためのtop位置
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

  // ポップアップウィンドウを開く
  const popup = window.open(
    // 開くURL
    popupUrl.toString(),
    // ウィンドウ名（同名なら再利用される）
    "periodPopup",
    // ウィンドウ機能指定
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  // ポップアップがブロックされた場合は通常遷移へフォールバックする
  if (!popup) {
    window.location.href = url;
  }
}

/**
 * カレンダー表クリック時にperiodポップアップを開くイベントを設定する関数。
 * 使い方: setupCalendarPopupNavigation();
 */
function setupCalendarPopupNavigation() {
  // カレンダーテーブル要素を取得する
  const table = document.querySelector(".calendar-home");
  // 要素がなければ何もしない
  if (!table) {
    return;
  }

  // テーブル全体でイベント委譲する（各セルに個別ハンドラを付けない）
  table.addEventListener("click", (event) => {
    // クリック元ターゲットを取得する
    const target = event.target;
    // Element以外は対象外
    if (!(target instanceof Element)) {
      return;
    }

    // クリック元から最寄りのaタグを探す
    const anchor = target.closest("a");
    // aタグ以外は対象外
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    // デフォルト遷移を止める
    event.preventDefault();
    // ポップアップ遷移へ切り替える
    openPeriodPopup(anchor.href);
  });
}

/**
 * 右上フィルターフォーム（学科/学年/学期）の初期化関数。
 * 使い方: setupHomeFilterForm();
 */
function setupHomeFilterForm() {
  // フォーム要素を取得する
  const form = document.getElementById("home-filter-form");
  // 学科セレクト要素を取得する
  const departmentSelect = document.getElementById("department-select");
  // 学年セレクト要素を取得する
  const gradeSelect = document.getElementById("grade-select");
  // 学期セレクト要素を取得する
  const termSelect = document.getElementById("term-select");

  // 必須要素が不足している場合は初期化を中断する
  if (!(form instanceof HTMLFormElement) ||
    !(departmentSelect instanceof HTMLSelectElement) ||
    !(gradeSelect instanceof HTMLSelectElement) ||
    !(termSelect instanceof HTMLSelectElement)) {
    return;
  }

  // URLから現在学期を取得する
  const term = getCurrentTermFromUrl();

  // 学年は固定値3をセットする
  gradeSelect.value = String(DEFAULT_GRADE);
  // 学科は情報工学科をセットする
  departmentSelect.value = "information_engineering";
  // 学期はURLから復元した値をセットする
  termSelect.value = String(term);

  // Applyボタン押下時の挙動を定義する
  form.addEventListener("submit", (event) => {
    // フォーム既定送信を止める
    event.preventDefault();

    // 学期をURLへ反映しつつ正規化した値を得る
    const selectedTerm = updateHomeUrl(termSelect.value);
    // セレクト表示も正規化値で揃える
    termSelect.value = String(selectedTerm);
    // カレンダーを再読み込みする
    loadCalendarLectures();
  });

  // 学期セレクト変更時にも即時反映する
  termSelect.addEventListener("change", () => {
    // 学期をURLへ反映しつつ正規化した値を得る
    const selectedTerm = updateHomeUrl(termSelect.value);
    // セレクト表示も正規化値で揃える
    termSelect.value = String(selectedTerm);
    // カレンダーを再読み込みする
    loadCalendarLectures();
  });
}

/**
 * バックエンドから講義データを取得し、時間割へ反映する関数。
 * 使い方: await loadCalendarLectures();
 */
async function loadCalendarLectures() {
  // カレンダーテーブル要素を取得する
  const table = document.querySelector(".calendar-home");
  // 要素がなければ処理を中断する
  if (!table) {
    return;
  }

  // 学年は固定3
  const grade = DEFAULT_GRADE;
  // 学期はURLから取得する
  const term = getCurrentTermFromUrl();

  try {
    // 取得クエリを組み立てる（grade=3固定 + term）
    const query = new URLSearchParams({ grade: String(grade), term: String(term) });
    // APIへGETリクエストを送る
    const response = await fetch(`${API_BASE_URL}/lectures?${query.toString()}`);
    // HTTPステータスが異常なら例外化する
    if (!response.ok) {
      throw new Error(`Failed to fetch lectures: ${response.status}`);
    }

    // レスポンスJSONを配列として受け取る
    const lectures = await response.json();

    // 配列でない場合はフォーマット異常として例外化する
    if (!Array.isArray(lectures)) {
      throw new Error("Lecture response is not an array");
    }

    // スロットキー単位で講義を引けるMapへ変換する
    const slotMap = buildSlotMap(lectures);
    // テーブルの全行（時限ごと）を取得する
    const rows = table.querySelectorAll("tbody tr");

    // 各時限行を処理する
    rows.forEach((row, rowIndex) => {
      // rowIndexは0始まりなので+1して時限にする
      const period = rowIndex + 1;
      // 各曜日セルを取得する
      const cells = row.querySelectorAll("td");

      // 曜日セルを順番に処理する
      cells.forEach((cell, cellIndex) => {
        // cellIndexは0始まりなので+1して曜日番号にする（月=1...金=5）
        const day = cellIndex + 1;
        // 既存リンクを取得する
        let anchor = cell.querySelector("a");
        // リンクが無い場合は新規作成する
        if (!anchor) {
          anchor = document.createElement("a");
          cell.replaceChildren(anchor);
        }

        // スロットキーを作成する
        const key = `${day}-${period}`;
        // 該当スロット講義配列を取得する（無ければ空配列）
        const lecturesInSlot = slotMap.get(key) || [];
        // セルリンク（件数表示と遷移URL）を描画する
        renderCellAnchor(anchor, lecturesInSlot, day, period, term, grade);
      });
    });
  } catch (error) {
    // 取得失敗時はコンソールへ記録する
    console.error(error);
  }
}

// DOM構築完了後に初期化処理を実行する
document.addEventListener("DOMContentLoaded", () => {
  // ホスト名をlocalhostへ正規化する
  normalizeFrontendHost();
  // フィルターフォームを初期化する
  setupHomeFilterForm();
  // カレンダーのポップアップ遷移を有効化する
  setupCalendarPopupNavigation();
  // 初回講義データを読み込む
  loadCalendarLectures();
});
