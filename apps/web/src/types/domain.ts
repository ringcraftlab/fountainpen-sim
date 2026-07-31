export type PartType =
  | 'cap_top'
  | 'cap'
  | 'grip'
  | 'barrel'
  | 'barrel_end';

export const PART_TYPES: PartType[] = [
  'cap_top',
  'cap',
  'grip',
  'barrel',
  'barrel_end',
];

export const PART_TYPE_LABELS: Record<PartType, { ja: string; en: string }> = {
  cap_top:    { ja: '蓋栓',      en: 'Cap Top' },
  cap:        { ja: '蓋',        en: 'Cap' },
  grip:       { ja: '大先',      en: 'Gripping Section' },
  barrel:     { ja: '胴',        en: 'Barrel' },
  barrel_end: { ja: '尾栓',      en: 'Barrel End' },
};

export type MetalColor = 'gold' | 'silver';

export const METAL_COLORS: { id: MetalColor; name: string; hex: string }[] = [
  { id: 'gold',   name: 'ゴールド', hex: '#d4b04c' },
  { id: 'silver', name: 'シルバー', hex: '#c9c9cf' },
];

/**
 * Color: 蓋・胴・大先・尾栓 で共通の色パレット。
 * kind='clear' は透け感、'milky' は柔らかい不透明色、'solid' は不透明。
 */
export type ColorKind = 'solid' | 'milky' | 'clear';

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  kind: ColorKind;
}

export interface Part {
  id: string;
  type: PartType;
  name: string;
  colorHex: string;
  colorKind?: ColorKind;
  currentAvailable: boolean;
  locations: string[];
  tags: string[];
}

export type PartsSelection = Partial<Record<PartType, string>>;

export type CollectionKind = 'owned' | 'wishlist';

export const COLLECTION_KIND_LABELS: Record<CollectionKind, string> = {
  owned: '所有中',
  wishlist: '購入検討',
};

export interface Collection {
  id: string;
  name: string;
  parts: PartsSelection;
  metalColor: MetalColor;
  kind: CollectionKind;
  comment: string;
  createdAt: string;
}

export type NewCollection = Omit<Collection, 'id' | 'createdAt'>;

export interface InventoryEntry {
  partId: string;
  owned: boolean;
  wishlist: boolean;
}

export interface Location {
  id: string;
  name: string;
  active: boolean;
}
