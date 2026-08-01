/**
 * Fountain Pen Buffet Simulator — GAS Web App
 *
 * データモデル (2026-08 リファクタ):
 *   colors シート: 1色 = 1行 (id / name / hex / category / status / sortOrder / locations / note)
 *   parts はサーバー側で colors × 5パーツタイプ から派生生成
 *
 * エントリ:
 *   doPost(e) → JSON {action, params} → JSON {ok, data|error}
 *
 * 初期セットアップ:
 *   1) 空の Google Sheets を作成
 *   2) 拡張機能 → Apps Script でこのファイルをコピペ
 *   3) 関数 `setupSheets` を実行 → colors / collections / inventory / locations の4シート作成
 *   4) デプロイ → ウェブアプリ (アクセス: 全員)
 *   5) デプロイURLを React の VITE_GAS_ENDPOINT に設定
 */

const PART_TYPES = ['cap_top', 'cap', 'grip', 'barrel', 'barrel_end'];
const PART_PREFIX = { cap_top: 'ct', cap: 'c', grip: 'g', barrel: 'b', barrel_end: 'be' };

// ============================================================
// エントリポイント
// ============================================================

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    const params = body.params || {};
    const data = route(action, params);
    return jsonResponse({ ok: true, data: data });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: { code: err.code || 'internal_error', message: err.message || String(err) },
    });
  }
}

function doGet() {
  return jsonResponse({ ok: true, data: { message: 'Fountain Pen Buffet API' } });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ============================================================
// ルーター
// ============================================================

function route(action, params) {
  switch (action) {
    case 'colors.list':         return listColors(params);
    case 'parts.list':          return listParts(params);
    case 'parts.get':           return getPart(params);
    case 'collections.list':    return listCollections();
    case 'collections.create':  return createCollection(params);
    case 'collections.delete':  return deleteCollection(params);
    case 'inventory.list':      return listInventory();
    case 'inventory.upsert':    return upsertInventory(params);
    case 'locations.list':      return listLocations();
    default:
      throw makeError('unknown_action', 'Unknown action: ' + action);
  }
}

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ============================================================
// Repository: シートの汎用I/O
// ============================================================

function sheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw makeError('sheet_not_found', 'Sheet not found: ' + name);
  return s;
}

function readAll(sheetName) {
  const s = sheet(sheetName);
  const values = s.getDataRange().getValues();
  if (values.length < 2) return { header: values[0] || [], rows: [] };
  const header = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = row[j];
    rows.push(obj);
  }
  return { header: header, rows: rows };
}

function appendRow(sheetName, obj) {
  const s = sheet(sheetName);
  const header = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  const row = header.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  s.appendRow(row);
}

function findRowIndex(sheetName, key, value) {
  const s = sheet(sheetName);
  const values = s.getDataRange().getValues();
  const header = values[0];
  const idx = header.indexOf(key);
  if (idx < 0) return -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idx]) === String(value)) return i + 1;
  }
  return -1;
}

function deleteRowByKey(sheetName, key, value) {
  const rowNum = findRowIndex(sheetName, key, value);
  if (rowNum < 0) return false;
  sheet(sheetName).deleteRow(rowNum);
  return true;
}

function upsertRow(sheetName, key, obj) {
  const s = sheet(sheetName);
  const header = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  const rowNum = findRowIndex(sheetName, key, obj[key]);
  const row = header.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  if (rowNum > 0) {
    s.getRange(rowNum, 1, 1, header.length).setValues([row]);
  } else {
    s.appendRow(row);
  }
}

// ============================================================
// Colors
// ============================================================

