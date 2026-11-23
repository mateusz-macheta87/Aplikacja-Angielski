import { IllustrationKey } from '../types/curriculum';

const BASE = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/?$/, '/');
const assetUrl = (relPath: string): string => `${BASE}${relPath.replace(/^\/+/, '')}`;

// Bespoke children's picture-book watercolor illustrations generated for English with Iskierka
export const STORYBOOK_ART = {
  // Hero, Map, Mascot Emotions, Treasure & Victory Banner
  mascotHero: assetUrl('src/assets/images/mascot_hero_1795430767409.webp'),
  mascotThinking: assetUrl('src/assets/images/mascot_thinking_1795436047155.webp'),
  mascotCelebrating: assetUrl('src/assets/images/mascot_celebrating_1795436046150.webp'),
  heroFriends: assetUrl('src/assets/images/hero_storybook_friends_1795430767922.webp'),
  mapFourSeasons: assetUrl('src/assets/images/map_four_seasons_bg_1795430766835.webp'),
  treasureChest: assetUrl('src/assets/images/treasure_chest_storybook_1795430767491.webp'),
  victoryBanner: assetUrl('src/assets/images/banner_victory_party_1795433329254.webp'),

  // Map Stop & Game Tile Badges
  stopTalking: assetUrl('src/assets/images/icon_speech_birds_1795433267122.webp'),
  stopHeadphones: assetUrl('src/assets/images/icon_music_headphones_1795433266674.webp'),
  stopPencil: assetUrl('src/assets/images/icon_magic_pencil_1795433327034.webp'),
  stopTrophy: assetUrl('src/assets/images/icon_golden_trophy_1795433327585.webp'),
  gameLightning: assetUrl('src/assets/images/icon_magic_lightning_1795433266331.webp'),
  gameDuel: assetUrl('src/assets/images/icon_duel_medals_1795433327708.webp'),
  gameStickers: assetUrl('src/assets/images/icon_sticker_album_1795433327419.webp'),
  gameWordGarden: assetUrl('src/assets/images/game_word_garden_1795436047271.webp'),
  gameVoiceStudio: assetUrl('src/assets/images/game_voice_studio_1795436046269.webp'),
  memoryCardBack: assetUrl('src/assets/images/icon_memory_cards_1795433266197.webp'),
  wardrobeStage: assetUrl('src/assets/images/wardrobe_boutique_stage_1795434301841.webp'),
  mascotCutout: assetUrl('src/assets/images/cutout_mascot_hero.webp'),
  mascotThinkingCutout: assetUrl('src/assets/images/cutout_mascot_thinking.webp'),
  mascotCelebratingCutout: assetUrl('src/assets/images/cutout_mascot_celebrating.webp'),

  // 4-Panel Interactive Comic Storybook: Mr Beetle's New Clothes
  comicPanel1Rain: assetUrl('src/assets/images/comic_panel_1_rain_1795436048225.webp'),
  comicPanel2Coat: assetUrl('src/assets/images/comic_panel_2_coat_1795436046923.webp'),
  comicPanel3Shorts: assetUrl('src/assets/images/comic_panel_3_shorts_1795436047988.webp'),
  comicPanel4Party: assetUrl('src/assets/images/comic_panel_4_party_1795436047047.webp'),
} as const;

export interface ItemArtEntry {
  src: string;
  altPl: string;
  zoomClass?: string;
}

export const ISKIERKA_OUTFIT_PORTRAIT: Record<string, string> = {
  'acc-bow': assetUrl('src/assets/images/portrait_iskierka_bow.webp'),
  'acc-flowers': assetUrl('src/assets/images/portrait_iskierka_flowers.webp'),
  'acc-cap': assetUrl('src/assets/images/portrait_iskierka_cap.webp'),
  'acc-crown': assetUrl('src/assets/images/portrait_iskierka_crown.webp'),
  'acc-winter-hat': assetUrl('src/assets/images/iskierka_wear_winter_hat_1795437671829.webp'),
  'acc-glasses': assetUrl('src/assets/images/iskierka_wear_glasses_1795437673180.webp'),
  'acc-scarf': assetUrl('src/assets/images/iskierka_wear_scarf_1795437671470.webp'),
  'acc-wings': assetUrl('src/assets/images/portrait_iskierka_wings.webp'),
  'acc-cape': assetUrl('src/assets/images/portrait_iskierka_cape.webp'),
};

