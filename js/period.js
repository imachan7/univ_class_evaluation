// period画面が参照するバックエンドAPIのベースURL
const PERIOD_API_BASE_URL = "http://localhost:3000";
// home画面から渡したコンテキストを保存しているlocalStorageキー
const PERIOD_POPUP_CONTEXT_KEY = "periodPopupContext";

// 曜日名文字列を曜日番号へ変換する対応表
const DAY_NAME_TO_NUMBER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

/**
 * 数値変換ユーティリティ。
 * 使い方: parseNumericOrDefault("2", 1) -> 2 / parseNumericOrDefault("x", 1) -> 1
 * @param {unknown} value 数値変換対象
 * @param {number} fallback 変換失敗時の代替値
 * @returns {number} 整数または代替値
 */
function parseNumericOrDefault(value, fallback) {
  // Numberで数値化を試みる
  const n = Number(value);
  // 整数判定に通れば採用し、通らなければfallbackを返す
  return Number.isInteger(n) ? n : fallback;
}

/**
 * term値を0/1へ正規化する関数。
 * 使い方: parseTermOrDefault("1") -> 1, parseTermOrDefault("9") -> 0
 * @param {unknown} value term値
 * @returns {number} 0または1
 */
function parseTermOrDefault(value) {
  // termを整数化する（失敗時は0）
  const term = parseNumericOrDefault(value, 0);
  // 1のみ後期として許可し、それ以外は前期0へ寄せる
  return term === 1 ? 1 : 0;
}

/**
 * period値を1-5へ正規化する関数。
 * 使い方: parsePeriodOrDefault("3") -> 3, parsePeriodOrDefault("0") -> 1
 * @param {unknown} value period値
 * @returns {number} 1-5の時限
 */
function parsePeriodOrDefault(value) {
  // 数値化して範囲判定する
  const period = parseNumericOrDefault(value, 1);
  // 1-5以外は1限へフォールバックする
  return period >= 1 && period <= 5 ? period : 1;
}

/**
 * day値（文字列/数値）を1-5へ正規化する関数。
 * 使い方: parseDayParam("monday") -> 1, parseDayParam("4") -> 4
 * @param {unknown} dayValue dayパラメータ
 * @returns {number} 1-5の曜日番号
 */
function parseDayParam(dayValue) {
  // 値が無い場合は月曜(1)を返す
  if (!dayValue) {
    return 1;
  }

  // 文字列なら小文字化して曜日名マップを参照する
  const lowered = String(dayValue).toLowerCase();
  // monday など一致した場合は対応番号を返す
  if (DAY_NAME_TO_NUMBER[lowered]) {
    return DAY_NAME_TO_NUMBER[lowered];
  }

  // 数値として解釈して範囲判定する
  const day = parseNumericOrDefault(dayValue, 1);
  // 1-5なら採用し、それ以外は1へフォールバックする
  return day >= 1 && day <= 5 ? day : 1;
}

/**
 * localStorageからperiodコンテキストを復元する関数。
 * 使い方: const stored = readStoredPopupContext();
 * @returns {{day:number,period:number,term:number,grade:number}|null}
 */
function readStoredPopupContext() {
  try {
    // 保存済みJSON文字列を取り出す
    const raw = localStorage.getItem(PERIOD_POPUP_CONTEXT_KEY);
    // 値が無ければnullを返す
    if (!raw) {
      return null;
    }

    // JSON文字列をオブジェクトへ戻す
    const parsed = JSON.parse(raw);
    // オブジェクトでなければ不正とみなしてnullを返す
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // dayを正規化する
    const day = parseDayParam(parsed.day);
    // periodを正規化する
    const period = parsePeriodOrDefault(parsed.period);
    // termを正規化する
    const term = parseTermOrDefault(parsed.term);

    // gradeは要件上3固定で返す
    return { day, period, term, grade: 3 };
  } catch (error) {
    // 復元失敗時は警告を出してnullへフォールバックする
    console.warn("Failed to read period popup context:", error);
    return null;
  }
}

