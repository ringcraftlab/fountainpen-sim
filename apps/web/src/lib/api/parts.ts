import type { ColorSwatch, Part, PartType } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';
import type { PartsFilter } from './types';

/** パーツID接頭辞 (色ID と組み合わせて Part.id を作る) */
const PREFIX: Record<PartType, string> = {
  cap_top: 'ct',
  cap: 'c',
  grip: 'g',
  barrel: 'b',
  barrel_end: 'be',
};

/**
 * 色 (ColorSwatch) の一覧から Part の一覧を派生生成する。
 * 1色 × 5パーツタイプ = 5 Part。全実装 (mock / local / gas) で共有する。
 */
export function partsFromColors(colors: ColorSwatch[]): Part[] {
  const parts: Part[] = [];
  for (const type of PART_TYPES) {
    for (const c of colors) {
      parts.push({
        id: `${PREFIX[type]}-${c.id}`,
        type,
        name: c.name,
        colorHex: c.hex,
        colorKind: c.category,
        currentAvailable: c.status === 'ACTIVE',
        locations: c.locations,
        tags: [c.category],
      });
    }
  }
  return parts;
}

export function filterParts(list: Part[], f?: PartsFilter): Part[] {
  return list.filter((p) => {
    if (f?.type && p.type !== f.type) return false;
    if (f?.availableOnly && !p.currentAvailable) return false;
    if (f?.locationId && !p.locations.includes(f.locationId)) return false;
    return true;
  });
}

export function filterColors(
  list: ColorSwatch[],
  filter?: { includeDiscontinued?: boolean; locationId?: string },
): ColorSwatch[] {
  return list
    .filter((c) => {
      if (!filter?.includeDiscontinued && c.status === 'DISCONTINUED') return false;
      if (filter?.locationId && !c.locations.includes(filter.locationId)) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
