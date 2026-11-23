import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSpokenPhrase, resolveSpriteSequence } from './spriteResolver';
import { AudioSpriteId, KROPKA_AUDIO_SPRITE } from '../data/kropkaAudioSprite';
import { UNIT1_CLOTHES_MODULE } from '../data/unit1Clothes';
import { WARDROBE_ACCESSORIES, STICKERS_CATALOG } from '../data/rewardsCatalog';
import { buildOutfitCaptionEn, buildWearingSentence } from './gameEngine';

test('normalizeSpokenPhrase standardizes UK/US spelling, punctuation, and apostrophes', () => {
  assert.equal(normalizeSpokenPhrase("Color the gray T-shirt!"), 'colour the grey t-shirt');
  assert.equal(normalizeSpokenPhrase("I’m wearing pajamas."), "i'm wearing pyjamas");
  assert.equal(normalizeSpokenPhrase("What’s the weather like today?"), "what's the weather like today");
  assert.equal(normalizeSpokenPhrase('Goodnight!'), 'good night');
});

test('all 345 sprite cues across all 4 MP3 files have strictly valid monotonic timestamps with zero overlaps', () => {
  const entries = Object.entries(KROPKA_AUDIO_SPRITE);
  assert.equal(entries.length, 345);

  const expectedCounts: Record<AudioSpriteId, number> = {
    main: 245,
    node1: 25,
    node2: 26,
    node3: 49,
  };
  const prevEndBySprite: Record<AudioSpriteId, number> = {
    main: 0,
    node1: 0,
    node2: 0,
    node3: 0,
  };
  const countBySprite: Record<AudioSpriteId, number> = {
    main: 0,
    node1: 0,
    node2: 0,
    node3: 0,
  };

  for (const [phrase, cue] of entries) {
    const sid: AudioSpriteId = cue.spriteId ?? 'main';
    assert.ok(cue.start >= prevEndBySprite[sid] - 0.001, `Overlap detected in ${sid} at "${phrase}"`);
    assert.ok(cue.end > cue.start + 0.15, `Clip too short in ${sid} at "${phrase}"`);
    prevEndBySprite[sid] = cue.end;
    countBySprite[sid] += 1;
  }

  assert.deepEqual(countBySprite, expectedCounts);
});

test('all 30 Unit 1 vocabulary words and all 8 crayon challenges resolve to ElevenLabs studio cues', () => {
  for (const item of UNIT1_CLOTHES_MODULE.vocabulary) {
    const wordCues = resolveSpriteSequence(item.word);
    assert.ok(wordCues && wordCues.length >= 1, `Missing studio audio for vocab word: ${item.word}`);

    const exampleCues = resolveSpriteSequence(item.exampleSentence);
    assert.ok(
      exampleCues && exampleCues.length >= 1,
      `Missing studio audio for example sentence: ${item.exampleSentence}`
    );
  }

  for (const challenge of UNIT1_CLOTHES_MODULE.crayonChallenges) {
    const cues = resolveSpriteSequence(challenge.sentence);
    assert.ok(cues && cues.length === 1, `Missing exact studio audio for crayon challenge: ${challenge.sentence}`);
  }
});

test('all Wardrobe accessories, outfit captions, Sticker praises, Comic lines, and Sorting phrases hit exact 1-cue ElevenLabs recordings', () => {
  for (const acc of WARDROBE_ACCESSORIES) {
    const nameCues = resolveSpriteSequence(acc.englishName);
    assert.ok(nameCues && nameCues.length === 1, `Missing exact audio for accessory: ${acc.englishName}`);

    const caption = buildOutfitCaptionEn([acc.id], WARDROBE_ACCESSORIES);
    const capCues = resolveSpriteSequence(caption);
    assert.ok(capCues && capCues.length === 1, `Missing exact audio for outfit caption: ${caption}`);
  }

  const emptyCaption = buildOutfitCaptionEn([], WARDROBE_ACCESSORIES);
  assert.equal(resolveSpriteSequence(emptyCaption)?.length, 1);

  for (const sticker of STICKERS_CATALOG) {
    const cues = resolveSpriteSequence(sticker.englishPraise);
    assert.ok(cues && cues.length === 1, `Missing exact audio for sticker praise: ${sticker.englishPraise}`);
  }

  const extraExactPhrases = [
    "Hello! Let's learn English together! Tap a stop on the map!",
    'park',
    'Playing in the park in summer!',
    'house',
    'Warm inside the house in winter.',
    "It's sunny and hot! Let's eat ice cream in the park!",
    "It's snowy and cold! Let's eat warm soup in the house!",
    'sunny & hot',
    "It's sunny and hot!",
    'snowy & cold',
    "It's snowy and cold!",
    'Yummy ice cream in summer!',
    'Hot soup in winter!',
    "I'm wearing a warm jumper.",
    "I'm wearing a hat in winter.",
    "Here's a new coat for Mr Beetle.",
    'Great pronunciation!',
  ];
  for (const phrase of extraExactPhrases) {
    const cues = resolveSpriteSequence(phrase);
    assert.ok(cues && cues.length === 1, `Missing exact 1-cue studio audio for: ${phrase}`);
  }
});

test('all 72 Crayon Studio free-coloring combinations (9 clothes x 8 colors) resolve to exact 1-cue ElevenLabs clips', () => {
  const clothes: Array<{ word: string; plural: boolean }> = [
    { word: 'coat', plural: false },
    { word: 'jumper', plural: false },
    { word: 'T-shirt', plural: false },
    { word: 'cap', plural: false },
    { word: 'hat', plural: false },
    { word: 'skirt', plural: false },
    { word: 'shorts', plural: true },
    { word: 'trousers', plural: true },
    { word: 'shoes', plural: true },
  ];
  const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'pink', 'orange', 'black'];

  for (const item of clothes) {
    for (const color of colors) {
      const sentence = buildWearingSentence(item.word, color, item.plural);
      const cues = resolveSpriteSequence(sentence);
      assert.ok(cues && cues.length === 1, `Missing exact studio audio for: ${sentence}`);
    }
  }
});

test('multi-sentence weather & season prompts chain seamlessly into sequential ElevenLabs cues', () => {
  const weatherQA = resolveSpriteSequence("What's the weather like today? It's sunny.");
  assert.ok(weatherQA && weatherQA.length === 2);
  assert.ok(weatherQA[0].start > 300 && weatherQA[1].start > weatherQA[0].end);

  const seasons = resolveSpriteSequence("It's snowy. It's winter!");
  assert.ok(seasons && seasons.length === 2);
});

test('all 10 Unit 1 Sentence Builder challenges resolve to ElevenLabs studio cues', () => {
  for (const s of UNIT1_CLOTHES_MODULE.sentences) {
    const cues = resolveSpriteSequence(s.targetSentence);
    assert.ok(cues && cues.length >= 1, `Missing studio audio for sentence: ${s.targetSentence}`);
  }
});

test('excluded homograph "bow" and non-English Polish phrases return null for graceful fallback', () => {
  assert.equal(resolveSpriteSequence('bow'), null);
  assert.equal(resolveSpriteSequence('Ile to jest trzy razy cztery?'), null);
});