/**
 * URLクエリまたは保存済みcontextからperiod画面用パラメータを決定する関数。
 * 使い方: const context = getPeriodQueryParams();
 * @returns {{day:number,period:number,term:number,grade:number}}
 */
function getPeriodQueryParams() {
  // 現在URLのクエリを取得する
  const params = new URLSearchParams(window.location.search);

  // dayパラメータの有無を判定する
  const hasDay = params.has("day");
  // periodパラメータの有無を判定する
  const hasPeriod = params.has("period");

  // クエリにday/periodが揃っている場合はクエリ優先で使う
  if (hasDay && hasPeriod) {
    // dayを正規化して取り出す
    const day = parseDayParam(params.get("day"));
    // periodを正規化して取り出す
    const period = parsePeriodOrDefault(params.get("period"));
    // termを正規化して取り出す
    const term = parseTermOrDefault(params.get("term"));
    // gradeは3固定で返す
    return { day, period, term, grade: 3 };
  }

  // クエリ欠落時はlocalStorageの保存contextを参照する
  const stored = readStoredPopupContext();
  // 保存contextがあればそれを返す
  if (stored) {
    return stored;
  }

  // 最終フォールバックとしてクエリ値（欠落時は既定値）を使う
  const day = parseDayParam(params.get("day"));
  // periodを正規化する
  const period = parsePeriodOrDefault(params.get("period"));
  // termを正規化する
  const term = parseTermOrDefault(params.get("term"));
  // grade固定で返す
  return { day, period, term, grade: 3 };
}

/**
 * 戻るボタンの動作を設定する関数。
 * 使い方: setupBackButton(context);
 * @param {{term:number,grade:number}} context 現在表示中の文脈
 */
function setupBackButton(context) {
  // 戻るボタン要素を取得する
  const button = document.getElementById("back-button");
  // ボタンが無ければ設定しない
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  // クリック時処理を設定する
  button.addEventListener("click", () => {
    // フォールバック遷移先（home画面）
    const homeUrl = `home.html?term=${context.term}&grade=${context.grade}`;

    // ポップアップとして開かれている場合は閉じる
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    // 履歴があれば戻る
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    // それもできない場合はhomeへ直接遷移する
    window.location.href = homeUrl;
  });
}

/**
 * 講義名を日本語名/英語名に分割する関数。
 * 使い方: const { japanese, english } = splitLectureName(lecture.lec_name);
 * @param {unknown} name 講義名文字列
 * @returns {{japanese:string,english:string}}
 */
function splitLectureName(name) {
  // null/undefinedに備えて文字列化しtrimする
  const raw = String(name || "").trim();
  // 空の場合はプレースホルダを返す
  if (!raw) {
    return { japanese: "Unnamed Lecture", english: "" };
  }

  // "|" 区切りで日英が来るケースを優先して処理する
  const pipeParts = raw.split("|").map((part) => part.trim()).filter(Boolean);
  // 2要素以上あれば先頭を日本語、残りを英語として扱う
  if (pipeParts.length >= 2) {
    return {
      japanese: pipeParts[0],
      english: pipeParts.slice(1).join(" | "),
    };
  }

  // 連結文字列ケース（例: 情報ネットワークInformation Networks）に対応する
  const firstAsciiIndex = raw.search(/[A-Za-z]/);
  // 英字の開始位置が見つかれば前半を日本語、後半を英語として分割する
  if (firstAsciiIndex > 0) {
    return {
      japanese: raw.slice(0, firstAsciiIndex).trim(),
      english: raw.slice(firstAsciiIndex).trim(),
    };
  }

  // 英語部分が見つからない場合は日本語行だけに入れる
  return { japanese: raw, english: "" };
}

