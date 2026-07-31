import { useEffect, useMemo, useState } from 'react';
import { Shuffle, RotateCcw, Save } from 'lucide-react';
import { SaveDialog } from '@/features/collections/components/SaveDialog';
import { useCollectionsStore } from '@/features/collections/store';
import type { Part, PartType } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';
import { usePartsStore } from '@/lib/stores/partsStore';
import { useLocationsStore } from '@/lib/stores/locationsStore';
import { useSimulatorStore } from '@/features/simulator/store';
import { LocationFilter } from '@/features/simulator/components/LocationFilter';
import { MetalColorPicker } from '@/features/simulator/components/MetalColorPicker';
import { OwnershipStatus } from '@/features/simulator/components/OwnershipStatus';
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

  const previewCard = (
    <div className="rounded-xl bg-[#faf5ea] dark:bg-neutral-900 border border-[#d8cca8] dark:border-neutral-800 p-4 shadow-inner relative overflow-hidden"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 12px, rgba(200,180,130,0.08) 12px 13px)',
      }}>
      <div className="h-[448px] [&_svg]:drop-shadow-[0_2px_2px_rgba(60,50,30,0.15)]">
        {partsLoading && parts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-400">
            読み込み中…
          </div>
        ) : (
          <PenPreview selection={selection} metalColor={metalColor} byId={byId} />
        )}
      </div>
    </div>
  );

  const [saveOpen, setSaveOpen] = useState(false);
  const fetchCollections = useCollectionsStore((s) => s.fetch);
  const collectionsLoaded = useCollectionsStore((s) => s.loaded);

  useEffect(() => {
    if (!collectionsLoaded) void fetchCollections();
  }, [collectionsLoaded, fetchCollections]);

  const actionButtons = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => randomize(availableParts)}
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        disabled={availableParts.length === 0}
      >
        <Shuffle className="w-4 h-4" />
        ランダム
      </button>
      <button
        type="button"
        onClick={() => setSaveOpen(true)}
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-2 text-sm font-medium hover:opacity-90"
      >
        <Save className="w-4 h-4" />
        保存
      </button>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label="リセット"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-xl font-semibold">シミュレーター</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <LocationFilter value={locationId} locations={locations} onChange={setLocation} />
          <MetalColorPicker value={metalColor} onChange={setMetalColor} />
        </div>
      </header>

      {/* Mobile: stack. Desktop (md+): 2-column with sticky preview */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8">
        <div className="md:sticky md:top-4 md:self-start space-y-3">
          {previewCard}
          <OwnershipStatus selection={selection} />
          <div className="hidden md:block">{actionButtons}</div>
        </div>

        <div className="space-y-4 mt-4 md:mt-0">
          <div className="md:hidden">{actionButtons}</div>
          <div className="md:hidden">
            <OwnershipStatus selection={selection} />
          </div>
          <PartTabs
            activeTab={activeTab}
            optionsByType={optionsByType}
            selection={selection}
            onChangeTab={setActiveTab}
            onSelectPart={setPart}
          />
        </div>
      </div>

      <SaveDialog
        open={saveOpen}
        selection={selection}
        metalColor={metalColor}
        onClose={() => setSaveOpen(false)}
      />
    </section>
  );
}
