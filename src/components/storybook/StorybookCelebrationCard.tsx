import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { MascotAvatar } from './MascotAvatar';

interface StorybookCelebrationCardProps {
  title: string;
  subtitle: React.ReactNode;
  starsCount?: number;
  equippedAccessories: string[];
  children?: React.ReactNode;
  actions: React.ReactNode;
}

export const StorybookCelebrationCard: React.FC<StorybookCelebrationCardProps> = ({
  title,
  subtitle,
  starsCount,
  equippedAccessories,
  children,
  actions,
}) => {
  const [bannerErr, setBannerErr] = useState(false);

  return (
    <div className="storybook-card rounded-[34px] overflow-hidden max-w-2xl mx-auto">
      {/* Panoramic Watercolor Celebration Scene */}
      {!bannerErr && (
        <div className="relative w-full h-44 sm:h-52 bg-[#FFF8EE] overflow-hidden border-b-2 border-[#EFE0CC]">
          <img
            src={STORYBOOK_ART.victoryBanner}
            alt="Iskierka i Pan Chrząszcz świętują pod bajkowymi chorągiewkami"
            referrerPolicy="no-referrer"
            onError={() => setBannerErr(true)}
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(255,253,248,1) 0%, rgba(255,253,248,0) 100%)',
            }}
          />
        </div>
      )}

      <div className={`px-6 sm:px-10 pb-8 sm:pb-10 text-center ${bannerErr ? 'pt-8' : '-mt-11 relative z-10'}`}>
        <MascotAvatar
          size="lg"
          equippedAccessories={equippedAccessories}
          mood="cheer"
          className="mx-auto shadow-md border-4 border-[#FFFDF8]"
        />

        {typeof starsCount === 'number' && (
          <div className="mt-4 flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-10 h-10 ${
                  s <= starsCount
                    ? 'fill-[#F5A623] text-[#D9820B] drop-shadow-sm'
                    : 'text-[#E5D7C6]'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#3E2F2B]">
          {title}
        </h2>
        <p className="mt-2 text-base font-semibold text-[#6E5B4F] leading-relaxed tabular-nums">
          {subtitle}
        </p>

        {children}

        <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </div>
  );
};
