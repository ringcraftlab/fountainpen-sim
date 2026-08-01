/**
 * Fountain Pen Buffet Simulator — GAS
 *
 * 設計:
 *   1. マスター (colors / locations) は Google Sheets
 *   2. React (Vercel) は読み取り専用で使う → 公開API デプロイ
 *   3. 管理者は Web App UI で色管理 → 管理者専用デプロイ
 *   4. 書き込み操作は認可チェック必須 (管理者だけ実行可)
 *
 * ★ 2つのデプロイを作成すること:
 *   [1] 公開API デプロイ
 *       - アクセス: 全員
 *       - 実行: 自分
 *       - 用途: React (Vercel/localhost) が POST で叩く
 *       - 書き込み操作は自動拒否される
 *   [2] 管理者UI デプロイ
 *       - アクセス: 自分のみ
 *       - 実行: 自分
 *       - 用途: ブラウザで URL を開くと管理画面
 *       - 書き込み操作 (色追加/廃盤) が可能
 *
 * ★ Script Properties に ADMIN_EMAIL = あなたの Google メールアドレスを設定すること。
 *   認可判定に使う。
 */

const PART_TYPES = ['cap_top', 'cap', 'grip', 'barrel', 'barrel_end'];
const PART_PREFIX = { cap_top: 'ct', cap: 'c', grip: 'g', barrel: 'b', barrel_end: 'be' };

const SHEET_COLORS = 'colors';
const SHEET_COLLECTIONS = 'collections';
const SHEET_INVENTORY = 'inventory';
const SHEET_LOCATIONS = 'locations';

const HEADERS = {
  colors:      ['id', 'name', 'hex', 'category', 'status', 'sortOrder', 'locations', 'note'],
  collections: ['id', 'name', 'parts_json', 'metalColor', 'kind', 'comment', 'createdAt'],
  inventory:   ['partId', 'owned', 'wishlist'],
  locations:   ['id', 'name', 'active'],
};

/** 書き込み系 action (これらは requireAdmin) */
const WRITE_ACTIONS = [
  'colors.upsert',
  'colors.updateStatus',
  'collections.create',
  'collections.delete',
  'inventory.upsert',
];

// ============================================================
// 認可
// ============================================================

/**
 * 管理者判定。
 * - 「Access: Only myself」デプロイでのみ Session.getActiveUser() が値を返す
 * - 「Access: Anyone」デプロイでは常に '' → 拒否される
 * → 公開API デプロイからは書き込み不可、管理者UI デプロイからのみ可能
 */
function requireAdmin() {
  const email = Session.getActiveUser().getEmail();
  const admin = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
  if (!admin) {
    throw makeError('config_missing', 'Script Properties に ADMIN_EMAIL を設定してください');
  }
  if (!email || email !== admin) {
    throw makeError('forbidden', 'この操作は管理者のみ実行できます (email=' + (email || 'anonymous') + ')');
  }
}

// ============================================================
// エントリポイント
// ============================================================

