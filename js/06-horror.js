'use strict';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const defaults = {
  storyTitle: '', story: '', storySize: 22,
  buttonText: '이 미스터리를 조사한다', characterName: '',
  logs: '(중요한 메시지는 이곳에 표시됩니다)\n[13:31:20]: 새로운 주문을 배웠다: 미다스의 손길!\n[13:31:20]: 새로운 상태를 얻었다: 도망자',
  animation: 'still', blink: true, duration: 6, gifWidth: 1338
};
const config = {...defaults};
const stats = Object.fromEntries(['stamina', 'reason', 'STR', 'DEX', 'PER', 'KNW', 'CHR', 'FND'].map(key => [key, '']));
const imageAreas = {scene: {x: 588, y: 44, w: 430, h: 412}, portrait: {x: 1024, y: 436, w: 312, h: 191}};
const pictures = Object.fromEntries(Object.keys(imageAreas).map(key => [key, {image: null, rendered: null, zoom: 1, x: .5, y: .5}]));
let frame, dark = '#061011', light = '#3c7885', palette;
let ready = false, playing = false, busy = false, cancelled = false, time = 0, lastTick = 0;

function notify(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 열지 못했어요. PNG, JPG 또는 WEBP 파일을 선택해주세요.'));
    image.src = src;
  });
}

