import React, { useState } from 'react';
import { IllustrationKey } from '../../types/curriculum';
import { ITEM_ART_MAP } from '../../data/storybookArt';

interface ItemIllustrationProps {
  kind: IllustrationKey;
  colorHex?: string;
  className?: string;
  roundedClass?: string;
}

export const ItemIllustration: React.FC<ItemIllustrationProps> = ({
  kind,
  colorHex,
  className = 'w-24 h-24',
  roundedClass = 'rounded-2xl',
}) => {
  const [imgError, setImgError] = useState(false);
  const art = ITEM_ART_MAP[kind];

  // Primary: High-resolution bespoke watercolor picture-book illustration
  if (art && !imgError) {
    return (
      <div
        className={`relative overflow-hidden bg-[#FFF8EE] flex items-center justify-center shrink-0 select-none ${roundedClass} ${className}`}
      >
        <img
          src={art.src}
          alt={art.altPl}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain pointer-events-none ${art.zoomClass || 'scale-[1.03]'}`}
        />
      </div>
    );
  }

  // Hand-crafted storybook watercolor-style SVGs for dynamic colours, math blocks & safe fallback
  const fill = colorHex || '#5496E8';
  const ink = '#4E3422';

  switch (kind) {
    case 'colour-swatch':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          {/* Soft watercolor halo behind crayon */}
          <circle cx="60" cy="62" r="46" fill={fill} opacity="0.16" />
          {/* Tilted fairy-tale wooden wax crayon */}
          <g transform="rotate(-24 60 60)">
            {/* Wax body */}
            <rect
              x="44"
              y="34"
              width="32"
              height="68"
              rx="6"
              fill={fill}
              stroke={ink}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Cream storybook paper wrapper */}
            <rect
              x="44"
              y="48"
              width="32"
              height="38"
              fill="#FFF6E5"
              fillOpacity="0.82"
              stroke={ink}
              strokeWidth="2.8"
            />
            {/* Decorative scalloped band on wrapper */}
            <path
              d="M45 55 Q52 51 60 55 Q68 59 75 55"
              fill="none"
              stroke={fill}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M45 79 Q52 75 60 79 Q68 83 75 79"
              fill="none"
              stroke={fill}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Cute star stamp on crayon label */}
            <polygon
              points="60,60 62.2,65 67.5,65.5 63.4,69 64.6,74 60,71.2 55.4,74 56.6,69 52.5,65.5 57.8,65"
              fill={fill}
              stroke={ink}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Sharpened wooden cone */}
            <polygon
              points="44,34 76,34 64,12 56,12"
              fill="#F3D6B3"
              stroke={ink}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Colored wax tip */}
            <polygon
              points="52,20 68,20 63.5,11 56.5,11"
              fill={fill}
              stroke={ink}
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Soft highlight */}
            <line
              x1="50"
              y1="38"
              x2="50"
              y2="96"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.38"
            />
          </g>
          {/* Tiny fairytale sparkles */}
          <circle cx="92" cy="30" r="3.5" fill="#F5B841" />
          <circle cx="28" cy="84" r="2.8" fill={fill} opacity="0.65" />
        </svg>
      );

    case 'math-card':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="#FEF6E4" />
          {/* Playful wooden storybook number blocks */}
          <rect x="22" y="24" width="34" height="34" rx="9" fill="#FAD7E3" stroke={ink} strokeWidth="3" />
          <path d="M32 41 H46 M39 34 V48" stroke="#C84678" strokeWidth="4.2" strokeLinecap="round" />

          <rect x="64" y="24" width="34" height="34" rx="9" fill="#FCE8B2" stroke={ink} strokeWidth="3" />
          <path d="M74 41 H88" stroke="#C47B14" strokeWidth="4.2" strokeLinecap="round" />

          <rect x="22" y="64" width="34" height="34" rx="9" fill="#D5F2DF" stroke={ink} strokeWidth="3" />
          <path d="M33 75 L45 87 M45 75 L33 87" stroke="#2D8652" strokeWidth="4.2" strokeLinecap="round" />

          <rect x="64" y="64" width="34" height="34" rx="9" fill="#D9EBFF" stroke={ink} strokeWidth="3" />
          <path d="M74 77 H88 M74 86 H88" stroke="#3674BD" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <circle cx="60" cy="60" r="46" fill="#FFF4DF" stroke={ink} strokeWidth="3" />
          <polygon
            points="60,26 69,48 92,50 74,65 80,88 60,76 40,88 46,65 28,50 51,48"
            fill={fill}
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};
