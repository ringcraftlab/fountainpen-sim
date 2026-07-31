# Fountain Pen Buffet Simulator

> 万年筆パーツを組み合わせて一本のペンを組み立てるシミュレーター。
> SAILOR がかつて提供していた「[万年筆buffet](https://sailor.co.jp/mannenhitsu_buffet)」シミュレーターがサービス終了したため、その体験を復活させる目的で個人開発。

🌐 **Live Demo**: https://fountainpen-sim-web.vercel.app

<!-- スクリーンショットは後日追加 -->

---

## 背景 / なぜ作ったか

- SAILOR の「万年筆buffet」は、蓋・胴・大先などのパーツを選んで自分好みの一本を組み立てられる公式サービス
- 実店舗（Style Of Lab / アンコーラ / 文具女子博）で購入したパーツを組み合わせる楽しさが売り
- **公式シミュレーターが終了してしまい、事前に配色を確認する手段がなくなった**
- 実際に多数のパーツを所有している立場から、購入前の検討と、既存所有パーツの組み合わせ管理を両立できるツールが欲しい

## 主な機能

### シミュレーター
- 5パーツ（蓋栓・蓋・大先・胴・尾栓）を選んで組み合わせ
- 23色のパレット（クリア / ミルキー / ソリッド系）から色を選択
- 金属パーツをゴールド / シルバーで統一切替
- 販売場所（Style Of Lab / アンコーラ / 文具女子博）で絞り込み
- 3ビュープレビュー（組立 / 蓋オフ / キャップポスト）を SVG で動的生成
- ランダム組み合わせ生成

### コレクション
- 現在の組み合わせを名前 + コメント付きで保存
- **種別選択**: 「所有中」（実際に持っている）/「購入検討」（買いたい）
- 一覧・削除

### 手持ち管理
- `kind: 'owned'` のコレクションから自動導出（手動登録不要）
- シミュレーターに **所有ステータスサマリー**（蓋 / 大先 / 胴）を表示 → 重複購入を抑止
- パーツタブ上に所有バッジ

## 技術スタック

| 分類 | 技術 | 理由 |
|---|---|---|
| Frontend | **React 19 + TypeScript** | 型安全とコンポーネント指向の定番 |
| Build | **Vite** | 高速な HMR、モダンな ESM 前提 |
| Style | **Tailwind CSS v4** | ユーティリティで素早く形にする、v4 の設定レスさ |
| Routing | **React Router v7** | 定番、SSR不要ケースで十分 |
| State | **Zustand** | Redux より軽量、hooks フレンドリー、テストしやすい |
| Icons | **lucide-react** | SVG ベース、Tree-shake 対応 |
| Backend | **Google Apps Script (Web App)** | サーバーレス、無料、Google Sheets との親和性 |
| DB | **Google Sheets** | 個人アプリで十分。スプレッドシートで直接データを見られる利便性 |
| Deploy | **Vercel** | Vite との相性、PR プレビュー、Git 連携 |
| Repo | **GitHub + npm workspaces** | モノレポで frontend / GAS を1リポで管理 |

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│  Browser (React SPA / Vite)             │
│  ┌───────────────────────────────────┐  │
│  │ Pages (シミュレーター/コレクション/手持ち)│
│  │ Components (PartShape / PenPreview…)│
│  │ Zustand Stores (parts/locations/…)  │
│  │ ApiClient (interface)               │
│  └────────────┬──────────────────────┘  │
└───────────────┼─────────────────────────┘
                │
    ┌───────────┴────────────┐
    │  切替 (環境変数で自動)  │
    ▼                        ▼
┌─────────┐            ┌──────────────────┐
│ Mock    │            │ GAS Web App      │
│ (in-mem)│            │  ├─ Router       │
└─────────┘            │  ├─ Controllers  │
                       │  └─ Repository   │
                       └────────┬─────────┘
                                ▼
                       ┌──────────────────┐
                       │  Google Sheets   │
                       └──────────────────┘
```

### レイヤー分離

- **UI**: React コンポーネント（`components/`, `pages/`）
- **State**: Zustand ストア（`features/*/store.ts`, `lib/stores/`）
- **API 抽象化**: `ApiClient` interface（`lib/api/types.ts`）
- **API 実装**: モック（`mock.ts`）と GAS（`gas.ts`）を差し替え可能
- **GAS 側**: Router → Controller → Repository（Sheets I/O）

## 設計判断（Why）

### なぜ Google Sheets を DB に？
- 個人利用の規模では RDB は過剰
- **スプレッドシートで直接データを目視・編集できる** 利便性が最強
- 家族/友人と共有もリンク1つ
- 学習コスト・運用コストが最低

### なぜ GAS を REST 風に？
- Sheets を直接 fetch できない（要 API 権限 + OAuth）→ 薄い API を挟む
- GAS Web App は無料で立てられる
- `doPost` 1つ + `action` ディスパッチで複数エンドポイントを表現
  - CORS プリフライトを回避するため Content-Type: text/plain で送る技も含む

### なぜ ApiClient を interface で？
- **モック実装で UI 単体を動かせる**（GAS 未接続でも開発可能）
- **将来 GAS → 別バックエンド（Firebase / 自前 API）に差し替え可能**
- テストで注入しやすい

### なぜ Zustand？
- Context + Reducer より書き量が少ない
- 型が素直、Redux DevTools 対応
- ドメインごとに小さいストアを分割しやすい

### なぜ SVG で万年筆を描画？
- パーツごとに色を動的に変える必要がある → 画像切替より柔軟
- パーツ形状は数式で表現できるレベルの図形
- スケーラブル / アクセシブル

### なぜ「手持ち」を独立管理せずコレクションから導出？
- 「手持ちに登録」と「コレクションに保存」の二重管理は UX として煩雑
- 実際に組み合わせて保存 = 所有している状態と等価
- `Collection.kind` で「所有中 / 購入検討」を区別すれば十分

## ディレクトリ構成

```
fountainpen-sim/
├── apps/
│   └── web/                     # React frontend
│       ├── src/
│       │   ├── pages/           # ページ (SimulatorPage / CollectionsPage / InventoryPage)
│       │   ├── features/        # ドメイン別
│       │   │   ├── simulator/   # コンポーネント + ストア + colors palette
│       │   │   ├── collections/ # 保存ダイアログ + ストア
│       │   │   └── inventory/   # 所有導出ロジック
│       │   ├── components/      # 汎用 (Layout)
│       │   ├── lib/
│       │   │   ├── api/         # ApiClient interface + mock + gas 実装
│       │   │   └── stores/      # 横断ストア (parts, locations)
│       │   ├── types/           # ドメイン型
│       │   └── router.tsx
│       └── vercel.json          # SPA rewrite
├── gas/                         # Google Apps Script
│   ├── Code.gs                  # 単一ファイル API 実装 + setupSheets
│   └── README.md                # GAS セットアップ手順
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── sheets-schema.md
└── README.md
```

## ローカル起動

```bash
# 依存関係
npm install

# フロントエンド起動
npm run dev
# → http://localhost:5173
```

デフォルトは **LocalStorage** で動作するのでセットアップ不要。

## ストレージ切替

| プロバイダ | 用途 | データ保存先 | 環境変数 |
|---|---|---|---|
| **local** (デフォルト) | 公開デモ / 気軽な個人利用 | ブラウザの LocalStorage | `VITE_API_PROVIDER=local` |
| **gas** | 本格個人利用 (端末間共有) | Google Sheets | `VITE_API_PROVIDER=gas` + `VITE_GAS_ENDPOINT=...` |
| **mock** | UI 開発 / テスト | メモリ (リロードで消える) | `VITE_API_PROVIDER=mock` |

- 環境変数未指定なら `local`
- `VITE_GAS_ENDPOINT` 単独指定なら `gas` として自動判定 (後方互換)

## GAS + Google Sheets セットアップ

実データで永続化する場合は [gas/README.md](gas/README.md) の手順に従ってください。

## 今後の予定

- [ ] URL共有（現在の組み合わせを URL エンコード）
- [ ] PNG 出力（コレクションを画像として保存）
- [ ] コレクション編集
- [ ] GitHub Actions CI（lint / typecheck / build）
- [ ] Vitest による基本テスト（ApiClient / Store）
- [ ] ダークモード切替
- [ ] AI 提案（テキストから配色サジェスト）

## ライセンス

MIT
