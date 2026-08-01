import type {
  Collection,
  ColorStatus,
  ColorSwatch,
  ColorsFilter,
  InventoryEntry,
  Location,
  NewCollection,
  Part,
  PartType,
} from '@/types/domain';

export interface PartsFilter {
  type?: PartType;
  locationId?: string;
  availableOnly?: boolean;
}

export interface PartsApi {
  list(filter?: PartsFilter): Promise<Part[]>;
}

/** 色の追加/更新入力 (id 必須。既存 id なら update、無ければ insert) */
export type ColorUpsertInput = Omit<ColorSwatch, 'sortOrder' | 'locations' | 'note'> &
  Partial<Pick<ColorSwatch, 'sortOrder' | 'locations' | 'note'>>;

export interface ColorsApi {
  list(filter?: ColorsFilter): Promise<ColorSwatch[]>;
  upsert(input: ColorUpsertInput): Promise<ColorSwatch>;
  updateStatus(id: string, status: ColorStatus): Promise<void>;
}

export interface CollectionsApi {
  list(): Promise<Collection[]>;
  create(input: NewCollection): Promise<Collection>;
  remove(id: string): Promise<void>;
}

export interface InventoryApi {
  list(): Promise<InventoryEntry[]>;
  upsert(entry: InventoryEntry): Promise<void>;
}

export interface LocationsApi {
  list(): Promise<Location[]>;
}

export interface ApiClient {
  colors: ColorsApi;
  parts: PartsApi;
  collections: CollectionsApi;
  inventory: InventoryApi;
  locations: LocationsApi;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}
