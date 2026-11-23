import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIT1_CLOTHES_MODULE } from '../data/unit1Clothes';
import { DEMO_MATH_MODULE } from '../data/demoModules';
import { createEmptyProgress } from './storage';
import {
  buildMockTest,
  buildOutfitCaptionEn,
  buildParentWarmupSummary,
  buildSmartWarmupQuestions,
  buildWearingSentence,
  canOpenTreasureChest,
  checkSpellingAnswer,
  computeMasteryPercent,
  evaluateCrayonAction,
  evaluateSentenceAssembly,
  formatStarsPl,
  generateAudioQuizQuestions,
  getAvailableStars,
  getLast7DaysCalendar,
  validateLessonModuleJson,
} from './gameEngine';

test('buildWearingSentence applies article "a" for singular and omits it for plural clothes', () => {
  assert.equal(buildWearingSentence('coat', 'red', false), "I'm wearing a red coat.");
  assert.equal(buildWearingSentence('shorts', 'purple', true), "I'm wearing purple shorts.");
  assert.equal(buildWearingSentence('trousers', 'blue', true), "I'm wearing blue trousers.");
  assert.equal(
    buildWearingSentence('T-shirt', 'green', false, true),
    "I'm wearing a new green T-shirt."
  );
});

test('evaluateSentenceAssembly validates exact match and detects missing or extra article "a"', () => {
  const tip = 'Shorts to liczba mnoga — bez „a”!';
  const pass = evaluateSentenceAssembly(
    ["I'm", 'wearing', 'purple', 'shorts.'],
    ["I'm", 'wearing', 'purple', 'shorts.'],
    tip
  );
  assert.equal(pass.isCorrect, true);

  const extraArticle = evaluateSentenceAssembly(
    ["I'm", 'wearing', 'a', 'purple', 'shorts.'],
    ["I'm", 'wearing', 'purple', 'shorts.'],
    tip
  );
  assert.equal(extraArticle.isCorrect, false);
  assert.match(extraArticle.feedbackPl, /Uwaga na słówko „a”/);

  const missingArticle = evaluateSentenceAssembly(
    ["I'm", 'wearing', 'red', 'coat.'],
    ["I'm", 'wearing', 'a', 'red', 'coat.'],
    'Coat jest jeden.'
  );
  assert.equal(missingArticle.isCorrect, false);
  assert.match(missingArticle.feedbackPl, /Brakuje słówka „a”/);
});

test('evaluateCrayonAction distinguishes correct coloring, wrong clothing part, and wrong color', () => {
  const challenge = UNIT1_CLOTHES_MODULE.crayonChallenges[0];
  assert.equal(evaluateCrayonAction(challenge, 'shorts', 'purple').status, 'correct');
  assert.equal(evaluateCrayonAction(challenge, 'shorts', 'red').status, 'wrong-color');
  assert.equal(evaluateCrayonAction(challenge, 'tshirt', 'purple').status, 'wrong-part');
});

test('generateAudioQuizQuestions produces deterministic unique options and supports category filtering', () => {
  const questions = generateAudioQuizQuestions(UNIT1_CLOTHES_MODULE, 8, 77);
  assert.equal(questions.length, 8);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    const ids = new Set(q.options.map((o) => o.id));
    assert.equal(ids.size, 4);
    assert.ok(ids.has(q.correctOptionId));
  }

  const colourQs = generateAudioQuizQuestions(UNIT1_CLOTHES_MODULE, 5, 19, {
    categoryFilter: 'colours',
  });
  assert.equal(colourQs.length, 5);
  assert.ok(colourQs.every((q) => q.correctOptionId.startsWith('colour-')));
});

test('buildMockTest generates 10 questions for Unit 1 and works for non-English math module', () => {
  const enTest = buildMockTest(UNIT1_CLOTHES_MODULE, 2026);
  assert.equal(enTest.length, 10);
  assert.ok(enTest.some((q) => q.skillCategory === 'Pogoda'));
  assert.ok(enTest.some((q) => q.skillCategory.includes('Gramatyka')));

  const mathTest = buildMockTest(DEMO_MATH_MODULE, 2026);
  assert.ok(mathTest.length >= 4);
});

