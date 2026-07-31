import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MetalColor, PartType, PartsSelection } from '@/types/domain';
import { METAL_COLORS, PART_TYPES } from '@/types/domain';
import { useSimulatorStore } from './store';

/**
 * URL クエリと Simulator 状態を双方向同期する。
 * - 初回: URL → ストア
 * - 以降: ストア → URL (replaceState 相当)
 *
 * URL 例:
 *   /simulator?cap_top=ct-black&cap=c-pink&grip=g-gold&barrel=b-green&barrel_end=be-black&metal=silver
 */
export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selection = useSimulatorStore((s) => s.selection);
  const metalColor = useSimulatorStore((s) => s.metalColor);
  const setPart = useSimulatorStore((s) => s.setPart);
  const setMetalColor = useSimulatorStore((s) => s.setMetalColor);

  const bootstrapped = useRef(false);

  // 初回: URL → store
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    for (const type of PART_TYPES) {
      const v = searchParams.get(type);
      if (v) setPart(type, v);
    }
    const m = searchParams.get('metal');
    if (m && METAL_COLORS.some((c) => c.id === m)) setMetalColor(m as MetalColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // store → URL (bootstrapped 後)
  useEffect(() => {
    if (!bootstrapped.current) return;
    const params = new URLSearchParams();
    for (const type of PART_TYPES) {
      const id = selection[type];
      if (id) params.set(type, id);
    }
    if (metalColor !== 'gold') params.set('metal', metalColor);
    setSearchParams(params, { replace: true });
  }, [selection, metalColor, setSearchParams]);
}

/** 現在の状態をエンコードした共有 URL を返す */
export function buildShareUrl(
  origin: string,
  selection: PartsSelection,
  metalColor: MetalColor,
): string {
  const params = new URLSearchParams();
  for (const type of PART_TYPES as PartType[]) {
    const id = selection[type];
    if (id) params.set(type, id);
  }
  if (metalColor !== 'gold') params.set('metal', metalColor);
  const q = params.toString();
  return `${origin}/simulator${q ? `?${q}` : ''}`;
}
