# 現状設計ドキュメント

コードから起こした現時点の設計。2026-08-01 時点。

---

## 1. 全体構成

```
fountainpen-sim/
├── apps/
│   └── web/                    # React SPA
│       ├── src/
│       │   ├── pages/          # ページ (Simulator / Collections / Inventory)
│       │   ├── features/       # ドメイン別
│       │   │   ├── simulator/  # コンポーネント + ストア + colors パレット + URLSync
│       │   │   ├── collections/# 保存ダイアログ + ストア
│       │   │   └── inventory/  # 所有導出フック (useIsOwned)
│       │   ├── components/     # Layout
│       │   ├── lib/
│       │   │   ├── api/        # ApiClient interface + 3実装
│       │   │   └── stores/     # partsStore / locationsStore
│       │   ├── types/          # ドメイン型
│       │   └── router.tsx
│       ├── vercel.json
│       └── .env.local          # VITE_GAS_ENDPOINT (ローカル開発用)
├── gas/
│   ├── Code.gs                 # 単一ファイル GAS Web App
│   └── README.md
└── docs/
```

---

## 2. 技術スタック

### Frontend
- React 19
- TypeScript
- Vite (ビルド)
- Tailwind CSS v4
- React Router v7 (ルーティング)
- Zustand (状態管理)
- lucide-react (アイコン)
- html-to-image (PNG エクスポート)

### Backend
- Google Apps Script (Web App)
- Google Sheets (データストア)

### インフラ
- Vercel (公開デプロイ)
- GitHub (リポジトリ)
- npm workspaces (モノレポ)

---

## 3. ドメイン型 (types/domain.ts)

### パーツ種別
```ts
type PartType = 'cap_top' | 'cap' | 'grip' | 'barrel' | 'barrel_end'
```
5種類固定。

### 色
```ts
type ColorKind = 'solid' | 'milky' | 'clear'
type ColorStatus = 'ACTIVE' | 'DISCONTINUED'

interface ColorSwatch {
  id: string
  name: string
  hex: string
  category: ColorKind
  status: ColorStatus
  sortOrder: number
  locations: string[]  // 販売店舗ID
  note?: string
}
```

### パーツ
```ts
interface Part {
  id: string          // `${prefix}-${colorId}` (例: c-fresh_pink)
  type: PartType
  name: string
  colorHex: string
  colorKind?: ColorKind
  currentAvailable: boolean
  locations: string[]
  tags: string[]
}
```
**Part は ColorSwatch × PartType から派生生成する**。DB には格納しない。

### 金属色
```ts
type MetalColor = 'gold' | 'silver'  // グローバル選択
```

### コレクション
```ts
type CollectionKind = 'owned' | 'wishlist'

interface Collection {
  id: string
  name: string
  parts: Partial<Record<PartType, string>>  // 各パーツの partId
  metalColor: MetalColor
  kind: CollectionKind
  comment: string
  createdAt: string  // ISO8601
}
```

### 販売店舗
```ts
interface Location {
  id: string
  name: string
  active: boolean
}
```

### インベントリ (現状ドメイン外、interface 保持用のみ)
```ts
interface InventoryEntry {
  partId: string
  owned: boolean
  wishlist: boolean
}
```
※ 現在は `Collection.kind === 'owned'` から自動導出しているため未使用。

---

## 4. API 抽象化層 (lib/api/)

### インターフェース (types.ts)
```ts
interface ApiClient {
  colors: ColorsApi
  parts: PartsApi
  collections: CollectionsApi
  inventory: InventoryApi
  locations: LocationsApi
}

interface ColorsApi {
  list(filter?: ColorsFilter): Promise<ColorSwatch[]>
}
interface PartsApi {
  list(filter?: PartsFilter): Promise<Part[]>
}
interface CollectionsApi {
  list(): Promise<Collection[]>
  create(input: NewCollection): Promise<Collection>
  remove(id: string): Promise<void>
}
interface InventoryApi {
  list(): Promise<InventoryEntry[]>
  upsert(entry: InventoryEntry): Promise<void>
}
interface LocationsApi {
  list(): Promise<Location[]>
}
```

