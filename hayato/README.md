# hayato 作業メモ

## この README の目的

このファイルは、FE-B 担当として `Home View` と `Lecture Modal` を実装し、DB 班から受け取るデータを JavaScript で取得するところまでの流れを整理するためのメモです。

今回の到達点は次のとおりです。

- GitHub で Issue を立てる
- API の受け取り条件を整理する
- 取得対象データを確定する
- JavaScript で API からデータを取得するコードを書く

## 自分の担当範囲

担当は FE-B です。

- `Home View`
  - 時間割グリッドを表示する
  - クリックで講義選択に進める
- `Lecture Modal`
  - 講義を検索する
  - 講義を選ぶ

図でいうと、次の部分を担当します。

- `Home View`
- `Lecture Modal`
- `GET /my-lectures`
- `GET /lectures/search`

## DB 班から受け取る前提データ

### lecture

```text
lecture {
  int serial_num   // 講義の通し番号
  string lec_name  // 講義名
  string teacher   // 先生名
  int day          // 曜日
  int period       // 何コマ目
  int grade        // 学年
  int term         // 前期か後期か
}
```

### 自分が主に使う API

- `GET /my-lectures`
- `GET /lectures/search`

`Home View` では自分の時間割に入る講義一覧、`Lecture Modal` では検索結果の講義一覧を使う想定です。

## 最初に立てる GitHub Issue

まずは、作業を 1 Issue に切り出します。

### Issue タイトル案

```text
FE-B: Home View / Lecture Modal 用の講義取得処理を実装する
```

### Issue 本文案

```md
## 概要
Home View と Lecture Modal で使う講義データを、DB 班の API から取得する JavaScript 処理を実装する。

## 対象
- Home View
- Lecture Modal
- GET /my-lectures
- GET /lectures/search

## やること
- API の URL とレスポンス形式を確認する
- 取得する lecture データの項目を整理する
- JavaScript で fetch 処理を作成する
- 取得成功時と失敗時の挙動を決める

## 完了条件
- Home View 用データを取得できる
- Lecture Modal 用の検索データを取得できる
- レスポンスを console または画面上で確認できる
- エラー時の処理が最低限ある
```

## 実装までのフロー

### 1. API 仕様を先に確認する

実装前に、DB 班に次の内容を確認する。

- API のベース URL →提供される
- 認証が必要か
- Cookie 認証か token 認証か→わからない
- `GET /my-lectures` のレスポンス形式 →jsonで返す。データの型は送った通り。一旦実装なし。

- `GET /lectures/search` のクエリパラメータ →曜日、学年、コマ数、前期か後期かの４つ
- `term` や `day` の値の定義
- データが 0 件のときのレスポンス → 設定無し
- エラー時のステータスコード →設定無し

確認できていない状態で画面側を進めると、後で修正量が増えるので先に詰める。

### 2. 自分が使うデータ項目を決める

少なくとも次の項目は使う前提で進める。

- `serial_num`
- `lec_name`
- `teacher`
- `day`
- `period`
- `grade`
- `term`

### 3. 画面での用途を整理する

#### Home View

- 時間割マスに講義名を表示する
- 曜日と時限を使って配置する
- `serial_num` はクリック時の識別子に使う

#### Lecture Modal

- 講義名で検索結果を出す
- 先生名も補助表示する
- 選択時に `serial_num` を次画面へ渡せるようにする

### 4. JavaScript の役割を分ける

実装時は、少なくとも次の責務に分ける。

- API からデータを取る関数
- 取得した配列を画面用に整える関数
- HTML に反映する関数

いきなり全部を 1 つの関数に入れない。

## 実装イメージ

### 取得処理の基本形

```javascript
async function fetchMyLectures() {
  const response = await fetch('/my-lectures');

  if (!response.ok) {
    throw new Error('時間割データの取得に失敗しました');
  }

  return response.json();
}
```

### 検索処理の基本形

```javascript
async function searchLectures(keyword) {
  const params = new URLSearchParams({ keyword });
  const response = await fetch(`/lectures/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error('講義検索に失敗しました');
  }

  return response.json();
}
```

## この段階で最低限やること

DB 班のデータ取得までが目的なので、この段階では次を優先する。

- API へ正しくアクセスできる
- 必要な JSON を受け取れる
- 受け取ったデータを `console.log` で確認できる
- エラー時に失敗が分かる

逆に、まだ無理にやらなくてよいものは次です。

- 見た目の調整
- 高度なバリデーション
- 状態管理の最適化
- レビュー画面との統合

## 実装前に確認したい質問

DB 班に次を聞けると安全です。

- `GET /my-lectures` はログイン済みユーザー前提か
- `GET /lectures/search` の検索条件は何か
- 返却値は配列か、`data` を持つオブジェクトか
- `term` は `0/1` か `spring/fall` か
- `day` は月曜始まりで `1-5` なのか
- CORS 設定はどうするか

## このフェーズの完了条件

- GitHub Issue を作成済み
- API 仕様の未確定点を洗い出せている
- `Home View` 用の講義データ取得コードがある
- `Lecture Modal` 用の検索データ取得コードがある
- JavaScript でレスポンス確認ができる

## 次のフェーズ

データ取得ができたら、次に進む。

1. 取得データを時間割グリッドに配置する
2. モーダル内に検索結果を一覧表示する
3. 講義選択後に `Lecture Detail View` へつなぐ
