'use strict';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const defaults = {
  mysteryName: '미스터리', mysteryDescription: '', storyTitle: '', story: '', storySize: 22,
  buttonText: '이 미스터리를 조사한다', characterName: '',
  logs: '(중요한 메시지는 이곳에 표시됩니다)\n[13:31:20]: 새로운 주문을 배웠다: 미다스의 손길!\n[13:31:20]: 새로운 상태를 얻었다: 도망자',
  animation: 'still', blink: true, duration: 12, gifWidth: 1448,
  infoTitle: '피부 박리', infoKind: '흡수', infoLevel: '1', infoCount: '0',
  infoBody: '', ritual: '활성화된 의식 없음'
};
const config = {...defaults};
const stats = Object.fromEntries(['stamina', 'reason', 'STR', 'DEX', 'PER', 'KNW', 'CHR', 'FND'].map(key => [key, '']));
const imageAreas = {scene: {x: 657, y: 65, w: 410, h: 604}, portrait: {x: 1083, y: 638, w: 357, h: 280}, selection: {x: 26, y: 212, w: 1033, h: 565}};
const pictures = Object.fromEntries(Object.keys(imageAreas).map(key => [key, {image: null, rendered: null, zoom: 1, x: .5, y: .5}]));
const emptyPicture = () => ({image:null, rendered:null, zoom:1, x:.5, y:.5});
const newPage = () => ({title:'', story:'', picture:emptyPicture()});
const cards = [{x:287,y:365,w:85,h:119},{x:786,y:345,w:90,h:125},{x:518,y:426,w:108,h:70},{x:368,y:505,w:81,h:125},{x:550,y:548,w:89,h:128},{x:716,y:512,w:100,h:126}];
const mysteryIndex = 2;
let editorPage = 0, hoverCard = -1, hoverNext = false, hoverAction = '';
let nextClickUntil = 0;
const nextButton = {x:574, y:720, w:44, h:48};
const actionButtons = {back:{x:29,y:813,w:147,h:53}, investigate:{x:654,y:726,w:397,h:122,inset:0}};
let pages = [newPage(), newPage()];
pictures.scene = pages[0].picture;
let frame, selectionFrame, dark = '#000000', light = '#ffffff', palette;
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

