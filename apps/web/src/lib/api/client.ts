import type { ApiClient } from './types';
import { createGasApiClient } from './gas';
import { createLocalStorageApiClient } from './localStorage';
import { createMockApiClient, generateSeedParts, seedLocations } from './mock';

type ApiProvider = 'mock' | 'local' | 'gas';

function resolveProvider(): ApiProvider {
  const raw = (import.meta.env.VITE_API_PROVIDER as string | undefined)?.toLowerCase();
  if (raw === 'mock' || raw === 'local' || raw === 'gas') return raw;
  // Backward compat: VITE_GAS_ENDPOINT が指定されていれば gas を推定
  if (import.meta.env.VITE_GAS_ENDPOINT) return 'gas';
  // デフォルト: 公開デモでも収まりが良い local (ブラウザ内永続)
  return 'local';
}

function build(): ApiClient {
  const provider = resolveProvider();
  switch (provider) {
    case 'gas': {
      const endpoint = import.meta.env.VITE_GAS_ENDPOINT as string | undefined;
      if (!endpoint) {
        // gas を指定されたが URL が無い → local へフォールバック
        return createLocalStorageApiClient({
          parts: generateSeedParts(),
          locations: seedLocations,
        });
      }
      return createGasApiClient({ endpoint });
    }
    case 'mock':
      return createMockApiClient();
    case 'local':
    default:
      return createLocalStorageApiClient({
        parts: generateSeedParts(),
        locations: seedLocations,
      });
  }
}

export const api: ApiClient = build();
