import { useId } from 'react';
import type { PartType } from '@/types/domain';

interface Props {
  type: PartType;
  colorHex: string;
  metalHex: string;
  opacity?: number;
}

/**
 * 円柱ライク陰影（左ハイライト・右シャドウ）で疑似3D。
 * ベース色は colorHex そのまま、上に白/黒の透過グラデを重ねる。
 */
export function PartShape({ type, colorHex, metalHex, opacity = 1 }: Props) {
  const uid = useId().replace(/:/g, '');
  const cylShade = `cyl-${uid}`;
  const metalGrad = `metal-${uid}`;
  const domeShade = `dome-${uid}`;
  const nibShine = `nibShine-${uid}`;

  // metalHex から金属光沢グラデを作る
  const isGold = metalHex.toLowerCase().startsWith('#d') || metalHex.toLowerCase().startsWith('#c9a');
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
        {/* Cylinder shading overlay: white left → transparent middle → black right */}
        <linearGradient id={cylShade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="0.15" stopColor="white" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
          <stop offset="0.85" stopColor="black" stopOpacity="0.15" />
          <stop offset="1" stopColor="black" stopOpacity="0.35" />
        </linearGradient>

        {/* Metallic gradient */}
        <linearGradient id={metalGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metalLight} />
          <stop offset="0.4" stopColor={metalHex} />
          <stop offset="0.7" stopColor={metalHex} />
          <stop offset="1" stopColor={metalDark} />
        </linearGradient>

        {/* Dome radial highlight */}
        <radialGradient id={domeShade} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="white" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.05" />
          <stop offset="1" stopColor="black" stopOpacity="0.15" />
        </radialGradient>

        {/* Nib center shine (vertical strip) */}
        <linearGradient id={nibShine} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.4" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ============ cap_top ============ */}
      {type === 'cap_top' && (
        <g>
          <path d="M 26 42 Q 26 4 50 0 Q 74 4 74 42 Z" fill={colorHex} />
          <path
            d="M 26 42 Q 26 4 50 0 Q 74 4 74 42 Z"
            fill={`url(#${domeShade})`}
          />
        </g>
      )}

      {/* ============ cap ============ */}
      {type === 'cap' && (
        <g>
          {/* body */}
          <path
            d="M 26 42 L 74 42 L 74 236 Q 74 250 68 253 L 32 253 Q 26 250 26 236 Z"
            fill={colorHex}
          />
          {/* cylindrical shading */}
          <path
            d="M 26 42 L 74 42 L 74 236 Q 74 250 68 253 L 32 253 Q 26 250 26 236 Z"
            fill={`url(#${cylShade})`}
          />
          {/* opening ring (metallic) */}
          <rect x="27" y="244" width="46" height="12" fill={`url(#${metalGrad})`} />
          <rect x="27" y="244" width="46" height="1.5" fill="white" opacity="0.6" />
          <rect x="27" y="254.5" width="46" height="1.5" fill="black" opacity="0.4" />
          {/* clip */}
          <path
            d="M 68 60 Q 68 55 72 55 L 76 55 Q 78 55 78 60 L 78 222 Q 78 232 74 236 L 68 232 Z"
            fill={`url(#${metalGrad})`}
          />
          <rect x="70.5" y="62" width="1.5" height="163" fill="white" opacity="0.55" />
        </g>
      )}

      {/* ============ grip (nib + section) ============ */}
      {type === 'grip' && (
        <g>
          {/* Nib body (shifted down ~25 units) */}
          <path
            d="M 38 157
               L 38 117
               Q 38 103 44 91
               Q 47 85 50 69
               Q 53 85 56 91
               Q 62 103 62 117
               L 62 157
               L 38 157 Z"
            fill={`url(#${metalGrad})`}
          />
          {/* Nib center shine */}
          <path
            d="M 38 157
               L 38 117
               Q 38 103 44 91
               Q 47 85 50 69
               Q 53 85 56 91
               Q 62 103 62 117
               L 62 157
               L 38 157 Z"
            fill={`url(#${nibShine})`}
          />
          {/* Breather hole */}
          <circle cx="50" cy="133" r="3.2" fill="#0a0a0a" />
          {/* Slit */}
          <line x1="50" y1="130" x2="50" y2="79" stroke="#0a0a0a" strokeWidth="0.8" />

          {/* Grip section (starts right at nib base — no feed gap) */}
          <path
            d="M 30 157 L 70 157 L 70 244 L 30 244 Z"
            fill={colorHex}
          />
          <path
            d="M 30 157 L 70 157 L 70 244 L 30 244 Z"
            fill={`url(#${cylShade})`}
          />

          {/* grip-barrel ring (touches section) */}
          <rect x="27" y="244" width="46" height="12" fill={`url(#${metalGrad})`} />
          <rect x="27" y="244" width="46" height="1.5" fill="white" opacity="0.6" />
          <rect x="27" y="254.5" width="46" height="1.5" fill="black" opacity="0.4" />
        </g>
      )}

      {/* ============ barrel ============ */}
      {type === 'barrel' && (
        <g>
          <path
            d="M 26 256
               L 74 256
               L 74 555
               Q 74 573 66 580
               L 34 580
               Q 26 573 26 555 Z"
            fill={colorHex}
          />
          <path
            d="M 26 256
               L 74 256
               L 74 555
               Q 74 573 66 580
               L 34 580
               Q 26 573 26 555 Z"
            fill={`url(#${cylShade})`}
          />
        </g>
      )}

      {/* ============ barrel_end ============ */}
      {type === 'barrel_end' && (
        <g>
          <path
            d="M 34 580 L 66 580 Q 66 594 58 600 L 42 600 Q 34 594 34 580 Z"
            fill={colorHex}
          />
          <path
            d="M 34 580 L 66 580 Q 66 594 58 600 L 42 600 Q 34 594 34 580 Z"
            fill={`url(#${domeShade})`}
          />
        </g>
      )}
    </svg>
  );
}