### 3実装
| ファイル | 実装 | 保存先 | 主用途 |
|---|---|---|---|
| `mock.ts` | `createMockApiClient` | メモリ (リロードで消える) | UI開発 / テスト |
| `localStorage.ts` | `createLocalStorageApiClient` | ブラウザの LocalStorage | 公開デモ (Vercel) |
| `gas.ts` | `createGasApiClient` | Google Sheets 経由 | 個人利用 (ローカル開発) |

### 派生ヘルパ (parts.ts)
- `partsFromColors(colors)`: 1色 × 5パーツタイプ = 5 Part を生成
- `filterParts(list, filter)`: type/availableOnly/locationId でフィルタ
- `filterColors(list, filter)`: includeDiscontinued/locationId でフィルタ

### プロバイダ選択 (client.ts)
```ts
function resolveProvider() {
  // 1. VITE_API_PROVIDER が mock/local/gas なら採用
  // 2. VITE_GAS_ENDPOINT が指定されていれば gas
  // 3. それ以外は local (デフォルト)
}
```
環境変数依存で **無言のフォールバック**。ユーザーに通知なし。

---

## 5. 状態管理 (Zustand)

### サーバー由来
- `usePartsStore` — parts.list() の結果を保持
- `useLocationsStore` — locations.list() の結果を保持
- `useCollectionsStore` — collections の CRUD

### UI状態
- `useSimulatorStore` — 現在の選択 (selection, metalColor, locationId, activeTab)

### 導出ロジック
- `useIsOwned` — `kind='owned'` のコレクションから所有 partId セットを算出

### 情報の流れ
```
起動時:
  partsStore.fetch() → api.parts.list() → partsFromColors(colors)
  locationsStore.fetch() → api.locations.list()
  collectionsStore.fetch() → api.collections.list()

シミュレーターページ:
  simulatorStore.selection → PenPreview に反映
  URL クエリ ⇄ simulatorStore (useUrlSync による双方向同期)

コレクション保存:
  SaveDialog → collectionsStore.create() → api.collections.create()

所有ステータス表示:
  useIsOwned() が collectionsStore を購読
  → OwnershipStatus / PartTabs の所有バッジに反映
```

---

## 6. GAS + Sheets バックエンド

### エンドポイント (Code.gs)
- `doPost(e)` — 全リクエストの入口
- Body: `{ action: string, params: object }`
- Response: `{ ok: true, data } | { ok: false, error }`

### Action ルーティング
```
colors.list         → listColors(params)
parts.list          → listParts(params)  (colors から派生)
parts.get           → getPart(params)
collections.list    → listCollections()
collections.create  → createCollection(params)
collections.delete  → deleteCollection(params)
inventory.list      → listInventory()
inventory.upsert    → upsertInventory(params)
locations.list      → listLocations()
```

### Sheets スキーマ
| シート名 | カラム | 用途 |
|---|---|---|
| `colors` | id / name / hex / category / status / sortOrder / locations / note | 色マスター |
| `collections` | id / name / parts_json / metalColor / kind / comment / createdAt | 保存された組み合わせ |
| `inventory` | partId / owned / wishlist | 手持ち (現状未使用) |
| `locations` | id / name / active | 販売店舗マスター |

### 管理系関数
- `setupSheets()` — 初回セットアップ (既存シートは触らない設計)
- `resetSheets()` — 全シート削除して setupSheets 再実行 (**破壊的**)

### CORS 対応
- ブラウザは `Content-Type: text/plain` で POST
- GAS 側は `e.postData.contents` を JSON.parse
- Preflight を回避

---

## 7. ページ構成

### `/simulator` (SimulatorPage)
- 販売場所フィルタ (LocationFilter)
- 金属色ピッカー (MetalColorPicker)
- ペンプレビュー (PenPreview) — 3ビュー (組立 / 蓋オフ / キャップポスト)
- 所有ステータスサマリー (OwnershipStatus)
- パーツタブ (PartTabs) — 5タブ + 色チップグリッド
- アクションボタン: ランダム / 保存 / URL共有 / PNG保存 / リセット
- 指示書ダイアログ (OrderSheet)
- 保存ダイアログ (SaveDialog) — 種別 (所有/購入検討) 選択付き
- URL クエリと状態を双方向同期 (`useUrlSync`)