function readAllColors() {
  const { rows } = readAll('colors');
  return rows.map(rowToColor).sort(function (a, b) {
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
}

function listColors(params) {
  return readAllColors().filter(function (c) {
    if (!params.includeDiscontinued && c.status === 'DISCONTINUED') return false;
    if (params.locationId && c.locations.indexOf(params.locationId) < 0) return false;
    return true;
  });
}

function rowToColor(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    hex: String(row.hex),
    category: String(row.category || 'solid'),
    status: String(row.status || 'ACTIVE'),
    sortOrder: Number(row.sortOrder || 0),
    locations: String(row.locations || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; }),
    note: row.note ? String(row.note) : undefined,
  };
}

// ============================================================
// Parts (colors × types から派生)
// ============================================================

function partsFromColors(colors) {
  const parts = [];
  for (let ti = 0; ti < PART_TYPES.length; ti++) {
    const type = PART_TYPES[ti];
    for (let ci = 0; ci < colors.length; ci++) {
      const c = colors[ci];
      parts.push({
        id: PART_PREFIX[type] + '-' + c.id,
        type: type,
        name: c.name,
        colorHex: c.hex,
        colorKind: c.category,
        currentAvailable: c.status === 'ACTIVE',
        locations: c.locations,
        tags: [c.category],
      });
    }
  }
  return parts;
}

function listParts(params) {
  const colors = readAllColors();
  return partsFromColors(colors).filter(function (p) {
    if (params.type && p.type !== params.type) return false;
    if (params.availableOnly && !p.currentAvailable) return false;
    if (params.locationId && p.locations.indexOf(params.locationId) < 0) return false;
    return true;
  });
}

function getPart(params) {
  const parts = partsFromColors(readAllColors());
  const found = parts.filter(function (p) { return p.id === params.id; })[0];
  if (!found) throw makeError('not_found', 'Part not found: ' + params.id);
  return found;
}

// ============================================================
// Collections
// ============================================================

function listCollections() {
  const { rows } = readAll('collections');
  return rows.map(rowToCollection).sort(function (a, b) {
    return b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0;
  });
}

function createCollection(params) {
  const id = 'col-' + Date.now();
  const createdAt = new Date().toISOString();
  const record = {
    id: id,
    name: String(params.name || ''),
    parts_json: JSON.stringify(params.parts || {}),
    metalColor: String(params.metalColor || 'gold'),
    kind: String(params.kind || 'owned'),
    comment: String(params.comment || ''),
    createdAt: createdAt,
  };
  appendRow('collections', record);
  return rowToCollection(record);
}

function deleteCollection(params) {
  deleteRowByKey('collections', 'id', params.id);
  return null;
}

