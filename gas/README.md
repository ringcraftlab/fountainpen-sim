# GAS (Google Apps Script) — API Layer

React クライアントが呼び出す REST 風エンドポイントを Google Apps Script Web App として提供する。

## セットアップ手順

### 1. Google Sheets を新規作成

- https://sheets.new で空のスプレッドシートを作成
- 名前を「Fountain Pen Buffet」等に

### 2. Apps Script プロジェクトを開く

- Sheets の **拡張機能 → Apps Script** を開く
- デフォルトの `Code.gs` の中身を **すべて削除**
- `gas/Code.gs` の中身を **すべてコピペ**
- 保存 (Ctrl+S)

### 3. 初期データ投入

- Apps Script エディタで、関数選択ドロップダウンから **`setupSheets`** を選択
- **実行** ボタンをクリック
- 初回は権限確認 → 承認
- 完了通知 (「パーツ 115 件を作成しました」) が出る

Sheets を確認すると `parts` / `collections` / `inventory` / `locations` の4シートが作成され、初期データが入っている。

### 4. Web App としてデプロイ

- Apps Script エディタ右上 **デプロイ → 新しいデプロイ**
- 種類: **ウェブアプリ**
- 説明: (任意)
- 次のユーザーとして実行: **自分**
- アクセスできるユーザー: **全員** (認証なし公開)
- デプロイ → **ウェブアプリURL をコピー**

### 5. React 側の設定

プロジェクトルートに `apps/web/.env.local` を作成:

```
VITE_GAS_ENDPOINT=https://script.google.com/macros/s/xxxxxxxxxxxxx/exec
```

`npm run dev` を再起動すると自動で GAS 経由になる。

## エンドポイント

すべて POST 単一エンドポイント。`{ action, params }` で分岐。

| action | params | data |
|---|---|---|
| `parts.list` | `{ type?, locationId?, availableOnly? }` | `Part[]` |
| `parts.get` | `{ id }` | `Part` |
| `collections.list` | — | `Collection[]` |
| `collections.create` | `NewCollection` | `Collection` |
| `collections.delete` | `{ id }` | `null` |
| `inventory.list` | — | `InventoryEntry[]` |
| `inventory.upsert` | `InventoryEntry` | `null` |
| `locations.list` | — | `Location[]` |

## スキーマ

[docs/sheets-schema.md](../docs/sheets-schema.md) 参照。

## 開発 Tips

- `Code.gs` を編集したら **再デプロイ** (デプロイの管理 → 編集 → バージョン: 新バージョン)
- ログは Apps Script エディタ左メニュー **実行数** で確認
- Sheets を直接編集しても即反映される (キャッシュなし)
