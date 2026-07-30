# Google Sheets スキーマ

1 つのスプレッドシート内に 4 シート + 任意の `_meta` を用意する。

## `parts`

| id | type | name | image | currentAvailable | locations | tags |
|---|---|---|---|---|---|---|
| cap-001 | cap | 深緑蓋 | /images/parts/cap-001.png | TRUE | lab,ankora | 緑 |

- `type`: `cap` / `body` / `nib`
- `locations`, `tags`: カンマ区切り

## `collections`

| id | name | capId | bodyId | nibId | comment | createdAt |

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
- id は接頭辞つき（`cap-001` など）で衝突回避。GAS 側で採番。