function rowToCollection(row) {
  let parts = {};
  try { parts = row.parts_json ? JSON.parse(row.parts_json) : {}; } catch (e) { parts = {}; }
  return {
    id: String(row.id),
    name: String(row.name),
    parts: parts,
    metalColor: String(row.metalColor || 'gold'),
    kind: String(row.kind || 'owned'),
    comment: String(row.comment || ''),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

// ============================================================
// Inventory
// ============================================================

function listInventory() {
  const { rows } = readAll('inventory');
  return rows.map(function (row) {
    return {
      partId: String(row.partId),
      owned: row.owned === true || String(row.owned).toUpperCase() === 'TRUE',
      wishlist: row.wishlist === true || String(row.wishlist).toUpperCase() === 'TRUE',
    };
  });
}

function upsertInventory(params) {
  upsertRow('inventory', 'partId', {
    partId: params.partId,
    owned: params.owned ? 'TRUE' : 'FALSE',
    wishlist: params.wishlist ? 'TRUE' : 'FALSE',
  });
  return null;
}

// ============================================================
// Locations
// ============================================================

function listLocations() {
  const { rows } = readAll('locations');
  return rows.map(function (row) {
    return {
      id: String(row.id),
      name: String(row.name),
      active: row.active === true || String(row.active).toUpperCase() === 'TRUE',
    };
  });
}

// ============================================================
// セットアップ: colors シートに 23色を投入、parts シートは廃止
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- colors ---
  let s = ss.getSheetByName('colors') || ss.insertSheet('colors');
  s.clear();
  s.appendRow(['id', 'name', 'hex', 'category', 'status', 'sortOrder', 'locations', 'note']);

  const PALETTE = [
    ['clear',          'クリア',             '#e5e7eb', 'clear'],
    ['black',          'ブラック',           '#2b2b30', 'solid'],
    ['fresh_pink',     'フレッシュピンク',   '#f4c0d0', 'solid'],
    ['rose_pink',      'ローズピンク',       '#b98599', 'solid'],
    ['light_blue',     'ライトブルー',       '#a4c2d8', 'solid'],
    ['green',          'グリーン',           '#4fa88b', 'solid'],
    ['mustard_yellow', 'マスタードイエロー', '#c9a24a', 'solid'],
    ['taupe',          'トープ',             '#8a7a6a', 'solid'],
    ['navy_blue',      'ネイビーブルー',     '#252b45', 'solid'],
    ['white',          'ホワイト',           '#f5f4ef', 'solid'],
    ['milky_white',    'ミルキーホワイト',   '#f2ecdc', 'milky'],
    ['clear_coffee',   'クリアコーヒー',     '#a58a72', 'clear'],
    ['milky_peach',    'ミルキーピーチ',     '#f4c6a8', 'milky'],
    ['milky_lavender', 'ミルキーラベンダー', '#c9bcd8', 'milky'],
    ['milky_soda',     'ミルキーソーダ',     '#c8dfe2', 'milky'],
    ['clear_emerald',  'クリアエメラルド',   '#2b8b7b', 'clear'],
    ['clear_mango',    'クリアマンゴー',     '#e8ce5a', 'clear'],
    ['clear_orange',   'クリアオレンジ',     '#e88a4a', 'clear'],
    ['clear_violet',   'クリアバイオレット', '#7a5aa8', 'clear'],
    ['clear_muscat',   'クリアマスカット',   '#b8d478', 'clear'],
    ['red',            'レッド',             '#d33a3a', 'solid'],
    ['blue',           'ブルー',             '#3a5ab8', 'solid'],
    ['clear_taupe',    'クリアトープ',       '#a89a88', 'clear'],
  ];
  const LOC_PATTERNS = [
    'lab,ankora,bungujoshi',
    'lab,ankora',
    'lab,bungujoshi',
    'ankora,bungujoshi',
    'lab',
    'ankora',
    'bungujoshi',
  ];
  const rows = PALETTE.map(function (p, i) {
    return [p[0], p[1], p[2], p[3], 'ACTIVE', (i + 1) * 10, LOC_PATTERNS[i % LOC_PATTERNS.length], ''];
  });
  s.getRange(2, 1, rows.length, 8).setValues(rows);

  // --- collections ---
  s = ss.getSheetByName('collections') || ss.insertSheet('collections');
  s.clear();
  s.appendRow(['id', 'name', 'parts_json', 'metalColor', 'kind', 'comment', 'createdAt']);

  // --- inventory ---
  s = ss.getSheetByName('inventory') || ss.insertSheet('inventory');
  s.clear();
  s.appendRow(['partId', 'owned', 'wishlist']);

  // --- locations ---
  s = ss.getSheetByName('locations') || ss.insertSheet('locations');
  s.clear();
  s.appendRow(['id', 'name', 'active']);
  const locs = [
    ['lab',        'Style Of Lab', true],
    ['ankora',     'アンコーラ',   true],
    ['bungujoshi', '文具女子博',   true],
  ];
  s.getRange(2, 1, locs.length, 3).setValues(locs);

  // 旧 parts シートは廃止 (存在すれば削除)
  const oldParts = ss.getSheetByName('parts');
  if (oldParts) ss.deleteSheet(oldParts);

  Logger.log('セットアップ完了: colors 23色 + locations 3件 + collections/inventory (parts シートは廃止)');
}
