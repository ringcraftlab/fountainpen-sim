export type PartType =
  | 'cap_top'
  | 'cap'
  | 'metal'
  | 'grip'
  | 'barrel'
  | 'barrel_end';

export const PART_TYPES: PartType[] = [
  'cap_top',
  'cap',
  'metal',
  'grip',
  'barrel',
  'barrel_end',
];

export const PART_TYPE_LABELS: Record<PartType, { ja: string; en: string }> = {
  cap_top:    { ja: '蓋栓',      en: 'Cap Top' },
  cap:        { ja: '蓋',        en: 'Cap' },
  metal:      { ja: '金属パーツ', en: 'Metal Parts' },
  grip:       { ja: '大先',      en: 'Gripping Section' },
  barrel:     { ja: '胴',        en: 'Barrel' },
  barrel_end: { ja: '尾栓',      en: 'Barrel End' },
};

export interface Part {
  id: string;
  type: PartType;
  name: string;
  image: string;
  currentAvailable: boolean;
  locations: string[];
  tags: string[];
}

export type PartsSelection = Partial<Record<PartType, string>>;

export interface Collection {
  id: string;
  name: string;
  parts: PartsSelection;
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
