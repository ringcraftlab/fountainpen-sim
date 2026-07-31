/**
 * Fountain Pen Buffet Simulator — GAS Web App
 *
 * エントリ:
 *   doPost(e) → JSON リクエスト {action, params} → JSON レスポンス {ok, data|error}
 *
 * 初期セットアップ:
 *   1) 空の Google Sheets を作成
 *   2) 拡張機能 → Apps Script でこのファイルをコピペ
 *   3) 関数 `setupSheets` を実行 → シート4つ + 23色パーツ + 3販売場所を投入
 *   4) デプロイ → ウェブアプリとしてデプロイ (アクセス: 全員)
 *   5) デプロイURLを React 側の VITE_GAS_ENDPOINT に設定
 */

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

/** ヘッダー付きシートを全行取得。1行目 = ヘッダー、以降 = レコード。 */
function readAll(sheetName) {
  const s = sheet(sheetName);
  const values = s.getDataRange().getValues();
  if (values.length < 2) return { header: values[0] || [], rows: [] };
  const header = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = row[j];
    }
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
// Parts
// ============================================================

function listParts(params) {
  const { rows } = readAll('parts');
  return rows.map(rowToPart).filter(function (p) {
    if (params.type && p.type !== params.type) return false;
    if (params.availableOnly && !p.currentAvailable) return false;
    if (params.locationId && p.locations.indexOf(params.locationId) < 0) return false;
    return true;
  });
}

function getPart(params) {
  const { rows } = readAll('parts');
  const found = rows.map(rowToPart).filter(function (p) { return p.id === params.id; })[0];
  if (!found) throw makeError('not_found', 'Part not found: ' + params.id);
  return found;
}

function rowToPart(row) {
  return {
    id: String(row.id),
    type: String(row.type),
    name: String(row.name),
    colorHex: String(row.colorHex),
    colorKind: row.colorKind ? String(row.colorKind) : undefined,
    currentAvailable: row.currentAvailable === true || String(row.currentAvailable).toUpperCase() === 'TRUE',
    locations: String(row.locations || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; }),
    tags: String(row.tags || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; }),
  };
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
  const partsJson = JSON.stringify(params.parts || {});
  const record = {
    id: id,
    name: String(params.name || ''),
    parts_json: partsJson,
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
  try {
    parts = row.parts_json ? JSON.parse(row.parts_json) : {};
  } catch (e) {
    parts = {};
  }
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
// Inventory (現状の React 側では自動導出なので使わないが、API は保持)
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
// セットアップ: 初回のみ手動実行 (Apps Script エディタで実行)
//   1) シートを作成 (parts / collections / inventory / locations)
//   2) 販売場所3件を投入
//   3) 23色パーツを 5パーツタイプぶん (合計115件) 投入
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- parts ---
  let s = ss.getSheetByName('parts') || ss.insertSheet('parts');
  s.clear();
  s.appendRow(['id', 'type', 'name', 'colorHex', 'colorKind', 'currentAvailable', 'locations', 'tags']);

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

  // --- parts: 23色 × 5タイプ = 115行 ---
  const palette = [
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
  const types = ['cap_top', 'cap', 'grip', 'barrel', 'barrel_end'];
  const prefix = { cap_top: 'ct', cap: 'c', grip: 'g', barrel: 'b', barrel_end: 'be' };
  const partsSheet = ss.getSheetByName('parts');
  const partRows = [];
  types.forEach(function (type) {
    palette.forEach(function (c) {
      partRows.push([
        prefix[type] + '-' + c[0],
        type,
        c[1],
        c[2],
        c[3],
        true,
        'lab,ankora,bungujoshi',
        c[3],
      ]);
    });
  });
  partsSheet.getRange(2, 1, partRows.length, 8).setValues(partRows);

  Logger.log('セットアップ完了: シート4つ、販売場所3件、パーツ ' + partRows.length + ' 件を作成しました。');
}
