import type {
  Collection,
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
