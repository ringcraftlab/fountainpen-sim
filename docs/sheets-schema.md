# Google Sheets スキーマ

1 つのスプレッドシート内に 4 シート + 任意の `_meta` を用意する。

## `parts`

| id | type | name | image | currentAvailable | locations | tags |
|---|---|---|---|---|---|---|
| c-pink | cap | さくらもち | /images/parts/cap-pink.svg | TRUE | lab,bungujoshi | 桃 |

- `type`: `cap_top` / `cap` / `grip` / `barrel` / `barrel_end` の 5 種（金属はグローバル選択のためパーツではない）
- `locations`, `tags`: カンマ区切り
- `image`: `apps/web/public/` 起点のパス（例: `/images/parts/xxx.svg`）

## `collections`

| id | name | parts_json | metalColor | comment | createdAt |
|---|---|---|---|---|---|
| col-001 | お気に入り桜 | `{"cap_top":"ct-black","cap":"c-pink",...}` | gold | 春に使う | 2026-03-01T12:00:00Z |

- `parts_json`: 5 パーツの選択を JSON 文字列で保存（拡張時に列追加不要）
- `metalColor`: `gold` / `silver`
- `createdAt`: ISO8601

## `inventory`

| partId | owned | wishlist |

## `locations`

| id | name | active |
|---|---|---|
| lab | Style Of Lab | TRUE |
| ankora | あんコーラ | TRUE |
| bungujoshi | 文具女子博 | TRUE |

## 運用ルール

- ヘッダー行は 1 行目固定。GAS はヘッダー名で列解決するため、列追加に強い。
- id は接頭辞つき（`ct-`, `c-`, `m-`, `g-`, `b-`, `be-`, `col-`）で衝突回避。GAS 側で採番。
