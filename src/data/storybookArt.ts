import { IllustrationKey } from '../types/curriculum';

// Bespoke children's picture-book watercolor illustrations generated for English with Iskierka
export const STORYBOOK_ART = {
  // Hero, Map, Mascot Emotions, Treasure & Victory Banner
  mascotHero: '/src/assets/images/mascot_hero_1795430767409.jpg',
  mascotThinking: '/src/assets/images/mascot_thinking_1795436047155.jpg',
  mascotCelebrating: '/src/assets/images/mascot_celebrating_1795436046150.jpg',
  heroFriends: '/src/assets/images/hero_storybook_friends_1795430767922.jpg',
  mapFourSeasons: '/src/assets/images/map_four_seasons_bg_1795430766835.jpg',
  treasureChest: '/src/assets/images/treasure_chest_storybook_1795430767491.jpg',
  victoryBanner: '/src/assets/images/banner_victory_party_1795433329254.jpg',

  // Map Stop & Game Tile Badges
  stopTalking: '/src/assets/images/icon_speech_birds_1795433267122.jpg',
  stopHeadphones: '/src/assets/images/icon_music_headphones_1795433266674.jpg',
  stopPencil: '/src/assets/images/icon_magic_pencil_1795433327034.jpg',
  stopTrophy: '/src/assets/images/icon_golden_trophy_1795433327585.jpg',
  gameLightning: '/src/assets/images/icon_magic_lightning_1795433266331.jpg',
  gameDuel: '/src/assets/images/icon_duel_medals_1795433327708.jpg',
  gameStickers: '/src/assets/images/icon_sticker_album_1795433327419.jpg',
  gameWordGarden: '/src/assets/images/game_word_garden_1795436047271.jpg',
  gameVoiceStudio: '/src/assets/images/game_voice_studio_1795436046269.jpg',
  memoryCardBack: '/src/assets/images/icon_memory_cards_1795433266197.jpg',
  wardrobeStage: '/src/assets/images/wardrobe_boutique_stage_1795434301841.jpg',
  mascotCutout: '/src/assets/images/cutout_mascot_hero.png',
  mascotThinkingCutout: '/src/assets/images/cutout_mascot_thinking.png',
  mascotCelebratingCutout: '/src/assets/images/cutout_mascot_celebrating.png',

  // 4-Panel Interactive Comic Storybook: Mr Beetle's New Clothes
  comicPanel1Rain: '/src/assets/images/comic_panel_1_rain_1795436048225.jpg',
  comicPanel2Coat: '/src/assets/images/comic_panel_2_coat_1795436046923.jpg',
  comicPanel3Shorts: '/src/assets/images/comic_panel_3_shorts_1795436047988.jpg',
  comicPanel4Party: '/src/assets/images/comic_panel_4_party_1795436047047.jpg',
} as const;

export interface ItemArtEntry {
  src: string;
  altPl: string;
  zoomClass?: string;
}

export const ISKIERKA_OUTFIT_PORTRAIT: Record<string, string> = {
  'acc-bow': '/src/assets/images/portrait_iskierka_bow.jpg',
  'acc-flowers': '/src/assets/images/portrait_iskierka_flowers.jpg',
  'acc-cap': '/src/assets/images/portrait_iskierka_cap.jpg',
  'acc-crown': '/src/assets/images/portrait_iskierka_crown.jpg',
  'acc-winter-hat': '/src/assets/images/iskierka_wear_winter_hat_1795437671829.jpg',
  'acc-glasses': '/src/assets/images/iskierka_wear_glasses_1795437673180.jpg',
  'acc-scarf': '/src/assets/images/iskierka_wear_scarf_1795437671470.jpg',
  'acc-wings': '/src/assets/images/portrait_iskierka_wings.jpg',
  'acc-cape': '/src/assets/images/portrait_iskierka_cape.jpg',
};

export const ISKIERKA_OUTFIT_STAGE: Record<string, string> = {
  'acc-bow': '/src/assets/images/stage_iskierka_bow.png',
  'acc-flowers': '/src/assets/images/stage_iskierka_flowers.png',
  'acc-cap': '/src/assets/images/stage_iskierka_cap.png',
  'acc-crown': '/src/assets/images/stage_iskierka_crown.png',
  'acc-winter-hat': '/src/assets/images/stage_iskierka_winter_hat.png',
  'acc-glasses': '/src/assets/images/stage_iskierka_glasses.png',
  'acc-scarf': '/src/assets/images/stage_iskierka_scarf.png',
  'acc-wings': '/src/assets/images/stage_iskierka_wings.png',
  'acc-cape': '/src/assets/images/stage_iskierka_cape.png',
};

// Full cohesive boutique-scene illustrations (4:3) rendered edge-to-edge without any cutout overlay
export const ISKIERKA_OUTFIT_SCENE: Record<string, string> = {
  'acc-cap': '/assets/aistudio/Gemini_Generated_Image_ij4b0vij4b0vij4b_ba41ed95.jpg',
};

