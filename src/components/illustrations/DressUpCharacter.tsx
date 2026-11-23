import React from 'react';
import { CrayonChallenge } from '../../types/curriculum';

export type GarmentPart = CrayonChallenge['targetPart'];

interface DressUpCharacterProps {
  outfitMode: 'casual' | 'winter' | 'skirt';
  partColors: Partial<Record<GarmentPart, string>>;
  onTapPart: (part: GarmentPart) => void;
  highlightedPart?: GarmentPart | null;
}

const PART_LABELS: Record<GarmentPart, string> = {
  cap: 'Czapka z daszkiem (cap)',
  tshirt: 'Koszulka (T-shirt)',
  jumper: 'Sweter (jumper)',
  coat: 'Płaszcz (coat)',
  trousers: 'Spodnie (trousers)',
  shorts: 'Spodenki (shorts)',
  skirt: 'Spódniczka (skirt)',
  shoes: 'Buty (shoes)',
};

export const DressUpCharacter: React.FC<DressUpCharacterProps> = ({
  outfitMode,
  partColors,
  onTapPart,
  highlightedPart,
}) => {
  const getFill = (part: GarmentPart) => partColors[part] || '#FFFDF8';
  const ink = '#4E3422';

  const interactiveProps = (part: GarmentPart) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': `Pokoloruj: ${PART_LABELS[part]}`,
    onClick: () => onTapPart(part),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTapPart(part);
      }
    },
    className:
      'cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus-visible:stroke-blue-600',
  });

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* Cozy Fairy-Tale Meadow Stage around interactive Mr Beetle */}
      <div className="w-full max-w-[330px] rounded-[28px] watercolor-frame p-3 bg-gradient-to-b from-[#FFF9EC] via-[#FFF6E5] to-[#F3F8E6] relative overflow-hidden">
        <svg
          viewBox="0 0 280 344"
          className="w-full h-auto select-none relative z-10"
          aria-label="Pan Chrząszcz (Mr Beetle) do pokolorowania"
        >
          <defs>
            <radialGradient id="beetleSunGlow" cx="50%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFF8EE" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="beetleShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C87533" />
              <stop offset="100%" stopColor="#8F491B" />
            </linearGradient>
          </defs>

          {/* Warm sunlit watercolor aura */}
          <rect x="0" y="0" width="280" height="344" fill="url(#beetleSunGlow)" />

          {/* Tiny floating golden storybook sparkles & daisies */}
          <circle cx="38" cy="52" r="3" fill="#F5B841" opacity="0.7" />
          <circle cx="242" cy="64" r="3.5" fill="#F493B0" opacity="0.65" />
          <circle cx="228" cy="110" r="2.2" fill="#F5B841" opacity="0.6" />

          {/* Soft watercolor meadow hill */}
          <ellipse cx="140" cy="316" rx="126" ry="26" fill="#D9ECC7" opacity="0.8" />
          <ellipse cx="140" cy="318" rx="72" ry="11" fill="#C4DCB0" />

          {/* Tiny meadow wildflowers */}
          <g aria-hidden="true">
            <circle cx="48" cy="312" r="4.5" fill="#FFFDF8" stroke="#A3C288" strokeWidth="1.2" />
            <circle cx="48" cy="312" r="1.8" fill="#F5B841" />
            <circle cx="232" cy="314" r="4.5" fill="#FBCFE8" stroke="#D97B9A" strokeWidth="1.2" />
            <circle cx="232" cy="314" r="1.8" fill="#F5B841" />
            <circle cx="212" cy="324" r="3.5" fill="#FFFDF8" stroke="#A3C288" strokeWidth="1" />
            <circle cx="212" cy="324" r="1.4" fill="#F5B841" />
          </g>

          {/* Mr Beetle Shell / Wings behind body */}
          <ellipse
            cx="102"
            cy="182"
            rx="28"
            ry="52"
            fill="url(#beetleShellGrad)"
            stroke={ink}
            strokeWidth="3.2"
            transform="rotate(14 102 182)"
          />
          <ellipse
            cx="178"
            cy="182"
            rx="28"
            ry="52"
            fill="url(#beetleShellGrad)"
            stroke={ink}
            strokeWidth="3.2"
            transform="rotate(-14 178 182)"
          />

          {/* Antennae */}
          <path d="M122 54 Q108 26 94 34" fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
          <path d="M158 54 Q172 26 186 34" fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
          <circle cx="94" cy="34" r="5.5" fill="#E59A38" stroke={ink} strokeWidth="2.4" />
          <circle cx="186" cy="34" r="5.5" fill="#E59A38" stroke={ink} strokeWidth="2.4" />

          {/* Head */}
          <ellipse cx="140" cy="84" rx="40" ry="34" fill="#CE7B3B" stroke={ink} strokeWidth="3.2" />
          {/* Rosy fairytale cheeks */}
          <ellipse cx="114" cy="92" rx="7" ry="4.5" fill="#F59AA8" opacity="0.65" />
          <ellipse cx="166" cy="92" rx="7" ry="4.5" fill="#F59AA8" opacity="0.65" />
          {/* Eyes with cute sparkle */}
          <circle cx="126" cy="78" r="9.5" fill="#FFFDF8" stroke={ink} strokeWidth="2.6" />
          <circle cx="154" cy="78" r="9.5" fill="#FFFDF8" stroke={ink} strokeWidth="2.6" />
          <circle cx="128" cy="78" r="4.2" fill={ink} />
          <circle cx="152" cy="78" r="4.2" fill={ink} />
          <circle cx="130" cy="76" r="1.5" fill="#FFFFFF" />
          <circle cx="154" cy="76" r="1.5" fill="#FFFFFF" />
          {/* Friendly smile */}
          <path d="M126 98 Q140 109 154 98" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />

          {/* CAP (clickable in casual & skirt modes) */}
          {outfitMode !== 'winter' && (
            <g {...interactiveProps('cap')}>
              <path
                d="M102 64 C104 38 122 30 140 30 C158 30 176 38 178 64 Z"
                fill={getFill('cap')}
                stroke={highlightedPart === 'cap' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'cap' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
              <path
                d="M138 58 Q186 54 202 68 Q178 74 134 66 Z"
                fill={getFill('cap')}
                stroke={highlightedPart === 'cap' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'cap' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
              <circle cx="140" cy="29" r="4" fill="#FDE68A" stroke={ink} strokeWidth="2" />
            </g>
          )}

          {/* Arms */}
          <path d="M98 148 Q68 156 64 176" fill="none" stroke="#8F491B" strokeWidth="11" strokeLinecap="round" />
          <path d="M182 148 Q212 156 216 176" fill="none" stroke="#8F491B" strokeWidth="11" strokeLinecap="round" />

          {/* Legs */}
          <line x1="122" y1="242" x2="118" y2="292" stroke="#8F491B" strokeWidth="11" strokeLinecap="round" />
          <line x1="158" y1="242" x2="162" y2="292" stroke="#8F491B" strokeWidth="11" strokeLinecap="round" />

          {/* LOWER GARMENT: shorts, trousers, or skirt */}
          {outfitMode === 'casual' && (
            <g {...interactiveProps('shorts')}>
              <path
                d="M104 202 L176 202 L184 252 L148 252 L140 232 L132 252 L96 252 Z"
                fill={getFill('shorts')}
                stroke={highlightedPart === 'shorts' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'shorts' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
              <line x1="104" y1="213" x2="176" y2="213" stroke={ink} strokeWidth="2.2" />
              <circle cx="140" cy="208" r="2.8" fill="#FDE68A" stroke={ink} strokeWidth="1.5" />
            </g>
          )}

          {outfitMode === 'winter' && (
            <g {...interactiveProps('trousers')}>
              <path
                d="M106 204 L174 204 L178 294 L152 294 L140 242 L128 294 L102 294 Z"
                fill={getFill('trousers')}
                stroke={highlightedPart === 'trousers' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'trousers' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
              <line x1="106" y1="214" x2="174" y2="214" stroke={ink} strokeWidth="2.2" />
            </g>
          )}

          {outfitMode === 'skirt' && (
            <g {...interactiveProps('skirt')}>
              <path
                d="M106 202 L174 202 L192 264 Q140 274 88 264 Z"
                fill={getFill('skirt')}
                stroke={highlightedPart === 'skirt' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'skirt' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
              <line x1="126" y1="208" x2="118" y2="264" stroke="rgba(78,52,34,0.28)" strokeWidth="2" />
              <line x1="154" y1="208" x2="162" y2="264" stroke="rgba(78,52,34,0.28)" strokeWidth="2" />
            </g>
          )}

          {/* UPPER GARMENT */}
          {outfitMode !== 'winter' ? (
            <g {...interactiveProps('tshirt')}>
              <path
                d="M112 122 Q140 134 168 122 L196 142 L184 166 L174 158 L174 206 L106 206 L106 158 L96 166 L84 142 Z"
                fill={getFill('tshirt')}
                stroke={highlightedPart === 'tshirt' ? '#3B82F6' : ink}
                strokeWidth={highlightedPart === 'tshirt' ? '4.8' : '3.2'}
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <>
              {/* Jumper inside */}
              <g {...interactiveProps('jumper')}>
                <path
                  d="M114 124 Q140 134 166 124 L174 208 L106 208 Z"
                  fill={getFill('jumper')}
                  stroke={highlightedPart === 'jumper' ? '#3B82F6' : ink}
                  strokeWidth={highlightedPart === 'jumper' ? '4.8' : '3.2'}
                  strokeLinejoin="round"
                />
                <path
                  d="M116 158 L124 150 L132 158 L140 150 L148 158 L156 150 L164 158"
                  fill="none"
                  stroke={ink}
                  strokeWidth="2.4"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
              </g>
              {/* Open Coat panels on left & right */}
              <g {...interactiveProps('coat')}>
                <path
                  d="M114 122 L82 142 L74 190 L92 192 L98 162 L94 234 L124 234 L124 126 Z"
                  fill={getFill('coat')}
                  stroke={highlightedPart === 'coat' ? '#3B82F6' : ink}
                  strokeWidth={highlightedPart === 'coat' ? '4.8' : '3.2'}
                  strokeLinejoin="round"
                />
                <path
                  d="M166 122 L198 142 L206 190 L188 192 L182 162 L186 234 L156 234 L156 126 Z"
                  fill={getFill('coat')}
                  stroke={highlightedPart === 'coat' ? '#3B82F6' : ink}
                  strokeWidth={highlightedPart === 'coat' ? '4.8' : '3.2'}
                  strokeLinejoin="round"
                />
                <circle cx="114" cy="176" r="3.5" fill="#FDE68A" stroke={ink} strokeWidth="1.5" />
                <circle cx="114" cy="198" r="3.5" fill="#FDE68A" stroke={ink} strokeWidth="1.5" />
                <circle cx="166" cy="176" r="3.5" fill="#FDE68A" stroke={ink} strokeWidth="1.5" />
                <circle cx="166" cy="198" r="3.5" fill="#FDE68A" stroke={ink} strokeWidth="1.5" />
              </g>
            </>
          )}

          {/* SHOES (always clickable) */}
          <g {...interactiveProps('shoes')}>
            <path
              d="M84 302 Q84 286 108 286 L128 286 L128 310 L88 310 Q84 310 84 302 Z"
              fill={getFill('shoes')}
              stroke={highlightedPart === 'shoes' ? '#3B82F6' : ink}
              strokeWidth={highlightedPart === 'shoes' ? '4.8' : '3.2'}
              strokeLinejoin="round"
            />
            <path
              d="M152 286 L172 286 Q196 286 196 302 Q196 310 192 310 L152 310 Z"
              fill={getFill('shoes')}
              stroke={highlightedPart === 'shoes' ? '#3B82F6' : ink}
              strokeWidth={highlightedPart === 'shoes' ? '4.8' : '3.2'}
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Direct accessible warm storybook tactile buttons beneath character */}
      <div className="mt-3.5 flex flex-wrap justify-center gap-2">
        {(outfitMode === 'casual'
          ? (['cap', 'tshirt', 'shorts', 'shoes'] as GarmentPart[])
          : outfitMode === 'winter'
            ? (['coat', 'jumper', 'trousers', 'shoes'] as GarmentPart[])
            : (['cap', 'tshirt', 'skirt', 'shoes'] as GarmentPart[])
        ).map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => onTapPart(part)}
            className="btn-puffy-white min-h-[44px] px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span
              className="w-4 h-4 rounded-full border-2 border-[#D7C2AC] shrink-0"
              style={{ backgroundColor: getFill(part) }}
            />
            {part === 'tshirt' ? 'T-shirt' : part}
          </button>
        ))}
      </div>
    </div>
  );
};
