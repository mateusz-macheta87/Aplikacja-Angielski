import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface ComicStoryViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteComic: (starsEarned: number) => void;
}

interface ComicPanel {
  id: string;
  number: number;
  titlePl: string;
  image: string;
  altPl: string;
  speaker: string;
  bubbleEn: string;
  translationPl: string;
}

const COMIC_PANELS: ComicPanel[] = [
  {
    id: 'p1',
    number: 1,
    titlePl: 'Deszczowy poranek',
    image: STORYBOOK_ART.comicPanel1Rain,
    altPl: 'Pan Chrząszcz wygląda przez okrągłe okienko domku na wiosenny deszcz',
    speaker: 'Mr Beetle',
    bubbleEn: "What's the weather like today? It's rainy!",
    translationPl: 'Jaka jest dziś pogoda? Pada deszcz!',
  },
  {
    id: 'p2',
    number: 2,
    titlePl: 'Prezent od Iskierki',
    image: STORYBOOK_ART.comicPanel2Coat,
    altPl: 'Wróżka Iskierka wręcza Panu Chrząszczowi nowy czerwony płaszczyk',
    speaker: 'Iskierka',
    bubbleEn: "Here's a new coat for Mr Beetle.",
    translationPl: 'Oto nowy płaszczyk dla Pana Chrząszcza.',
  },
  {
    id: 'p3',
    number: 3,
    titlePl: 'Słoneczny spacer w parku',
    image: STORYBOOK_ART.comicPanel3Shorts,
    altPl: 'Pan Chrząszcz tańczy w słonecznym parku w fioletowych spodenkach i żółtej koszulce',
    speaker: 'Mr Beetle',
    bubbleEn: "I'm wearing new purple shorts.",
    translationPl: 'Mam na sobie nowe fioletowe spodenki.',
  },
  {
    id: 'p4',
    number: 4,
    titlePl: 'Wielkie leśne przyjęcie!',
    image: STORYBOOK_ART.comicPanel4Party,
    altPl: 'Przyjaciele świętują na leśnym pikniku pod bajkowymi lampkami',
    speaker: 'Mr Beetle & Friends',
    bubbleEn: 'I love my new clothes!',
    translationPl: 'Uwielbiam moje nowe ubrania!',
  },
];

