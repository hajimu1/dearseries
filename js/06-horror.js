'use strict';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const defaults = {
  mysteryName: '미스터리', mysteryDescription: '', storyTitle: '', story: '', storySize: 22,
  buttonText: '이 미스터리를 조사한다', characterName: '',
  logs: '(중요한 메시지는 이곳에 표시됩니다)\n[13:31:20]: 새로운 주문을 배웠다: 미다스의 손길!\n[13:31:20]: 새로운 상태를 얻었다: 도망자',
  animation: 'still', blink: true, duration: 12, gifWidth: 1448, doom: 0, headerYear: 1984, headerMonth: 5, palettePreset:'mono', paletteInk:'#000000', palettePaper:'#ffffff', paletteAccent:'#ffffff', paletteUseAccent:false,
  infoLevel: '1', infoExperience: '0', infoBody: '', ritual: '활성화된 의식 없음'
};
const config = {...defaults};
const defaultStatuses = () => [{name:'피부 박리'},{name:'흡수'}];
let statuses = defaultStatuses();
const stats = Object.fromEntries(['stamina', 'reason', 'STR', 'DEX', 'PER', 'KNW', 'CHR', 'FND'].map(key => [key, '']));
const imageAreas = {scene: {x: 657, y: 65, w: 410, h: 604}, portrait: {x: 1170, y: 640, w: 184, h: 276}};
const pictures = Object.fromEntries(Object.keys(imageAreas).map(key => [key, {image: null, rendered: null, zoom: 1, x: .5, y: .5, brightness: 0}]));
const newPage = () => ({title:'', story:''});
const cards = [{x:287,y:365,w:85,h:119},{x:786,y:345,w:90,h:125},{x:518,y:426,w:108,h:70},{x:368,y:505,w:81,h:125},{x:550,y:548,w:89,h:128},{x:716,y:512,w:100,h:126}];
const mysteryIndex = 2;
let editorPage = 0, hoverCard = -1, hoverNext = false, hoverAction = '';
let nextClickUntil = 0;
let navigation = null, manualPointer = null;
const nextButton = {x:574, y:720, w:44, h:48};
const actionButtons = {back:{x:36,y:813,w:147,h:53}, investigate:{x:654,y:726,w:397,h:122,inset:0}};
let pages = [newPage(), newPage(), newPage()];
let frame, selectionFrame, portraitFrame, portraitClip, portraitAccentMask, dark = '#000000', light = '#ffffff', palette;
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

function drawStory(t, page, index) {
  const size = config.storySize, lineHeight = size + 6;
  font(size, light, 'center');
  const title = page.title ? wrapText(page.title, 480) : [];
  const body = page.story ? wrapText(page.story, 480) : [];
  const gap = title.length && body.length ? lineHeight : 0;
  const height = (title.length + body.length) * lineHeight + gap;
  let y = Math.max(188, 337 - height / 2);
  let remaining = config.animation === 'typewriter' ? Math.floor(t / (config.duration * (pageStart(index+1)-pageStart(index)) * .65) * Array.from(page.title + page.story).length) : Infinity;
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
  applyScenePalette();
}

