import { useEffect, useMemo } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import type { Part, PartType } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';
import { usePartsStore } from '@/lib/stores/partsStore';
import { useLocationsStore } from '@/lib/stores/locationsStore';
import { useSimulatorStore } from '@/features/simulator/store';
import { LocationFilter } from '@/features/simulator/components/LocationFilter';
import { MetalColorPicker } from '@/features/simulator/components/MetalColorPicker';
import { PartTabs } from '@/features/simulator/components/PartTabs';
import { PenPreview } from '@/features/simulator/components/PenPreview';

export function SimulatorPage() {
  const { parts, loaded: partsLoaded, loading: partsLoading, fetch: fetchParts, byId } =
    usePartsStore();
  const { locations, loaded: locsLoaded, fetch: fetchLocs } = useLocationsStore();
  const {
    locationId,
    metalColor,
    selection,
    activeTab,
    setLocation,
    setMetalColor,
    setPart,
    setActiveTab,
    randomize,
    reset,
  } = useSimulatorStore();

  useEffect(() => {
    if (!partsLoaded) void fetchParts();
    if (!locsLoaded) void fetchLocs();
  }, [partsLoaded, locsLoaded, fetchParts, fetchLocs]);

  const availableParts = useMemo(
    () =>
      parts.filter((p) => {
        if (!p.currentAvailable) return false;
        if (locationId !== 'all' && !p.locations.includes(locationId)) return false;
        return true;
      }),
    [parts, locationId],
  );

  const optionsByType = useMemo(() => {
    const map = {} as Record<PartType, Part[]>;
    for (const t of PART_TYPES) map[t] = availableParts.filter((p) => p.type === t);
    return map;
  }, [availableParts]);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-xl font-semibold">シミュレーター</h2>
        <LocationFilter value={locationId} locations={locations} onChange={setLocation} />
        <MetalColorPicker value={metalColor} onChange={setMetalColor} />
      </header>

      <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
        {partsLoading && parts.length === 0 ? (
          <div className="aspect-[1/2] flex items-center justify-center text-sm text-neutral-400">
            読み込み中…
          </div>
        ) : (
          <PenPreview selection={selection} metalColor={metalColor} byId={byId} />
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => randomize(availableParts)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          disabled={availableParts.length === 0}
        >
          <Shuffle className="w-4 h-4" />
          ランダムで組み合わせる
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <RotateCcw className="w-4 h-4" />
          リセット
        </button>
      </div>

      <PartTabs
        activeTab={activeTab}
        optionsByType={optionsByType}
        selection={selection}
        onChangeTab={setActiveTab}
        onSelectPart={setPart}
      />
    </section>
  );
}
