import type { ColorSwatch } from '@/types/domain';

/**
 * SAILOR 万年筆buffet の色パレット（23色）。
 * hex は近似値。実物写真から調整可能。
 */
export const COLOR_PALETTE: ColorSwatch[] = [
  { id: 'clear',            name: 'クリア',             hex: '#e5e7eb', kind: 'clear' },
  { id: 'black',            name: 'ブラック',           hex: '#2b2b30', kind: 'solid' },
  { id: 'fresh_pink',       name: 'フレッシュピンク',   hex: '#f4c0d0', kind: 'solid' },
  { id: 'rose_pink',        name: 'ローズピンク',       hex: '#b98599', kind: 'solid' },
  { id: 'light_blue',       name: 'ライトブルー',       hex: '#a4c2d8', kind: 'solid' },
  { id: 'green',            name: 'グリーン',           hex: '#4fa88b', kind: 'solid' },
  { id: 'mustard_yellow',   name: 'マスタードイエロー', hex: '#c9a24a', kind: 'solid' },
  { id: 'taupe',            name: 'トープ',             hex: '#8a7a6a', kind: 'solid' },
  { id: 'navy_blue',        name: 'ネイビーブルー',     hex: '#252b45', kind: 'solid' },
  { id: 'white',            name: 'ホワイト',           hex: '#f5f4ef', kind: 'solid' },
  { id: 'milky_white',      name: 'ミルキーホワイト',   hex: '#f2ecdc', kind: 'milky' },
  { id: 'clear_coffee',     name: 'クリアコーヒー',     hex: '#a58a72', kind: 'clear' },
  { id: 'milky_peach',      name: 'ミルキーピーチ',     hex: '#f4c6a8', kind: 'milky' },
  { id: 'milky_lavender',   name: 'ミルキーラベンダー', hex: '#c9bcd8', kind: 'milky' },
  { id: 'milky_soda',       name: 'ミルキーソーダ',     hex: '#c8dfe2', kind: 'milky' },
  { id: 'clear_emerald',    name: 'クリアエメラルド',   hex: '#2b8b7b', kind: 'clear' },
  { id: 'clear_mango',      name: 'クリアマンゴー',     hex: '#e8ce5a', kind: 'clear' },
  { id: 'clear_orange',     name: 'クリアオレンジ',     hex: '#e88a4a', kind: 'clear' },
  { id: 'clear_violet',     name: 'クリアバイオレット', hex: '#7a5aa8', kind: 'clear' },
  { id: 'clear_muscat',     name: 'クリアマスカット',   hex: '#b8d478', kind: 'clear' },
  { id: 'red',              name: 'レッド',             hex: '#d33a3a', kind: 'solid' },
  { id: 'blue',             name: 'ブルー',             hex: '#3a5ab8', kind: 'solid' },
  { id: 'clear_taupe',      name: 'クリアトープ',       hex: '#a89a88', kind: 'clear' },
];

export const COLOR_BY_ID: Record<string, ColorSwatch> = Object.fromEntries(
  COLOR_PALETTE.map((c) => [c.id, c]),
);
