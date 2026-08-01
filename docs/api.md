# API 仕様

## エンドポイント

```
POST <GAS Web App URL>
Content-Type: text/plain;charset=utf-8   # CORSプリフライト回避のため text/plain
```

## リクエスト形式

```json
{ "action": "parts.list", "params": { "type": "cap" } }
```

## レスポンス形式

```json
{ "ok": true, "data": ... }
```

エラー時:

```json
{ "ok": false, "error": { "code": "not_found", "message": "..." } }
```

## Actions

| action | params | data |
|---|---|---|
| `colors.list` | `{ includeDiscontinued?, locationId? }` | `ColorSwatch[]` |
| `parts.list` | `{ type?, locationId?, availableOnly? }` | `Part[]` (colors から派生) |
| `parts.get` | `{ id }` | `Part` |
| `collections.list` | — | `Collection[]` |
| `collections.create` | `NewCollection` (name / parts / comment) | `Collection` |
| `collections.delete` | `{ id }` | `void` |
| `inventory.list` | — | `InventoryEntry[]` |
| `inventory.upsert` | `InventoryEntry` | `void` |
| `locations.list` | — | `Location[]` |

## 認証

MVP では未実装（`middleware/auth.ts` は素通し）。将来トークン検証を追加予定。
