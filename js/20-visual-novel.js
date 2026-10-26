'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=1280,H=800;
const qualityBuffer=document.createElement('canvas'),qualityContext=qualityBuffer.getContext('2d');
const board=document.createElement('canvas');board.width=W;board.height=H;const g=board.getContext('2d');g.scale(2,2);
const config={duration:12,loop:true,gifWidth:640,resolution:1280,speaker:'선배',intro:$('intro').value,choiceCount:3,selectedChoice:0,profileName:'선배',profileNote:'도서부 / 3학년',dateLabel:'4月 12日',timeLabel:'16:30',timeNote:'放課後',place:'방과 후 · 복도',cgFit:'cover',cgZoom:1,cgX:0,cgY:0,portraitZoom:1,portraitX:0,portraitY:0,cgIndexed:false,cgColors:32,cgDither:false,cgNoise:50,portraitIndexed:false,portraitColors:32,portraitDither:false,portraitNoise:50,frameColor:'#a998b2',accentColor:'#b99bb7',dialogColor:'#111020',showRoses:true};
const choices=[{label:'테스트 문구 1입니다.',reply:'테스트 문구 1입니다.\n첫 번째 선택 후 표시되는 대사입니다.'},{label:'테스트 문구 2입니다.',reply:'테스트 문구 2입니다.\n두 번째 선택 후 표시되는 대사입니다.'},{label:'테스트 문구 3입니다.',reply:'테스트 문구 3입니다.\n세 번째 선택 후 표시되는 대사입니다.'}];
const assets={},defaults={},assetURLs={};
let time=0,playing=true,lastTick=0,busy=false,ready=false,cancelled=false;
const breathe=()=>new Promise(r=>setTimeout(r,0));
function notify(message){$('notice').textContent=message;}
function lock(value){busy=value;$('settingsFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video'])$(id).disabled=value||!ready;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=time.toFixed(1)+' / '+config.duration+' s';$('play').textContent=playing?'Ⅱ':'▶';}
function showEditorTab(name){for(const key of ['story','images','export']){const yes=key===name;$('tab-'+key).setAttribute('aria-selected',yes);$('tab-'+key).tabIndex=yes?0:-1;$('panel-'+key).hidden=!yes;}$('savePanel').hidden=name!=='export';}
['story','images','export'].forEach((key,i)=>{$('tab-'+key).onclick=()=>showEditorTab(key);$('tab-'+key).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;showEditorTab(['story','images','export'][n]);$('tab-'+['story','images','export'][n]).focus();};});
function syncChoices(){for(let i=0;i<3;i++){$('choiceGroup'+i).hidden=i>=config.choiceCount;$('selectedChoice').options[i].hidden=i>=config.choiceCount;$('selectedChoice').options[i].disabled=i>=config.choiceCount;}config.selectedChoice=Math.min(config.selectedChoice,config.choiceCount-1);$('selectedChoice').value=config.selectedChoice;}
choices.forEach((choice,i)=>{const group=document.createElement('div');group.className='choice-group';group.id='choiceGroup'+i;group.innerHTML=`<label for="choice${i}">${i+1}번 선택지</label><input id="choice${i}" maxlength="28"><label for="reply${i}">${i+1}번 선택 후 대사</label><textarea id="reply${i}" maxlength="100" rows="2"></textarea>`;$('choiceFields').append(group);for(const [prefix,key] of [['choice','label'],['reply','reply']]){$(prefix+i).value=choice[key];$(prefix+i).oninput=()=>{choice[key]=$(prefix+i).value;draw();};}});
for(const id of Object.keys(config)){if(!$(id))continue;$(id).oninput=()=>{config[id]=$(id).type==='checkbox'?$(id).checked:typeof config[id]==='number'?Number($(id).value):$(id).value;if(id==='choiceCount')syncChoices();if(/(Indexed|Dither|Noise)$/.test(id))syncPaletteControls();time%=config.duration;syncTime();draw();};}
// Pure time-based phases keep scrubbing and all export formats identical.
function stateAt(t){const local=((t%config.duration)+config.duration)%config.duration,u=local/config.duration,phase=u<.34?'intro':u<.66?'choices':'reply',start=phase==='intro'?0:phase==='choices'?.34:.66;return {phase,u,elapsed:(u-start)*config.duration,selected:config.selectedChoice};}
const paletteCache={};
function syncPaletteControls(){for(const key of ['cg','portrait']){$(key+'Colors').disabled=!config[key+'Indexed'];$(key+'Dither').disabled=!config[key+'Indexed'];$(key+'Noise').disabled=!config[key+'Indexed']||!config[key+'Dither'];$(key+'NoiseValue').textContent=config[key+'Noise']+'%';}}

