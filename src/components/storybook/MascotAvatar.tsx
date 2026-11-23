import React, { useEffect, useState } from 'react';
import {
  ISKIERKA_OUTFIT_PORTRAIT,
  ISKIERKA_OUTFIT_STAGE,
  STORYBOOK_ART,
} from '../../data/storybookArt';

export const MASCOT_IMAGE_URL = STORYBOOK_ART.mascotHero;

export type MascotMood = 'happy' | 'listening' | 'thinking' | 'cheer' | 'encourage';

interface MascotAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  equippedAccessories?: string[];
  mood?: MascotMood;
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

  const isStage = variant === 'stage';
  // Strictly max 1 active accessory so Iskierka always displays a single unified bespoke portrait
  const activeAccessoryId = equippedAccessories[0];

  const portraitSrc = (() => {
    if (isStage) {
      if (activeAccessoryId && ISKIERKA_OUTFIT_STAGE[activeAccessoryId]) {
        return ISKIERKA_OUTFIT_STAGE[activeAccessoryId];
      }
      return STORYBOOK_ART.mascotCutout;
    }

    if (mood === 'thinking' || mood === 'encourage') {
      return STORYBOOK_ART.mascotThinking;
    }
    if (mood === 'cheer') {
      return STORYBOOK_ART.mascotCelebrating;
    }
    if (activeAccessoryId && ISKIERKA_OUTFIT_PORTRAIT[activeAccessoryId]) {
      return ISKIERKA_OUTFIT_PORTRAIT[activeAccessoryId];
    }
    return MASCOT_IMAGE_URL;
  })();

  useEffect(() => {
    setImgError(false);
  }, [portraitSrc]);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        isStage
          ? 'w-56 h-56 sm:w-64 sm:h-64'
          : `rounded-full bg-[#FFF9F0] border-2 border-[#F0DFC8] shadow-sm ${SIZE_MAP[size]}`
      } ${mood === 'cheer' ? 'scale-105 transition-transform' : 'transition-transform'} ${className}`}
    >
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center ${
          isStage ? 'overflow-visible' : 'rounded-full overflow-hidden bg-[#FFF9F0]'
        }`}
      >
        {!imgError ? (
          <img
            src={portraitSrc}
            alt="Iskierka — bajkowa przyjaciółka do nauki angielskiego"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full pointer-events-none ${
              isStage
                ? 'object-contain scale-[1.06] drop-shadow-[0_6px_12px_rgba(92,65,36,0.16)]'
                : 'object-cover scale-[1.12]'
            }`}
          />
        ) : (
          <span className="font-display text-2xl font-bold text-rose-500">I</span>
        )}
      </div>

      {/* LISTENING MOOD: Gentle Musical Sparkle Waves beside Iskierka's ear */}
      {mood === 'listening' && (
        <div
          className="absolute -right-2 -top-1 z-30 pointer-events-none flex items-center gap-0.5"
          aria-hidden="true"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F5A623] opacity-90 animate-ping" />
          <span className="text-base font-bold text-[#4C8EE0] drop-shadow-xs">♪</span>
        </div>
      )}
    </div>
  );
};
