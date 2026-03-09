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
  - 画面の中央にカレンダーを表示する
  - 曜日と時限を選択する
- `Lecture Modal`
  - 選択した曜日・時限に対応する講義候補を表示する
  - 講義を選ぶ

図でいうと、次の部分を担当します。

- `Home View`
- `Lecture Modal`
- `GET /lectures/search`

今回の担当範囲では、講義候補の表示までを行います。
その先の「授業の評価を書く画面」「授業の評価を確認する画面」は他の担当者に引き継ぎます。

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

- `GET /lectures/search`

`Home View` で曜日と時限を選択し、`Lecture Modal` で検索結果の講義一覧を表示する想定です。

## 画面の動き

自分の画面では、中央にカレンダーを表示します。

- カレンダーには曜日と時限のマスがある
- ユーザーが `◯曜日 ◯限` を選択する
- 選択した条件に対応する授業候補を表示する
- 名古屋工業大学 情報工学科 3 年の授業のみを対象とする

対象をかなり絞っているため、候補数はそこまで多くならない想定です。
そのため、まずは選択したマスに対応する授業候補を分かりやすく一覧表示できれば十分です。

担当範囲はここまでです。

- 曜日・時限の選択
- 授業候補の取得
- 授業候補の表示

担当範囲ではないものは次です。

- 授業評価を書く画面
- 授業評価を確認する画面

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
- GET /lectures/search

## やること
- API の URL とレスポンス形式を確認する
- 取得する lecture データの項目を整理する
- 曜日と時限を選んだときの講義候補表示を実装する
- JavaScript で fetch 処理を作成する
- 取得成功時と失敗時の挙動を決める

## 完了条件
- 曜日と時限に応じた講義候補を取得できる
- レスポンスを console または画面上で確認できる
- エラー時の処理が最低限ある
```

## 実装までのフロー

### 1. API 仕様を先に確認する

実装前に、DB 班に次の内容を確認する。

- API のベース URL
- 認証が必要か
- Cookie 認証か token 認証か
- `GET /lectures/search` のクエリパラメータ
- `term` や `day` の値の定義
- データが 0 件のときのレスポンス
- エラー時のステータスコード

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

- 画面中央にカレンダーを表示する
- ユーザーが曜日と時限を選択する
- カレンダーのマス選択を検索条件として使う

#### Lecture Modal

- 選択された曜日と時限に応じて講義候補を出す
- 講義名と先生名を表示する
- 選択時に `serial_num` を次画面へ渡せるようにする

今回の対象は、名古屋工業大学 情報工学科 3 年の授業のみです。
そのため、検索条件として特に重要なのは次の 4 つです。

- `grade`
- `term`
- `day`
- `period`

### 4. JavaScript の役割を分ける

実装時は、少なくとも次の責務に分ける。

- API からデータを取る関数
- 取得した配列を画面用に整える関数
- HTML に反映する関数

いきなり全部を 1 つの関数に入れない。

## 実装イメージ

### 取得処理の基本形

```javascript
async function searchLectures({ grade, term, day, period }) {
  const params = new URLSearchParams({
    grade: String(grade),
    term: String(term),
    day: String(day),
    period: String(period),
  });

  const response = await fetch(`/lectures/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error('講義候補の取得に失敗しました');
  }

  return response.json();
}
```

## この段階で最低限やること

DB 班のデータ取得までが目的なので、この段階では次を優先する。

- API へ正しくアクセスできる
- 必要な JSON を受け取れる
- `grade` `term` `day` `period` を使って候補を取れる
- 受け取ったデータを `console.log` で確認できる
- エラー時に失敗が分かる

逆に、まだ無理にやらなくてよいものは次です。

- 見た目の調整
- 高度なバリデーション
- 状態管理の最適化
- レビュー画面との統合

## 実装前に確認したい質問

DB 班に次を聞けると安全です。

- `GET /lectures/search` は `grade` `term` `day` `period` で検索できるか
- 返却値は配列か、`data` を持つオブジェクトか
- `term` は `0/1` か `spring/fall` か
- `day` は月曜始まりで `1-5` なのか
- `period` は `1-5` か `1-6` か
- CORS 設定はどうするか

## このフェーズの完了条件

- GitHub Issue を作成済み
- API 仕様の未確定点を洗い出せている
- 曜日と時限に応じた講義候補の取得コードがある
- 候補講義を表示する流れが整理できている
- JavaScript でレスポンス確認ができる

## 次のフェーズ

データ取得ができたら、次に進む。

1. カレンダーで `◯曜日 ◯限` を選択できるようにする
2. モーダル内に候補講義を一覧表示する
3. 講義選択後の遷移は他担当と接続する