function font(size, color = light, align = 'left') {
  ctx.font = `${size}px Pixel, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
}

function wrapText(text, width) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (line && ctx.measureText(line + character).width > width) {
        lines.push(line); line = '';
      }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}

function fitLine(text, width) {
  if (ctx.measureText(text).width <= width) return text;
  let chars = Array.from(text);
  while (chars.length && ctx.measureText(chars.join('') + '…').width > width) chars.pop();
  return chars.join('') + '…';
}

function drawStory(t) {
  const size = config.storySize, lineHeight = size + 6;
  font(size, light, 'center');
  const title = config.storyTitle ? wrapText(config.storyTitle, 480) : [];
  const body = config.story ? wrapText(config.story, 480) : [];
  const gap = title.length && body.length ? lineHeight : 0;
  const height = (title.length + body.length) * lineHeight + gap;
  let y = Math.max(188, 337 - height / 2);
  let remaining = config.animation === 'typewriter' ? Math.floor(t / (config.duration * .65) * Array.from(config.storyTitle + config.story).length) : Infinity;
  ctx.save(); ctx.beginPath(); ctx.rect(40, 176, 502, 304); ctx.clip();
  for (const [index, lines] of [title, body].entries()) {
    if (index) y += gap;
    for (const line of lines) {
      const characters = Array.from(line);
      const visible = characters.slice(0, Math.max(0, remaining)).join('');
      ctx.fillText(visible, 289, Math.round(y));
      remaining -= characters.length;
      y += lineHeight;
    }
  }
  ctx.restore();
}

function drawPortrait() {
  const area = imageAreas.portrait, hasImage = !!pictures.portrait.rendered;
  ctx.fillStyle = light;
  ctx.fillRect(1023, 435, 315, 194);
  if (hasImage) ctx.drawImage(pictures.portrait.rendered, area.x, area.y, area.w, area.h);
  ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.strokeRect(1024, 436, 312, 191);
  // Keep the stats legible on both bright and dark uploaded portraits.
  if (hasImage) {
    ctx.globalAlpha = .9; ctx.fillStyle = dark;
    ctx.fillRect(1025, 438, 85, 120); ctx.fillRect(1250, 438, 85, 120);
    ctx.globalAlpha = 1;
  }
  const ink = hasImage ? light : dark;
  font(28, ink); ctx.fillText(stats.stamina, 1030, 440);
  font(28, ink, 'right'); ctx.fillText(stats.reason, 1330, 440);
  font(18, ink); ctx.fillText('체력', 1030, 469);
  font(18, ink, 'right'); ctx.fillText('이성', 1330, 469);
  ctx.fillStyle = ink; ctx.fillRect(1028, 489, 76, 2); ctx.fillRect(1255, 489, 77, 2);
  ['STR', 'DEX', 'PER'].forEach((key, i) => {font(18, ink); ctx.fillText(`${key}:${stats[key]}`, 1030, 495 + i * 20);});
  ['KNW', 'CHR', 'FND'].forEach((key, i) => {font(18, ink, 'right'); ctx.fillText(`${stats[key]}:${key}`, 1330, 495 + i * 20);});
}

function draw(t = time) {
  if (!ready) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame, 0, 0, W, H);
  const area = imageAreas.scene;
  if (pictures.scene.rendered) ctx.drawImage(pictures.scene.rendered, area.x, area.y, area.w, area.h);
  drawStory(t);
  ctx.fillStyle = dark; ctx.fillRect(1095, 43, 238, 30);
  font(22, light, 'center'); ctx.fillText(fitLine(config.characterName, 228), 1214, 48);
  drawPortrait();
  ctx.fillStyle = light; ctx.fillRect(588, 505, 408, 66);
  font(24, dark, 'center');
  const buttonLabel = fitLine(config.buttonText, 394);
  ctx.fillText(buttonLabel, 792, 526); ctx.fillText(buttonLabel, 793, 526);
  ctx.fillStyle = dark; ctx.fillRect(2, 612, 1017, 100);
  font(22, light, 'center');
  const logs = config.logs.split('\n').slice(0, 3);
  logs.forEach((line, i) => {
    const text = fitLine(line, 970), y = 632 + i * 25;
    ctx.fillText(text, 510, y);
    if (i === logs.length - 1) ctx.fillText(text, 511, y);
  });
  if (config.blink && t % 1 >= .6) {
    ctx.fillStyle = light; ctx.fillRect(519, 499, 23, 21);
  }
}

function renderPicture(key) {
  const picture = pictures[key];
  if (!picture.image) {picture.rendered = null; return;}
  const area = imageAreas[key];
  const result = document.createElement('canvas');
  result.width = Math.ceil(area.w / 2); result.height = Math.ceil(area.h / 2);
  const c = result.getContext('2d', {willReadFrequently: true});
  const scale = Math.max(result.width / picture.image.width, result.height / picture.image.height) * picture.zoom;
  const width = picture.image.width * scale, height = picture.image.height * scale;
  c.fillStyle = dark; c.fillRect(0, 0, result.width, result.height);
  c.drawImage(picture.image, (result.width - width) * picture.x, (result.height - height) * picture.y, width, height);
  const pixels = c.getImageData(0, 0, result.width, result.height);
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < result.height; y++) for (let x = 0; x < result.width; x++) {
    const offset = (y * result.width + x) * 4, p = pixels.data;
    const luminance = p[offset] * .2126 + p[offset + 1] * .7152 + p[offset + 2] * .0722;
    const color = palette[luminance > (bayer[(y % 4) * 4 + x % 4] + .5) * 16 ? 1 : 0];
    p[offset] = color[0]; p[offset + 1] = color[1]; p[offset + 2] = color[2]; p[offset + 3] = 255;
  }
  c.putImageData(pixels, 0, 0); picture.rendered = result;
}

function syncTime() {
  $('scrub').max = config.duration; $('scrub').value = time;
  const stamp = n => `00:${String(Math.floor(n)).padStart(2, '0')}`;
  $('currentTime').value = stamp(time); $('totalTime').textContent = stamp(config.duration);
  $('play').textContent = playing ? 'Ⅱ' : '▶';
  $('play').setAttribute('aria-label', playing ? '일시 정지' : '재생');
}

function syncForm() {
  document.querySelectorAll('[data-config]').forEach(input => {
    if (input.type === 'checkbox') input.checked = config[input.dataset.config];
    else input.value = config[input.dataset.config];
  });
  document.querySelectorAll('[data-stat]').forEach(input => {input.value = stats[input.dataset.stat];});
  $('storySizeValue').value = `${config.storySize} px`;
  syncTime();
}

$('settings').addEventListener('submit', event => event.preventDefault());
$('settings').addEventListener('input', event => {
  const input = event.target;
  if (input.dataset.config) {
    config[input.dataset.config] = input.type === 'checkbox' ? input.checked : input.hasAttribute('data-number') ? Number(input.value) : input.value;
    time = Math.min(time, config.duration); $('storySizeValue').value = `${config.storySize} px`;
  } else if (input.dataset.stat) {
    const value = input.value === '' ? '' : String(Math.max(0, Math.min(99, Math.round(Number(input.value) || 0))));
    stats[input.dataset.stat] = value; input.value = value;
  } else if (input.dataset.image) {
    pictures[input.dataset.image][input.dataset.property] = Number(input.value);
    renderPicture(input.dataset.image);
  } else return;
  draw(); syncTime();
  font(config.storySize);
  const lineCount = wrapText(config.storyTitle, 480).length + wrapText(config.story, 480).length;
  if (input.dataset.config?.startsWith('story') && lineCount * (config.storySize + 6) > 290) notify('본문이 길면 창 아래에서 잘릴 수 있어요. 문장을 줄이거나 글자 크기를 낮춰주세요.');
  else notify('변경 사항이 미리보기에 반영됐어요.');
});

function clearPicture(key) {
  Object.assign(pictures[key], {image: null, rendered: null, zoom: 1, x: .5, y: .5});
  document.querySelectorAll(`[data-image="${key}"]`).forEach(input => {input.value = input.dataset.property === 'zoom' ? 1 : .5;});
  document.querySelector(`[data-tools="${key}"]`).hidden = true;
  $(`${key}Upload`).value = '';
  $(`${key}FileName`).textContent = key === 'scene' ? '이미지 선택' : '인물 이미지 선택';
}

document.querySelectorAll('[data-upload]').forEach(input => input.addEventListener('change', async () => {
  const file = input.files[0]; if (!file) return;
  const key = input.dataset.upload;
  let url;
  lock(true); notify('이미지를 픽셀로 변환하는 중…');
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG, JPG 또는 WEBP 이미지를 선택해주세요.');
    if (file.size > 20_000_000) throw new Error('이미지는 20 MB 이하로 선택해주세요.');
    url = URL.createObjectURL(file);
    const image = await loadImage(url);
    if (image.width * image.height > 40_000_000) throw new Error('이미지가 너무 커요. 4천만 픽셀 이하로 줄여주세요.');
    clearPicture(key); pictures[key].image = image; renderPicture(key);
    $(`${key}FileName`).textContent = file.name;
    document.querySelector(`[data-tools="${key}"]`).hidden = false;
    notify('이미지를 넣었어요. 확대와 위치를 조정할 수 있어요.');
  } catch (error) {input.value = ''; notify(error.message, true);}
  finally {if (url) URL.revokeObjectURL(url); lock(false); draw();}
}));
document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {clearPicture(button.dataset.remove); draw(); notify('이미지를 지웠어요.');}));

$('regionsToggle').onclick = () => {
  const shown = $('hotspots').classList.toggle('show');
  $('regionsToggle').setAttribute('aria-pressed', String(shown));
};
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
  const section = $(button.dataset.section); section.open = true;
  section.scrollIntoView({behavior: 'auto', block: 'nearest'});
  $(button.dataset.focus).focus({preventScroll: true});
}));
$('fullscreen').onclick = async () => {
  try {if (document.fullscreenElement) await document.exitFullscreen(); else await $('previewShell').requestFullscreen();}
  catch {notify('이 브라우저에서는 전체 화면을 사용할 수 없어요.', true);}
};
$('play').onclick = () => {playing = !playing; if (time >= config.duration) time = 0; lastTick = 0; syncTime();};
$('scrub').oninput = () => {playing = false; time = Number($('scrub').value); syncTime(); draw();};
$('reset').onclick = () => {
  if (!confirm('문구, 이미지, 스탯을 처음 상태로 되돌릴까요?')) return;
  Object.assign(config, defaults); Object.keys(stats).forEach(key => {stats[key] = '';});
  Object.keys(pictures).forEach(clearPicture); playing = false; time = 0; syncForm(); draw(); notify('처음 상태로 되돌렸어요.');
};

function lock(value) {
  busy = value;
  $('settingsFields').disabled = value;
  ['png', 'gif', 'video', 'play', 'scrub', 'reset'].forEach(id => {$(id).disabled = value;});
  document.querySelectorAll('[data-section]').forEach(button => {button.disabled = value;});
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const breathe = () => new Promise(resolve => setTimeout(resolve, 0));
$('cancel').onclick = () => {cancelled = true; notify('저장을 취소하는 중…');};

async function exportScene(job) {
  const before = {time, playing}; cancelled = false; playing = false; lock(true); syncTime();
  $('progress').value = 0; $('progress').hidden = false; $('cancel').hidden = false;
  try {await job();}
  catch (error) {notify(error.message, !cancelled);}
  finally {
    time = before.time; playing = before.playing; lastTick = 0; lock(false);
    $('progress').hidden = true; $('cancel').hidden = true; syncTime(); draw();
  }
}

$('png').onclick = () => exportScene(async () => {
  draw();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG 저장에 실패했어요. 다시 시도해주세요.');
  if (cancelled) throw new Error('저장을 취소했어요.');
  download(blob, 'world-of-horror.png'); notify('PNG 저장 완료 · 1338 × 714');
});

$('gif').onclick = () => exportScene(async () => {
  let width = config.gifWidth, frameMs = 100, colors = 256, previousSize;
  while (true) {
    const height = Math.round(width * H / W), small = document.createElement('canvas');
    small.width = width; small.height = height;
    const c = small.getContext('2d', {willReadFrequently: true}); c.imageSmoothingEnabled = false;
    const encoder = GifCodec.GIFEncoder(), count = Math.ceil(config.duration * 1000 / frameMs);
    for (let i = 0; i < count; i++) {
      if (cancelled) throw new Error('저장을 취소했어요.');
      draw(i * frameMs / 1000); c.drawImage(canvas, 0, 0, width, height);
      const rgba = c.getImageData(0, 0, width, height).data;
      const framePalette = GifCodec.quantize(rgba, colors), indices = GifCodec.applyPalette(rgba, framePalette);
      const delay = Math.min(frameMs, config.duration * 1000 - i * frameMs);
      encoder.writeFrame(indices, width, height, {palette: framePalette, delay, repeat: 0});
      $('progress').value = (i + 1) / count;
      if (i % 3 === 0) {notify(`GIF 만드는 중 · ${Math.round((i + 1) / count * 100)}%`); await breathe();}
    }
    encoder.finish();
    const blob = new Blob([encoder.bytes()], {type: 'image/gif'});
    if (cancelled) throw new Error('저장을 취소했어요.');
    $('cancel').hidden = true;
    const action = await reviewGif(blob, {width, height, frameMs, colors, previousSize});
    if (action === 'save') {download(blob, 'world-of-horror.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
    if (action === 'cancel') {notify('GIF 저장을 닫았어요.'); break;}
    previousSize = blob.size; colors = 192; frameMs = frameMs < 100 ? 100 : 125;
    if (action === 'small') width = Math.max(320, Math.round(width * .85));
    $('cancel').hidden = false;
  }
});

$('video').onclick = () => exportScene(async () => {
  const type = window.MediaRecorder && ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
  if (!type || !canvas.captureStream) throw new Error('영상 저장은 Chrome 또는 Edge에서 이용해주세요.');
  let stream, recorder;
  try {
    draw(0); stream = canvas.captureStream(30);
    recorder = new MediaRecorder(stream, {mimeType: type, videoBitsPerSecond: 6_000_000});
    const chunks = [];
    let recorderError;
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => {if (event.data.size) chunks.push(event.data);};
      recorder.onstop = resolve;
      recorder.onerror = event => {recorderError = event.error || new Error('영상 인코딩 오류'); reject(recorderError);};
    });
    done.catch(() => {}); recorder.start();
    notify('영상 저장 중 · 완료될 때까지 이 탭을 열어두세요.');
    const start = performance.now();
    while (!cancelled && !recorderError) {
      const t = Math.min((performance.now() - start) / 1000, config.duration);
      draw(t); $('progress').value = t / config.duration;
      if (t >= config.duration) break;
      await new Promise(resolve => setTimeout(resolve, 1000 / 30));
    }
    if (recorder.state !== 'inactive') recorder.stop();
    await done;
    if (cancelled) throw new Error('저장을 취소했어요.');
    const extension = type.startsWith('video/mp4') ? 'mp4' : 'webm';
    const blob = new Blob(chunks, {type: recorder.mimeType});
    if (!blob.size) throw new Error('영상이 비어 있어요. 브라우저 창을 열어둔 상태에서 다시 시도해주세요.');
    download(blob, `world-of-horror.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});