export const ISKIERKA_OUTFIT_STAGE: Record<string, string> = {
  'acc-bow': assetUrl('src/assets/images/stage_iskierka_bow.webp'),
  'acc-flowers': assetUrl('src/assets/images/stage_iskierka_flowers.webp'),
  'acc-cap': assetUrl('src/assets/images/stage_iskierka_cap.webp'),
  'acc-crown': assetUrl('src/assets/images/stage_iskierka_crown.webp'),
  'acc-winter-hat': assetUrl('src/assets/images/stage_iskierka_winter_hat.webp'),
  'acc-glasses': assetUrl('src/assets/images/stage_iskierka_glasses.webp'),
  'acc-scarf': assetUrl('src/assets/images/stage_iskierka_scarf.webp'),
  'acc-wings': assetUrl('src/assets/images/stage_iskierka_wings.webp'),
  'acc-cape': assetUrl('src/assets/images/stage_iskierka_cape.webp'),
};

// Full cohesive boutique-scene illustrations (4:3) rendered edge-to-edge without any cutout overlay
export const ISKIERKA_OUTFIT_SCENE: Record<string, string> = {
  'acc-cap': assetUrl('assets/aistudio/Gemini_Generated_Image_ij4b0vij4b0vij4b_ba41ed95.webp'),
};

export const WARDROBE_ART_MAP: Record<string, ItemArtEntry> = {
  'acc-bow': {
    src: assetUrl('src/assets/images/acc_pink_bow_1795434301056.webp'),
    altPl: 'Różowa satynowa kokarda z perełkami',
  },
  'acc-cap': {
    src: assetUrl('src/assets/images/acc_explorer_cap_1795434302126.webp'),
    altPl: 'Zielona czapka odkrywczyni ze stokrotką i biedronką',
  },
  'acc-crown': {
    src: assetUrl('src/assets/images/acc_golden_crown_1795434301572.webp'),
    altPl: 'Złota korona księżniczki z klejnotami',
  },
  'acc-flowers': {
    src: assetUrl('src/assets/images/acc_flower_wreath_1795434301268.webp'),
    altPl: 'Wianek leśnej wróżki ze stokrotek i wstążek',
  },
  'acc-winter-hat': {
    src: assetUrl('src/assets/images/item_winter_hat_1795433266838.webp'),
    altPl: 'Zimowa lawendowa czapka z puszystym złotym pomponem ze Skrzyni Skarbów',
  },
  'acc-glasses': {
    src: assetUrl('src/assets/images/acc_star_glasses_1795434301299.webp'),
    altPl: 'Bajkowe okulary gwiazdki w kolorze różowego złota',
  },
  'acc-scarf': {
    src: assetUrl('src/assets/images/acc_winter_scarf_1795434301381.webp'),
    altPl: 'Ciepły niebieski szalik w śnieżynki z frędzlami',
    zoomClass: 'scale-[1.15]',
  },
  'acc-cape': {
    src: assetUrl('src/assets/images/acc_hero_cape_1795434301668.webp'),
    altPl: 'Aksamitna peleryna bohaterki ze złotą gwiazdką',
  },
  'acc-wings': {
    src: assetUrl('src/assets/images/acc_butterfly_wings_1795434301983.webp'),
    altPl: 'Pastelowe skrzydełka motyla wróżki',
  },
};