const scenePalettes={
  mono:['#000000','#ffffff','#ffffff',false],
  sepia:['#29291f','#eee0b5','#d4aa29',true],
  blueprint:['#344359','#eee9d7','#96b5c6',true],
  cyan:['#151820','#f1f1e7','#5cddd5',true],
  crimson:['#211d29','#71a2a7','#b33356',true],
  green:['#20382e','#c4d4a3','#82aa81',false]
};
for(const entry of window.HorrorExtraPalettes || []) {
  scenePalettes[entry.id]=entry.colors;
  const start=Math.floor((entry.number-1)/10)*10+1;
  const groupId=`palette-group-${start}`;
  let group=$(groupId);
  if(!group) {group=document.createElement('optgroup');group.id=groupId;group.label=`World of Horror ${start}–${Math.min(start+9,73)}`;$('palettePreset').append(group);}
  group.append(new Option(`${String(entry.number).padStart(2,'0')} · ${entry.name}`,entry.id));
}
let paletteCacheKey='',paletteLookup,paletteAccentLookup;
function applyScenePalette() {
  const {paletteInk:ink,palettePaper:paper,paletteAccent:accent,paletteUseAccent:useAccent}=config;
  if(ink==='#000000' && paper==='#ffffff' && !useAccent)return;
  const key=[ink,paper,accent].join();
  if(key!==paletteCacheKey) {
    const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    const low=rgb(ink);
    const ramp=hex=>{const high=rgb(hex),out=new Uint8Array(256*3);for(let v=0;v<256;v++)for(let c=0;c<3;c++)out[v*3+c]=Math.round(low[c]+(high[c]-low[c])*v/255);return out;};
    paletteLookup=ramp(paper);paletteAccentLookup=ramp(accent);paletteCacheKey=key;
  }
  const pixels=ctx.getImageData(0,0,W,H),data=pixels.data;
  const regions=[imageAreas.scene,imageAreas.portrait,{x:655,y:2,w:210,h:52}];
  const detail=canvas.dataset.stage==='detail';
  if(!detail)regions[0]={x:2,y:60,w:1067,h:720};
  for(let y=0;y<H;y++) {
    const spans=useAccent?regions.filter(a=>y>=a.y&&y<a.y+a.h):[];
    for(let x=0;x<W;x++) {
      const i=(y*W+x)*4,v=data[i]*3;
      const lut=spans.some(a=>x>=a.x&&x<a.x+a.w&&(a!==imageAreas.portrait||portraitAccentMask[(y-a.y)*a.w+x-a.x]))?paletteAccentLookup:paletteLookup;
      data[i]=lut[v];data[i+1]=lut[v+1];data[i+2]=lut[v+2];
    }
  }
  ctx.putImageData(pixels,0,0);
}

function savePage() {
  Object.assign(pages[editorPage], {title:config.storyTitle, story:config.story});
}

function selectPage(index, preview = true) {
  editorPage = index;
  config.storyTitle = pages[index].title; config.story = pages[index].story;
  $('pageSelect').replaceChildren(...pages.map((_,i)=>new Option(`${i+1} 페이지`,i,false,i===index)));
  $('removePage').disabled = pages.length === 1;
  if (preview) {playing=false; time=config.duration*(pageStart(index)+(pageStart(index+1)-pageStart(index))*.45);}
  syncForm(); draw();
}

// Keep the first click after the pointer arrives, regardless of page count.
function pageStart(index) {
  if (index === 0) return .3;
  if (index >= pages.length) return .675;
  return .425 + .25 * (index-1) / (pages.length-1);
}

function pageAt(t) {
  for (let index=pages.length-1; index>0; index--) {
    if (t >= config.duration*pageStart(index)) return index;
  }
  return 0;
}

function sequenceStage(t) {
  const phase = t / config.duration;
  return phase < .3 || phase >= .96 ? 'selection' : 'detail';
}