function tick(stamp) {
  if (playing && !busy && ready) {
    if (lastTick) time = (time + (stamp - lastTick) / 1000) % config.duration;
    draw(); syncTime();
  }
  lastTick = stamp; requestAnimationFrame(tick);
}

(async () => {
  lock(true); syncForm();
  try {
    const assets = window.HorrorAssets;
    [frame] = await Promise.all([loadImage(assets.frame), document.fonts.load('22px Pixel', '한글 ABC')]);
    await document.fonts.ready;
    ctx.drawImage(frame, 0, 0);
    const darkPixel = Array.from(ctx.getImageData(700, 200, 1, 1).data).slice(0, 3);
    const lightPixel = Array.from(ctx.getImageData(600, 470, 1, 1).data).slice(0, 3);
    palette = [darkPixel, lightPixel]; dark = `rgb(${darkPixel.join(',')})`; light = `rgb(${lightPixel.join(',')})`;
    ready = true; draw(); $('scene').dataset.ready = 'true';
    notify('준비됐어요. 장면을 클릭하거나 오른쪽 패널에서 편집하세요.');
    lock(false); requestAnimationFrame(tick);
  } catch (error) {notify(`시작하지 못했어요: ${error.message}`, true);}
})();

window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=value;lastTick=0;syncTime()}};
