import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Code2,
  Download,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { LessonModule, ModuleProgress, SubjectId, VocabItem } from '../../types/curriculum';
import { computeMasteryPercent, validateLessonModuleJson } from '../../engine/gameEngine';
import { PWAInstallButton } from '../layout/PWAInstallButton';

interface ParentStudioViewProps {
  modules: LessonModule[];
  activeModule: LessonModule;
  progressByModule: Record<string, ModuleProgress>;
  speechRate: 'normal' | 'slow';
  onChangeSpeechRate: (rate: 'normal' | 'slow') => void;
  onSelectModule: (id: string) => void;
  onAddCustomModule: (mod: LessonModule) => void;
  onDeleteCustomModule: (id: string) => void;
  onResetProgress: (moduleId: string) => void;
  onBackToMap: () => void;
}

const SAMPLE_TEMPLATE = JSON.stringify(
  {
    id: 'en-unit2-animals',
    title: 'Unit 2: Farm Animals (Szablon)',
    subtitle: 'Przykładowy kolejny rozdział — zwierzęta i kolory',
    subject: 'english',
    subjectLabel: 'Język angielski',
    gradeLevel: 'Klasa 1–3',
    speechLang: 'en-GB',
    sourceReference: 'Podręcznik Unit 2',
    vocabulary: [
      {
        id: 'dog',
        word: 'dog',
        translation: 'pies',
        category: 'general',
        categoryLabel: 'Zwierzęta',
        illustration: 'generic',
        exampleSentence: "It's a brown dog.",
        exampleTranslation: 'To jest brązowy pies.',
      },
      {
        id: 'cat',
        word: 'cat',
        translation: 'kot',
        category: 'general',
        categoryLabel: 'Zwierzęta',
        illustration: 'generic',
        exampleSentence: "It's a black cat.",
        exampleTranslation: 'To jest czarny kot.',
      },
    ],
  },
  null,
  2
);

