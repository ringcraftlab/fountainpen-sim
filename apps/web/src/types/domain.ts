export type PartType = 'cap' | 'body' | 'nib';

export const PART_TYPES: PartType[] = ['cap', 'body', 'nib'];

export interface Part {
  id: string;
  type: PartType;
  name: string;
  image: string;
  currentAvailable: boolean;
  locations: string[];
  tags: string[];
}

export interface Collection {
  id: string;
  name: string;
  capId: string;
  bodyId: string;
  nibId: string;
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
