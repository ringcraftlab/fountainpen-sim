import type { ColorSwatch } from '@/types/domain';

/**
 * SAILOR 万年筆buffet の色パレット (種色 seed)。
 * status='ACTIVE' の色は現行販売色、'DISCONTINUED' は廃盤。
 * hex 値は写真から近似したもの。
 */
const RAW: Omit<ColorSwatch, 'sortOrder' | 'locations'>[] = [
  { id: 'clear',            name: 'クリア',             hex: '#e5e7eb', category: 'clear',  status: 'ACTIVE' },
  { id: 'black',            name: 'ブラック',           hex: '#2b2b30', category: 'solid',  status: 'ACTIVE' },
  { id: 'fresh_pink',       name: 'フレッシュピンク',   hex: '#f4c0d0', category: 'solid',  status: 'ACTIVE' },
  { id: 'rose_pink',        name: 'ローズピンク',       hex: '#b98599', category: 'solid',  status: 'ACTIVE' },
  { id: 'light_blue',       name: 'ライトブルー',       hex: '#a4c2d8', category: 'solid',  status: 'ACTIVE' },
  { id: 'green',            name: 'グリーン',           hex: '#4fa88b', category: 'solid',  status: 'ACTIVE' },
  { id: 'mustard_yellow',   name: 'マスタードイエロー', hex: '#c9a24a', category: 'solid',  status: 'ACTIVE' },
  { id: 'taupe',            name: 'トープ',             hex: '#8a7a6a', category: 'solid',  status: 'ACTIVE' },
  { id: 'navy_blue',        name: 'ネイビーブルー',     hex: '#252b45', category: 'solid',  status: 'ACTIVE' },
  { id: 'white',            name: 'ホワイト',           hex: '#f5f4ef', category: 'solid',  status: 'ACTIVE' },
  { id: 'milky_white',      name: 'ミルキーホワイト',   hex: '#f2ecdc', category: 'milky',  status: 'ACTIVE' },
  { id: 'clear_coffee',     name: 'クリアコーヒー',     hex: '#a58a72', category: 'clear',  status: 'ACTIVE' },
  { id: 'milky_peach',      name: 'ミルキーピーチ',     hex: '#f4c6a8', category: 'milky',  status: 'ACTIVE' },
  { id: 'milky_lavender',   name: 'ミルキーラベンダー', hex: '#c9bcd8', category: 'milky',  status: 'ACTIVE' },
  { id: 'milky_soda',       name: 'ミルキーソーダ',     hex: '#c8dfe2', category: 'milky',  status: 'ACTIVE' },
  { id: 'clear_emerald',    name: 'クリアエメラルド',   hex: '#2b8b7b', category: 'clear',  status: 'ACTIVE' },
  { id: 'clear_mango',      name: 'クリアマンゴー',     hex: '#e8ce5a', category: 'clear',  status: 'ACTIVE' },
  { id: 'clear_orange',     name: 'クリアオレンジ',     hex: '#e88a4a', category: 'clear',  status: 'ACTIVE' },
  { id: 'clear_violet',     name: 'クリアバイオレット', hex: '#7a5aa8', category: 'clear',  status: 'ACTIVE' },
  { id: 'clear_muscat',     name: 'クリアマスカット',   hex: '#b8d478', category: 'clear',  status: 'ACTIVE' },
  { id: 'red',              name: 'レッド',             hex: '#d33a3a', category: 'solid',  status: 'ACTIVE' },
  { id: 'blue',             name: 'ブルー',             hex: '#3a5ab8', category: 'solid',  status: 'ACTIVE' },
  { id: 'clear_taupe',      name: 'クリアトープ',       hex: '#a89a88', category: 'clear',  status: 'ACTIVE' },
];

/** 種色 seed。sortOrder は配列順、locations は全店舗デフォルト。 */
export const COLOR_PALETTE: ColorSwatch[] = RAW.map((c, i) => ({
  ...c,
  sortOrder: (i + 1) * 10,
  locations: ['lab', 'ankora', 'bungujoshi'],
}));

export const COLOR_BY_ID: Record<string, ColorSwatch> = Object.fromEntries(
  COLOR_PALETTE.map((c) => [c.id, c]),
);