function drawStory(t, page) {
  const size = config.storySize, lineHeight = size + 6;
  font(size, light, 'center');
  const title = page.title ? wrapText(page.title, 480) : [];
  const body = page.story ? wrapText(page.story, 480) : [];
  const gap = title.length && body.length ? lineHeight : 0;
  const height = (title.length + body.length) * lineHeight + gap;
  let y = Math.max(188, 337 - height / 2);
  let remaining = config.animation === 'typewriter' ? Math.floor(t / (config.duration * .5 / pages.length * .65) * Array.from(page.title + page.story).length) : Infinity;
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

function draw(t = time) {
  if (!ready) return;
  savePage();
  drawSequence(t);
}

function savePage() {
  Object.assign(pages[editorPage], {title:config.storyTitle, story:config.story, picture:pictures.scene});
}

function selectPage(index, preview = true) {
  editorPage = index;
  config.storyTitle = pages[index].title; config.story = pages[index].story;
  pictures.scene = pages[index].picture;
  $('pageSelect').replaceChildren(...pages.map((_,i)=>new Option(`${i+1} 페이지`,i,false,i===index)));
  $('removePage').disabled = pages.length === 1;
  $('sceneUpload').value = '';
  $('sceneFileName').textContent = pictures.scene.image ? `${index+1} 페이지 이미지` : '이미지 선택';
  document.querySelector('[data-tools="scene"]').hidden = !pictures.scene.image;
  document.querySelectorAll('[data-image="scene"]').forEach(input=>{input.value=pictures.scene[input.dataset.property];});
  if (preview) {playing=false; time=config.duration*(.3 + .5*(index+.45)/pages.length);}
  syncForm(); draw();
}

function pageAt(t) {
  return Math.max(0,Math.min(pages.length-1,Math.floor((t/config.duration-.3)/(.5/pages.length))));
}

function sequenceStage(t) {
  const phase = t / config.duration;
  return phase < .3 || phase >= .92 ? 'selection' : 'detail';
}

function drawSequence(t) {
  const detail = sequenceStage(t) === 'detail';
  $('hotspots').hidden = !detail;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(detail ? frame : selectionFrame, 0, 0, W, H);
  ctx.drawImage(selectionFrame, 0, 0, W, 60, 0, 0, W, 60);
  if (!detail && pictures.selection.rendered) {
    const a = imageAreas.selection; ctx.drawImage(pictures.selection.rendered, a.x, a.y, a.w, a.h);
  }
  const pageIndex = pageAt(t), page = pages[pageIndex];
  if (detail) {
    const a = imageAreas.scene;
    if (page.picture.rendered) ctx.drawImage(page.picture.rendered, a.x, a.y, a.w, a.h);
    ctx.save(); ctx.translate(0, 20); ctx.scale(1.12, 1.48);
    drawStory(Math.max(0, t - config.duration * (.3 + .5*pageIndex/pages.length)),page); ctx.restore();
    ctx.fillStyle = light; ctx.fillRect(1078, 65, 283, 38); ctx.fillRect(1078, 111, 283, 32);
    font(28, dark, 'center'); ctx.fillText(fitLine(config.infoTitle, 275), 1218, 70);
    ctx.fillText(fitLine(config.infoKind, 275), 1218, 111);
    ctx.fillStyle = light; ctx.fillRect(1370, 66, 69, 34); ctx.fillRect(1370, 111, 69, 32);
    font(26, dark, 'right'); ctx.fillText(config.infoLevel, 1436, 72); ctx.fillText(config.infoCount, 1436, 114);
    ctx.fillStyle = light; ctx.fillRect(1079, 151, 280, 160);
    font(21, dark); wrapText(config.infoBody, 264).slice(0, 6).forEach((line, i) => ctx.fillText(line, 1086, 158 + i * 24));
    ctx.fillStyle = light; ctx.fillRect(1074, 318, 374, 1);
    ctx.fillStyle = dark; ctx.fillRect(1074, 319, 374, 101);
    ctx.drawImage(frame, 1074, 319, 374, 31, 1074, 325, 374, 31);
    ctx.fillStyle = light; ctx.fillRect(1075, 357, 372, 62);
    font(23, dark); ctx.fillText(fitLine(config.ritual, 350), 1083, 366);
  }
  const a = imageAreas.portrait;
  ctx.fillStyle = light; ctx.fillRect(a.x, a.y, a.w, a.h);
  if (pictures.portrait.rendered) ctx.drawImage(pictures.portrait.rendered, a.x, a.y, a.w, a.h);
  const ink = pictures.portrait.rendered ? light : dark;
  function portraitText(text, x, y) {
    if (pictures.portrait.rendered) {
      ctx.save(); ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y); ctx.restore();
    }
    ctx.fillText(text, x, y);
  }
  font(27, ink); portraitText(`체력 ${stats.stamina}`, 1090, 682);
  font(27, ink, 'right'); portraitText(`${stats.reason} 이성`, 1434, 682);
  ['STR', 'DEX', 'PER'].forEach((key, i) => {font(25, ink); portraitText(`${key}:${stats[key]}`, 1090, 722 + i * 30);});
  ['KNW', 'CHR', 'FND'].forEach((key, i) => {font(25, ink, 'right'); portraitText(`${stats[key]}:${key}`, 1434, 722 + i * 30);});
  if (config.characterName) {font(23, ink, 'center'); portraitText(fitLine(config.characterName, 330), 1261, 861);}
  if (detail) {
    ctx.fillStyle = light; ctx.fillRect(654, 726, 397, 122);
    font(32, dark, 'center'); ctx.fillText(fitLine(config.buttonText, 382), 852, 774);
    ctx.fillStyle = light; ctx.fillRect(25, 809, 155, 61);
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.strokeRect(29, 813, 147, 53);
    font(24, dark, 'center'); ctx.fillText('← 뒤로가기', 102, 827);
    drawNextButton();
    const clickedAt = config.duration * (.3 + .5 * pageIndex / pages.length);
    if ((pageIndex > 0 && t >= clickedAt && t-clickedAt < .12) || (!playing && !busy && performance.now()<nextClickUntil)) drawNextDots();
    font(18, light, 'right'); ctx.fillText(`${pageIndex+1} / ${pages.length}`,564,742);
  }
  ctx.fillStyle = dark; ctx.fillRect(2, 909, 1067, 175);
  if (detail) {
    font(28, light, 'center'); config.logs.split('\n').slice(0, 3).forEach((line, i) => ctx.fillText(fitLine(line, 1040), 534, 928 + i * 38));
  }
  if (!detail && hoverCard >= 0 && !playing && !busy) drawCardHover(hoverCard);
  if (detail && hoverAction && !playing && !busy) drawButtonTone(actionButtons[hoverAction]);
  drawPlaybackPointer(t);
  canvas.dataset.stage = detail ? 'detail' : 'selection';
  canvas.dataset.page = String(pageIndex+1);
}