export const ITEM_ART_MAP: Partial<Record<IllustrationKey, ItemArtEntry>> = {
  // Clothes & Bedtime (12 bespoke watercolor illustrations)
  coat: {
    src: assetUrl('src/assets/images/item_red_coat_1795433327899.webp'),
    altPl: 'Czerwony płaszcz',
  },
  trousers: {
    src: assetUrl('src/assets/images/item_blue_trousers_1795433267221.webp'),
    altPl: 'Niebieskie spodnie',
  },
  tshirt: {
    src: assetUrl('src/assets/images/item_green_tshirt_1795433327647.webp'),
    altPl: 'Zielona koszulka',
  },
  jumper: {
    src: assetUrl('src/assets/images/item_yellow_jumper_1795433268419.webp'),
    altPl: 'Żółty sweter',
  },
  skirt: {
    src: assetUrl('src/assets/images/item_pink_skirt_1795433266456.webp'),
    altPl: 'Różowa spódniczka',
  },
  shorts: {
    src: assetUrl('src/assets/images/item_purple_shorts_1795433328197.webp'),
    altPl: 'Fioletowe spodenki',
  },
  shoes: {
    src: assetUrl('src/assets/images/item_amber_shoes_1795433327518.webp'),
    altPl: 'Buty',
  },
  cap: {
    src: assetUrl('src/assets/images/item_green_cap_1795433266743.webp'),
    altPl: 'Zielona czapka z daszkiem',
  },
  hat: {
    src: assetUrl('src/assets/images/item_winter_hat_1795433266838.webp'),
    altPl: 'Ciepła czapka zimowa',
  },
  pyjamas: {
    src: assetUrl('src/assets/images/item_star_pyjamas_1795433267155.webp'),
    altPl: 'Piżama w gwiazdki',
  },
  slippers: {
    src: assetUrl('src/assets/images/item_bunny_slippers_1795433327266.webp'),
    altPl: 'Kapcie z uszkami króliczka',
  },
  'dressing-gown': {
    src: assetUrl('src/assets/images/item_dressing_gown_1795433267896.webp'),
    altPl: 'Niebieski szlafrok',
  },

  // Seasons (4 bespoke watercolor vignettes)
  spring: {
    src: assetUrl('src/assets/images/season_spring_tree_1795433267610.webp'),
    altPl: 'Wiosna',
  },
  summer: {
    src: assetUrl('src/assets/images/season_summer_tree_1795433329043.webp'),
    altPl: 'Lato',
  },
  autumn: {
    src: assetUrl('src/assets/images/season_autumn_tree_1795433327075.webp'),
    altPl: 'Jesień',
  },
  winter: {
    src: assetUrl('src/assets/images/season_winter_tree_1795433266856.webp'),
    altPl: 'Zima',
  },

  // Weather & Temperature
  sunny: {
    src: assetUrl('src/assets/images/weather_sunny_sun_1795433266326.webp'),
    altPl: 'Słonecznie',
  },
  hot: {
    src: assetUrl('src/assets/images/weather_sunny_sun_1795433266326.webp'),
    altPl: 'Gorąco',
  },
  cloudy: {
    src: assetUrl('src/assets/images/weather_fluffy_clouds_1795433266705.webp'),
    altPl: 'Pochmurno',
  },
  rainy: {
    src: assetUrl('src/assets/images/weather_rainy_cloud_1795433267677.webp'),
    altPl: 'Deszczowo',
  },
  snowy: {
    src: assetUrl('src/assets/images/weather_snowy_flakes_1795433267352.webp'),
    altPl: 'Śnieżnie',
  },
  cold: {
    src: assetUrl('src/assets/images/weather_snowy_flakes_1795433267352.webp'),
    altPl: 'Zimno',
  },

  // Summer vs Winter Sorting Vignettes
  'ice-cream': {
    src: assetUrl('src/assets/images/sort_ice_cream_1795433266451.webp'),
    altPl: 'Lody',
  },
  soup: {
    src: assetUrl('src/assets/images/sort_warm_soup_1795433328094.webp'),
    altPl: 'Ciepła zupa',
  },
  park: {
    src: assetUrl('src/assets/images/sort_sunny_park_1795433266614.webp'),
    altPl: 'Park',
  },
  house: {
    src: assetUrl('src/assets/images/sort_cozy_house_1795433328099.webp'),
    altPl: 'Ciepły domek',
  },
};
