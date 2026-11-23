import { ISKIERKA_OUTFIT_SCENE, ISKIERKA_OUTFIT_STAGE, STORYBOOK_ART } from '../data/storybookArt';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Renders a high-res 1200x900 fairy-tale photo postcard of Iskierka wearing her active accessories
 * in her woodland dressing room with an English caption. Returns a PNG data URL.
 */
export async function renderWardrobePostcard(
  accessoryIds: string[],
  captionEn: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Warm parchment postcard background
  ctx.fillStyle = '#FFF8EC';
  ctx.fillRect(0, 0, 1200, 900);

  // Subtle decorative golden border
  ctx.strokeStyle = '#E8CCA2';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, 26, 26, 1148, 848, 42);
  ctx.stroke();

  // Stage frame (1080x640)
  const stageX = 60;
  const stageY = 56;
  const stageW = 1080;
  const stageH = 630;

  ctx.save();
  drawRoundedRect(ctx, stageX, stageY, stageW, stageH, 34);
  ctx.clip();

  const activeAccessoryId = accessoryIds[0];
  const fullSceneSrc = activeAccessoryId ? ISKIERKA_OUTFIT_SCENE[activeAccessoryId] : undefined;

  if (fullSceneSrc) {
    const sceneImg = await loadImage(fullSceneSrc);
    if (sceneImg) {
      const scale = Math.max(stageW / sceneImg.width, stageH / sceneImg.height);
      const dw = sceneImg.width * scale;
      const dh = sceneImg.height * scale;
      ctx.drawImage(
        sceneImg,
        stageX + (stageW - dw) / 2,
        stageY + (stageH - dh) / 2,
        dw,
        dh
      );
    } else {
      ctx.fillStyle = '#FEF3DC';
      ctx.fillRect(stageX, stageY, stageW, stageH);
    }
  } else {
    const stageImg = await loadImage(STORYBOOK_ART.wardrobeStage);
    if (stageImg) {
      // Cover-fit background
      const scale = Math.max(stageW / stageImg.width, stageH / stageImg.height);
      const dw = stageImg.width * scale;
      const dh = stageImg.height * scale;
      ctx.drawImage(
        stageImg,
        stageX + (stageW - dw) / 2,
        stageY + (stageH - dh) / 2,
        dw,
        dh
      );
    } else {
      ctx.fillStyle = '#FEF3DC';
      ctx.fillRect(stageX, stageY, stageW, stageH);
    }

    // Mascot centered bounding box inside stage (500x500)
    const mSize = 510;
    const mx = stageX + (stageW - mSize) / 2;
    const my = stageY + stageH - mSize + 24;

    // Single unified Iskierka illustration (with her active accessory naturally painted in)
    const mascotSrc =
      (activeAccessoryId && ISKIERKA_OUTFIT_STAGE[activeAccessoryId]) ||
      STORYBOOK_ART.mascotCutout;
    const mascotImg = await loadImage(mascotSrc);
    if (mascotImg) {
      const drawS = mSize * 1.06;
      ctx.drawImage(mascotImg, mx - (drawS - mSize) / 2, my - (drawS - mSize) / 2, drawS, drawS);
    }
  }

  ctx.restore();

  // Stage frame outline
  ctx.strokeStyle = '#E8CCA2';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, stageX, stageY, stageW, stageH, 34);
  ctx.stroke();

  // Bottom typography caption
  ctx.fillStyle = '#3E2F2B';
  ctx.font = '700 40px Fredoka, Nunito, ui-rounded, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`„${captionEn}”`, 600, 766, 1080);

  ctx.fillStyle = '#8A7465';
  ctx.font = '600 22px Nunito, ui-rounded, sans-serif';
  ctx.fillText('English with Iskierka · Pocztówka z Bajkowego Butiku', 600, 822);

  return canvas.toDataURL('image/png');
}

/**
 * Renders a printable/savable "Dyplom Odkrywczyni" PNG when opening the Treasure Chest.
 */
export async function renderTreasureDiploma(starsTotal: number, moduleTitle: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 1200, 850);
  grad.addColorStop(0, '#FFF9EE');
  grad.addColorStop(1, '#FEF0D4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 850);

  ctx.strokeStyle = '#E2B466';
  ctx.lineWidth = 12;
  drawRoundedRect(ctx, 32, 32, 1136, 786, 44);
  ctx.stroke();

  ctx.strokeStyle = '#F3DFA2';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 52, 52, 1096, 746, 32);
  ctx.stroke();

  const celebImg = await loadImage(STORYBOOK_ART.mascotCelebratingCutout);
  if (celebImg) {
    ctx.drawImage(celebImg, 470, 84, 260, 260);
  }

  ctx.fillStyle = '#B86E14';
  ctx.font = '700 24px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ENGLISH WITH ISKIERKA · SKRZYNIA SKARBÓW', 600, 390);

  ctx.fillStyle = '#3E2F2B';
  ctx.font = '700 58px Fredoka, Nunito, sans-serif';
  ctx.fillText('Dyplom Mistrzyni Angielskiego!', 600, 466);

  ctx.fillStyle = '#6E5B4F';
  ctx.font = '600 28px Nunito, sans-serif';
  ctx.fillText(`Za otwarcie Skrzyni Skarbów w module: ${moduleTitle}`, 600, 540, 1020);
  ctx.fillText(`Zebrane gwiazdki: ${starsTotal} ⭐ · Odblokowano Czapkę Skarbu!`, 600, 592);

  ctx.fillStyle = '#4178BF';
  ctx.font = '700 32px Fredoka, Nunito, sans-serif';
  ctx.fillText('„You are an English superstar!”', 600, 686);

  ctx.fillStyle = '#9A8577';
  ctx.font = '600 20px Nunito, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('pl-PL'), 600, 756);

  return canvas.toDataURL('image/png');
}

export function triggerPngDownload(dataUrl: string, filename: string): void {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