function drawSequence(t) {
  const detail = sequenceStage(t) === 'detail';
  $('hotspots').hidden = false;
  $('hotspots').querySelectorAll('[data-focus]').forEach(button=>{button.style.visibility=detail || ['doom','headerYear'].includes(button.dataset.focus) ? '' : 'hidden';});
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(detail ? frame : selectionFrame, 0, 0, W, H);
  ctx.drawImage(selectionFrame, 0, 0, W, 60, 0, 0, W, 60);
  ctx.save();ctx.fillStyle=dark;ctx.fillRect(57,4,210,52);
  font(28,light);ctx.textBaseline='middle';ctx.fillText(`${config.headerMonth}월${config.headerYear}`,60,30);ctx.restore();
  ctx.save();ctx.fillStyle=light;ctx.fillRect(868,22,47,31);
  ctx.translate(891.5,37.5);ctx.scale(.86,1);
  font(22,dark,'center');ctx.textBaseline='middle';ctx.fillText(`${config.doom}%`,0,0);ctx.restore();
  const pageIndex = pageAt(t), page = pages[pageIndex];
  if (detail && !window.HorrorEncounter) {
    const a = imageAreas.scene;
    if (pictures.scene.rendered) ctx.drawImage(pictures.scene.rendered, a.x, a.y, a.w, a.h);
    ctx.save(); ctx.translate(0, 20); ctx.scale(1.12, 1.48);
    drawStory(Math.max(0, t - config.duration * pageStart(pageIndex)),page,pageIndex); ctx.restore();
  }
  if (detail) {
    const {step,bodyY,bodyHeight} = statusLayout();
    ctx.fillStyle = dark; ctx.fillRect(1074,62,292,254);
    statuses.forEach((status,i) => {
      const y=65+i*step, height=step-6;
      ctx.drawImage(frame,1074,62,292,44,1074,y-3,292,step);
      ctx.fillStyle=light; ctx.fillRect(1078,y,283,height);
      font(Math.min(28,height-4),dark,'center'); ctx.textBaseline='alphabetic';
      const line=fitLine(status.name,275), metrics=ctx.measureText(line);
      ctx.fillText(line,Math.round(1219.5+(metrics.actualBoundingBoxLeft-metrics.actualBoundingBoxRight)/2),Math.round(y+height/2+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2));
    });
    ctx.fillStyle=light;ctx.fillRect(1370,66,69,34);ctx.fillRect(1370,111,69,32);
    for(const [value,y,height] of [[config.infoLevel,66,34],[config.infoExperience,111,32]]) {
      font(value.length>2 ? 20 : 26,dark,'right');ctx.textBaseline='alphabetic';
      const metrics=ctx.measureText(value);
      ctx.fillText(value,1436,Math.round(y+height/2+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2));
    }
    font(11,dark); ctx.font='bold 11px Pixel, monospace'; ctx.textBaseline='bottom';
    ctx.fillText('LVL',1372,99); ctx.fillText('EXP',1372,142);
    if (bodyHeight>8) {
    ctx.drawImage(frame,1074,147,292,169,1074,bodyY-3,292,bodyHeight+5);
    ctx.fillStyle=light; ctx.fillRect(1079,bodyY,280,bodyHeight-3);
    font(21,dark); wrapText(config.infoBody,264).slice(0,Math.min(6,Math.floor((bodyHeight-8)/24))).forEach((line,i)=>ctx.fillText(line,1086,bodyY+4+i*24));
    }
    ctx.fillStyle = light; ctx.fillRect(1074, 318, 374, 1);
    ctx.fillStyle = dark; ctx.fillRect(1074, 319, 374, 101);
    ctx.drawImage(frame, 1074, 319, 374, 31, 1074, 325, 374, 31);
    ctx.fillStyle = light; ctx.fillRect(1075, 357, 372, 62);
    font(23, dark); ctx.fillText(fitLine(config.ritual, 350), 1083, 366);
  }
  ctx.fillStyle = light; ctx.fillRect(1083,638,357,280);
  const a = imageAreas.portrait;
  ctx.drawImage(portraitFrame,a.x,a.y);
  if (pictures.portrait.rendered) {
    ctx.save(); ctx.translate(a.x,a.y); ctx.clip(portraitClip);
    ctx.drawImage(pictures.portrait.rendered,0,0,a.w,a.h); ctx.restore();
  }
  ctx.fillStyle=dark; ctx.beginPath();
  [[1083,638],[1440,638],[1440,648],[1360,648],[1332,676],[1321,676],
   [1310,659],[1284,643],[1262,640],[1240,643],[1214,659],[1203,676],
   [1192,676],[1164,648],[1083,648]].forEach(([x,y],i)=>i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath(); ctx.fill();
  ctx.fillStyle=dark;
  ctx.fillRect(1083,651,81,1); ctx.fillRect(1360,651,80,1);
  for(let step=0;step<7;step++) {
    ctx.fillRect(1164+step*4,652+step*4,4,1);
    ctx.fillRect(1356-step*4,652+step*4,4,1);
  }
  ctx.fillRect(1192,679,11,1); ctx.fillRect(1321,679,11,1);
  font(27,dark); ctx.fillText(stats.stamina,1090,655);
  font(27,dark,'right'); ctx.fillText(stats.reason,1434,655);
  font(23,dark); ctx.fillText('체력',1090,684);
  font(23,dark,'right'); ctx.fillText('이성',1434,684);
  ctx.strokeStyle=dark; ctx.lineWidth=2; ctx.beginPath();
  for (const y of [713,809]) {
    ctx.moveTo(1090,y); ctx.lineTo(1168,y); ctx.moveTo(1356,y); ctx.lineTo(1434,y);
  }
  ctx.stroke();
  ['STR','DEX','PER'].forEach((key,i)=>{font(21,dark);ctx.fillText(`${key}:${stats[key]}`,1090,722+i*30);});
  ['KNW','CHR','FND'].forEach((key,i)=>{font(21,dark,'right');ctx.fillText(`${stats[key]}:${key}`,1434,722+i*30);});
  if (config.characterName) {font(18,dark);ctx.fillText(fitLine(config.characterName,78),1090,861);}
  if (detail && !window.HorrorEncounter) {
    ctx.fillStyle = light; ctx.fillRect(654, 726, 397, 122);
    font(32, dark, 'center'); ctx.fillText(fitLine(config.buttonText, 382), 852, 774);
    ctx.fillStyle = light; ctx.fillRect(32, 809, 155, 61);
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.strokeRect(36, 813, 147, 53);
    font(24, dark, 'center'); ctx.fillText('← 뒤로가기', 109, 827);
    drawNextButton();
    const clickedAt = config.duration * pageStart(pageIndex);
    if ((pageIndex > 0 && t >= clickedAt && t-clickedAt < .12) || (!playing && !busy && performance.now()<nextClickUntil)) drawNextDots();
    font(18, light, 'right'); ctx.fillText(`${pageIndex+1} / ${pages.length}`,564,742);
  }
  ctx.fillStyle = dark; ctx.fillRect(2, 909, 1067, 175);
  if (detail) {
    if(window.HorrorEncounter) window.HorrorEncounter.drawLogs(t);
    else {font(28, light, 'center'); config.logs.split('\n').slice(0, 3).forEach((line, i) => ctx.fillText(fitLine(line, 1040), 534, 928 + i * 38));}
  }
  if (!detail && hoverCard >= 0 && !playing && !busy) drawCardHover(hoverCard);
  if (detail && hoverAction && !playing && !busy) drawButtonTone(actionButtons[hoverAction]);
  if (window.HorrorEncounter) window.HorrorEncounter.draw(t);
  else {drawSceneTransition(t); drawPlaybackPointer(t);}
  canvas.dataset.stage = detail ? 'detail' : 'selection';
  canvas.dataset.page = String(pageIndex+1);
}

function drawSceneTransition(t) {
  const distance = Math.min(Math.abs(t-config.duration*.3), Math.abs(t-config.duration*.96));
  if (distance >= .16) return;
  const cover = 1-distance/.16;
  ctx.save(); ctx.beginPath(); ctx.rect(2,60,1071,844); ctx.clip(); ctx.fillStyle = dark;
  for (let x=2;x<1073;x+=12) {
    const stagger = (Math.floor(x/12)*7%11)/11;
    const height = 844*Math.min(1,cover*(1.25+stagger*.35));
    ctx.fillRect(x,60,12,Math.ceil(height));
  }
  ctx.restore();
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
  font(19,light,'center'); ctx.textBaseline = 'alphabetic';
  const heading = fitLine(title,395), metrics = ctx.measureText(heading);
  ctx.fillText(heading,850,Math.round(804+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2));
  ctx.fillStyle = light; ctx.fillRect(649,817,402,52);
  font(22,dark,'center');
  const lines=wrapText(index === mysteryIndex ? config.mysteryDescription : '아직 확인되지 않은 미스터리',382).slice(0,2);
  lines.forEach((line,i)=>ctx.fillText(fitLine(line,382),850,820+(2-lines.length)*11+i*23));
}

function drawPlaybackPointer(t) {
  const phase=t/config.duration;
  const center=i=>({x:cards[i].x+cards[i].w*.55,y:cards[i].y+cards[i].h*.55});
  const stops=[{at:0,x:490,y:680},{at:.04,...center(3)},{at:.10,...center(3)},
    {at:.14,...center(5)},{at:.20,...center(5)},{at:.24,...center(mysteryIndex)},{at:.35,...center(mysteryIndex)}];
  if (pages.length>1) stops.push({at:.40,x:593,y:749},{at:.80,x:593,y:749});
  else stops.push({at:.80,...center(mysteryIndex)});
  stops.push({at:.83,x:848,y:785},{at:.89,x:848,y:785},
    {at:.915,x:736,y:761},{at:.94,x:109,y:841},{at:.96+.18/config.duration,x:109,y:841},{at:1,x:490,y:680});
  let from=stops[0],to=stops[stops.length-1];
  for(let i=1;i<stops.length;i++)if(phase<=stops[i].at){from=stops[i-1];to=stops[i];break;}
  const mix=Math.max(0,Math.min(1,(phase-from.at)/(to.at-from.at||1)));
  let x=Math.round((from.x+(to.x-from.x)*mix)/2)*2,y=Math.round((from.y+(to.y-from.y)*mix)/2)*2;
  if (manualPointer && !playing && (!busy || navigation)) ({x,y}=manualPointer);
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

function navigateScene(back, point) {
  if(busy||!ready)return;
  savePage(); playing=false; hoverCard=-1; hoverAction='';
  if (!back) selectPage(0,false);
  manualPointer=point || (back ? {x:109,y:841} : {x:577,y:465});
  navigation={start:performance.now(),boundary:config.duration*(back ? .96 : .3)};
  lock(true); time=navigation.boundary-.16; syncTime(); draw();
}
function canvasPoint(event) {
  const b=canvas.getBoundingClientRect();return {x:(event.clientX-b.left)*W/b.width,y:(event.clientY-b.top)*H/b.height};
}
canvas.addEventListener('mousemove',event=>{
  if(busy||playing)return;
  const {x,y}=canvasPoint(event);
  manualPointer={x,y};
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
  if(detail&&x>=32&&x<=187&&y>=809&&y<=870)navigateScene(true,{x,y});
  else if(detail&&x>=nextButton.x&&x<=nextButton.x+nextButton.w&&y>=nextButton.y&&y<=nextButton.y+nextButton.h&&pageAt(time)<pages.length-1){savePage();nextClickUntil=performance.now()+120;selectPage(pageAt(time)+1);setTimeout(()=>{if(!playing&&!busy)draw();},130);}
  else if(!detail){const index=cards.findIndex(c=>x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h);if(index===mysteryIndex)navigateScene(false,{x,y});}
});
$('back').onclick=()=>navigateScene(true);
$('openDetail').onclick=()=>navigateScene(false);
$('pageSelect').onchange=()=>{savePage();selectPage(Number($('pageSelect').value));};
$('addPage').onclick=()=>{
  savePage();pages.push(newPage());config.duration=Math.max(config.duration,Math.ceil(window.HorrorEncounter ? pages.length*1.5 : 6+pages.length*3));selectPage(pages.length-1);
};
$('removePage').onclick=()=>{
  if(pages.length===1)return;
  if(!confirm('이 페이지의 제목과 본문을 삭제할까요? 공통 이미지는 유지됩니다.'))return;
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
    const luminance = p[offset] * .2126 + p[offset + 1] * .7152 + p[offset + 2] * .0722 + picture.brightness * 2.55;
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

function statusLayout() {
  const step=statuses.length===6 ? 42 : Math.min(44,Math.floor(204/statuses.length));
  const bodyY=Math.min(314,65+statuses.length*step+2);
  return {step,bodyY,bodyHeight:314-bodyY};
}

function renderStatusEditor() {
  $('statusRows').replaceChildren(); $('statusHotspots').replaceChildren();
  const {step,bodyY,bodyHeight}=statusLayout();
  statuses.forEach((status,i)=>{
    const row=document.createElement('div'); row.className='status-row-editor';
    row.innerHTML=`<div class="field-row"><span>상태 ${i+1}</span><button type="button" class="text-button" data-status-remove="${i}" aria-label="상태 ${i+1} 삭제">삭제</button></div><div class="status-fields"><label>상태명<input type="text" id="statusName${i}" data-status-index="${i}" data-status-property="name" maxlength="24"></label></div>`;
    row.querySelector('[data-status-property="name"]').value=status.name;
    row.querySelector('button').disabled=statuses.length===1;
    $('statusRows').append(row);
    for(const [field,x,width,label] of [['Name',1078,283,'상태명']]) {
      const button=document.createElement('button'); button.type='button';
      button.dataset.section='sequenceSection'; button.dataset.focus=`status${field}${i}`;
      button.style.cssText=`--x:${x/W*100}%;--y:${(65+i*step)/H*100}%;--w:${width/W*100}%;--h:${(step-6)/H*100}%`;
      button.setAttribute('aria-label',`상태 ${i+1} ${label} 편집`);
      const caption=document.createElement('span');caption.textContent=`상태 ${i+1} ${label}`;button.append(caption);
      $('statusHotspots').append(button);
    }
  });
  $('statusCount').value=`${statuses.length} / 6`;
  $('addStatus').disabled=statuses.length===6;
  const bodyHotspot=document.querySelector('[data-focus="infoBody"]');
  bodyHotspot.hidden=bodyHeight<=8;
  bodyHotspot.style.setProperty('--y',`${bodyY/H*100}%`);
  bodyHotspot.style.setProperty('--h',`${bodyHeight/H*100}%`);
}

$('addStatus').onclick=()=>{
  if(statuses.length>=6)return;
  statuses.push({name:''});renderStatusEditor();selectPage(editorPage);
  $(`statusName${statuses.length-1}`).focus();
};
$('statusRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-status-remove]');
  if(!button||statuses.length<=1)return;
  statuses.splice(Number(button.dataset.statusRemove),1);renderStatusEditor();selectPage(editorPage);
});

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
    if(['infoLevel','infoExperience'].includes(input.dataset.config)&&input.value!=='') {
      config[input.dataset.config]=String(Math.max(0,Math.min(999,Math.round(Number(input.value)||0))));input.value=config[input.dataset.config];
    }
    if(input.dataset.config==='palettePreset' && scenePalettes[config.palettePreset]) {
      [config.paletteInk,config.palettePaper,config.paletteAccent,config.paletteUseAccent]=scenePalettes[config.palettePreset];syncForm();
    } else if(['paletteInk','palettePaper','paletteAccent','paletteUseAccent'].includes(input.dataset.config)) {
      config.palettePreset='custom';$('palettePreset').value='custom';
    }
    if(input.dataset.config==='headerYear') {config.headerYear=Math.max(1,Math.min(9999,Math.round(Number(input.value)||1984)));input.value=config.headerYear;}
    if(input.dataset.config==='headerMonth') {config.headerMonth=Math.max(1,Math.min(12,Math.round(Number(input.value)||1)));input.value=config.headerMonth;}
    if(input.dataset.config==='doom') {config.doom=Math.max(0,Math.min(99,Math.round(Number(input.value)||0)));input.value=config.doom;}
    if(input.dataset.config==='duration') config.duration=Math.max(6,Math.min(120,config.duration || 12));
    time = Math.min(time, config.duration); $('storySizeValue').value = `${config.storySize} px`;
  } else if (input.dataset.statusIndex !== undefined) {
    statuses[Number(input.dataset.statusIndex)].name=input.value;
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
  Object.assign(pictures[key], {image: null, rendered: null, zoom: 1, x: .5, y: .5, brightness: 0});
  document.querySelectorAll(`[data-image="${key}"]`).forEach(input => {input.value = pictures[key][input.dataset.property];});
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
$('hotspots').addEventListener('click', event => {
  const button=event.target.closest('[data-section]');
  if(!button)return;
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
});
$('fullscreen').onclick = async () => {
  try {if (document.fullscreenElement) await document.exitFullscreen(); else await $('previewShell').requestFullscreen();}
  catch {notify('이 브라우저에서는 전체 화면을 사용할 수 없어요.', true);}
};
$('play').onclick = () => {playing = !playing; if (time >= config.duration) time = 0; lastTick = 0; syncTime();};
$('scrub').oninput = () => {playing = false; time = Number($('scrub').value); syncTime(); draw();};
$('reset').onclick = () => {
  if (!confirm('문구, 이미지, 스탯을 처음 상태로 되돌릴까요?')) return;
  statuses=defaultStatuses();renderStatusEditor();
  Object.assign(config, defaults); Object.keys(stats).forEach(key => {stats[key] = '';});
  editorPage=0;pages=window.HorrorEncounter ? window.HorrorEncounter.pages() : [newPage(),newPage(),newPage()];
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
  link.href = url; link.download = window.HorrorEncounter ? filename.replace("world-of-horror", "world-of-horror-2") : filename; link.click();
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
  if (navigation) {
    const elapsed=(stamp-navigation.start)/1000;
    time=navigation.boundary-.16+Math.min(.32,elapsed);
    if (elapsed>=.32) {navigation=null;lock(false);}
    draw(); syncTime();
  } else if (playing && !busy && ready) {
    if (lastTick) time = (time + (stamp - lastTick) / 1000) % config.duration;
    draw(); syncTime();
  }
  lastTick = stamp; requestAnimationFrame(tick);
}

(async () => {
  window.HorrorEncounter?.setup();
  renderStatusEditor();
  selectPage(0,false);lock(true); syncForm();
  try {
    const assets = window.HorrorAssets;
    [frame, selectionFrame, portraitFrame] = await Promise.all([loadImage(assets.frame), loadImage(assets.selection), loadImage(assets.portraitFrame), document.fonts.load('22px Pixel', '한글 ABC'), document.fonts.load('bold 11px Pixel', 'LVL EXP')]);
    await document.fonts.ready;
    const ornament=document.createElement('canvas'); ornament.width=184; ornament.height=276;
    const ornamentContext=ornament.getContext('2d');
    ornamentContext.fillStyle='#fff'; ornamentContext.fillRect(0,0,184,276);
    ornamentContext.drawImage(portraitFrame,350,270,3300,3480,0,0,184,276);
    const ornamentPixels=ornamentContext.getImageData(0,0,184,276);
    for(let i=0;i<ornamentPixels.data.length;i+=4) {
      const ink=ornamentPixels.data[i]<160 ? 0 : 255;
      ornamentPixels.data[i]=ornamentPixels.data[i+1]=ornamentPixels.data[i+2]=ink;
    }
    ornamentContext.putImageData(ornamentPixels,0,0); portraitFrame=ornament;
    portraitClip=new Path2D();
    portraitAccentMask=new Uint8Array(184*276);
    const innerRows=[];
    for(let y=12;y<268;y++) {
      const black=x=>ornamentPixels.data[(y*184+x)*4]===0;
      let left=-1,right=184,leftWidth=0,rightWidth=0;
      for(let x=0;x<184;) {
        if(!black(x)) {x++;continue;}
        const start=x;
        while(x<184&&black(x)) x++;
        const width=x-start;
        if(x<=92&&width>leftWidth) {left=x;leftWidth=width;}
        if(start>=92&&width>rightWidth) {right=start-1;rightWidth=width;}
      }
      if(left>=0&&right<184&&left<=right) innerRows.push({y,left,right});
    }
    for(let i=0;i<innerRows.length-1;i++) {
      const a=innerRows[i],b=innerRows[i+1];
      for(let y=a.y;y<b.y;y++) {
        const mix=(y-a.y)/(b.y-a.y);
        const left=Math.round(a.left+(b.left-a.left)*mix),right=Math.round(a.right+(b.right-a.right)*mix);
        for(let x=left;x<=right;) {
          if(ornamentPixels.data[(y*184+x)*4]===0) {x++;continue;}
          const start=x;
          while(x<=right&&ornamentPixels.data[(y*184+x)*4]!==0) x++;
          portraitClip.rect(start,y,x-start,1);
          portraitAccentMask.fill(1,y*184+start,y*184+x);
        }
      }
    }
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
