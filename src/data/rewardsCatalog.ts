import { IllustrationKey, MapStopId } from '../types/curriculum';

export interface StickerItem {
  id: string;
  title: string;
  englishPraise: string;
  illustration: IllustrationKey;
  colorHex?: string;
  unlockHintPl: string;
  unlockedByStop?: MapStopId;
}

export interface WardrobeAccessory {
  id: string;
  namePl: string;
  englishName: string;
  priceStars: number;
  slot: 'head' | 'eyes' | 'neck' | 'back' | 'hand';
  slotLabelPl: string;
  descriptionPl: string;
  secretTreasureOnly?: boolean;
}

export const STICKERS_CATALOG: StickerItem[] = [
  {
    id: 'stk-coat',
    title: 'Czerwony Płaszczyk',
    englishPraise: 'Red coat superstar!',
    illustration: 'coat',
    colorHex: '#EF4444',
    unlockHintPl: 'Ukończ przystanek 1: Clothes',
    unlockedByStop: 'stop-clothes',
  },
  {
    id: 'stk-colours',
    title: 'Tęczowa Kredka',
    englishPraise: 'Colour artist!',
    illustration: 'colour-swatch',
    colorHex: '#9333EA',
    unlockHintPl: 'Ukończ przystanek 2: Colours',
    unlockedByStop: 'stop-colours',
  },
  {
    id: 'stk-wearing',
    title: 'Mistrzyni Zdań',
    englishPraise: 'Great sentences!',
    illustration: 'jumper',
    colorHex: '#EAB308',
    unlockHintPl: 'Ukończ przystanek 3: I\'m wearing',
    unlockedByStop: 'stop-wearing',
  },
  {
    id: 'stk-dressup',
    title: 'Projektantka Mody',
    englishPraise: 'Purple shorts champion!',
    illustration: 'shorts',
    colorHex: '#9333EA',
    unlockHintPl: 'Ukończ przystanek 4: Dress up',
    unlockedByStop: 'stop-dressup',
  },
  {
    id: 'stk-spring',
    title: 'Kwitnąca Wiosna',
    englishPraise: 'Happy spring!',
    illustration: 'spring',
    unlockHintPl: 'Ukończ przystanek 5: Seasons',
    unlockedByStop: 'stop-seasons',
  },
  {
    id: 'stk-sunny',
    title: 'Słoneczny Uśmiech',
    englishPraise: 'Sunny day star!',
    illustration: 'sunny',
    unlockHintPl: 'Ukończ przystanek 6: Weather',
    unlockedByStop: 'stop-weather',
  },
  {
    id: 'stk-audio',
    title: 'Złote Uszko',
    englishPraise: 'Super listener!',
    illustration: 'shoes',
    colorHex: '#F59E0B',
    unlockHintPl: 'Ukończ przystanek 7: Iskierka says',
    unlockedByStop: 'stop-audio',
  },
  {
    id: 'stk-write',
    title: 'Mistrzyni Pisania',
    englishPraise: 'Amazing spelling!',
    illustration: 'tshirt',
    colorHex: '#22C55E',
    unlockHintPl: 'Ukończ przystanek 8: Listen & write',
    unlockedByStop: 'stop-write',
  },
  {
    id: 'stk-test',
    title: 'Puchar Sprawdzianu',
    englishPraise: 'You are ready for the test!',
    illustration: 'summer',
    unlockHintPl: 'Ukończ przystanek 9: Test',
    unlockedByStop: 'stop-test',
  },
  {
    id: 'stk-daily',
    title: 'Codzienna Iskierka',
    englishPraise: 'Daily hero!',
    illustration: 'ice-cream',
    unlockHintPl: 'Wykonaj Zadanie dnia',
  },
  {
    id: 'stk-duel',
    title: 'Medal Pojedynku',
    englishPraise: 'Family game winner!',
    illustration: 'autumn',
    unlockHintPl: 'Zagraj w Pojedynek z rodzicem',
  },
  {
    id: 'stk-treasure',
    title: 'Skarb Czterech Pór Roku',
    englishPraise: 'Magical treasure!',
    illustration: 'winter',
    unlockHintPl: 'Otwórz Skrzynię Skarbów na mapie',
  },
  {
    id: 'stk-voice',
    title: 'Śpiewający Słowik',
    englishPraise: 'Great pronunciation!',
    illustration: 'park',
    unlockHintPl: 'Nagraj swój głos w „Powiedz z Iskierką!”',
  },
  {
    id: 'stk-comic',
    title: 'Mistrzyni Bajek',
    englishPraise: 'I love my new clothes!',
    illustration: 'house',
    unlockHintPl: 'Przeczytaj bajkowy komiks Pana Chrząszcza',
  },
];