test('validateLessonModuleJson rejects malformed input and accepts valid custom subject packs', () => {
  assert.equal(validateLessonModuleJson('').valid, false);
  assert.equal(validateLessonModuleJson('{bad json').valid, false);
  assert.equal(validateLessonModuleJson(JSON.stringify({ title: 'Test', vocabulary: [] })).valid, false);

  const validJson = JSON.stringify({
    title: 'Niemiecki: Zwierzęta',
    subject: 'custom',
    subjectLabel: 'Język niemiecki',
    speechLang: 'de-DE',
    vocabulary: [
      { word: 'der Hund', translation: 'pies' },
      { word: 'die Katze', translation: 'kot' },
    ],
  });
  const res = validateLessonModuleJson(validJson);
  assert.equal(res.valid, true);
  assert.equal(res.module?.vocabulary.length, 2);
});

test('computeMasteryPercent, star wallet, treasure unlock, calendar, and spelling checker work reliably', () => {
  const prog = {
    ...createEmptyProgress(UNIT1_CLOTHES_MODULE.id),
    masteredWordIds: UNIT1_CLOTHES_MODULE.vocabulary.slice(0, 15).map((v) => v.id),
    stars: 14,
    starsSpent: 5,
    stopStars: { 'stop-clothes': 3, 'stop-colours': 3 } as const,
  };
  assert.equal(
    computeMasteryPercent(UNIT1_CLOTHES_MODULE, prog),
    Math.round((15 / UNIT1_CLOTHES_MODULE.vocabulary.length) * 100)
  );
  assert.equal(getAvailableStars(prog), 9);
  assert.equal(canOpenTreasureChest(prog), true);
  assert.equal(canOpenTreasureChest({ stopStars: { 'stop-clothes': 2 }, stars: 2 }), false);

  assert.equal(checkSpellingAnswer('tshirt', 'T-shirt'), true);
  assert.equal(checkSpellingAnswer('  COAT ', 'coat'), true);
  assert.equal(checkSpellingAnswer('shors', 'shorts'), false);

  const cal = getLast7DaysCalendar(['2026-11-23'], new Date(2026, 10, 23, 12, 0, 0));
  assert.equal(cal.length, 7);
  assert.equal(cal[6].isToday, true);
  assert.equal(cal[6].isDone, true);
  assert.equal(cal[0].isDone, false);
});

test('formatStarsPl applies Polish plural forms accurately', () => {
  assert.equal(formatStarsPl(0), '0 gwiazdek');
  assert.equal(formatStarsPl(1), '1 gwiazdka');
  assert.equal(formatStarsPl(2), '2 gwiazdki');
  assert.equal(formatStarsPl(5), '5 gwiazdek');
  assert.equal(formatStarsPl(22), '22 gwiazdki');
});

test('buildSmartWarmupQuestions prioritizes mistakes and builds parent summary accurately', () => {
  const prog = {
    ...createEmptyProgress(UNIT1_CLOTHES_MODULE.id),
    mistakeWordIds: ['trousers', 'autumn'],
    masteredWordIds: ['coat', 'shorts'],
  };
  const qs = buildSmartWarmupQuestions(UNIT1_CLOTHES_MODULE, prog, 42);
  assert.equal(qs.length, 6);
  const ids = qs.map((q) => q.correctOptionId);
  assert.equal(ids.includes('trousers'), true);
  assert.equal(ids.includes('autumn'), true);

  const summary = buildParentWarmupSummary([
    { wordId: 'coat', word: 'coat', categoryLabel: 'Ubrania', correct: true },
    { wordId: 'sunny', word: 'sunny', categoryLabel: 'Pogoda', correct: true },
    { wordId: 'autumn', word: 'autumn', categoryLabel: 'Pory roku', correct: false },
  ]);
  assert.deepEqual(summary.strongCategories, ['Ubrania', 'Pogoda']);
  assert.deepEqual(summary.reviewWords, ['autumn']);
  assert.equal(summary.scorePercent, 67);
  assert.equal(summary.readyForTest, false);
});

test('buildOutfitCaptionEn applies article "a" for singular and omits it for plural accessories', () => {
  const catalog = [
    { id: 'acc-crown', englishName: 'Golden crown' },
    { id: 'acc-wings', englishName: 'Butterfly wings' },
    { id: 'acc-glasses', englishName: 'Star glasses' },
  ];
  assert.equal(
    buildOutfitCaptionEn([], catalog),
    'Hello! I love learning English with you!'
  );
  assert.equal(
    buildOutfitCaptionEn(['acc-crown'], catalog),
    "I'm wearing a golden crown!"
  );
  assert.equal(
    buildOutfitCaptionEn(['acc-crown', 'acc-wings'], catalog),
    "I'm wearing a golden crown and butterfly wings!"
  );
  assert.equal(
    buildOutfitCaptionEn(['acc-crown', 'acc-glasses', 'acc-wings'], catalog),
    "I'm wearing a golden crown, star glasses and butterfly wings!"
  );
});
