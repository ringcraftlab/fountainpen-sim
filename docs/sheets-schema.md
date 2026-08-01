# Google Sheets スキーマ

1つのスプレッドシート内に 4シート。**色を主データ**として扱い、パーツは色 × 5パーツタイプから GAS 側で派生生成する。

## `colors` (主データ)

| id | name | hex | category | status | sortOrder | locations | note |
|---|---|---|---|---|---|---|---|
| fresh_pink | フレッシュピンク | #f4c0d0 | solid | ACTIVE | 30 | lab,ankora,bungujoshi |  |
| discontinued_x | 過去の色 | #abcdef | solid | DISCONTINUED | 900 | lab | 2024年廃盤 |

- **id**: 内部ID (半角英数字 + アンダースコア)
- **name**: 表示名
- **hex**: `#RRGGBB`
- **category**: `solid` / `milky` / `clear`
- **status**: `ACTIVE` (現行) / `DISCONTINUED` (廃盤)
- **sortOrder**: 数値、小さい順に表示
- **locations**: 販売店舗ID をカンマ区切り (`lab,ankora,bungujoshi`)
- **note**: イベント名や備考など任意

**新色追加はこのシートに 1 行足すだけ。** 5パーツタイプは GAS が自動生成する。

## `collections`

| id | name | parts_json | metalColor | kind | comment | createdAt |
|---|---|---|---|---|---|---|
| col-001 | お気に入り桜 | `{"cap_top":"ct-black","cap":"c-fresh_pink",...}` | gold | owned | 春に使う | 2026-03-01T12:00:00Z |

- **kind**: `owned` (所有中) / `wishlist` (購入検討)
- **parts_json**: 5パーツの選択を JSON 文字列で保存
- **createdAt**: ISO8601

## `inventory` (現状ドメイン外だが interface 保持用)

| partId | owned | wishlist |

`Collection.kind='owned'` から自動導出しているため実質未使用。

## `locations`

| id | name | active |
|---|---|---|
| lab | Style Of Lab | TRUE |
| ankora | アンコーラ | TRUE |
| bungujoshi | 文具女子博 | TRUE |

## 運用ルール

- ヘッダー行は 1 行目固定。GAS はヘッダー名で列解決するため、列追加に強い
- **色を追加**: `colors` シートに 1 行追加、`status=ACTIVE`、`sortOrder` は既存値の間で調整
- **色を廃盤にする**: `status=DISCONTINUED` に変更。既存コレクションは維持される (該当色は「廃盤色を表示」で選択可)
- **色を消す**: 過去コレクションが壊れる可能性あり非推奨。廃盤扱いを推奨
