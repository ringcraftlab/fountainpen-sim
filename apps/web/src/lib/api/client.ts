import type { ApiClient } from './types';
import { createGasApiClient } from './gas';
import { createMockApiClient } from './mock';

const endpoint = import.meta.env.VITE_GAS_ENDPOINT as string | undefined;

export const api: ApiClient = endpoint
  ? createGasApiClient({ endpoint })
  : createMockApiClient();