export const WARDROBE_ART_MAP: Record<string, ItemArtEntry> = {
  'acc-bow': {
    src: '/src/assets/images/acc_pink_bow_1795434301056.jpg',
    altPl: 'Różowa satynowa kokarda z perełkami',
  },
  'acc-cap': {
    src: '/src/assets/images/acc_explorer_cap_1795434302126.jpg',
    altPl: 'Zielona czapka odkrywczyni ze stokrotką i biedronką',
  },
  'acc-crown': {
    src: '/src/assets/images/acc_golden_crown_1795434301572.jpg',
    altPl: 'Złota korona księżniczki z klejnotami',
  },
  'acc-flowers': {
    src: '/src/assets/images/acc_flower_wreath_1795434301268.jpg',
    altPl: 'Wianek leśnej wróżki ze stokrotek i wstążek',
  },
  'acc-winter-hat': {
    src: '/src/assets/images/item_winter_hat_1795433266838.jpg',
    altPl: 'Zimowa lawendowa czapka z puszystym złotym pomponem ze Skrzyni Skarbów',
  },
  'acc-glasses': {
    src: '/src/assets/images/acc_star_glasses_1795434301299.jpg',
    altPl: 'Bajkowe okulary gwiazdki w kolorze różowego złota',
  },
  'acc-scarf': {
    src: '/src/assets/images/acc_winter_scarf_1795434301381.jpg',
    altPl: 'Ciepły niebieski szalik w śnieżynki z frędzlami',
    zoomClass: 'scale-[1.15]',
  },
  'acc-cape': {
    src: '/src/assets/images/acc_hero_cape_1795434301668.jpg',
    altPl: 'Aksamitna peleryna bohaterki ze złotą gwiazdką',
  },
  'acc-wings': {
    src: '/src/assets/images/acc_butterfly_wings_1795434301983.jpg',
    altPl: 'Pastelowe skrzydełka motyla wróżki',
  },
};

export const ITEM_ART_MAP: Partial<Record<IllustrationKey, ItemArtEntry>> = {
  // Clothes & Bedtime (12 bespoke watercolor illustrations)
  coat: {
    src: '/src/assets/images/item_red_coat_1795433327899.jpg',
    altPl: 'Czerwony płaszcz',
  },
  trousers: {
    src: '/src/assets/images/item_blue_trousers_1795433267221.jpg',
    altPl: 'Niebieskie spodnie',
  },
  tshirt: {
    src: '/src/assets/images/item_green_tshirt_1795433327647.jpg',
    altPl: 'Zielona koszulka',
  },
  jumper: {
    src: '/src/assets/images/item_yellow_jumper_1795433268419.jpg',
    altPl: 'Żółty sweter',
    zoomClass: 'scale-[1.14]',
  },
  skirt: {
    src: '/src/assets/images/item_pink_skirt_1795433266456.jpg',
    altPl: 'Różowa spódniczka',
  },
  shorts: {
    src: '/src/assets/images/item_purple_shorts_1795433328197.jpg',
    altPl: 'Fioletowe spodenki',
  },
  shoes: {
    src: '/src/assets/images/item_amber_shoes_1795433327518.jpg',
    altPl: 'Buty',
  },
  cap: {
    src: '/src/assets/images/item_green_cap_1795433266743.jpg',
    altPl: 'Zielona czapka z daszkiem',
  },
  hat: {
    src: '/src/assets/images/item_winter_hat_1795433266838.jpg',
    altPl: 'Ciepła czapka zimowa',
  },
  pyjamas: {
    src: '/src/assets/images/item_star_pyjamas_1795433267155.jpg',
    altPl: 'Piżama w gwiazdki',
  },
  slippers: {
    src: '/src/assets/images/item_bunny_slippers_1795433327266.jpg',
    altPl: 'Kapcie z uszkami króliczka',
  },
  'dressing-gown': {
    src: '/src/assets/images/item_dressing_gown_1795433267896.jpg',
    altPl: 'Niebieski szlafrok',
  },

  // Seasons (4 bespoke watercolor vignettes)
  spring: {
    src: '/src/assets/images/season_spring_tree_1795433267610.jpg',
    altPl: 'Wiosna',
  },
  summer: {
    src: '/src/assets/images/season_summer_tree_1795433329043.jpg',
    altPl: 'Lato',
  },
  autumn: {
    src: '/src/assets/images/season_autumn_tree_1795433327075.jpg',
    altPl: 'Jesień',
  },
  winter: {
    src: '/src/assets/images/season_winter_tree_1795433266856.jpg',
    altPl: 'Zima',
  },

  // Weather & Temperature
  sunny: {
    src: '/src/assets/images/weather_sunny_sun_1795433266326.jpg',
    altPl: 'Słonecznie',
  },
  hot: {
    src: '/src/assets/images/weather_sunny_sun_1795433266326.jpg',
    altPl: 'Gorąco',
  },
  cloudy: {
    src: '/src/assets/images/weather_fluffy_clouds_1795433266705.jpg',
    altPl: 'Pochmurno',
  },
  rainy: {
    src: '/src/assets/images/weather_rainy_cloud_1795433267677.jpg',
    altPl: 'Deszczowo',
  },
  snowy: {
    src: '/src/assets/images/weather_snowy_flakes_1795433267352.jpg',
    altPl: 'Śnieżnie',
  },
  cold: {
    src: '/src/assets/images/weather_snowy_flakes_1795433267352.jpg',
    altPl: 'Zimno',
  },

  // Summer vs Winter Sorting Vignettes
  'ice-cream': {
    src: '/src/assets/images/sort_ice_cream_1795433266451.jpg',
    altPl: 'Lody',
  },
  soup: {
    src: '/src/assets/images/sort_warm_soup_1795433328094.jpg',
    altPl: 'Ciepła zupa',
  },
  park: {
    src: '/src/assets/images/sort_sunny_park_1795433266614.jpg',
    altPl: 'Park',
  },
  house: {
    src: '/src/assets/images/sort_cozy_house_1795433328099.jpg',
    altPl: 'Ciepły domek',
  },
};
