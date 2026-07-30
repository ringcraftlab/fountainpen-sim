# GAS (Google Apps Script) — API Layer

React クライアントが呼び出す REST 風エンドポイントを Google Apps Script Web App として提供する。

## セットアップ（Phase 2 で実施）

1. Google Sheets を新規作成し、`docs/sheets-schema.md` に従ってシートを用意
2. スプレッドシートの拡張機能 → Apps Script でプロジェクトを開く
3. `clasp` を使う場合:
   ```bash
   npm i -g @google/clasp
   clasp login
   clasp clone <SCRIPT_ID>
   ```
4. `src/` の内容をアップロード → Web App としてデプロイ
5. デプロイ URL を React 側 `.env` の `VITE_GAS_ENDPOINT` に設定

## エンドポイント

すべて POST 単一エンドポイント。詳細は [`docs/api.md`](../docs/api.md) 参照。

```
POST <deploy-url>
Body: { "action": "parts.list", "params": {...} }
```

## 構成

```
gas/src/
├── main.ts            # doGet/doPost エントリ
├── router.ts          # action → controller
├── controllers/       # ドメイン別ハンドラ
├── repositories/      # Sheets I/O
├── middleware/        # 認証（MVPは素通し）
└── lib/               # response/validation ヘルパー
```
