import { useId } from 'react';
import type { PartType } from '@/types/domain';

interface Props {
  type: PartType;
  colorHex: string;
  metalHex: string;
  opacity?: number;
}

/**
 * すべてのパーツ共通 viewBox = 100x600, 幅 x=28-72 (44 units)。
 * 単体で組み合わせると 1 本の万年筆になる。
 *
 * y 配置:
 *   cap_top      :   0 -  40  (dome)
 *   cap | grip   :  40 - 260  (排他: cap=閉じ, grip=分解)
 *     └ cap opening ring : 250-260 (cap 内蔵)
 *     └ grip-barrel ring : 250-260 (grip 内蔵)
 *   barrel       : 260 - 560
 *   barrel_end   : 560 - 580  (小チップ)
 */
export function PartShape({ type, colorHex, metalHex, opacity = 1 }: Props) {
  const uid = useId().replace(/:/g, '');
  const cyl = `cyl-${uid}`;
  const metal = `metal-${uid}`;
  const dome = `dome-${uid}`;

  const isGold =
    metalHex.toLowerCase().startsWith('#d') || metalHex.toLowerCase().startsWith('#c9a');
  const metalLight = isGold ? '#f5e19a' : '#f0f0f5';
  const metalDark = isGold ? '#8a6a20' : '#7a7a80';

  return (
    <svg
      viewBox="0 0 100 600"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none"
      style={{ opacity }}
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

      {/* cap_top: 半円ドーム + 底端に濃い境界線 */}
      {type === 'cap_top' && (
        <g>
          <path d="M 28 40 Q 28 4 50 0 Q 72 4 72 40 Z" fill={colorHex} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
          <path d="M 28 40 Q 28 4 50 0 Q 72 4 72 40 Z" fill={`url(#${dome})`} />
          {/* cap_top base separator */}
          <line x1="28" y1="40" x2="72" y2="40" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
        </g>
      )}

      {/* cap: 直方体 + 開口リング + クリップ */}
      {type === 'cap' && (
        <g>
          <rect x="28" y="40" width="44" height="210" fill={colorHex} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
          <rect x="28" y="40" width="44" height="210" fill={`url(#${cyl})`} />
          {/* opening ring: 厚めで濃い境界 */}
          <rect x="27" y="248" width="46" height="14" fill={`url(#${metal})`} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
          <rect x="27" y="248" width="46" height="2" fill="white" opacity="0.7" />
          <rect x="27" y="260" width="46" height="2" fill="black" opacity="0.5" />
          {/* clip: 濃い枠線 */}
          <path d="M 66 55 L 72 55 L 72 230 L 66 226 Z" fill={`url(#${metal})`} stroke="rgba(0,0,0,0.45)" strokeWidth="0.6" />
          <rect x="68" y="57" width="1.5" height="167" fill="white" opacity="0.6" />
        </g>
      )}

      {/* grip: ニブ + section + ring */}
      {type === 'grip' && (
        <g>
          {/* nib: tip up (100 units) */}
          <path
            d="M 36 200
               L 36 150
               Q 36 132 44 118
               Q 47 108 50 100
               Q 53 108 56 118
               Q 64 132 64 150
               L 64 200
               L 36 200 Z"
            fill={`url(#${metal})`}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="0.8"
          />
          <circle cx="50" cy="168" r="3" fill="#0a0a0a" />
          <line x1="50" y1="165" x2="50" y2="108" stroke="#0a0a0a" strokeWidth="0.8" />
          <path d="M 50 100 L 50 197" stroke="white" strokeWidth="0.4" opacity="0.4" />
          {/* section (50 units) — 濃い枠線 */}
          <rect x="30" y="200" width="40" height="50" fill={colorHex} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
          <rect x="30" y="200" width="40" height="50" fill={`url(#${cyl})`} />
          {/* grip-barrel ring: 厚めで濃い境界 */}
          <rect x="27" y="248" width="46" height="14" fill={`url(#${metal})`} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
          <rect x="27" y="248" width="46" height="2" fill="white" opacity="0.7" />
          <rect x="27" y="260" width="46" height="2" fill="black" opacity="0.5" />
        </g>
      )}

      {/* barrel: 下端を少し絞る + 濃い枠線 */}
      {type === 'barrel' && (
        <g>
          <path
            d="M 28 260
               L 72 260
               L 72 530
               Q 72 555 62 560
               L 38 560
               Q 28 555 28 530 Z"
            fill={colorHex}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.8"
          />
          <path
            d="M 28 260
               L 72 260
               L 72 530
               Q 72 555 62 560
               L 38 560
               Q 28 555 28 530 Z"
            fill={`url(#${cyl})`}
          />
        </g>
      )}

      {/* barrel_end: 小チップ + 濃い枠線 */}
      {type === 'barrel_end' && (
        <g>
          <path d="M 38 560 L 62 560 Q 62 575 55 580 L 45 580 Q 38 575 38 560 Z" fill={colorHex} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
          <ellipse cx="43" cy="565" rx="3.5" ry="2" fill="white" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}
