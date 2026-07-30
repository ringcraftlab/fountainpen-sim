# アーキテクチャ

```
Browser (React SPA)
  ├─ UI (shadcn/ui + Tailwind)
  ├─ Router (React Router)
  ├─ State (Zustand)
  └─ ApiClient (差し替え可能)
        │
        ▼
GAS Web App (doPost)
  ├─ Router (action ディスパッチ)
  ├─ Controllers
  ├─ Repositories (Sheets I/O)
  └─ Middleware (認証・後付け用フック)
        │
        ▼
Google Sheets (DB)
```

## 設計原則

- **レイヤー分離**: UI / State / API Client / GAS Controller / Repository を明確に分離。
- **ApiClient 抽象化**: `interface ApiClient` を切って GAS 実装を注入。将来 Firebase や自前 API に差し替え可能。モック実装 (`mock.ts`) で UI 単体でも動作する。
- **画像は Sheets に持たない**: URL のみ格納。実体は `apps/web/public/images/parts/`。
- **認証は後付け**: GAS 側 `middleware/auth.ts` を用意し、MVP では素通し。将来トークン検証を挿入。

## 状態管理

- サーバー由来データ（parts / collections / inventory / locations）と UI 状態（現在の選択）を別ストアに分離。
- 各ストア内で `api` を呼び、UI からは selector で購読。
