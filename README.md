# Fountain Pen Buffet Simulator

万年筆ビュッフェ（Style Of Lab、あんコーラ、文具女子博）で購入したパーツの
組み合わせをシミュレーションする Web アプリ。

## 構成

```
fountainpen-sim/
├── apps/
│   └── web/    # React + Vite + TS + Tailwind + shadcn/ui
└── gas/        # Google Apps Script (Web App as REST API)
```

- **Frontend**: React / Vite / TypeScript / Tailwind CSS / shadcn/ui / React Router / Zustand
- **Backend**: Google Apps Script (Web App)
- **DB**: Google Sheets

## 開発

```bash
npm install
npm run dev
```

## Phase

- [x] Phase 0: 基盤スケルトン + モック API
- [ ] Phase 1: シミュレーター
- [ ] Phase 2: GAS + Sheets 接続
- [ ] Phase 3: コレクション
- [ ] Phase 4: 手持ち
- [ ] Phase 5: 仕上げ

## コミット規約

Conventional Commits: `feat:` `fix:` `docs:` `refactor:` `chore:` `test:` `build:` `ci:`
