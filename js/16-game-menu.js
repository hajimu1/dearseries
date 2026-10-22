'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=960,H=720;
const config={title:'AFTER THE\nBLUE',subtitle:'a memory of the summer / 2002',menuItems:['Continue','Load Game','New Game','Options','Gallery','Exit'],target:1,mode:'LOAD GAME',description:'Select a command to continue.',player:'Yuna',footer:'MEMORY CARD (PS2) / SLOT 1',effect:'sparkle',effectStrength:.3,effectSpread:240,effectCycles:3,effectX:.72,effectY:.42,effectPhase:0,theme:'gothic',titleScale:1,panelOpacity:1,resolution:640,pixelScaling:'soft',colorLevels:0,colorBleed:0,grain:.75,accent:'#e7c482',shade:.08,scanlines:.055,duration:12,gifWidth:640,loop:true};
let time=0,playing=true,lastTick=0,busy=false,ready=false,cancelled=false,selected=0;
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>1-Math.pow(1-clamp(n),3),breathe=()=>new Promise(r=>setTimeout(r,0));
function notify(text){$('notice').textContent=text;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=`${time.toFixed(1)} / ${config.duration.toFixed(1)} s`;$('play').textContent=playing?'Ⅱ':'▶';}
function lock(value){busy=value;if(value)$('editHover').hidden=true;$('settingsFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video','previewAction','viewMain','viewLoad'])$(id).disabled=value;if(typeof syncRecentEdit==='function')syncRecentEdit();}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('이미지를 읽지 못했어요. 다른 PNG·JPG·WebP 파일을 선택해주세요.'));image.src=src;});
const defaults=Array.from({length:4},()=>{const c=document.createElement('canvas');c.width=960;c.height=720;return c;});
const mainDefault=defaults[0].cloneNode();
function photo(image){return {image,fit:'cover',zoom:1,x:.5,y:.5};}
let background=photo(mainDefault),menuPhoto=photo(mainDefault);
const slots=['The rain-soaked gate','A letter in the dark','The last departure','Beneath a broken sky'].map((title,i)=>({title,place:['Chapter 01 / town gate','Chapter 02 / the boarding house','Chapter 03 / midnight platform','Chapter 04 / ruined observatory'][i],level:String(12+i*7).padStart(2,'0'),time:['03:24:18','08:12:06','16:40:32','24:08:51'][i],date:`2002 / 08 / ${String(12+i*4).padStart(2,'0')}  18:4${i}`,note:['Beyond the rain, the gate was open.','A sealed letter waited in the dark.','The last train left without you.','The key led you back to the stars.'][i],photo:photo(defaults[i])}));
function image(g,p,x,y,w,h){g.save();if(config.theme==='noir')g.filter='grayscale(1) contrast(1.15)';g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='#091525';g.fillRect(x,y,w,h);const scale=(p.fit==='contain'?Math.min:Math.max)(w/p.image.width,h/p.image.height)*p.zoom,iw=p.image.width*scale,ih=p.image.height*scale;g.drawImage(p.image,x+(w-iw)*p.x,y+(h-ih)*p.y,iw,ih);g.restore();}
function showTab(name){for(const key of ['menu','slots','screen']){const active=key===name;$('tab-'+key).setAttribute('aria-selected',String(active));$('tab-'+key).tabIndex=active?0:-1;$('panel-'+key).hidden=!active;}}
['menu','slots','screen'].forEach((key,i,all)=>{$('tab-'+key).onclick=()=>showTab(key);$('tab-'+key).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;showTab(all[n]);$('tab-'+all[n]).focus();};});
function targets(){const previous=config.target;$('target').replaceChildren(...config.menuItems.map((s,i)=>new Option(s,String(i))));config.target=Math.min(previous,config.menuItems.length-1);$('target').value=config.target;}
targets();
for(const key of ['titleScale','panelOpacity','title','subtitle','description','player','footer','mode','accent','shade','scanlines','duration','gifWidth','target','theme','resolution','pixelScaling','colorLevels','colorBleed','grain','effect','effectStrength','effectSpread','effectCycles'])$(key).oninput=()=>{const numeric=['titleScale','panelOpacity','shade','scanlines','duration','gifWidth','target','resolution','colorLevels','colorBleed','grain','effectStrength','effectSpread','effectCycles'].includes(key);if(key==='duration')time=time/config.duration*Number($(key).value);config[key]=numeric?Number($(key).value):$(key).value;if(key==='theme'){config.accent=gameThemes[config.theme].accent||(config.theme==='street'?'#eee9cf':config.theme==='sepia'?'#fff1c2':'#e7c482');$('accent').value=config.accent;}$('durationValue').textContent=config.duration+'초';syncTime();draw();recordEdit(key);};
$('title').onbeforeinput=event=>{if(['insertLineBreak','insertParagraph'].includes(event.inputType)){const field=event.target,next=field.value.slice(0,field.selectionStart)+'\n'+field.value.slice(field.selectionEnd);if(next.split('\n').length>2)event.preventDefault();}};
$('title').oninput=()=>{const field=$('title'),value=field.value.replace(/\r\n?/g,'\n'),firstBreak=value.indexOf('\n'),normalized=firstBreak<0?value:value.slice(0,firstBreak+1)+value.slice(firstBreak+1).replace(/\n/g,' ');if(field.value!==normalized){const cursor=field.selectionStart;field.value=normalized;field.setSelectionRange(cursor,cursor);}config.title=normalized;draw();recordEdit('title');};
$('menuItems').oninput=()=>{config.menuItems=$('menuItems').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,6);if(!config.menuItems.length)config.menuItems=['Load Game'];targets();draw();recordEdit('menuItems');};
function photoEditor(host,p,title,resetImage,onReset){
 const prefix=host.id;host.className='photo-editor';host.innerHTML=`<img alt="${title} 미리보기"><h4>${title}</h4><label for="${prefix}-upload">이미지 올리기 · 20MB 이하</label><input id="${prefix}-upload" type="file" accept="image/png,image/jpeg,image/webp"><label for="${prefix}-fit">이미지 맞춤</label><select id="${prefix}-fit"><option value="cover">영역 채우기</option><option value="contain">전체 보기</option></select><label for="${prefix}-zoom">확대</label><input id="${prefix}-zoom" type="range" min="1" max="3" step=".01"><label for="${prefix}-x">좌우 위치</label><input id="${prefix}-x" type="range" min="0" max="1" step=".01"><label for="${prefix}-y">상하 위치</label><input id="${prefix}-y" type="range" min="0" max="1" step=".01"><div class="photo-actions"><button type="button" id="${prefix}-positionReset">위치·확대 초기화</button><button type="button" id="${prefix}-reset">기본 이미지로 복원</button></div>`;
 const thumb=()=>host.querySelector('img').src=p.image instanceof HTMLCanvasElement?p.image.toDataURL():p.image.src;thumb();
 for(const key of ['fit','zoom','x','y']){const input=$(prefix+'-'+key);input.value=p[key];input.oninput=()=>{p[key]=key==='fit'?input.value:Number(input.value);draw();recordEdit(prefix+'-'+key);};}
 $(prefix+'-positionReset').onclick=()=>{Object.assign(p,{zoom:1,x:.5,y:.5});for(const key of ['zoom','x','y'])$(prefix+'-'+key).value=p[key];draw();recordEdit(prefix+'-positionReset',false);};
 $(prefix+'-reset').onclick=()=>{releasePhoto(p);Object.assign(p,photo(resetImage));onReset();draw();recordEdit(prefix+'-reset',false);};
 $(prefix+'-upload').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){notify('20MB 이하 PNG·JPG·WebP 파일을 선택해주세요.');event.target.value='';return;}
  const wasPlaying=playing;playing=false;lock(true);let url;
  try{url=URL.createObjectURL(file);const next=await load(url);if(next.width*next.height>40000000)throw Error('이미지가 너무 커요. 4천만 화소 이하로 줄여주세요.');releasePhoto(p);Object.assign(p,photo(next));thumb();for(const key of ['fit','zoom','x','y'])$(prefix+'-'+key).value=p[key];notify('이미지를 바꿨어요.');recordEdit(prefix+'-upload',false);url=null;}
  catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);lock(false);playing=wasPlaying;lastTick=0;syncTime();draw();event.target.value='';}
 };
}
function slotEditor(){const s=slots[selected];for(const [id,key] of [['slotTitle','title'],['slotPlace','place'],['slotLevel','level'],['slotTime','time'],['slotDate','date'],['slotNote','note']]){$(id).value=s[key];$(id).oninput=()=>{s[key]=$(id).value;draw();recordEdit(id);};}document.querySelectorAll('[data-slot]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.slot)===selected)));photoEditor($('slotPhoto'),s.photo,'슬롯 0'+(selected+1)+' 이미지',defaults[selected],slotEditor);}
slotEditor();
function initMenuPhoto(){photoEditor($('menuPhoto'),menuPhoto,'메뉴 메인 이미지',mainDefault,initMenuPhoto);}initMenuPhoto();
function initBackground(){photoEditor($('backgroundPhoto'),background,'전체 배경 이미지',mainDefault,initBackground);}initBackground();
document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.slot);playing=false;time=(.38+selected*.105)*config.duration;slotEditor();syncTime();draw();});
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;playing=true;lastTick=0;syncTime();draw();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);syncTime();draw();};$('cancel').onclick=()=>cancelled=true;
$('effectReset').onclick=()=>{Object.assign(config,{effectX:.72,effectY:.42,effectPhase:0});draw();recordEdit('effectReset',false);};
function interactWithPreview(event){if(busy||!ready)return;const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*W/r.width,y=(event.clientY-r.top)*H/r.height;playing=false;const p=phaseAt(time);if(p.open===1&&x>=81&&x<=562&&y>=194&&y<559){selected=Math.min(3,Math.floor((y-194)/94));time=(.38+selected*.105)*config.duration;slotEditor();showTab('slots');$('slotTitle').focus({preventScroll:true});}else if(p.open===0&&x>=gameThemes[config.theme].menuX-25&&x<=gameThemes[config.theme].menuX+348&&y>=menuTop()&&y<menuTop()+46*config.menuItems.length){config.target=Math.floor((y-menuTop())/46);$('target').value=config.target;time=.38*config.duration;}else if(x>=798&&y>=678){time=0;}if(config.effect!=='off'){config.effectX=clamp(x/W);config.effectY=clamp(y/H);config.effectPhase=time/config.duration;playing=true;lastTick=0;}syncTime();draw();recordEdit('effect',false);};
// Preview edit targets use the same 960×720 coordinates as the exported scene.
function previewTargets(){
 const p=phaseAt(time),targets=[],add=(id,label,tab,x,y,w,h,slot=null,line=null)=>targets.push({id,label,tab,x,y,w,h,slot,line});
 add('footer','하단 문구','menu',25,680,490,35);
 if(p.open===1){
  add('mode','창 제목','menu',70,115,620,55);
  for(let i=0;i<4;i++){const y=194+i*94;add('slotPhoto-upload','슬롯 '+(i+1)+' 이미지','slots',90,y+7,93,67,i);add('slotTitle','슬롯 '+(i+1)+' 제목','slots',220,y+5,330,30,i);add('slotPlace','장소 · 챕터','slots',193,y+34,355,20,i);add('slotLevel','레벨','slots',193,y+55,58,23,i);add('slotTime','플레이 시간','slots',251,y+55,295,23,i);}
  add('slotPhoto-upload','선택한 슬롯 이미지','slots',584,195,296,180,p.slot);add('slotTitle','슬롯 제목','slots',584,380,296,34,p.slot);add('slotPlace','장소 · 챕터','slots',584,414,296,42,p.slot);
  add('player','캐릭터 이름','menu',584,468,202,29);add('slotLevel','레벨','slots',795,468,85,29,p.slot);add('slotTime','플레이 시간','slots',698,500,182,32,p.slot);add('slotDate','저장 일시','slots',698,534,182,27,p.slot);add('slotNote','기록 · 한마디','slots',584,565,296,44,p.slot);
 }else if(p.open===0){
  const sepia=config.theme==='sepia',street=config.theme==='street',x=sepia?458:60,w=sepia?456:config.theme==='noir'?400:560,mx=gameThemes[config.theme].menuX;
  add('title','게임 제목','menu',x,70,w,street?170:150);add('subtitle','보조 문구','menu',x,street?255:238,street?396:w,22);
  config.menuItems.forEach((v,i)=>add('menuItems','메뉴 '+(i+1)+' · '+v,'menu',mx-25,menuTop()+46*i,sepia?355:373,46,null,i));
  add('description','메뉴 안내 문구','menu',mx,600,sepia?330:370,60);
  if(sepia)add('menuPhoto-upload','메인 이미지','menu',0,70,440,525);else add('menuPhoto-upload','메인 이미지','menu',config.theme==='street'?493:config.theme==='noir'?516:570,config.theme==='street'?111:80,config.theme==='street'?422:config.theme==='noir'?376:390,482);
  add('backgroundPhoto-upload','전체 배경 이미지','screen',0,0,W,678);
 }
 return targets;
}
function previewPoint(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};}
function previewTarget(event){const {x,y}=previewPoint(event);return previewTargets().find(t=>x>=t.x&&x<t.x+t.w&&y>=t.y&&y<t.y+t.h);}
function clearPreviewHover(){$('editHover').hidden=true;canvas.style.cursor='';}
canvas.onpointermove=event=>{if(busy||!ready||$('previewAction').value!=='edit'){clearPreviewHover();return;}const target=previewTarget(event);if(!target){clearPreviewHover();return;}const r=canvas.getBoundingClientRect(),wrap=$('canvasWrap').getBoundingClientRect(),hint=$('editHover');Object.assign(hint.style,{left:(r.left-wrap.left+target.x*r.width/W)+'px',top:(r.top-wrap.top+target.y*r.height/H)+'px',width:target.w*r.width/W+'px',height:target.h*r.height/H+'px'});hint.querySelector('span').textContent=target.label+' 편집';hint.hidden=false;canvas.style.cursor='pointer';};
canvas.onpointerleave=clearPreviewHover;$('previewAction').onchange=()=>{clearPreviewHover();document.querySelector('.preview-help').textContent=$('previewAction').value==='edit'?'글자나 이미지를 클릭하면 재생을 멈추고 해당 편집 항목으로 이동합니다.':'메뉴를 클릭해 로드 창을 열거나 화면을 클릭해 효과 위치를 옮길 수 있습니다.';};
canvas.onclick=event=>{
 if(busy||!ready)return;
 if($('previewAction').value==='interact'){interactWithPreview(event);return;}
 const target=previewTarget(event);if(!target)return;playing=false;lastTick=0;
 if(target.slot!==null){selected=target.slot;time=(.38+selected*.105)*config.duration;slotEditor();}
 showTab(target.tab);syncTime();draw();clearPreviewHover();const field=$(target.id);field.scrollIntoView({block:'center',behavior:'smooth'});field.focus({preventScroll:true});
 if(target.line!==null){const lines=field.value.split('\n'),start=lines.slice(0,target.line).reduce((n,line)=>n+line.length+1,0);field.setSelectionRange(start,start+lines[target.line].length);}
 field.classList.remove('edit-target');void field.offsetWidth;field.classList.add('edit-target');notify(target.label+' 항목으로 이동했어요.');
};
for(const [id,u] of [['viewMain',.12],['viewLoad',.38]])$(id).onclick=()=>{if(busy||!ready)return;playing=false;lastTick=0;time=u*config.duration;clearPreviewHover();syncTime();draw();};
canvas.onkeydown=event=>{if(busy||!ready)return;const moves={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]};if(moves[event.key]){event.preventDefault();const [dx,dy]=moves[event.key];config.effectX=clamp(config.effectX+dx);config.effectY=clamp(config.effectY+dy);draw();recordEdit('effect');}else if(event.key==='Enter'||event.key===' '){event.preventDefault();$('play').click();}};
function tick(now){if(playing&&ready&&!busy){clearPreviewHover();if(lastTick)time=(time+(now-lastTick)/1000)%config.duration;syncTime();draw();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
lock(true);notify('화면을 불러오는 중…');
Promise.all([load('../assets/game-menu/ps2-portrait-v2.png'),load('../assets/game-menu/slot-01-rain-gate.png'),load('../assets/game-menu/slot-02-letter-room.png'),load('../assets/game-menu/slot-03-last-train.png'),load('../assets/game-menu/slot-04-observatory.png'),document.fonts.load('600 30px GameSerif'),document.fonts.load('400 30px GameSepia'),document.fonts.load('400 30px GameArchive'),document.fonts.load('600 30px KookminUniversitySunggokSerif','한글'),document.fonts.load('600 30px GameHan','漢字')]).then(([art,...slotImages])=>{
 mainDefault.getContext('2d').drawImage(art,0,0,960,720);
 defaults.forEach((c,i)=>c.getContext('2d').drawImage(slotImages[i],0,0,960,720));
 slotEditor();initMenuPhoto();initBackground();ready=true;initRecentEdit();lock(false);lastTick=0;syncTime();draw();notify('');
}).catch(error=>{lock(false);notify(error.message);});

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
  download(blob, 'dear-memory-card-16.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
});

$('gif').onclick = () => exportScene(async () => {
  let width = config.gifWidth, frameMs = 100, colors = 256, previousSize;
  while (true) {
    const height = Math.round(width * H / W), small = document.createElement('canvas');
    small.width = width; small.height = height;
    const c = small.getContext('2d', {willReadFrequently: true}); c.imageSmoothingEnabled = true;
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
    if (action === 'save') {download(blob, 'dear-memory-card-16.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-memory-card-16.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});
for(const [id,values] of Object.entries({retroCapture:{resolution:320,pixelScaling:'nearest',colorLevels:32,colorBleed:1,scanlines:.055,grain:.4},retroDefault:{resolution:640,pixelScaling:'soft',colorLevels:0,colorBleed:0,scanlines:.055,grain:.75}}))$(id).onclick=()=>{Object.assign(config,values);for(const [key,value] of Object.entries(values))$(key).value=value;draw();recordEdit(id);};
