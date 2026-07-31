import type {
  Collection,
  InventoryEntry,
  Location,
  NewCollection,
  Part,
} from '@/types/domain';
import { ApiError, type ApiClient, type ApiResponse, type PartsFilter } from './types';

// GAS Web App は CORS プリフライトを扱えないため text/plain で送る。
// GAS 側は e.postData.contents を JSON.parse するので body 形式は同じ。

interface GasClientConfig {
  endpoint: string;
}

async function call<T>(endpoint: string, action: string, params: unknown = {}): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) throw new ApiError('http_error', `HTTP ${res.status}`);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) throw new ApiError(body.error.code, body.error.message);
  return body.data;
}

export function createGasApiClient(config: GasClientConfig): ApiClient {
  const c = <T>(action: string, params?: unknown) => call<T>(config.endpoint, action, params);
  return {
    parts: {
      list: (filter?: PartsFilter) => c<Part[]>('parts.list', filter ?? {}),
    },
    collections: {
      list: () => c<Collection[]>('collections.list'),
      create: (input: NewCollection) => c<Collection>('collections.create', input),
      remove: (id: string) => c<void>('collections.delete', { id }),
    },
    inventory: {
      list: () => c<InventoryEntry[]>('inventory.list'),
      upsert: (entry: InventoryEntry) => c<void>('inventory.upsert', entry),
    },
    locations: {
      list: () => c<Location[]>('locations.list'),
    },
  };
}
