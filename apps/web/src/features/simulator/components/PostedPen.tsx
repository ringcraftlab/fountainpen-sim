import { useId } from 'react';
import type { Part, PartsSelection } from '@/types/domain';

interface Props {
  selection: PartsSelection;
  byId: (id: string | undefined) => Part | undefined;
  metalHex: string;
}

const PLACEHOLDER_HEX = '#e5e7eb';

function colorOf(p: Part | undefined) {
  return p?.colorHex ?? PLACEHOLDER_HEX;
}
function opacityOf(p: Part | undefined) {
  if (!p) return 0.35;
  if (p.colorKind === 'clear') return 0.55;
  if (p.colorKind === 'milky') return 0.7;
  return 1;
}

/**
 * キャップポスト: 見本比率に基づき配置。PartShape と同一寸法を使用。
 * viewBox 100x780 (物理的に長いペン)。
 *
 *   cap_top      :   0 -  40  (5%)
 *   cap          :  40 - 250  (27%, opening ring 250-260 内蔵)
 *   opening ring : 250 - 260
 *   barrel_end   : 260 - 280  (小チップ 3%)
 *   barrel       : 280 - 580  (38%)
 *   grip-b ring  : 580 - 590
 *   grip section : 590 - 630  (5%, 短い)
 *   nib(下向き)  : 630 - 760  (17%, プロミネント)
 */
export function PostedPen({ selection, byId, metalHex }: Props) {
  const uid = useId().replace(/:/g, '');
  const cyl = `pcyl-${uid}`;
  const metal = `pmetal-${uid}`;
  const dome = `pdome-${uid}`;

  const isGold =
    metalHex.toLowerCase().startsWith('#d') || metalHex.toLowerCase().startsWith('#c9a');
  const metalLight = isGold ? '#f5e19a' : '#f0f0f5';
  const metalDark = isGold ? '#8a6a20' : '#7a7a80';

  const capTop = byId(selection.cap_top);
  const cap = byId(selection.cap);
  const barrel = byId(selection.barrel);
  const barrelEnd = byId(selection.barrel_end);
  const grip = byId(selection.grip);

  return (
    <svg
      viewBox="0 0 100 780"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full pointer-events-none"
    >
      <defs>
        <linearGradient id={cyl} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="0.15" stopColor="white" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
          <stop offset="0.85" stopColor="black" stopOpacity="0.15" />
          <stop offset="1" stopColor="black" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metalLight} />
          <stop offset="0.4" stopColor={metalHex} />
          <stop offset="0.7" stopColor={metalHex} />
          <stop offset="1" stopColor={metalDark} />
        </linearGradient>
        <radialGradient id={dome} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="white" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.05" />
          <stop offset="1" stopColor="black" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      {/* cap_top */}
      <g style={{ opacity: opacityOf(capTop) }}>
        <path d="M 28 40 Q 28 4 50 0 Q 72 4 72 40 Z" fill={colorOf(capTop)} />
        <path d="M 28 40 Q 28 4 50 0 Q 72 4 72 40 Z" fill={`url(#${dome})`} />
      </g>

      {/* cap */}
      <g style={{ opacity: opacityOf(cap) }}>
        <rect x="28" y="40" width="44" height="210" fill={colorOf(cap)} />
        <rect x="28" y="40" width="44" height="210" fill={`url(#${cyl})`} />
        <rect x="28" y="250" width="44" height="10" fill={`url(#${metal})`} />
        <rect x="28" y="250" width="44" height="1.5" fill="white" opacity="0.55" />
        <rect x="28" y="258.5" width="44" height="1.5" fill="black" opacity="0.35" />
        {/* clip */}
        <path d="M 66 55 L 72 55 L 72 230 L 66 226 Z" fill={`url(#${metal})`} />
        <rect x="68" y="57" width="1.5" height="167" fill="white" opacity="0.5" />
      </g>

      {/* barrel_end (小チップ、barrel絞りに合わせる) */}
      <g style={{ opacity: opacityOf(barrelEnd) }}>
        <path
          d="M 38 260 L 62 260 Q 62 275 55 280 L 45 280 Q 38 275 38 260 Z"
          fill={colorOf(barrelEnd)}
        />
        <ellipse cx="43" cy="265" rx="3.5" ry="2" fill="white" opacity="0.4" />
      </g>

      {/* barrel (下端を少し絞る) */}
      <g style={{ opacity: opacityOf(barrel) }}>
        <path
          d="M 28 280
             L 72 280
             L 72 550
             Q 72 575 62 580
             L 38 580
             Q 28 575 28 550 Z"
          fill={colorOf(barrel)}
        />
        <path
          d="M 28 280
             L 72 280
             L 72 550
             Q 72 575 62 580
             L 38 580
             Q 28 575 28 550 Z"
          fill={`url(#${cyl})`}
        />
      </g>

      {/* grip section + ring + nib(下向き) */}
      <g style={{ opacity: opacityOf(grip) }}>
        {/* grip-barrel ring */}
        <rect x="28" y="580" width="44" height="10" fill={`url(#${metal})`} />
        <rect x="28" y="580" width="44" height="1.5" fill="white" opacity="0.55" />
        <rect x="28" y="588.5" width="44" height="1.5" fill="black" opacity="0.35" />

        {/* grip section (50 units) */}
        <rect x="30" y="590" width="40" height="50" fill={colorOf(grip)} />
        <rect x="30" y="590" width="40" height="50" fill={`url(#${cyl})`} />

        {/* nib pointing DOWN (100 units、PartShape反転) */}
        <path
          d="M 36 640
             L 36 690
             Q 36 708 44 722
             Q 47 732 50 740
             Q 53 732 56 722
             Q 64 708 64 690
             L 64 640 Z"
          fill={`url(#${metal})`}
        />
        <circle cx="50" cy="672" r="3" fill="#0a0a0a" />
        <line x1="50" y1="675" x2="50" y2="732" stroke="#0a0a0a" strokeWidth="0.8" />
        <path d="M 50 643 L 50 740" stroke="white" strokeWidth="0.4" opacity="0.35" />
      </g>
    </svg>
  );
}