function drawNextButton() {
  const b = nextButton;
  ctx.fillStyle = dark; ctx.fillRect(b.x-1,b.y-1,b.w+2,b.h+2);
  ctx.fillStyle = light; ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle = dark; ctx.fillRect(b.x+2,b.y+2,b.w-4,b.h-4);
  ctx.fillStyle = light; ctx.fillRect(b.x+4,b.y+4,b.w-8,b.h-8);
  ctx.fillStyle = dark;
  ctx.beginPath();ctx.moveTo(b.x+12,b.y+12);ctx.lineTo(b.x+12,b.y+b.h-12);ctx.lineTo(b.x+b.w-10,b.y+b.h/2);ctx.closePath();ctx.fill();
}

function drawNextDots() {
  drawButtonTone(nextButton);
}

function drawButtonTone(b) {
  const inset=b.inset ?? 4;
  ctx.save();ctx.globalCompositeOperation='difference';ctx.fillStyle=light;
  for(let y=b.y+inset;y<b.y+b.h-inset;y+=4) {
    for(let x=b.x+inset;x<b.x+b.w-inset;x+=4) ctx.fillRect(x,y,Math.min(2,b.x+b.w-inset-x),Math.min(2,b.y+b.h-inset-y));
  }
  ctx.restore();
}

function drawCardHover(index) {
  const c = cards[index];
  ctx.fillStyle = dark;
  for (let y=c.y+4;y<c.y+c.h-4;y+=2) {
    for (let x=c.x+4;x<c.x+c.w-4;x+=2) ctx.fillRect(x,y,1,1);
  }
  ctx.fillStyle = dark; ctx.fillRect(641,786,418,91);
  ctx.strokeStyle = light; ctx.lineWidth = 2; ctx.strokeRect(645,790,410,83);
  const title=index === mysteryIndex ? config.mysteryName : '? ? ?';
  font(19,light,'center'); ctx.fillText(fitLine(title,395),850,794);
  ctx.fillStyle = light; ctx.fillRect(649,817,402,52);
  font(22,dark,'center');
  const lines=wrapText(index === mysteryIndex ? config.mysteryDescription : '아직 확인되지 않은 미스터리',382).slice(0,2);
  lines.forEach((line,i)=>ctx.fillText(fitLine(line,382),850,820+(2-lines.length)*11+i*23));
}

function drawPlaybackPointer(t) {
  const phase=t/config.duration;
  const center=i=>({x:cards[i].x+cards[i].w*.55,y:cards[i].y+cards[i].h*.55});
  const stops=[{at:0,x:490,y:680},{at:.04,...center(3)},{at:.10,...center(3)},
    {at:.14,...center(5)},{at:.20,...center(5)},{at:.24,...center(mysteryIndex)},{at:.30,...center(mysteryIndex)}];
  stops.push({at:.3+Math.min(.035,.25/pages.length),x:593,y:749},{at:.80,x:593,y:749});
  stops.push({at:.83,x:848,y:785},{at:.85,x:848,y:785},
    {at:.87,x:736,y:761},{at:.89,x:102,y:841},{at:.92,x:102,y:841},{at:1,x:490,y:680});
  let from=stops[0],to=stops[stops.length-1];
  for(let i=1;i<stops.length;i++)if(phase<=stops[i].at){from=stops[i-1];to=stops[i];break;}
  const mix=Math.max(0,Math.min(1,(phase-from.at)/(to.at-from.at||1)));
  const x=Math.round((from.x+(to.x-from.x)*mix)/2)*2,y=Math.round((from.y+(to.y-from.y)*mix)/2)*2;
  if(sequenceStage(t)==='selection') {
    const index=cards.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(index>=0&&!(hoverCard>=0&&!playing&&!busy))drawCardHover(index);
  } else {
    for(const [name,b] of Object.entries(actionButtons)) {
      if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h&&!(hoverAction===name&&!playing&&!busy))drawButtonTone(b);
    }
  }
  ctx.save();ctx.translate(x,y);ctx.fillStyle=light;ctx.strokeStyle=dark;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,24);ctx.lineTo(6,18);ctx.lineTo(11,29);
  ctx.lineTo(16,27);ctx.lineTo(11,16);ctx.lineTo(20,16);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}