export const WARDROBE_ACCESSORIES: WardrobeAccessory[] = [
  {
    id: 'acc-bow',
    namePl: 'Różowa kokarda z perełkami',
    englishName: 'Pink bow',
    priceStars: 3,
    slot: 'head',
    slotLabelPl: 'Na głowę',
    descriptionPl: 'Satynowa, pudrowa kokardka z drobnymi perełkami i złotym pyłkiem.',
  },
  {
    id: 'acc-flowers',
    namePl: 'Wianek leśnej wróżki',
    englishName: 'Flower crown',
    priceStars: 4,
    slot: 'head',
    slotLabelPl: 'Na głowę',
    descriptionPl: 'Pleciony wianek ze stokrotek, niezapominajek i pastelowych wstążek.',
  },
  {
    id: 'acc-cap',
    namePl: 'Czapka odkrywczyni',
    englishName: 'Green cap',
    priceStars: 4,
    slot: 'head',
    slotLabelPl: 'Na głowę',
    descriptionPl: 'Leśna czapka z daszkiem z haftowaną stokrotką i uśmiechniętą biedronką.',
  },
  {
    id: 'acc-crown',
    namePl: 'Złota korona księżniczki',
    englishName: 'Golden crown',
    priceStars: 6,
    slot: 'head',
    slotLabelPl: 'Na głowę',
    descriptionPl: 'Ażurowa korona z pastelowymi klejnotami dla Mistrzyni Angielskiego!',
  },
  {
    id: 'acc-glasses',
    namePl: 'Okulary gwiazdki',
    englishName: 'Star glasses',
    priceStars: 4,
    slot: 'eyes',
    slotLabelPl: 'Na oczy',
    descriptionPl: 'Różowo-złote okulary w kształcie gwiazdek z liliowo-brzoskwiniowymi szkłami.',
  },
  {
    id: 'acc-scarf',
    namePl: 'Szalik w śnieżynki',
    englishName: 'Winter scarf',
    priceStars: 4,
    slot: 'neck',
    slotLabelPl: 'Na szyję',
    descriptionPl: 'Miękki błękitny szalik dziergany w śnieżynki z puszystymi frędzlami.',
  },
  {
    id: 'acc-wings',
    namePl: 'Skrzydełka motyla',
    englishName: 'Butterfly wings',
    priceStars: 5,
    slot: 'back',
    slotLabelPl: 'Na plecy',
    descriptionPl: 'Mieniące się pastelowe skrzydełka wróżki ze złotymi zawijasami.',
  },
  {
    id: 'acc-cape',
    namePl: 'Peleryna Bohaterki',
    englishName: 'Hero cape',
    priceStars: 5,
    slot: 'back',
    slotLabelPl: 'Na plecy',
    descriptionPl: 'Aksamitna malinowa peleryna ze złotą zapinką w kształcie gwiazdki.',
  },
  {
    id: 'acc-winter-hat',
    namePl: 'Czapka Skarbu z pomponem',
    englishName: 'Winter hat',
    priceStars: 0,
    slot: 'head',
    slotLabelPl: 'Na głowę · Skarb',
    descriptionPl: 'Puszysta lawendowa czapka ze złotym pomponem — sekretna nagroda ze Skrzyni Skarbów!',
    secretTreasureOnly: true,
  },
];