### `/collections` (CollectionsPage)
- 保存済みコレクションの一覧 (グリッド)
- 各カードにミニプレビュー + 種別バッジ + 削除ボタン
- 4列 (PC) / 2列 (モバイル)

### `/inventory` (InventoryPage)
- `kind='owned'` のコレクションのみ表示
- 実質「所有ペン一覧」

---

## 8. 描画 (SVG)

### `PartShape` (features/simulator/components/PartShape.tsx)
- 共通 viewBox 100x600
- パーツタイプごとに y 座標帯を担当:
  - cap_top: 0-40
  - cap | grip: 40-260 (排他)
  - barrel: 260-560
  - barrel_end: 560-580
- 色は props で受け取り動的に fill
- 円柱シェーディング / 金属グラデ / ドームハイライトで疑似3D

### `PenPreview`
- 3ビューを横並び (組立 / 蓋オフ / キャップポスト)
- 全ペン同じ幅、キャップポストは 7/6 倍縦長
- コンテナ高さに比例スケール

### `PostedPen`
- キャップポスト専用 SVG (viewBox 100x780)
- 蓋を胴後端に約 40% オーバーラップで配置

---

## 9. 環境変数

| 変数 | 値 | 効果 |
|---|---|---|
| `VITE_API_PROVIDER` | `mock` / `local` / `gas` | 明示的にプロバイダ指定 |
| `VITE_GAS_ENDPOINT` | GAS Web App URL | gas 使用時のエンドポイント |

### 現在のデプロイ環境
- **Vercel (公開)**: 環境変数未設定 → **local (LocalStorage)** で動作
- **ローカル開発**: `.env.local` に `VITE_GAS_ENDPOINT` 設定 → **gas** で動作

---

## 10. 既知の問題点

### 設計上のリスク
1. **保存先が UI に表示されない** — ユーザーはどこにデータが行くか分からない
2. **Silent Fallback** — 環境変数の設定違いで挙動が変わっても警告なし
3. **モード切替でデータ引き継ぎなし** — mock/local/gas でデータは共有されない
4. **プロバイダ切替が起動時にしかできない** — 動作中に切り替えられない

### 破壊性
5. **`resetSheets` は明示破壊関数**だが Code.gs 内に存在
6. **過去の setupSheets 実装が破壊的だった**歴史（既にデータ喪失を招いた）

### データ整合性
7. **マイグレーション機構なし** — 型変更時の既存データ互換性が担保されていない
8. **バックアップ機構なし**
9. **バリデーションなし** — 不正な入力を弾く仕組みが弱い

### UX
10. **色追加が「Sheets 手動編集」しかない** — 頻繁な追加/廃盤に耐えない
11. **管理者と一般ユーザーの権限分離なし** — 誰でも書き込める

---

## 11. 現時点で「動くこと」

- ✅ シミュレーターでパーツ選択・プレビュー
- ✅ コレクション保存 (LocalStorage or Sheets)
- ✅ コレクション一覧 / 削除
- ✅ 手持ちビュー (所有ペンフィルタ)
- ✅ 所有ステータス表示 (シミュレーター)
- ✅ URL 共有 / PNG 出力 / 指示書
- ✅ Vercel でのデプロイ
- ✅ GAS + Sheets 接続 (ローカル開発時)

## 12. 現時点で「壊れているまたは危険」

- ⚠️ setupSheets の破壊履歴 (再発防止済みだが警告なし)
- ⚠️ 色を追加/廃盤する運用フロー (Sheets 手動 5行入力 or リファクタ必須)
- ⚠️ Vercel と ローカル開発でデータ保存先が異なる
- ⚠️ 認証なし (Sheets 経由なら誰でも書き込める)
- ⚠️ データ削除・変更のログなし
