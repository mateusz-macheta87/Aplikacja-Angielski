import React, { useState } from 'react';
import { STORYBOOK_ART, WARDROBE_CUTOUT_MAP } from '../../data/storybookArt';

export const MASCOT_IMAGE_URL = STORYBOOK_ART.mascotHero;

interface MascotAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  equippedAccessories?: string[];
  mood?: 'happy' | 'cheer' | 'encourage';
  variant?: 'avatar' | 'stage';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-56 h-56',
};

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  size = 'md',
  equippedAccessories = [],
  mood = 'happy',
  variant = 'avatar',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const has = (id: string) => equippedAccessories.includes(id);

  const isStage = variant === 'stage';

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-visible shrink-0 select-none ${
        isStage
          ? 'w-56 h-56 sm:w-64 sm:h-64'
          : `rounded-full bg-[#FFF9F0] border-2 border-[#F0DFC8] shadow-sm ${SIZE_MAP[size]}`
      } ${mood === 'cheer' ? 'scale-105 transition-transform' : 'transition-transform'} ${className}`}
    >
      {/* BACK SLOT: True-Alpha Watercolor Butterfly Wings */}
      {has('acc-wings') && (
        <img
          src={WARDROBE_CUTOUT_MAP['acc-wings']}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className={`absolute pointer-events-none z-0 object-contain drop-shadow-[0_3px_6px_rgba(92,65,36,0.18)] ${
            isStage
              ? 'w-[104%] left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2'
              : 'w-[116%] left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2'
          }`}
        />
      )}

      {/* BACK SLOT: Painterly Velvet Hero Cape with Gold Star Hem */}
      {has('acc-cape') && (
        <svg
          viewBox="0 0 140 140"
          className={`absolute pointer-events-none z-0 overflow-visible ${
            isStage ? 'w-[106%] h-[106%] -inset-[3%]' : 'w-[118%] h-[118%] -inset-[9%]'
          }`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="iskierkaCapeVelvet" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B83B55" />
              <stop offset="55%" stopColor="#942843" />
              <stop offset="100%" stopColor="#771D35" />
            </linearGradient>
            <linearGradient id="iskierkaCapeLining" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBE29D" />
              <stop offset="100%" stopColor="#EBB85E" />
            </linearGradient>
          </defs>
          <path
            d="M44 74 Q70 64 96 74 C110 88 120 108 122 124 Q96 132 70 126 Q44 132 18 124 C20 108 30 88 44 74 Z"
            fill="url(#iskierkaCapeVelvet)"
            stroke="#59222C"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M24 120 Q47 127 70 122 Q93 127 116 120 Q93 132 70 126 Q47 132 24 120 Z"
            fill="url(#iskierkaCapeLining)"
          />
          <circle cx="32" cy="115" r="2.2" fill="#FBE29D" />
          <circle cx="42" cy="119" r="1.6" fill="#FBE29D" />
          <circle cx="108" cy="115" r="2.2" fill="#FBE29D" />
          <circle cx="98" cy="119" r="1.6" fill="#FBE29D" />
        </svg>
      )}

      {/* MAIN ISKIERKA PORTRAIT */}
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center ${
          isStage ? 'overflow-visible' : 'rounded-full overflow-hidden bg-[#FFF9F0]'
        }`}
      >
        {!imgError ? (
          <img
            src={isStage ? STORYBOOK_ART.mascotCutout : MASCOT_IMAGE_URL}
            alt="Iskierka — bajkowa przyjaciółka do nauki angielskiego"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full pointer-events-none ${
              isStage
                ? 'object-contain scale-[1.06] drop-shadow-[0_6px_12px_rgba(92,65,36,0.16)]'
                : 'object-cover scale-110'
            }`}
          />
        ) : (
          <span className="font-display text-2xl font-bold text-rose-500">I</span>
        )}
      </div>

      {/* FRONT EQUIPPED TRUE-ALPHA WATERCOLOR & PAINTERLY ACCESSORIES */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
        {/* HEAD SLOT: Golden Princess Tiara */}
        {has('acc-crown') && (
          <img
            src={WARDROBE_CUTOUT_MAP['acc-crown']}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className={`absolute left-[49%] -translate-x-1/2 object-contain drop-shadow-[0_2px_4px_rgba(92,65,24,0.22)] ${
              isStage ? 'top-[13%] w-[31%]' : 'top-[2%] w-[38%]'
            }`}
          />
        )}

        {/* HEAD SLOT: Pink Satin Pearl Bow perched by ear */}
        {has('acc-bow') && (
          <img
            src={WARDROBE_CUTOUT_MAP['acc-bow']}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className={`absolute object-contain rotate-[14deg] drop-shadow-[0_2px_4px_rgba(92,65,24,0.2)] ${
              isStage ? 'right-[20%] top-[15%] w-[26%]' : 'right-[12%] top-[4%] w-[32%]'
            }`}
          />
        )}

        {/* HEAD SLOT: Green Explorer Cap with Daisy & Ladybird */}
        {has('acc-cap') && (
          <img
            src={WARDROBE_CUTOUT_MAP['acc-cap']}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className={`absolute left-[46%] -translate-x-1/2 object-contain -rotate-[6deg] drop-shadow-[0_3px_5px_rgba(62,47,30,0.22)] ${
              isStage ? 'top-[10%] w-[41%]' : 'top-[-1%] w-[48%]'
            }`}
          />
        )}

        {/* HEAD SLOT: Woodland Fairy Flower Crown Garland */}
        {has('acc-flowers') && (
          <svg
            viewBox="0 0 120 120"
            className="absolute inset-0 w-full h-full overflow-visible"
            aria-hidden="true"
          >
            <g transform={isStage ? 'translate(0 9)' : 'translate(0 2)'}>
              <path
                d="M32 28 Q60 17 88 28"
                fill="none"
                stroke="#6E945B"
                strokeWidth="5.2"
                strokeLinecap="round"
              />
              <path
                d="M32 28 Q60 17 88 28"
                fill="none"
                stroke="#4E3422"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="4 4"
                opacity="0.55"
              />
              <ellipse cx="40" cy="22" rx="5" ry="2.5" transform="rotate(-24 40 22)" fill="#89B372" stroke="#4E3422" strokeWidth="1" />
              <ellipse cx="80" cy="22" rx="5" ry="2.5" transform="rotate(24 80 22)" fill="#89B372" stroke="#4E3422" strokeWidth="1" />
              <ellipse cx="52" cy="19" rx="4.5" ry="2.2" transform="rotate(-12 52 19)" fill="#9AC284" stroke="#4E3422" strokeWidth="1" />
              <ellipse cx="68" cy="19" rx="4.5" ry="2.2" transform="rotate(12 68 19)" fill="#9AC284" stroke="#4E3422" strokeWidth="1" />
              <g transform="translate(60 21)">
                <circle cx="0" cy="-4" r="3.4" fill="#F9B8C9" stroke="#5A392C" strokeWidth="0.9" />
                <circle cx="3.8" cy="-1.2" r="3.4" fill="#F9B8C9" stroke="#5A392C" strokeWidth="0.9" />
                <circle cx="2.3" cy="3.2" r="3.4" fill="#F9B8C9" stroke="#5A392C" strokeWidth="0.9" />
                <circle cx="-2.3" cy="3.2" r="3.4" fill="#F9B8C9" stroke="#5A392C" strokeWidth="0.9" />
                <circle cx="-3.8" cy="-1.2" r="3.4" fill="#F9B8C9" stroke="#5A392C" strokeWidth="0.9" />
                <circle cx="0" cy="0" r="2.6" fill="#F7C95B" stroke="#5A392C" strokeWidth="0.8" />
              </g>
              <g transform="translate(44 24)">
                <circle cx="0" cy="-3.4" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="3.2" cy="0" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="0" cy="3.4" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="-3.2" cy="0" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="2.2" fill="#F6C34B" />
              </g>
              <g transform="translate(76 24)">
                <circle cx="0" cy="-3.4" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="3.2" cy="0" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="0" cy="3.4" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="-3.2" cy="0" r="2.6" fill="#FFFDF8" stroke="#5A392C" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="2.2" fill="#F6C34B" />
              </g>
              <circle cx="34" cy="27" r="3" fill="#9AC6F0" stroke="#5A392C" strokeWidth="0.8" />
              <circle cx="34" cy="27" r="1" fill="#FBE17E" />
              <circle cx="86" cy="27" r="3" fill="#9AC6F0" stroke="#5A392C" strokeWidth="0.8" />
              <circle cx="86" cy="27" r="1" fill="#FBE17E" />
            </g>
          </svg>
        )}

        {/* EYES SLOT: Rose-Gold Star Sunglasses */}
        {has('acc-glasses') && (
          <img
            src={WARDROBE_CUTOUT_MAP['acc-glasses']}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className={`absolute left-[49%] -translate-x-1/2 object-contain opacity-92 drop-shadow-[0_2px_4px_rgba(92,65,24,0.2)] ${
              isStage ? 'top-[33%] w-[36%]' : 'top-[31%] w-[41%]'
            }`}
          />
        )}

        {/* NECK SLOT: Cozy Knitted Snowflake Winter Scarf */}
        {has('acc-scarf') && (
          <svg
            viewBox="0 0 120 120"
            className="absolute inset-0 w-full h-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="iskierkaScarfWool" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#92C5EB" />
                <stop offset="100%" stopColor="#6AA7D9" />
              </linearGradient>
            </defs>
            <g transform={isStage ? 'translate(0 4)' : 'translate(0 6)'}>
              <path
                d="M66 66 L79 65 L83 89 Q74 92 67 89 Z"
                fill="#76B2E0"
                stroke="#4E3422"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M69 89 L68 95 M73 90 L73 96 M77 90 L78 96 M81 89 L82 95"
                stroke="#FFF4DE"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <path
                d="M69 89 L68 95 M73 90 L73 96 M77 90 L78 96 M81 89 L82 95"
                stroke="#4E3422"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              <path
                d="M36 60 Q60 69 84 60 Q86 67 82 71 Q60 80 38 71 Q34 67 36 60 Z"
                fill="url(#iskierkaScarfWool)"
                stroke="#4E3422"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
              <circle cx="46" cy="67" r="1.7" fill="#FFF9EE" />
              <circle cx="56" cy="70" r="1.9" fill="#FFF9EE" />
              <circle cx="67" cy="69" r="1.7" fill="#FFF9EE" />
              <circle cx="76" cy="66" r="1.6" fill="#FFF9EE" />
              <circle cx="74" cy="77" r="1.9" fill="#FFF9EE" />
              <circle cx="75" cy="84" r="1.5" fill="#FFF9EE" />
            </g>
          </svg>
        )}

        {/* CAPE CLASP ON COLLAR */}
        {has('acc-cape') && !has('acc-scarf') && (
          <svg
            viewBox="0 0 120 120"
            className="absolute inset-0 w-full h-full overflow-visible"
            aria-hidden="true"
          >
            <g transform={isStage ? 'translate(60 67)' : 'translate(60 71)'}>
              <polygon
                points="0,-6 1.8,-1.8 6.2,-1.8 2.6,1 4,5.4 0,2.8 -4,5.4 -2.6,1 -6.2,-1.8 -1.8,-1.8"
                fill="#F7C95B"
                stroke="#6E4416"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
