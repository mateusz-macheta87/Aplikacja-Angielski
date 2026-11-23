import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Mic, Play, Sparkles, Square, Volume2 } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface VoiceStudioViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteVoiceSession: (starsEarned: number) => void;
}

interface VoicePrompt {
  id: string;
  en: string;
  pl: string;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteVoiceSession,
}) => {
  const prompts: VoicePrompt[] = useMemo(() => {
    const fromSentences = module.sentences.slice(0, 4).map((s) => ({
      id: s.id,
      en: s.targetSentence,
      pl: s.promptPl,
    }));
    if (fromSentences.length >= 3) return fromSentences;
    return [
      { id: 'v1', en: "I'm wearing purple shorts.", pl: 'Mam na sobie fioletowe spodenki.' },
      { id: 'v2', en: "What's the weather like today? It's sunny.", pl: 'Jaka jest dziś pogoda? Jest słonecznie.' },
      { id: 'v3', en: 'I love my new clothes!', pl: 'Uwielbiam moje nowe ubrania!' },
    ];
  }, [module.sentences]);

  const [idx, setIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const [practicedCount, setPracticedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);

  const current = prompts[idx];

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors on unmount
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (playbackCtxRef.current && playbackCtxRef.current.state !== 'closed') {
        playbackCtxRef.current.close().catch(() => undefined);
        playbackCtxRef.current = null;
      }
    };
  }, []);

  const clearRecording = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    setRecordingBlob(null);
    setMicMessage(null);
  };

  const handleStartRecording = async () => {
    clearRecording();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicMessage(
        'Ta przeglądarka nie obsługuje nagrywania mikrofonem. Powiedz zdanie głośno na głos i kliknij „Powiedziałam głośno!”'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        playToneEffect('success', soundEffectsEnabled);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setMicMessage(null);
    } catch {
      setMicMessage(
        'Mikrofon nie ma zgody albo jest wyłączony. Możesz poćwiczyć głośno razem z Iskierką bez nagrywania!'
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handlePlayNormal = () => {
    if (!recordingUrl) return;
    const audio = new Audio(recordingUrl);
    audio.play().catch(() => undefined);
  };

  const handlePlaySpriteVoice = async () => {
    if (!recordingBlob) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        handlePlayNormal();
        return;
      }
      if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
        playbackCtxRef.current = new AudioCtx();
      }
      const ctx = playbackCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const buf = await recordingBlob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.playbackRate.value = 1.38;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      handlePlayNormal();
    }
  };

  const handleNextPrompt = () => {
    playToneEffect('success', soundEffectsEnabled);
    const nextPracticed = practicedCount + 1;
    setPracticedCount(nextPracticed);
    clearRecording();

    if (idx + 1 >= prompts.length) {
      playToneEffect('fanfare', soundEffectsEnabled);
      onCompleteVoiceSession(2);
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <StorybookLessonShell
      title="Powiedz to z Iskierką!"
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={!finished ? prompts.length : undefined}
      currentStepIndex={!finished ? idx : undefined}
    >
      {finished ? (
        <StorybookCelebrationCard
          title="Śpiewający Słowik Angielskiego!"
          subtitle="Pięknie wymówiłaś wszystkie zdania po angielsku! Zdobywasz +2 gwiazdki oraz naklejkę „Śpiewający Słowik”!"
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
                  setIdx(0);
                  setPracticedCount(0);
                  setFinished(false);
                  clearRecording();
                }}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold"
              >
                Poćwicz jeszcze raz
              </button>
            </>
          }
        />
      ) : (
        <div className="storybook-card rounded-[32px] p-6 sm:p-8 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="w-24 h-24 rounded-[24px] watercolor-frame border-2 border-[#EED9BD] overflow-hidden shrink-0">
              <img
                src={STORYBOOK_ART.gameVoiceStudio}
                alt="Złoty bajkowy mikrofon z ptaszkami"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <MascotAvatar
              size="md"
              equippedAccessories={equippedAccessories}
              mood={isRecording ? 'listening' : recordingUrl ? 'cheer' : 'happy'}
            />
          </div>

          <p className="mt-5 text-xs font-bold text-[#8A7465]">
            Krok 1: Posłuchaj Iskierki · Krok 2: Powtórz głośno i posłuchaj swojego głosu!
          </p>

          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#3E2F2B]">
            „{current.en}”
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#786356]">{current.pl}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => speakText(current.en, { lang: module.speechLang, rate: speechRate })}
              className="btn-puffy-blue min-h-[48px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Posłuchaj Iskierki
            </button>

            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                className="btn-puffy-amber min-h-[48px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                Nagraj mój głos
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="min-h-[48px] px-6 rounded-full bg-[#E11D48] text-white border-b-4 border-[#9F1239] font-display text-sm font-bold inline-flex items-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                Zatrzymaj nagrywanie
              </button>
            )}
          </div>

          {micMessage && (
            <p className="mt-4 rounded-2xl bg-[#FEF7DC] border border-[#F3DFA2] px-4 py-3 text-xs sm:text-sm font-bold text-[#784A14]">
              {micMessage}
            </p>
          )}

          {recordingUrl && (
            <div className="mt-6 rounded-[24px] bg-[#EEF9F1] border-2 border-[#A7E3B9] p-4 space-y-3">
              <p className="font-display text-base font-bold text-[#226B3B] inline-flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                Nagranie gotowe! Jak brzmisz?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePlayNormal}
                  className="btn-puffy-white min-h-[44px] px-5 rounded-full font-display text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current text-[#5496E8]" aria-hidden="true" />
                  Posłuchaj siebie (1×)
                </button>
                <button
                  type="button"
                  onClick={handlePlaySpriteVoice}
                  className="btn-puffy-amber min-h-[44px] px-5 rounded-full font-display text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Głosik leśnego duszka! (1,38×)
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#EFE0CC] flex justify-center">
            <button
              type="button"
              onClick={handleNextPrompt}
              className="btn-puffy-green min-h-[50px] px-8 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              {idx + 1 >= prompts.length ? 'Odbierz naklejkę Słowika!' : 'Powiedziałam! Następne zdanie'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </StorybookLessonShell>
  );
};