export const ParentStudioView: React.FC<ParentStudioViewProps> = ({
  modules,
  activeModule,
  progressByModule,
  speechRate,
  onChangeSpeechRate,
  onSelectModule,
  onAddCustomModule,
  onDeleteCustomModule,
  onResetProgress,
  onBackToMap,
}) => {
  const [section, setSection] = useState<'progress' | 'builder' | 'architecture'>('progress');
  const [confirmReset, setConfirmReset] = useState(false);

  // Quick Module Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectId>('english');
  const [speechLang, setSpeechLang] = useState('en-GB');
  const [wordDraft, setWordDraft] = useState('');
  const [transDraft, setTransDraft] = useState('');
  const [exampleDraft, setExampleDraft] = useState('');
  const [draftWords, setDraftWords] = useState<VocabItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // JSON Import state
  const [jsonInput, setJsonInput] = useState('');
  const [jsonMessage, setJsonMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // AI Photo Module Creator state
  const [aiPhotoPreview, setAiPhotoPreview] = useState<string | null>(null);
  const [aiPhotoBase64, setAiPhotoBase64] = useState<string | null>(null);
  const [aiPhotoMime, setAiPhotoMime] = useState<string>('image/jpeg');
  const [aiSubjectHint, setAiSubjectHint] = useState<SubjectId>('english');
  const [aiTitleHint, setAiTitleHint] = useState('');
  const [aiParentPin, setAiParentPin] = useState('');
  const [aiPinRequired, setAiPinRequired] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedModule, setAiGeneratedModule] = useState<LessonModule | null>(null);

  const activeProgress = progressByModule[activeModule.id];
  const masteryPct = computeMasteryPercent(activeModule, activeProgress);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAiError(null);
    setAiGeneratedModule(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAiError('Wybierz zdjęcie w formacie JPG, PNG lub WebP.');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setAiError('Zdjęcie jest większe niż 7 MB. Wybierz mniejszy plik.');
      return;
    }
    setAiPhotoMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAiPhotoPreview(dataUrl);
      setAiPhotoBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateFromPhoto = async () => {
    if (!aiPhotoBase64) {
      setAiError('Najpierw wybierz zdjęcie strony podręcznika lub notatki.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiGeneratedModule(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (aiParentPin.trim()) {
        headers['X-Parent-Pin'] = aiParentPin.trim();
      }
      const resp = await fetch('/api/generate-module-from-photo', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: aiPhotoBase64,
          mimeType: aiPhotoMime,
          subjectHint: aiSubjectHint,
          titleHint: aiTitleHint,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 401 && data.requiresPin) {
        setAiPinRequired(true);
        setAiError(data.error || 'Wpisz PIN rodzica, aby uruchomić analizę zdjęcia.');
        return;
      }
      if (resp.status === 404 || resp.status === 405) {
        setAiError(
          'Kreator AI ze zdjęć wymaga serwera backendowego (na statycznym podglądzie GitHub Pages działają wszystkie gry, lektor offline, ręczny edytor oraz import JSON).'
        );
        return;
      }
      if (!resp.ok || !data.module) {
        setAiError(data.error || 'Nie udało się utworzyć modułu ze zdjęcia.');
        return;
      }
      const validated = validateLessonModuleJson(JSON.stringify(data.module));
      if (!validated.valid || !validated.module) {
        setAiError(validated.error || 'Wygenerowany moduł nie przeszedł walidacji.');
        return;
      }
      setAiGeneratedModule(validated.module);
    } catch {
      setAiError('Błąd połączenia z serwerem. Sprawdź czy aplikacja działa poprawnie.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddDraftWord = () => {
    if (!wordDraft.trim() || !transDraft.trim()) {
      setFormError('Wpisz zarówno słówko/pojęcie, jak i jego polskie tłumaczenie.');
      return;
    }
    if (draftWords.length >= 60) {
      setFormError('Jeden moduł może zawierać maksymalnie 60 słówek lub pojęć.');
      return;
    }
    setFormError(null);
    const newItem: VocabItem = {
      id: `w-${Date.now()}-${draftWords.length}`,
      word: wordDraft.trim().slice(0, 80),
      translation: transDraft.trim().slice(0, 100),
      category: 'general',
      categoryLabel: 'Słownictwo',
      illustration: subject === 'math' ? 'math-card' : 'generic',
      exampleSentence: (exampleDraft.trim() || wordDraft.trim()).slice(0, 160),
      exampleTranslation: transDraft.trim().slice(0, 160),
    };
    setDraftWords((prev) => [...prev, newItem]);
    setWordDraft('');
    setTransDraft('');
    setExampleDraft('');
  };

  const handleSaveNewModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Podaj nazwę nowego modułu (np. „Unit 2: Zwierzęta” lub „Matematyka: Dodawanie”).');
      return;
    }
    if (draftWords.length < 2) {
      setFormError('Dodaj co najmniej 2 słówka/pojęcia, aby quiz audio i gry mogły działać.');
      return;
    }

    const subjectLabels: Record<SubjectId, string> = {
      english: 'Język angielski',
      math: 'Matematyka',
      science: 'Przyroda',
      polish: 'Język polski',
      custom: 'Inny przedmiot',
    };

    const candidate: LessonModule = {
      id: `custom-${Date.now()}`,
      title: title.trim().slice(0, 100),
      subtitle: `Własny moduł tematyczny (${draftWords.length} haseł)`,
      subject,
      subjectLabel: subjectLabels[subject],
      gradeLevel: 'Własny zestaw',
      speechLang,
      sourceReference: 'Utworzono w Strefie Rodzica',
      isBuiltIn: false,
      vocabulary: draftWords,
      sentences: [],
      crayonChallenges: [],
    };

    const validated = validateLessonModuleJson(JSON.stringify(candidate));
    if (!validated.valid || !validated.module) {
      setFormError(validated.error || 'Nie udało się zapisać modułu — sprawdź wpisane dane.');
      return;
    }

    onAddCustomModule(validated.module);
    onSelectModule(validated.module.id);
    setTitle('');
    setDraftWords([]);
    setFormError(null);
    setFormSuccess(`Moduł „${validated.module.title}” został zapisany i ustawiony jako aktywny!`);
  };

  const handleImportJson = () => {
    const res = validateLessonModuleJson(jsonInput);
    if (!res.valid || !res.module) {
      setJsonMessage({ ok: false, text: res.error || 'Błąd walidacji JSON.' });
      return;
    }
    onAddCustomModule(res.module);
    onSelectModule(res.module.id);
    setJsonInput('');
    setJsonMessage({
      ok: true,
      text: `Zaimportowano moduł „${res.module.title}” (${res.module.vocabulary.length} haseł)!`,
    });
  };

  const handleExportActiveModule = () => {
    const blob = new Blob([JSON.stringify(activeModule, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const safeFilename = activeModule.id.replace(/[^a-zA-Z0-9_-]/g, '_') || 'module';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="btn-puffy-white min-h-[46px] px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Wróć do mapy dziecka
          </button>
          <div>
            <p className="text-xs font-bold text-[#8A7465]">
              Panel Rodzica · Architektura wieloprzedmiotowa
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2F2B]">
              Strefa Rodzica i Architektura
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-full bg-[#F5ECE0] border border-[#E7D8C5]">
            <button
              type="button"
              onClick={() => onChangeSpeechRate('normal')}
              className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold ${
                speechRate === 'normal'
                  ? 'bg-white text-[#3E2F2B] shadow-sm'
                  : 'text-[#8A7465]'
              }`}
            >
              Lektor: Normalnie
            </button>
            <button
              type="button"
              onClick={() => onChangeSpeechRate('slow')}
              className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold ${
                speechRate === 'slow'
                  ? 'bg-white text-[#3E2F2B] shadow-sm'
                  : 'text-[#8A7465]'
              }`}
            >
              Lektor: Wolniej
            </button>
          </div>
          <PWAInstallButton />
        </div>
      </div>

      {/* Segmented Section Tabs */}
      <div role="tablist" aria-label="Sekcje Strefy Rodzica" className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-full bg-[#F5ECE0] border border-[#E7D8C5]">
        {[
          { id: 'progress', label: 'Postępy dziecka' },
          { id: 'builder', label: 'Edytor Modułów i JSON' },
          { id: 'architecture', label: 'Architektura i Plan Wdrożenia' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={section === tab.id}
            onClick={() => setSection(tab.id as typeof section)}
            className={`min-h-[42px] px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-amber-500 ${
              section === tab.id
                ? 'bg-[#3E2F2B] text-white shadow-sm'
                : 'text-[#6E5B4F] hover:text-[#3E2F2B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROGRESS */}
      {section === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500">Opanowane słownictwo</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
                {masteryPct}%
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {activeProgress?.masteredWordIds.length ?? 0} z {activeModule.vocabulary.length} słówek
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500">Najlepszy Próbny Sprawdzian</p>
              <p className="mt-2 font-display text-3xl font-bold text-blue-700 tabular-nums">
                {activeProgress?.bestTestScore ?? 0}%
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                Ukończone gry i quizy: {activeProgress?.quizzesCompleted ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500">Zdobyte gwiazdki</p>
              <p className="mt-2 font-display text-3xl font-bold text-amber-600 tabular-nums">
                {activeProgress?.stars ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Zapis lokalny w pamięci iPada</p>
            </div>
          </div>

          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Zainstalowane moduły tematyczne ({modules.length})
                </h2>
                <p className="text-sm text-slate-600">
                  Kliknij dowolny moduł, aby przełączyć całą aplikację na nowy przedmiot lub rozdział.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportActiveModule}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Eksportuj aktywny JSON
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {modules.map((m) => {
                const isSelected = m.id === activeModule.id;
                const modPct = computeMasteryPercent(m, progressByModule[m.id]);
                return (
                  <div key={m.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {m.title}
                        {isSelected && <span className="ml-2 text-xs font-semibold text-blue-600">· Aktywny</span>}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {m.subjectLabel} · {m.vocabulary.length} haseł · Język lektora: {m.speechLang} · Opanowane: {modPct}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectModule(m.id)}
                          className="min-h-[40px] px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                        >
                          Uruchom ten moduł
                        </button>
                      )}
                      {!m.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomModule(m.id)}
                          aria-label={`Usuń moduł ${m.title}`}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Możesz wyzerować postęp aktywnego modułu przed powtórką generalną.
              </p>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Wyzeruj postęp tego modułu
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress(activeModule.id);
                      setConfirmReset(false);
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                  >
                    Potwierdź reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: MODULE CREATOR, AI PHOTO SCANNER & JSON IMPORT */}
      {section === 'builder' && (
        <div className="space-y-6">
          {/* AI Textbook Photo Module Creator */}
          <section className="rounded-3xl bg-gradient-to-br from-[#FFFDF8] to-[#FEF7E4] border-2 border-[#EED9BD] p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#3E2F2B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D9820B]" aria-hidden="true" />
                  Kreator nowej lekcji ze zdjęcia podręcznika (AI)
                </h2>
                <p className="mt-1 text-sm text-[#6E5B4F]">
                  Zrób zdjęcie nowej strony z podręcznika (angielski, matematyka, przyroda lub polski), a aplikacja automatycznie odczyta słówka i przygotuje cały zestaw gier oraz quiz audio!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5 space-y-3">
                <label className="flex flex-col items-center justify-center min-h-[156px] rounded-2xl border-2 border-dashed border-[#DFC19B] bg-white hover:border-[#5496E8] cursor-pointer p-4 text-center transition-colors">
                  {aiPhotoPreview ? (
                    <img
                      src={aiPhotoPreview}
                      alt="Podgląd zdjęcia strony podręcznika"
                      className="max-h-36 rounded-xl object-contain"
                    />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-[#5496E8] mb-2" aria-hidden="true" />
                      <span className="font-display text-sm font-bold text-[#3E2F2B]">
                        Wybierz lub zrób zdjęcie strony
                      </span>
                      <span className="text-xs text-[#8A7465] mt-1">
                        JPG, PNG lub WebP · maks. 7 MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ai-photo-subject" className="block text-xs font-bold text-[#6E5B4F] mb-1">
                      Przedmiot na zdjęciu
                    </label>
                    <select
                      id="ai-photo-subject"
                      value={aiSubjectHint}
                      onChange={(e) => setAiSubjectHint(e.target.value as SubjectId)}
                      className="w-full min-h-[44px] rounded-xl border border-[#DFC9AE] bg-white px-3 py-2 text-sm"
                    >
                      <option value="english">Język angielski</option>
                      <option value="math">Matematyka</option>
                      <option value="polish">Język polski</option>
                      <option value="science">Przyroda</option>
                      <option value="custom">Inny przedmiot</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ai-photo-title" className="block text-xs font-bold text-[#6E5B4F] mb-1">
                      Własna nazwa lekcji (opcjonalnie)
                    </label>
                    <input
                      id="ai-photo-title"
                      type="text"
                      value={aiTitleHint}
                      onChange={(e) => setAiTitleHint(e.target.value)}
                      placeholder="np. Unit 2: My Toys"
                      className="w-full min-h-[44px] rounded-xl border border-[#DFC9AE] bg-white px-3.5 py-2 text-sm"
                    />
                  </div>
                </div>

                {aiPinRequired && (
                  <div>
                    <label htmlFor="ai-parent-pin" className="block text-xs font-bold text-[#6E5B4F] mb-1">
                      PIN rodzica (wymagany przez serwer)
                    </label>
                    <input
                      id="ai-parent-pin"
                      type="password"
                      autoComplete="off"
                      value={aiParentPin}
                      onChange={(e) => setAiParentPin(e.target.value)}
                      placeholder="Wpisz PIN rodzica"
                      className="w-full sm:max-w-xs min-h-[44px] rounded-xl border border-[#DFC9AE] bg-white px-3.5 py-2 text-sm"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={aiLoading || !aiPhotoBase64}
                  onClick={handleGenerateFromPhoto}
                  className={`min-h-[48px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2 ${
                    aiLoading || !aiPhotoBase64
                      ? 'bg-[#E8DFD3] text-[#9A897A] cursor-not-allowed'
                      : 'btn-puffy-amber'
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Analizuję zdjęcie podręcznika...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Utwórz moduł ze zdjęcia
                    </>
                  )}
                </button>

                {aiError && (
                  <p className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700">
                    {aiError}
                  </p>
                )}

                {aiGeneratedModule && (
                  <div className="rounded-2xl bg-[#EEF9F1] border-2 border-[#A7E3B9] p-4 space-y-2.5">
                    <p className="font-display text-base font-bold text-[#226B3B] flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      Gotowe! Rozpoznano: „{aiGeneratedModule.title}”
                    </p>
                    <p className="text-xs font-semibold text-[#3B6B4B]">
                      Odczytane słówka: {aiGeneratedModule.vocabulary.length} · Zdania do rozsypanki: {aiGeneratedModule.sentences.length}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiGeneratedModule.vocabulary.slice(0, 8).map((v) => (
                        <span
                          key={v.id}
                          className="px-2.5 py-1 rounded-full bg-white border border-[#BFE8CC] text-xs font-bold text-[#3E2F2B]"
                        >
                          {v.word} — {v.translation}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddCustomModule(aiGeneratedModule);
                        onSelectModule(aiGeneratedModule.id);
                        setFormSuccess(`Nowy moduł AI „${aiGeneratedModule.title}” został zapisany i uruchomiony!`);
                        setAiGeneratedModule(null);
                        setAiPhotoPreview(null);
                        setAiPhotoBase64(null);
                      }}
                      className="btn-puffy-green min-h-[44px] px-6 rounded-full font-display text-sm font-bold"
                    >
                      Zapisz i uruchom ten moduł!
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveNewModule}
            className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-slate-900">
              Utwórz nowy moduł (kolejna lekcja lub przedmiot)
            </h2>
            <p className="text-sm text-slate-600">
              Dodaj słówka z nowego rozdziału, tabliczkę mnożenia lub daty z historii — aplikacja automatycznie wygeneruje Słowniczek Audio, Quiz Audio, Memory i Próbny Sprawdzian.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mod-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tytuł lekcji / sprawdzianu
                </label>
                <input
                  id="mod-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Unit 2: My House"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="mod-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                    Przedmiot
                  </label>
                  <select
                    id="mod-subject"
                    value={subject}
                    onChange={(e) => {
                      const val = e.target.value as SubjectId;
                      setSubject(val);
                      setSpeechLang(val === 'english' ? 'en-GB' : 'pl-PL');
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="english">Angielski</option>
                    <option value="math">Matematyka</option>
                    <option value="polish">Polski</option>
                    <option value="science">Przyroda</option>
                    <option value="custom">Inny</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="mod-lang" className="block text-xs font-semibold text-slate-700 mb-1">
                    Głos lektora
                  </label>
                  <select
                    id="mod-lang"
                    value={speechLang}
                    onChange={(e) => setSpeechLang(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="en-GB">en-GB (UK)</option>
                    <option value="en-US">en-US (US)</option>
                    <option value="pl-PL">pl-PL (PL)</option>
                    <option value="de-DE">de-DE (DE)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700">Dodaj hasła / słówka do modułu</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  aria-label="Słówko lub pojęcie"
                  value={wordDraft}
                  onChange={(e) => setWordDraft(e.target.value)}
                  placeholder="Słówko (np. bedroom)"
                  className="min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                <input
                  type="text"
                  aria-label="Tłumaczenie lub odpowiedź"
                  value={transDraft}
                  onChange={(e) => setTransDraft(e.target.value)}
                  placeholder="Tłumaczenie (np. sypialnia)"
                  className="min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label="Przykładowe zdanie (opcjonalnie)"
                  value={exampleDraft}
                  onChange={(e) => setExampleDraft(e.target.value)}
                  placeholder="Przykładowe zdanie (opcjonalnie, np. This is my bedroom.)"
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddDraftWord}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Dodaj słówko
                </button>
              </div>
            </div>

            {draftWords.length > 0 && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  Dodane hasła ({draftWords.length}):
                </p>
                <ul className="space-y-1.5 text-sm">
                  {draftWords.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-2">
                      <span>
                        <strong>{w.word}</strong> — {w.translation}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftWords((prev) => prev.filter((x) => x.id !== w.id))}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Usuń
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}
            {formSuccess && (
              <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Zapisz nowy moduł lekcji
            </button>
          </form>

          {/* JSON Import Panel */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Importuj pakiet lekcji (JSON)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Wklej plik JSON przygotowany dla kolejnego działu lub innego przedmiotu. Aplikacja zweryfikuje strukturę i zapisze go lokalnie.
              </p>

              <textarea
                aria-label="Kod JSON modułu lekcji"
                rows={10}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"title": "Unit 2: Animals", "vocabulary": [...]}'
                className="mt-3 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              />

              {jsonMessage && (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    jsonMessage.ok ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {jsonMessage.text}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImportJson}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Importuj JSON
              </button>
              <button
                type="button"
                onClick={() => setJsonInput(SAMPLE_TEMPLATE)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Wstaw przykładowy szablon
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ARCHITECTURE & IMPLEMENTATION PLAN */}
      {section === 'architecture' && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-blue-600" aria-hidden="true" />
              Architektura Systemu (Niezależna i Modułowa)
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
              LingoPlay zostało zaprojektowane w architekturze <strong>Data-Driven PWA (Local-First)</strong>. Oznacza to całkowite rozdzielenie silnika edukacyjnego od treści konkretnego sprawdzianu — dzięki temu ta sama aplikacja obsłuży kolejne działy z angielskiego, matematykę, przyrodę i język polski bez przepisywania kodu.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01. Warstwa Kontentu',
                  title: 'Kontrakt LessonModule JSON',
                  desc: 'Każda lekcja to niezależny pakiet JSON: słownictwo, zdania gramatyczne, zadania z kredkami, sortowanie kontrastów i język lektora (en-GB / pl-PL / de-DE).',
                },
                {
                  step: '02. Silnik Gier i Reguł',
                  title: 'Czysta logika (gameEngine)',
                  desc: 'Deterministyczny generator quizów, walidator gramatyki („a” vs liczba mnoga), kreator próbnych sprawdzianów i ocena postępów — w pełni pokryty testami jednostkowymi.',
                },
                {
                  step: '03. Warstwa Multimedialna',
                  title: 'Audio + SVG Offline',
                  desc: 'Syntezator mowy Web Speech API (en-GB z trybem wolnym), proceduralne efekty dźwiękowe Web Audio API i wektorowe ilustracje SVG — zero zewnętrznych serwerów.',
                },
                {
                  step: '04. Dystrybucja iPad PWA',
                  title: 'Instalacja i Pamięć Lokalna',
                  desc: 'Service Worker (Workbox) + Manifest PWA + ikony iOS pozwalają dodać aplikację na ekran główny iPada i ćwiczyć w trybie pełnoekranowym nawet bez Wi-Fi.',
                },
              ].map((layer) => (
                <div key={layer.step} className="space-y-1.5">
                  <p className="text-xs font-semibold text-blue-700">{layer.step}</p>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {layer.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{layer.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Kompletny Plan Wdrożenia i Rozbudowy
              </h3>
              <ol className="mt-4 space-y-4 text-sm text-slate-700">
                <li>
                  <strong className="text-slate-900">Faza 1 (Wdrożona teraz): Unit 1 + iPad PWA</strong>
                  <p className="mt-0.5 text-slate-600">
                    Pełny materiał ze str. 8–16 i 80 (ubrania, kolory, kredki, pogoda, pory roku, piżama/kapcie, wymowa /sh/), 5 gier multimedialnych, próbny sprawdzian i instalacja na iPadzie.
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">Faza 2: Kolejne rozdziały (Unit 2–6)</strong>
                  <p className="mt-0.5 text-slate-600">
                    Dodawanie kolejnych działów w zakładce „Edytor Modułów i JSON” w 3 minuty — bez ingerencji w kod źródłowy i bez konieczności ponownego wdrażania aplikacji.
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">Faza 3: Inne przedmioty szkolne</strong>
                  <p className="mt-0.5 text-slate-600">
                    Przełączanie języka lektora na <code className="font-mono text-xs">pl-PL</code> dla matematyki (tabliczka mnożenia, jednostki), języka polskiego (ortografia ó/u, rz/ż) i przyrody — gotowe moduły pokazowe są już wbudowane.
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">Faza 4 (Opcjonalnie): Backup i synchronizacja</strong>
                  <p className="mt-0.5 text-slate-600">
                    Eksport i import pakietów JSON pozwala przesyłać gotowe zestawy między komputerem rodzica a iPadem dziecka (np. przez AirDrop lub dysk), zachowując pełną niezależność bez abonamentów.
                  </p>
                </li>
              </ol>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6">
              <h3 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Kontrakt Danych Modułu (JSON Schema)
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Wystarczy taki plik JSON, aby uruchomić zupełnie nowy sprawdzian z dowolnego przedmiotu:
              </p>
              <pre className="mt-3 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                {SAMPLE_TEMPLATE}
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
