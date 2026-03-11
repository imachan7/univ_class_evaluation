# univ_class_evaluation

Efreiの講義で作成するwebサービスのリポジトリです

---

## 🛠️ バックエンド セットアップ

### 必要環境

- Node.js 18 以上
- npm

### インストール・起動

```bash
cd backend_app
npm install          # 依存パッケージのインストール（Prisma Clientの生成も自動実行）
```

`.env` ファイルを作成する（`.env` はGit管理外）：

```env
DATABASE_URL="file:dev.db"
JWT_SECRET="任意の長いランダム文字列"
ALLOWED_ORIGINS="http://localhost:5173"   # フロントのオリジンに合わせて変更
```

```bash
npx prisma migrate dev   # DBマイグレーション（dev.db を生成）
npm run seed             # 講義データ投入（名工大情報工学科3年 前期15件・後期15件）
npm run dev              # 開発サーバー起動（http://localhost:3000）
```

---

## 📡 APIエンドポイント一覧

### 認証

| メソッド | パス           | 説明                        | 認証 |
| -------- | -------------- | --------------------------- | ---- |
| POST     | `/auth/signup` | ユーザー登録                | 不要 |
| POST     | `/auth/login`  | ログイン（JWTトークン返却） | 不要 |

**signup リクエストボディ:**

```json
{
  "email": "test@nitech.ac.jp",
  "password": "password123",
  "name": "テストユーザー",
  "grade": 3,
  "course": 1,
  "prog_exp": 1
}
```

**login レスポンス:**

```json
{ "token": "eyJ..." }
```

### 講義

| メソッド | パス            | 説明                   | 認証 |
| -------- | --------------- | ---------------------- | ---- |
| GET      | `/lectures`     | 講義一覧（絞り込み可） | 不要 |
| GET      | `/lectures/:id` | 講義詳細 + 評価平均値  | 不要 |

**クエリパラメータ（すべて省略可・複数組み合わせ可）:**

| パラメータ | 型   | 説明                   |
| ---------- | ---- | ---------------------- |
| `term`     | 整数 | 学期（0=前期, 1=後期） |
| `day`      | 整数 | 曜日（1=月〜5=金）     |
| `period`   | 整数 | 時限（1〜4）           |
| `grade`    | 整数 | 学年                   |

例：`GET /lectures?term=0&day=2` → 前期・火曜の講義を返す

### 評価

| メソッド | パス                  | 説明                   | 認証     |
| -------- | --------------------- | ---------------------- | -------- |
| GET      | `/lectures/:id/evals` | 評価一覧取得           | 不要     |
| POST     | `/lectures/:id/evals` | 評価投稿（1講義1評価） | **必要** |
| PUT      | `/lectures/:id/evals` | 評価編集               | **必要** |

**評価の各フィールド（1〜5の整数）：**

| フィールド        | 説明                     |
| ----------------- | ------------------------ |
| `attendance`      | 出席の必要度             |
| `assignments`     | 課題の多さ               |
| `exam_difficulty` | テスト・レポートの難しさ |
| `clarity`         | わかりやすさ             |
| `interest`        | 面白さ                   |
| `easy_credit`     | 単位の取りやすさ         |
| `comment`         | コメント（任意・文字列） |

### ユーザー

| メソッド | パス         | 説明                         | 認証     |
| -------- | ------------ | ---------------------------- | -------- |
| GET      | `/users/me`  | 自分のプロフィール取得       | **必要** |
| GET      | `/users/:id` | 他ユーザーのプロフィール取得 | **必要** |

認証が必要なリクエストには `Authorization: Bearer <token>` ヘッダーを付与してください。

---

## 🖥️ フロントエンド開発者向け

### バックエンドサーバーの起動手順

バックエンド担当者からリポジトリをクローン後、以下の手順で起動してください。

```bash
cd backend_app
npm install
```

`backend_app/.env` ファイルを作成（バックエンド担当者に内容を確認してください）：

```env
DATABASE_URL="file:dev.db"
JWT_SECRET="バックエンド担当者から受け取った値"
ALLOWED_ORIGINS="http://localhost:5173"
```

```bash
npx prisma migrate dev   # DB作成（初回のみ）
npm run seed             # 講義データ投入（初回のみ）
npm run dev              # サーバー起動 → http://localhost:3000
```

### フロントからのAPI呼び出し例

ベースURLは `http://localhost:3000`（本番では環境変数で切り替えてください）。

#### ログイン・トークン取得

```js
const res = await fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@nitech.ac.jp", password: "password123" }),
});
const { token } = await res.json();
// token を localStorage などに保存して使い回す
```

#### 講義一覧取得（前期・月曜）

```js
const res = await fetch("http://localhost:3000/lectures?term=0&day=1");
const lectures = await res.json();
```

#### 評価投稿（認証あり）

```js
const res = await fetch("http://localhost:3000/lectures/1/evals", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`, // ログイン時に取得したトークン
  },
  body: JSON.stringify({
    attendance: 3,
    assignments: 2,
    exam_difficulty: 4,
    clarity: 5,
    interest: 4,
    easy_credit: 3,
    comment: "わかりやすい講義でした",
  }),
});
```

#### エラーレスポンスの形式

```json
{ "message": "エラーの説明" }
```

ステータスコード: `400` バリデーションエラー / `401` 未認証 / `404` 見つからない / `409` 重複 / `500` サーバーエラー

---

## 🧪 APIテスト（Bruno）

[Bruno](https://www.usebruno.com/)（無料のAPIクライアント）を使ってすべてのエンドポイントを手軽に試せます。

### 手順

1. [Bruno をインストール](https://www.usebruno.com/)
2. Bruno を起動 → **Open Collection** → `backend_app/bruno/` フォルダを選択
3. 右上の環境を **local** に切り替える
4. `npm run dev` でサーバーを起動しておく

### テストの流れ

```
1. auth/ユーザー登録     → アカウント作成
2. auth/ログイン         → tokenが環境変数に自動セットされる
3. lectures/講義一覧取得 → 全講義またはフィルタで絞り込み
4. lectures/講義詳細取得 → 評価平均値も返される
5. lectures/evals/評価投稿 → 認証済みトークンで投稿（自動付与）
6. lectures/evals/評価編集 → 投稿済み評価を部分更新
7. users/自分のプロフィール取得
```

> **Note:** ログインリクエストを送ると、レスポンスの `token` が自動で環境変数 `token` にセットされます。以降の認証が必要なリクエストは追加操作なしで実行できます。

## 🚀 機能要件

### 1. ユーザー管理

- **ログイン画面:** メールアドレス・パスワード入力
- **新規登録:** 以下の情報を入力してアカウント作成（モック）
  - メールアドレス / ユーザー名 / パスワード
  - 学年 (例: B1, B2...)
  - 分野 (例: 文学部, 理工学部...)

### 2. 時間割 (メイン機能)

- **5x6 グリッド:** 月〜金の1〜6限を表示。
- **講義選択:** グリッドのセルをクリック → そのコマの講義一覧を表示 → 講義を選択。

### 3. 評価システム

- **詳細画面:** 講義ごとのメニューを表示。
- **評価入力:** 5段階評価 + コメント自由記述。
- **評価閲覧:** ユーザーごとの評価をリスト表示（投稿者の学年・分野も表示）。