/** GET: 管理者UI (HTML) を返す。認可 = ブラウザで開ける = 管理者のみアクセス許可されたデプロイ */
function doGet() {
  const email = Session.getActiveUser().getEmail();
  const admin = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
  if (!admin || email !== admin) {
    return HtmlService.createHtmlOutput(
      '<h1 style="font-family:sans-serif;padding:40px;text-align:center;color:#666">' +
      'Access Denied' +
      '</h1>' +
      '<p style="font-family:sans-serif;text-align:center;color:#999">' +
      'このURLは管理者専用です。' +
      '</p>'
    );
  }
  return HtmlService.createHtmlOutputFromFile('AdminApp')
    .setTitle('パレット管理 — Fountain Pen Buffet')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    const params = body.params || {};
    if (WRITE_ACTIONS.indexOf(action) >= 0) {
      requireAdmin();
    }
    const data = route(action, params);
    return jsonResponse({ ok: true, data: data });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: { code: err.code || 'internal_error', message: err.message || String(err) },
    });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function route(action, params) {
  switch (action) {
    // 読み取り (公開)
    case 'colors.list':         return listColors(params);
    case 'parts.list':          return listParts(params);
    case 'parts.get':           return getPart(params);
    case 'locations.list':      return listLocations();
    case 'collections.list':    return listCollections();
    case 'inventory.list':      return listInventory();

    // 書き込み (要 requireAdmin, 上で判定済)
    case 'colors.upsert':       return upsertColor(params);
    case 'colors.updateStatus': return updateColorStatus(params);
    case 'collections.create':  return createCollection(params);
    case 'collections.delete':  return deleteCollection(params);
    case 'inventory.upsert':    return upsertInventory(params);

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
// 管理者UI HTML → 内部呼び出し用サーバー関数 (google.script.run)
// ============================================================

function apiListColors() {
  requireAdmin();
  return readAllColors();
}
function apiUpsertColor(input) {
  requireAdmin();
  return upsertColor(input);
}
function apiUpdateColorStatus(id, status) {
  requireAdmin();
  return updateColorStatus({ id: id, status: status });
}

// ============================================================
// Repository: シートの汎用I/O
// ============================================================

function sheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw makeError('sheet_not_found', 'Sheet not found: ' + name + '. Run migrateSheets() first.');
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

function deleteRowByKey(sheetName, key, value) {
  const rowNum = findRowIndex(sheetName, key, value);
  if (rowNum < 0) return false;
  sheet(sheetName).deleteRow(rowNum);
  return true;
}

// ============================================================
// Colors
// ============================================================

function readAllColors() {
  const { rows } = readAll(SHEET_COLORS);
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

function upsertColor(params) {
  if (!params.id) throw makeError('validation', 'id is required');
  if (!params.name) throw makeError('validation', 'name is required');
  if (!params.hex) throw makeError('validation', 'hex is required');
  const category = params.category || 'solid';
  if (['solid', 'milky', 'clear'].indexOf(category) < 0) {
    throw makeError('validation', 'category must be solid/milky/clear');
  }
  const status = params.status || 'ACTIVE';
  if (['ACTIVE', 'DISCONTINUED'].indexOf(status) < 0) {
    throw makeError('validation', 'status must be ACTIVE/DISCONTINUED');
  }
  const record = {
    id: String(params.id),
    name: String(params.name),
    hex: String(params.hex),
    category: category,
    status: status,
    sortOrder: Number(params.sortOrder || 0),
    locations: (params.locations || []).join(','),
    note: String(params.note || ''),
  };
  upsertRow(SHEET_COLORS, 'id', record);
  return rowToColor(record);
}

function updateColorStatus(params) {
  if (!params.id) throw makeError('validation', 'id is required');
  if (['ACTIVE', 'DISCONTINUED'].indexOf(params.status) < 0) {
    throw makeError('validation', 'status must be ACTIVE/DISCONTINUED');
  }
  const rowNum = findRowIndex(SHEET_COLORS, 'id', params.id);
  if (rowNum < 0) throw makeError('not_found', 'Color not found: ' + params.id);
  const s = sheet(SHEET_COLORS);
  const header = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  const statusCol = header.indexOf('status') + 1;
  s.getRange(rowNum, statusCol).setValue(params.status);
  return { id: params.id, status: params.status };
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
  return partsFromColors(readAllColors()).filter(function (p) {
    if (params.type && p.type !== params.type) return false;
    if (params.availableOnly && !p.currentAvailable) return false;
    if (params.locationId && p.locations.indexOf(params.locationId) < 0) return false;
    return true;
  });
}

function getPart(params) {
  const found = partsFromColors(readAllColors()).filter(function (p) { return p.id === params.id; })[0];
  if (!found) throw makeError('not_found', 'Part not found: ' + params.id);
  return found;
}

// ============================================================
// Collections
// ============================================================

function listCollections() {
  const { rows } = readAll(SHEET_COLLECTIONS);
  return rows.map(rowToCollection).sort(function (a, b) {
    return b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0;
  });
}

function createCollection(params) {
  const record = {
    id: 'col-' + Date.now(),
    name: String(params.name || ''),
    parts_json: JSON.stringify(params.parts || {}),
    metalColor: String(params.metalColor || 'gold'),
    kind: String(params.kind || 'owned'),
    comment: String(params.comment || ''),
    createdAt: new Date().toISOString(),
  };
  appendRow(SHEET_COLLECTIONS, record);
  return rowToCollection(record);
}

function deleteCollection(params) {
  deleteRowByKey(SHEET_COLLECTIONS, 'id', params.id);
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
// Inventory / Locations
// ============================================================

function listInventory() {
  const { rows } = readAll(SHEET_INVENTORY);
  return rows.map(function (row) {
    return {
      partId: String(row.partId),
      owned: row.owned === true || String(row.owned).toUpperCase() === 'TRUE',
      wishlist: row.wishlist === true || String(row.wishlist).toUpperCase() === 'TRUE',
    };
  });
}

function upsertInventory(params) {
  upsertRow(SHEET_INVENTORY, 'partId', {
    partId: params.partId,
    owned: params.owned ? 'TRUE' : 'FALSE',
    wishlist: params.wishlist ? 'TRUE' : 'FALSE',
  });
  return null;
}

function listLocations() {
  const { rows } = readAll(SHEET_LOCATIONS);
  return rows.map(function (row) {
    return {
      id: String(row.id),
      name: String(row.name),
      active: row.active === true || String(row.active).toUpperCase() === 'TRUE',
    };
  });
}

// ============================================================
// 管理系: 初期化 / マイグレーション / リセット (完全分離)
// ============================================================

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = [SHEET_COLORS, SHEET_COLLECTIONS, SHEET_INVENTORY, SHEET_LOCATIONS]
    .filter(function (name) { return ss.getSheetByName(name); });
  if (existing.length > 0) {
    throw makeError(
      'already_initialized',
      '初期化拒否: シートが既に存在します [' + existing.join(', ') + ']。' +
      ' 既存プロジェクトなら migrateSheets() を使ってください。' +
      ' 完全リセットしたいなら resetSheets("CONFIRM_RESET") を使ってください。',
    );
  }
  createColorsSheetWithSeed(ss);
  createCollectionsSheet(ss);
  createInventorySheet(ss);
  createLocationsSheetWithSeed(ss);
  Logger.log('initializeSheets: 初期化完了');
}

function migrateSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const created = [];
  if (!ss.getSheetByName(SHEET_COLORS)) { createColorsSheetWithSeed(ss); created.push(SHEET_COLORS + ' (種色投入)'); }
  if (!ss.getSheetByName(SHEET_COLLECTIONS)) { createCollectionsSheet(ss); created.push(SHEET_COLLECTIONS); }
  if (!ss.getSheetByName(SHEET_INVENTORY)) { createInventorySheet(ss); created.push(SHEET_INVENTORY); }
  if (!ss.getSheetByName(SHEET_LOCATIONS)) { createLocationsSheetWithSeed(ss); created.push(SHEET_LOCATIONS + ' (種データ投入)'); }
  const oldParts = ss.getSheetByName('parts');
  if (oldParts) { ss.deleteSheet(oldParts); Logger.log('migrateSheets: 旧 parts シート削除'); }
  Logger.log('migrateSheets: ' + (created.length === 0 ? '変更なし' : '追加 [' + created.join(', ') + ']'));
}

function resetSheets(confirmation) {
  if (confirmation !== 'CONFIRM_RESET') {
    throw makeError('confirmation_required', 'resetSheets は破壊的です。実行するには resetSheets("CONFIRM_RESET") を呼んでください。');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET_COLORS, SHEET_COLLECTIONS, SHEET_INVENTORY, SHEET_LOCATIONS, 'parts'].forEach(function (name) {
    const s = ss.getSheetByName(name);
    if (s) ss.deleteSheet(s);
  });
  initializeSheets();
  Logger.log('resetSheets: 全リセット完了');
}

function createColorsSheetWithSeed(ss) {
  const s = ss.insertSheet(SHEET_COLORS);
  s.appendRow(HEADERS.colors);
  const PALETTE = [
    ['clear', 'クリア', '#e5e7eb', 'clear'], ['black', 'ブラック', '#2b2b30', 'solid'],
    ['fresh_pink', 'フレッシュピンク', '#f4c0d0', 'solid'], ['rose_pink', 'ローズピンク', '#b98599', 'solid'],
    ['light_blue', 'ライトブルー', '#a4c2d8', 'solid'], ['green', 'グリーン', '#4fa88b', 'solid'],
    ['mustard_yellow', 'マスタードイエロー', '#c9a24a', 'solid'], ['taupe', 'トープ', '#8a7a6a', 'solid'],
    ['navy_blue', 'ネイビーブルー', '#252b45', 'solid'], ['white', 'ホワイト', '#f5f4ef', 'solid'],
    ['milky_white', 'ミルキーホワイト', '#f2ecdc', 'milky'], ['clear_coffee', 'クリアコーヒー', '#a58a72', 'clear'],
    ['milky_peach', 'ミルキーピーチ', '#f4c6a8', 'milky'], ['milky_lavender', 'ミルキーラベンダー', '#c9bcd8', 'milky'],
    ['milky_soda', 'ミルキーソーダ', '#c8dfe2', 'milky'], ['clear_emerald', 'クリアエメラルド', '#2b8b7b', 'clear'],
    ['clear_mango', 'クリアマンゴー', '#e8ce5a', 'clear'], ['clear_orange', 'クリアオレンジ', '#e88a4a', 'clear'],
    ['clear_violet', 'クリアバイオレット', '#7a5aa8', 'clear'], ['clear_muscat', 'クリアマスカット', '#b8d478', 'clear'],
    ['red', 'レッド', '#d33a3a', 'solid'], ['blue', 'ブルー', '#3a5ab8', 'solid'],
    ['clear_taupe', 'クリアトープ', '#a89a88', 'clear'],
  ];
  const LOC_PATTERNS = ['lab,ankora,bungujoshi', 'lab,ankora', 'lab,bungujoshi', 'ankora,bungujoshi', 'lab', 'ankora', 'bungujoshi'];
  const rows = PALETTE.map(function (p, i) {
    return [p[0], p[1], p[2], p[3], 'ACTIVE', (i + 1) * 10, LOC_PATTERNS[i % LOC_PATTERNS.length], ''];
  });
  s.getRange(2, 1, rows.length, HEADERS.colors.length).setValues(rows);
}

function createCollectionsSheet(ss) {
  const s = ss.insertSheet(SHEET_COLLECTIONS);
  s.appendRow(HEADERS.collections);
}

function createInventorySheet(ss) {
  const s = ss.insertSheet(SHEET_INVENTORY);
  s.appendRow(HEADERS.inventory);
}

function createLocationsSheetWithSeed(ss) {
  const s = ss.insertSheet(SHEET_LOCATIONS);
  s.appendRow(HEADERS.locations);
  const locs = [['lab', 'Style Of Lab', true], ['ankora', 'アンコーラ', true], ['bungujoshi', '文具女子博', true]];
  s.getRange(2, 1, locs.length, HEADERS.locations.length).setValues(locs);
}