function paletteImage(key){
 const source=assets[key],colors=config[key+'Colors'],noise=config[key+'Dither']?config[key+'Noise']:0;if(!source||!config[key+'Indexed'])return source;
 let cached=paletteCache[key];
 if(cached?.source!==source||cached.colors!==colors){
  const canvas=document.createElement('canvas'),scale=Math.min(1,(key==='cg'?1280:512)/Math.max(source.width,source.height));
  canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,canvas.width,canvas.height);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height),rgba=new Uint8ClampedArray(pixels.data);
  cached=paletteCache[key]={source,colors,canvas,context,pixels,rgba,palette:GifCodec.quantize(rgba,colors),mapped:new Uint8ClampedArray(rgba),noise:null};
 }
 if(cached.noise===noise)return cached.canvas;
 const {rgba,palette,mapped,pixels,context}=cached;
 if(noise){
  for(let i=0;i<mapped.length;i+=4){
   let hash=Math.imul((i/4+1)^0x9e3779b9,0x85ebca6b);hash=Math.imul(hash^(hash>>>16),0xc2b2ae35);hash^=hash>>>16;
   const offset=((hash>>>0)/4294967296-.5)*128*noise/100;
   for(let channel=0;channel<3;channel++)mapped[i+channel]=rgba[i+channel]+offset;
  }
 }
 const indices=GifCodec.applyPalette(noise?mapped:rgba,palette),out=pixels.data;
 for(let i=0;i<indices.length;i++){const color=palette[indices[i]];out[i*4]=color[0];out[i*4+1]=color[1];out[i*4+2]=color[2];}
 context.putImageData(pixels,0,0);cached.noise=noise;return cached.canvas;
}
// Keep slider input cheap; commit only the latest value after a short pause or release.
const pendingNoise=new Map();
function commitNoise(key){const pending=pendingNoise.get(key);if(!pending)return;clearTimeout(pending.timer);config[key+'Noise']=pending.value;pendingNoise.delete(key);draw();}
for(const key of ['cg','portrait']){
 $(key+'Noise').oninput=()=>{const value=Number($(key+'Noise').value);$(key+'NoiseValue').textContent=value+'%';clearTimeout(pendingNoise.get(key)?.timer);pendingNoise.set(key,{value,timer:setTimeout(()=>commitNoise(key),140)});};
 $(key+'Noise').onchange=()=>commitNoise(key);
}
function accentTone(factor=1){const channels=config.accentColor.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*factor));return '#'+channels.map(v=>v.toString(16).padStart(2,'0')).join('');}
function accentInk(factor=1){const rgb=accentTone(factor).slice(1).match(/../g).map(v=>{const c=parseInt(v,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#171422':'#fff6e6';}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function text(value,x,y,size=12,color='#fff6e6',align='left'){g.font=`${size}px NovelPixel,NovelUnicode,monospace`;g.textBaseline='top';g.textAlign=align;g.fillStyle=color;g.fillText(String(value),Math.round(x),Math.round(y));g.textAlign='left';}
function fitText(value,x,y,width,size=12,color='#fff6e6',align='left'){g.font=`${size}px NovelPixel,NovelUnicode,monospace`;let s=String(value);while(s.length&&g.measureText(s).width>width)s=s.slice(0,-1);text(s,x,y,size,color,align);}
function frame(x,y,w,h,fill){rect(x+2,y+2,w,h,'#292332');rect(x,y,w,h,'#282331');rect(x+1,y+1,w-2,h-2,'#f0e5df');rect(x+3,y+3,w-6,h-6,config.frameColor);rect(x+5,y+5,w-10,h-10,'#504255');rect(x+6,y+6,w-12,h-12,'#ebdce4');rect(x+7,y+7,w-14,h-14,fill);}
function flatFrame(x,y,w,h,fill){rect(x,y,w,h,'#44394a');rect(x+1,y+1,w-2,h-2,'#e8dce5');rect(x+2,y+2,w-4,h-4,fill);}
function centeredInk(value,cx,cy,maxWidth,size,color,maxHeight=Infinity,align='center'){
 g.save();g.textAlign='left';g.textBaseline='alphabetic';let m;
 do{g.font=`${size}px NovelPixel,NovelUnicode,monospace`;m=g.measureText(String(value));if((m.actualBoundingBoxLeft+m.actualBoundingBoxRight<=maxWidth&&m.actualBoundingBoxAscent+m.actualBoundingBoxDescent<=maxHeight)||size<=7)break;size--;}while(true);
 g.fillStyle=color;g.fillText(String(value),Math.round(align==='left'?cx+m.actualBoundingBoxLeft:cx+(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2),Math.round(cy+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2));g.restore();
}
function cgOrnament(){
 // Thin silver trellis stays on the frame; the single rose crest belongs to its top rail.
 for(const x of [13,473]){
  rect(x,45,2,225,'#443349');rect(x+1,45,1,225,'#e4d6df');
  for(let y=54;y<270;y+=22){rect(x-2,y,3,2,'#e4d6df');rect(x-3,y+2,3,2,'#65596f');rect(x+2,y+7,3,2,'#e4d6df');rect(x+3,y+9,3,2,'#65596f');}
 }
 for(const x of [14,468])for(const y of [31,280]){rect(x-3,y-3,11,11,'#39283f');rect(x-2,y-2,9,9,'#d9c5d6');rect(x,y,5,5,accentTone(.7));rect(x+1,y+1,2,2,'#f7dfce');}
 rect(166,28,155,2,'#45314e');rect(168,27,151,1,'#f3e4e5');
 if(assets.roses)g.drawImage(assets.roses,172,13,144,48);
}
function profileOrnament(){
 // Keep ornament inside the outer rails, clear of the portrait and information cells.
 const dark=accentTone(.35),mid=accentTone(.65),light='#e4d6df';
 for(const x of [493,626]){
  rect(x-1,38,3,342,dark);rect(x,38,1,342,light);
  for(let y=49;y<377;y+=22){rect(x-3,y,3,2,light);rect(x-4,y+2,3,2,mid);rect(x+1,y+7,3,2,light);rect(x+2,y+9,3,2,mid);}
 }
 for(const x of [493,625])for(const y of [30,386]){
  rect(x-4,y-4,9,9,dark);rect(x-3,y-3,7,7,light);rect(x-1,y-1,3,3,accentTone());rect(x-1,y-1,1,1,'#fff3dc');
 }
 for(const y of [29,388]){rect(502,y,115,1,dark);rect(503,y-1,113,1,light);}

}
function paragraph(value,x,y,width,lineHeight,maxLines,visible=Infinity){g.font='13px NovelPixel,NovelUnicode,monospace';const lines=[''];for(const char of String(value)){if(char==='\n'){lines.push('');continue;}if(g.measureText(lines.at(-1)+char).width>width)lines.push('');lines[lines.length-1]+=char;}let left=visible;for(const [i,line] of lines.slice(0,maxLines).entries()){text(line.slice(0,Math.max(0,left)),x,y+i*lineHeight,13);left-=line.length;}return lines;}
// Separate daily-life menu motifs, as in the supplied romance-game references.
const lifeMenus=[
 {label:'TELEPHONE',pixels:['001111110000','011111111000','111000011100','110000001100','110000001100','000000000000','000111100000','001111110000','011010111000','011101011000','011111111000','011111111000']},
 {label:'PRESENT',pixels:['001100110000','001111110000','000111100000','111111111111','111001100111','111111111111','011001100110','011001100110','011001100110','011001100110','011111111110','011111111110']},
 {label:'HOROSCOPE',pixels:['000001000000','000011100000','000011100000','111111111110','011111111100','001111111000','000111110000','001111111000','001100011000','011000001100','010000000100','000000000000']},
 {label:'HOLIDAY',pixels:['000100010000','111111111110','100100010010','111111111110','100000000010','101101101010','100000000010','101101101010','100000000010','101101101010','100000000010','111111111110']}
];
function lifeMenu(item,y){
 rect(498,y,124,21,'#29202f');rect(499,y+1,122,19,'#ecd9e1');rect(501,y+3,118,15,accentTone(.7));rect(502,y+4,116,1,accentTone(1));rect(502,y+17,116,1,accentTone(.4));
 item.pixels.forEach((row,py)=>[...row].forEach((v,px)=>{if(v==='1')rect(507+px,y+5+py,1,1,accentInk(.7));}));
 text(item.label,570,y+8,8,accentInk(.7),'center');
 // Small contrasting studs frame each plaque rather than repeating pictorial ornaments.
 rect(501,y+9,2,2,'#f9e9c9');rect(617,y+9,2,2,'#f9e9c9');
}
function draw(t=time){
 const s=stateAt(t);g.imageSmoothingEnabled=false;
 rect(0,0,640,400,config.frameColor);
 for(let y=0;y<400;y+=4)for(let x=(y%8?2:0);x<640;x+=4)rect(x,y,1,1,'#e6d9df');
 rect(0,0,640,2,'#f7eee8');rect(0,398,640,2,'#382d42');
 frame(10,27,468,263,'#181527');g.save();g.beginPath();g.rect(18,35,452,247);g.clip();
 if(assets.cg){const im=paletteImage('cg'),scale=(config.cgFit==='contain'?Math.min:Math.max)(452/im.width,247/im.height)*config.cgZoom,w=im.width*scale,h=im.height*scale;g.drawImage(im,244-w/2+config.cgX*226,158.5-h/2+config.cgY*123.5,w,h);}g.restore();
 rect(18,267,452,15,'#1d1727');centeredInk(config.place,26,274.5,425,9,'#eee0e7',11,'left');
 if(config.showRoses)cgOrnament();
 frame(10,306,468,84,config.dialogColor);
 rect(24,292,105,22,'#302536');rect(25,293,103,20,'#eadce5');rect(27,295,99,16,accentTone(.65));centeredInk(config.speaker,76.5,303,91,11,accentInk(.65),12);
 const dialogue=s.phase==='reply'?choices[s.selected].reply:config.intro;
 const shown=s.phase==='choices'?Infinity:Math.floor(s.elapsed/(config.duration/12)*34);
 g.save();g.beginPath();g.rect(21,321,445,59);g.clip();paragraph(dialogue,27,324,427,17,3,shown);g.restore();
 if(s.phase!=='choices'&&shown>=dialogue.replaceAll('\n','').length&&Math.floor(s.elapsed*2)%2===0)text('▼',452,371,10,config.accentColor);
 flatFrame(490,27,140,363,accentTone(.8));profileOrnament();
 flatFrame(498,35,124,131,'#20182b');
 if(assets.portrait){g.save();g.beginPath();g.rect(505,42,110,117);g.clip();const im=paletteImage('portrait'),scale=Math.max(110/im.width,117/im.height)*config.portraitZoom,w=im.width*scale,h=im.height*scale;g.drawImage(im,560-w/2+config.portraitX*55,100.5-h/2+config.portraitY*58,w,h);g.restore();}
 rect(499,170,122,19,accentTone(.45));centeredInk(config.profileName,560,179.5,110,12,accentInk(.45),13);
 rect(499,191,122,30,'#20182b');text('PROFILE',505,194,8,config.accentColor);fitText(config.profileNote,560,206,112,10,'#fff6df','center');
 flatFrame(498,227,124,64,'#fff0c8');centeredInk(config.dateLabel,560,249,106,16,'#352b40');centeredInk([config.timeLabel,config.timeNote].filter(Boolean).join('  '),560,273,106,11,'#352b40');
 lifeMenus.forEach((item,i)=>lifeMenu(item,297+i*22));
 if(s.phase==='choices'){
  const count=config.choiceCount,h=18+count*29,y=158-h/2;frame(51,y,386,h,'#171422');
  for(let i=0;i<count;i++){const selected=i===s.selected&&s.elapsed>config.duration*.08,cy=y+14+i*29;if(selected)rect(64,cy-3,360,25,config.accentColor);fitText((selected?'▶ ':'  ')+(i+1)+'. '+choices[i].label,72,cy+3,345,12,selected?accentInk():'#fff0e0');}
 }
 ctx.imageSmoothingEnabled=false;
 if(config.resolution<W){
  const width=config.resolution,height=Math.round(width*H/W);
  if(qualityBuffer.width!==width||qualityBuffer.height!==height){qualityBuffer.width=width;qualityBuffer.height=height;}
  qualityContext.clearRect(0,0,width,height);qualityContext.drawImage(board,0,0,width,height);
  ctx.drawImage(qualityBuffer,0,0,W,H);
 }else ctx.drawImage(board,0,0,W,H);$('phase').textContent=({intro:'01 / 처음의 대사',choices:'02 / 선택지',reply:'03 / 달라진 대사'})[s.phase]+'  ·  무한 반복';
}
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('이미지를 불러오지 못했어요.'));im.src=src;});
for(const key of ['cg','portrait']){
 $(key+'Upload').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){notify('20 MB 이하 PNG·JPG·WebP 이미지를 선택해주세요.');e.target.value='';return;}lock(true);let url;try{url=URL.createObjectURL(file);const im=await load(url);if(im.width*im.height>40000000)throw Error('4천만 화소 이하 이미지를 선택해주세요.');if(assetURLs[key])URL.revokeObjectURL(assetURLs[key]);assetURLs[key]=url;url=null;assets[key]=im;delete paletteCache[key];notify('이미지를 적용했어요.');}catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);e.target.value='';lastTick=0;lock(false);draw();}};
 $(key+'Reset').onclick=()=>{if(assetURLs[key])URL.revokeObjectURL(assetURLs[key]);assetURLs[key]=null;assets[key]=defaults[key];delete paletteCache[key];draw();};
}
$('portraitPositionReset').onclick=()=>{for(const [key,value] of [['portraitZoom',1],['portraitX',0],['portraitY',0]]){config[key]=value;$(key).value=value;}draw();};
$('cgPositionReset').onclick=()=>{for(const [key,value] of [['cgFit','cover'],['cgZoom',1],['cgX',0],['cgY',0]]){config[key]=value;$(key).value=value;}draw();};
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;lastTick=0;draw();syncTime();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);draw();syncTime();};$('cancel').onclick=()=>cancelled=true;
for(const [id,u] of [['previewIntro',.25],['previewChoices',.5],['previewReply',.9]])$(id).onclick=()=>{time=config.duration*u;playing=false;draw();syncTime();};
function focusEditor(tab,id){showEditorTab(tab);for(let parent=$(id).parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;$(id).focus();$(id).scrollIntoView({block:'nearest'});}
canvas.onclick=e=>{if(busy||!ready)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width,y=(e.clientY-r.top)*400/r.height;if(x>=498&&x<=622&&y>=297&&y<=384)return;else if(x>=490)focusEditor('images',y<170?'portraitUpload':y>=227&&y<=291?'dateLabel':'profileName');else if(y>=292)focusEditor('story',stateAt(time).phase==='reply'?'reply'+config.selectedChoice:'intro');else if(stateAt(time).phase==='choices')focusEditor('story','selectedChoice');else focusEditor('images','cgUpload');};
canvas.onkeydown=e=>{if(['Enter',' '].includes(e.key)&&!busy){e.preventDefault();focusEditor('story','intro');}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function tick(now){if(ready&&playing&&!busy){if(lastTick)time=(time+(now-lastTick)/1000)%config.duration;draw();syncTime();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
syncChoices();syncPaletteControls();lock(true);
Promise.all([load('../assets/visual-novel/event-cg-v2.png'),load('../assets/visual-novel/profile-v2.png'),load('../assets/visual-novel/roses-v1.png'),document.fonts.load('13px NovelPixel'),document.fonts.load('13px NovelUnicode')]).then(([cg,portrait,roses])=>{Object.assign(defaults,{cg,portrait,roses});Object.assign(assets,defaults);ready=true;lock(false);draw();syncTime();}).catch(error=>notify(error.message));
async function exportScene(job) {
  for(const key of [...pendingNoise.keys()])commitNoise(key);
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
  download(blob, 'dear-after-school-20.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
      encoder.writeFrame(indices, width, height, {palette: framePalette, delay, repeat: config.loop?0:-1});
      $('progress').value = (i + 1) / count;
      if (i % 3 === 0) {notify(`GIF 만드는 중 · ${Math.round((i + 1) / count * 100)}%`); await breathe();}
    }
    encoder.finish();
    const blob = new Blob([encoder.bytes()], {type: 'image/gif'});
    if (cancelled) throw new Error('저장을 취소했어요.');
    $('cancel').hidden = true;
    const action = await reviewGif(blob, {width, height, frameMs, colors, previousSize});
    if (action === 'save') {download(blob, 'dear-after-school-20.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-after-school-20.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});

