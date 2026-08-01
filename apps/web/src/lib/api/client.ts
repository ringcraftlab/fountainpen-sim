import type { ApiClient } from './types';
import { createHybridApiClient } from './hybrid';
import { createMockApiClient } from './mock';

/**
 * ApiClient のファクトリ。
 *   - VITE_GAS_ENDPOINT が設定されていれば → hybrid (Sheets + LocalStorage)
 *   - 未設定 → mock (メモリ内、開発時のみ)
 *
 * 本番 (Vercel) では必ず VITE_GAS_ENDPOINT を設定すること。
 */
function build(): ApiClient {
  const endpoint = import.meta.env.VITE_GAS_ENDPOINT as string | undefined;
  if (endpoint) {
    return createHybridApiClient(endpoint);
  }
  // 開発時フォールバック (GAS 接続なし)
  console.warn(
    '[ApiClient] VITE_GAS_ENDPOINT が未設定のため mock で動作します。' +
      ' 本番では必ず環境変数を設定してください。',
  );
  return createMockApiClient();
}

export const api: ApiClient = build();