function navigateScene(back) {
  if(busy||!ready)return;
  savePage();if(!back){selectPage(0);return;}
  playing=false;hoverCard=-1;
  time=config.duration*(back ? .96 : .3+.225/pages.length);syncTime();draw();
}
function canvasPoint(event) {
  const b=canvas.getBoundingClientRect();return {x:(event.clientX-b.left)*W/b.width,y:(event.clientY-b.top)*H/b.height};
}
canvas.addEventListener('mousemove',event=>{
  if(busy||playing)return;
  const {x,y}=canvasPoint(event);
  hoverCard=sequenceStage(time)==='selection'?cards.findIndex(c=>x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h):-1;
  const b=nextButton;
  hoverNext=sequenceStage(time)==='detail'&&pageAt(time)<pages.length-1&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
  hoverAction=sequenceStage(time)==='detail'?(Object.keys(actionButtons).find(key=>{const a=actionButtons[key];return x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h;})||''):'';
  canvas.style.cursor=hoverCard>=0||hoverNext||hoverAction?'pointer':'default';draw();
});
canvas.addEventListener('mouseleave',()=>{hoverCard=-1;hoverNext=false;hoverAction='';if(!busy&&!playing)draw();});
canvas.addEventListener('click',event=>{
  if(busy||!ready)return;
  const {x,y}=canvasPoint(event),detail=sequenceStage(time)==='detail';
  if(detail&&x>=25&&x<=180&&y>=809&&y<=870)navigateScene(true);
  else if(detail&&x>=nextButton.x&&x<=nextButton.x+nextButton.w&&y>=nextButton.y&&y<=nextButton.y+nextButton.h&&pageAt(time)<pages.length-1){savePage();nextClickUntil=performance.now()+120;selectPage(pageAt(time)+1);setTimeout(()=>{if(!playing&&!busy)draw();},130);}
  else if(!detail){const index=cards.findIndex(c=>x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h);if(index===mysteryIndex)navigateScene(false);}
});
$('back').onclick=()=>navigateScene(true);
$('openDetail').onclick=()=>navigateScene(false);
$('pageSelect').onchange=()=>{savePage();selectPage(Number($('pageSelect').value));};
$('addPage').onclick=()=>{
  savePage();pages.push(newPage());config.duration=Math.max(config.duration,Math.ceil(6+pages.length*3));selectPage(pages.length-1);
};
$('removePage').onclick=()=>{
  if(pages.length===1)return;
  if(!confirm('이 페이지의 본문과 이미지를 삭제할까요?'))return;
  pages.splice(editorPage,1);selectPage(Math.min(editorPage,pages.length-1));
};

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
    if(input.dataset.config==='duration') config.duration=Math.max(6,Math.min(120,config.duration || 12));
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
  if (busy) return;
  playing=false;lastTick=0;
  if (button.dataset.section==='storySection' || button.dataset.section==='imageSection') {
    savePage();selectPage(pageAt(time),false);
  }
  syncTime();
  const section = $(button.dataset.section); section.open = true;
  const input = $(button.dataset.focus);
  input.scrollIntoView({behavior: 'auto', block: 'nearest'});
  input.focus({preventScroll: true});
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
  editorPage=0;pages=[newPage(),newPage()];pictures.scene=pages[0].picture;
  selectPage(0,false);
  Object.keys(pictures).forEach(clearPicture); playing = false; time = 0; syncForm(); draw(); notify('처음 상태로 되돌렸어요.');
};

function lock(value) {
  busy = value;
  $('settingsFields').disabled = value;
  ['png', 'gif', 'video', 'play', 'scrub', 'reset', 'back', 'openDetail'].forEach(id => {$(id).disabled = value;});
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
  download(blob, 'world-of-horror.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
  selectPage(0,false);lock(true); syncForm();
  try {
    const assets = window.HorrorAssets;
    [frame, selectionFrame] = await Promise.all([loadImage(assets.frame), loadImage(assets.selection), document.fonts.load('22px Pixel', '한글 ABC')]);
    await document.fonts.ready;
    ctx.drawImage(frame, 0, 0);
    const darkPixel = [0, 0, 0];
    const lightPixel = [255, 255, 255];
    palette = [darkPixel, lightPixel]; dark = `rgb(${darkPixel.join(',')})`; light = `rgb(${lightPixel.join(',')})`;
    ready = true; draw(); $('scene').dataset.ready = 'true';
    notify('준비됐어요. 장면을 클릭하거나 오른쪽 패널에서 편집하세요.');
    lock(false); requestAnimationFrame(tick);
  } catch (error) {notify(`시작하지 못했어요: ${error.message}`, true);}
})();

window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=value;lastTick=0;syncTime()}};