export const ComicStoryView: React.FC<ComicStoryViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteComic,
}) => {
  const [listenedIds, setListenedIds] = useState<string[]>([]);
  const [endingChoice, setEndingChoice] = useState<'picnic' | 'soup' | null>(null);
  const [finished, setFinished] = useState(false);

  const handleTapBubble = (panel: ComicPanel) => {
    playToneEffect('tap', soundEffectsEnabled);
    speakText(panel.bubbleEn, { lang: module.speechLang, rate: speechRate });
    setListenedIds((prev) => (prev.includes(panel.id) ? prev : [...prev, panel.id]));
  };

  const handleChooseEnding = (choice: 'picnic' | 'soup') => {
    setEndingChoice(choice);
    playToneEffect('success', soundEffectsEnabled);
    const endingLine =
      choice === 'picnic'
        ? "It's sunny and hot! Let's eat ice cream in the park!"
        : "It's snowy and cold! Let's eat warm soup in the house!";
    speakText(endingLine, { lang: module.speechLang, rate: speechRate });
  };

  const handleFinishComic = () => {
    playToneEffect('fanfare', soundEffectsEnabled);
    onCompleteComic(3);
    setFinished(true);
  };

  return (
    <StorybookLessonShell
      title="Bajkowy Komiks: Mr Beetle's New Clothes"
      module={module}
      onBackToMap={onBackToMap}
      rightSlot={
        <span className="px-4 py-1.5 rounded-full bg-[#FEF5D9] border border-[#F3DFA2] font-display text-sm font-bold text-[#784A14] inline-flex items-center gap-1.5 tabular-nums">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Posłuchane: {listenedIds.length} / {COMIC_PANELS.length}
        </span>
      }
    >
      {finished ? (
        <StorybookCelebrationCard
          title="Mistrzyni Bajkowego Komiksu!"
          subtitle="Przeczytałaś całą przygodę Pana Chrząszcza i wybrałaś jej zakończenie! Zdobywasz +3 gwiazdki oraz naklejkę „Mistrzyni Bajek”!"
          starsCount={3}
          equippedAccessories={equippedAccessories}
          actions={
            <>
              <button
                type="button"
                onClick={onBackToMap}
                className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display font-bold"
              >
                Wróć na mapę przygód
              </button>
              <button
                type="button"
                onClick={() => {
                  setFinished(false);
                  setEndingChoice(null);
                }}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold"
              >
                Przeczytaj ponownie
              </button>
            </>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="storybook-card rounded-[28px] p-5 text-center">
            <p className="font-display text-lg font-bold text-[#3E2F2B]">
              Stuknij dymek w każdym kadrze, aby usłyszeć głosy bohaterów!
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[#786356] mt-1">
              Na końcu wybierz własne zakończenie bajki i odbierz nagrodę.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {COMIC_PANELS.map((panel) => {
              const heard = listenedIds.includes(panel.id);
              return (
                <article
                  key={panel.id}
                  className={`storybook-card rounded-[30px] p-4 sm:p-5 flex flex-col gap-3.5 transition-all ${
                    heard ? 'border-[#A7E3B9]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-display text-base font-bold text-[#3E2F2B]">
                      <span className="w-7 h-7 rounded-full bg-[#55B373] text-white text-sm flex items-center justify-center">
                        {panel.number}
                      </span>
                      {panel.titlePl}
                    </span>
                    {heard && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#226B3B]">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        Wysłuchano
                      </span>
                    )}
                  </div>

                  <div className="relative w-full aspect-[4/3] rounded-[22px] overflow-hidden border-2 border-[#EED9BD] bg-[#FFF8EB]">
                    <img
                      src={panel.image}
                      alt={panel.altPl}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Interactive Tappable Speech Bubble */}
                  <button
                    type="button"
                    onClick={() => handleTapBubble(panel)}
                    className="w-full rounded-[22px] bg-[#FFF8EC] hover:bg-[#EEF6FF] border-2 border-[#EED9BD] hover:border-[#5496E8] p-3.5 text-left transition-all flex items-start gap-3"
                  >
                    <span className="w-10 h-10 rounded-full bg-[#5496E8] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="block text-[13px] font-bold text-[#755F51]">
                        {panel.speaker} mówi:
                      </span>
                      <span className="block font-display text-base sm:text-lg font-bold text-[#3E2F2B] leading-snug">
                        „{panel.bubbleEn}”
                      </span>
                      <span className="block text-xs font-semibold text-[#786356] mt-0.5">
                        {panel.translationPl}
                      </span>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {/* Interactive Ending Picker */}
          <section className="storybook-card rounded-[32px] p-6 sm:p-7 text-center">
            <h3 className="font-display text-2xl font-bold text-[#3E2F2B] inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F4A938]" aria-hidden="true" />
              Jak kończy się bajka? Wybierz!
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#786356]">
              Stuknij wybrane zakończenie, aby usłyszeć finał po angielsku:
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => handleChooseEnding('picnic')}
                className={`rounded-[24px] border-2 p-4 text-left transition-all ${
                  endingChoice === 'picnic'
                    ? 'bg-[#FEF7DC] border-[#F4A938] ring-4 ring-[#FDE68A]/70'
                    : 'bg-[#FFFDF8] border-[#EFE0CC] hover:border-[#F4A938]'
                }`}
              >
                <p className="font-display text-lg font-bold text-[#3E2F2B]">
                  Letni piknik z lodami!
                </p>
                <p className="text-xs font-bold text-[#2F6DB5] mt-1">
                  „It&apos;s sunny and hot! Let&apos;s eat ice cream in the park!”
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleChooseEnding('soup')}
                className={`rounded-[24px] border-2 p-4 text-left transition-all ${
                  endingChoice === 'soup'
                    ? 'bg-[#EEF6FF] border-[#5496E8] ring-4 ring-[#BFDBFE]/70'
                    : 'bg-[#FFFDF8] border-[#EFE0CC] hover:border-[#5496E8]'
                }`}
              >
                <p className="font-display text-lg font-bold text-[#3E2F2B]">
                  Zimowa uczta z ciepłą zupą!
                </p>
                <p className="text-xs font-bold text-[#2F6DB5] mt-1">
                  „It&apos;s snowy and cold! Let&apos;s eat warm soup in the house!”
                </p>
              </button>
            </div>

            {endingChoice && (
              <button
                type="button"
                onClick={handleFinishComic}
                className="mt-6 btn-puffy-green min-h-[52px] px-8 rounded-full font-display text-base font-bold"
              >
                Zakończ bajkę i odbierz +3 ⭐ oraz naklejkę!
              </button>
            )}
          </section>
        </div>
      )}
    </StorybookLessonShell>
  );
};
