export type ApiProvider = 'mock' | 'local' | 'gas';

/** 現在の API プロバイダを返す (client.ts と同じロジック) */
export function currentProvider(): ApiProvider {
  const raw = (import.meta.env.VITE_API_PROVIDER as string | undefined)?.toLowerCase();
  if (raw === 'mock' || raw === 'local' || raw === 'gas') return raw;
  if (import.meta.env.VITE_GAS_ENDPOINT) return 'gas';
  return 'local';
}

/** 管理者モード = gas プロバイダ (Sheets に書き込む個人管理環境) */
export function isAdminMode(): boolean {
  return currentProvider() === 'gas';
}