/**
 * 講義候補ボタン一覧を描画する関数。
 * 使い方: renderLectureButtons(lectures, context);
 * @param {Array<object>} lectures 講義候補配列
 * @param {{day:number,period:number,term:number,grade:number}} context 現在スロット情報
 */
function renderLectureButtons(lectures, context) {
  // 描画先コンテナを取得する
  const container = document.getElementById("lecture-buttons");
  // 要素が無ければ処理を中断する
  if (!container) {
    return;
  }

  // 既存内容をクリアする
  container.innerHTML = "";

  // 候補が無い場合は空のまま終了する
  if (!lectures.length) {
    return;
  }

  // 候補講義ごとにボタンリンクを生成する
  for (const lecture of lectures) {
    // 詳細ページへ飛ぶリンクを作成する
    const link = document.createElement("a");
    // CSSクラスを付与する
    link.className = "lecture-button";
    // クエリ付き遷移先URLを設定する
    link.href = `detail_class.html?lecture_id=${lecture.id}&day=${context.day}&period=${context.period}&term=${context.term}&grade=${context.grade}`;

    // 講義名を取得する（欠損時はプレースホルダ）
    const lectureName = lecture.lec_name || "Unnamed Lecture";
    // 教員名を取得する（欠損時はTBA）
    const teacherName = lecture.teacher ? lecture.teacher : "TBA";

    // 講義名を日本語/英語へ分解する
    const { japanese, english } = splitLectureName(lectureName);

    // 1行目: 日本語名
    const japaneseLine = document.createElement("span");
    // spanをブロック表示にして改行させる
    japaneseLine.style.display = "block";
    // 日本語名テキストを設定する
    japaneseLine.textContent = japanese;
    // リンクへ追加する
    link.appendChild(japaneseLine);

    // 2行目: 英語名（ある場合のみ）
    if (english) {
      // 英語表示用spanを作成する
      const englishLine = document.createElement("span");
      // spanをブロック表示にして改行させる
      englishLine.style.display = "block";
      // 英語名テキストを設定する
      englishLine.textContent = english;
      // リンクへ追加する
      link.appendChild(englishLine);
    }

    // 3行目: 教員名
    const teacherLine = document.createElement("span");
    // spanをブロック表示にして改行させる
    teacherLine.style.display = "block";
    // Instructor文言を作って設定する
    teacherLine.textContent = `Instructor: ${teacherName}`;
    // リンクへ追加する
    link.appendChild(teacherLine);

    // 1候補のリンク完成後、一覧へ追加する
    container.appendChild(link);
  }
}

/**
 * 現在スロットの講義候補をAPIから取得して描画する関数。
 * 使い方: await loadPeriodLectures();
 */
async function loadPeriodLectures() {
  // URLまたは保存contextから表示対象スロットを決定する
  const context = getPeriodQueryParams();
  // 戻るボタンの挙動をセットする
  setupBackButton(context);

  try {
    // APIクエリを組み立てる
    const query = new URLSearchParams({
      day: String(context.day),
      period: String(context.period),
      term: String(context.term),
      grade: String(context.grade),
    });

    // 講義候補一覧を取得する
    const response = await fetch(`${PERIOD_API_BASE_URL}/lectures?${query.toString()}`);
    // HTTP異常時は例外化する
    if (!response.ok) {
      throw new Error(`Failed to fetch lectures: ${response.status}`);
    }

    // JSONレスポンスを受け取る
    const lectures = await response.json();
    // 配列でない場合はフォーマット異常として扱う
    if (!Array.isArray(lectures)) {
      throw new Error("Lecture response is not an array");
    }

    // 候補ボタン一覧を描画する
    renderLectureButtons(lectures, context);
  } catch (error) {
    // 例外はコンソールへ出力して調査可能にする
    console.error(error);
  }
}

// DOM構築完了後に初期ロードを実行する
document.addEventListener("DOMContentLoaded", () => {
  // period画面の講義候補読み込み処理を実行する
  loadPeriodLectures();
});
