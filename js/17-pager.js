'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=960,H=720;
const pixel=document.createElement('canvas');pixel.width=320;pixel.height=240;const g=pixel.getContext('2d',{willReadFrequently:true});
const config={brand:'PG-17',owner:'012-000-0717',standbyClock:'10:24 PM',standbyDate:'1997 / 07 / 17',lcdColor:'#b4ca73',size:1,resolution:960,textDensity:.95,textBleed:1,vhsOpacity:0,tapeTone:0,vhsEmboss:0,bgColor:'#ffffff',bgFit:'cover',bgZoom:1,bgX:.5,bgY:.5,blur:0,bgOpacity:1,messageCount:3,baseDuration:18,duration:18,gifWidth:960,loop:true};
const messages=[{mode:'text',number:'8282',sender:'02-734-0717',text:'지금 어디야?\n집에 가는 길에 연락해 줘.\n기다리고 있을게.',stamp:'07/17  10:24 PM'},{mode:'numeric',number:'8282',sender:'02-000-0717',text:'잘 도착했어?\n오늘도 네 생각이 났어.',stamp:'07/17  10:26 PM'},{mode:'text',number:'1004',sender:'02-000-0104',text:'불 켜 두고 기다릴게.\n천천히, 조심히 와.',stamp:'07/17  10:28 PM'},{mode:'numeric',number:'1004',sender:'02-000-0828',text:'보고 싶어.\n전화해 줘!',stamp:'07/17  10:31 PM'}];
let selected=0,time=0,playing=true,lastTick=0,busy=false,ready=false,cancelled=false,bgImage=null,bgURL=null,pagerPhoto=null,schedule=[];
const timing={alertStart:.6,readStart:1.5,rest:.6,page:2.4};
const breathe=()=>new Promise(r=>setTimeout(r,0)),clamp=n=>Math.max(0,Math.min(1,n));
function notify(message){$('notice').textContent=message;}
function lock(value){busy=value;$('settingsFields').disabled=value;$('playbackFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video','gifWidth'])$(id).disabled=value||!ready;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=time.toFixed(1)+' / '+config.duration.toFixed(1)+' s';$('play').textContent=playing?'Ⅱ':'▶';}
function showTab(name){for(const key of ['message','device','background','screen']){const active=key===name;$('tab-'+key).setAttribute('aria-selected',active);$('tab-'+key).tabIndex=active?0:-1;$('panel-'+key).hidden=!active;}}
for(const [i,key] of ['message','device','background','screen'].entries()){$('tab-'+key).onclick=()=>showTab(key);$('tab-'+key).onkeydown=e=>{const keys=['message','device','background','screen'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:keys.length-1))%keys.length;showTab(keys[n]);$('tab-'+keys[n]).focus();};}
// Keep each message on a native font grid. Unifont covers characters outside Galmuri's main scripts.
function fontFor(text){return /[^\u0000-\u024f\u2000-\u206f\u3000-\u30ff\u3130-\u318f\uac00-\ud7af\uff00-\uffef]/u.test(text)?'16px PagerUnicode':'16px PagerPixel, PagerUnicode';}
function wrapMessage(text){g.font=fontFor(text);const lines=[];for(const paragraph of text.split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line&&g.measureText(line+ch).width>(lines.length%2===0?242:276)){lines.push(line);line='';}line+=ch;}lines.push(line);}const rows=2,pages=[];for(let i=0;i<lines.length;i+=rows)pages.push(lines.slice(i,i+rows));return pages.length?pages:[['']];}
function rebuildSchedule(){
 let start=0;const base=config.baseDuration/config.messageCount;
 schedule=messages.slice(0,config.messageCount).map((m,i)=>{const pages=m.mode==='numeric'?[[m.number]]:wrapMessage(m.text),duration=Math.max(base,timing.readStart+pages.length*timing.page+timing.rest),pageDuration=(duration-timing.readStart-timing.rest)/pages.length,entry={i,start,duration,pages,pageDuration};start+=duration;return entry;});
 config.duration=start;time%=start;$('durationHelp').textContent='전체 '+start.toFixed(1)+'초 · 각 페이지를 2.4초 이상 읽고, 잠시 대기한 뒤 다음 메시지를 받습니다.';updateMessageFields();syncTime();
}
function stateAt(t){const local=((t%config.duration)+config.duration)%config.duration,entry=schedule.find(s=>local<s.start+s.duration)||schedule[0],elapsed=local-entry.start,page=Math.min(entry.pages.length-1,Math.max(0,Math.floor((elapsed-timing.readStart)/entry.pageDuration)));return {...entry,elapsed,page,alert:elapsed>=timing.alertStart&&elapsed<timing.readStart,reading:elapsed>=timing.readStart&&elapsed<entry.duration-timing.rest};}

function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

const lettering=document.createElement('canvas');lettering.width=300;lettering.height=48;const lg=lettering.getContext('2d',{willReadFrequently:true});
function text(value,x,y,color='#263c27',font='12px PagerPixel, PagerUnicode',max=220){g.font=font;let str=String(value);while(g.measureText(str).width>max&&str.length)str=Array.from(str).slice(0,-1).join('');lg.clearRect(0,0,300,48);lg.font=font;lg.textBaseline='alphabetic';lg.fillStyle=color;lg.fillText(str,0,36);const bits=lg.getImageData(0,0,300,48);for(let i=3;i<bits.data.length;i+=4)bits.data[i]=bits.data[i]>=96?255:0;lg.putImageData(bits,0,0);g.drawImage(lettering,Math.round(x),Math.round(y)-36);}

function line(x1,y1,x2,y2,color){g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(x1+.5,y1+.5);g.lineTo(x2+.5,y2+.5);g.stroke();}
const lcdBlend=document.createElement('canvas');lcdBlend.width=288;lcdBlend.height=64;const lcdContext=lcdBlend.getContext('2d');
function largeLCD(value,baseline,ink){let size=28;do{g.font=size+'px PagerPixel, PagerUnicode';if(g.measureText(value).width<=276)break;size--;}while(size>16);const width=Math.min(276,g.measureText(value).width);text(value,(288-width)/2,baseline,ink,size+'px PagerPixel, PagerUnicode',276);}
function paintLCD(s){const m=messages[s.i];
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,320,240);const ink='#182234',small='8px PagerSmall, PagerUnicode';
 // Numbered caller information is the notification itself.
 if(s.alert){text(String(s.i+1).padStart(2,'0')+':',4,12,ink,small,30);largeLCD(m.sender,39,ink);text(m.stamp,4,62,ink,small,276);}
 else if(s.reading&&m.mode==='numeric'){text(String(s.i+1).padStart(2,'0')+':',4,12,ink,small,30);largeLCD(m.number,40,ink);text(m.stamp,4,62,ink,small,276);}
 else if(s.reading){text(String(s.i+1).padStart(2,'0')+':',4,23,ink,fontFor(m.text),32);s.pages[s.page].forEach((l,i)=>text(l,i===0?38:4,23+i*20,ink,fontFor(m.text),i===0?242:276));text(m.stamp,4,62,ink,small,276);}
 else{largeLCD(config.standbyClock,38,ink);g.font=small;const width=g.measureText(config.standbyDate).width;text(config.standbyDate,Math.max(4,(288-width)/2),60,ink,small,276);}

}
// Derive persistence from timeline boundaries, never the preceding rendered frame.
// This keeps scrubbing, paused previews and exports identical and the loop seam clean.
function lcdTransitionAt(t){
 const current=stateAt(t);let boundary;
 if(current.reading)boundary=timing.readStart+current.page*current.pageDuration;
 else if(current.alert)boundary=timing.alertStart;
 else if(current.elapsed>=current.duration-timing.rest)boundary=current.duration-timing.rest;
 else return {current,previous:null,progress:1};
 const progress=clamp((current.elapsed-boundary)/.22);
 return {current,previous:progress<1?stateAt(current.start+boundary-.00001):null,progress};
}
function composeLCD(t){
 const {current,previous,progress:p}=lcdTransitionAt(t);lcdContext.clearRect(0,0,288,64);
 if(!previous){paintLCD(current);lcdContext.drawImage(pixel,0,0);return;}
 paintLCD(previous);const old=g.getImageData(0,0,288,64).data;
 paintLCD(current);const frame=g.getImageData(0,0,288,64),next=frame.data,age=p*.22;
 // Keep shared segments fully dark; only switched segments respond.
 // New segments settle promptly, while erased segments leave a faint short trace.
 const on=1-Math.exp(-age/.018),off=.85*Math.exp(-age/.015)+.15*Math.exp(-age/.07)*(1-p);
 for(let i=0;i<next.length;i+=4){const common=Math.min(old[i+3],next[i+3]);const alpha=common+(old[i+3]-common)*off+(next[i+3]-common)*on;next[i]=24;next[i+1]=34;next[i+2]=52;next[i+3]=Math.round(alpha);}
 lcdContext.putImageData(frame,0,0);
}

// A static electrode mask gives each LCD dot a fine gap and slight density variation.
const dotMask=document.createElement('canvas'),lcdDots=document.createElement('canvas');dotMask.width=lcdDots.width=576;dotMask.height=lcdDots.height=128;
const dm=dotMask.getContext('2d'),dg=lcdDots.getContext('2d');
for(let y=0;y<64;y++)for(let x=0;x<288;x++){dm.fillStyle='rgba(0,0,0,'+(.94+((x*17+y*29)%7)/100)+')';dm.fillRect(x*2+.08,y*2+.08,1.84,1.84);}
function applyLCDDots(){dg.clearRect(0,0,576,128);dg.imageSmoothingEnabled=false;dg.drawImage(lcdBlend,0,0,576,128);dg.save();dg.globalCompositeOperation='destination-in';dg.drawImage(dotMask,0,0);dg.restore();}

const qualityBuffer=document.createElement('canvas');
function applyScreenFinish(){
 if(config.resolution<W){const width=config.resolution,height=width*H/W;if(qualityBuffer.width!==width){qualityBuffer.width=width;qualityBuffer.height=height;}const q=qualityBuffer.getContext('2d');q.clearRect(0,0,width,height);q.drawImage(canvas,0,0,width,height);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(qualityBuffer,0,0,W,H);ctx.restore();}
 applyVhs(ctx,config.vhsOpacity);applyTapeTone(ctx,config.tapeTone);applyVhsEmboss(ctx,config.vhsEmboss);
}
function draw(t=time){
 if(!schedule.length||!pagerPhoto)return;
 const s=stateAt(t),m=messages[s.i];ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.fillStyle=config.bgColor;ctx.fillRect(0,0,W,H);
 if(bgImage){ctx.save();ctx.globalAlpha=config.bgOpacity;ctx.filter='blur('+config.blur+'px)';const scale=(config.bgFit==='cover'?Math.max:Math.min)(W/bgImage.width,H/bgImage.height)*config.bgZoom,w=bgImage.width*scale,h=bgImage.height*scale;ctx.drawImage(bgImage,(W-w)*config.bgX,(H-h)*config.bgY,w,h);ctx.restore();}
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(config.size,config.size);ctx.translate(-W/2,-H/2);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(pagerPhoto,60,80,840,560);
 // Photo bounds are fixed; only this inset LCD is rendered on a coarse pixel grid.
 ctx.save();ctx.beginPath();ctx.roundRect(192,226,574,128,8);ctx.clip();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.45;ctx.fillStyle=config.lcdColor;ctx.fillRect(192,226,574,128);ctx.restore();
 composeLCD(t);applyLCDDots();
 // A faint diffuse pass surrounds a near-black navy pixel core, like ink behind LCD glass.
 ctx.save();ctx.beginPath();ctx.roundRect(192,226,574,128,8);ctx.clip();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=Math.min(.6,config.textBleed*.26)*config.textDensity/.95;ctx.filter='blur('+(config.textBleed*1.2)+'px)';ctx.drawImage(lcdDots,0,0,576,128,202,231,554,123);ctx.globalAlpha=config.textDensity;ctx.filter='blur('+(config.textBleed*.35)+'px)';ctx.drawImage(lcdDots,0,0,576,128,202,231,554,123);ctx.restore();
 // Subtle printed labels sit on the photographic plastic, not on the animated LCD.
 ctx.save();ctx.fillStyle='#b9b8aa';ctx.font='16px PagerSmall, PagerUnicode';ctx.textBaseline='middle';ctx.fillText(config.brand,171,172,240);ctx.textAlign='center';ctx.fillStyle='#b1b2a3';ctx.fillText(config.owner,480,523,355);ctx.restore();
 if(s.alert&&Math.floor(s.elapsed*3)%2){ctx.save();ctx.fillStyle='#ef6642';ctx.shadowColor='#ff4b20';ctx.shadowBlur=12;ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(480,172,15,5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 ctx.restore();applyScreenFinish();$('phase').textContent=String(s.i+1).padStart(2,'0')+' / '+(s.alert?'수신 중 · 알림':s.reading?'메시지 · '+(s.page+1)+' / '+s.pages.length+' 페이지':'대기 중');
}

function updateMessageFields(){const m=messages[selected],numeric=m.mode==='numeric';$('messageMode').value=m.mode;$('number').value=m.number;$('textFields').hidden=numeric;$('numericFields').hidden=!numeric;$('pageInfo').textContent=numeric?'숫자·공백·전화번호 기호를 최대 24자 표시합니다.':wrapMessage(m.text).length+'페이지 · 최대 240자 · 줄바꿈 가능';}
$('messageMode').oninput=()=>{messages[selected].mode=$('messageMode').value;rebuildSchedule();draw();};
$('number').oninput=()=>{const value=$('number').value.replace(/[^0-9+*#()\s-]/g,'');$('number').value=value;messages[selected].number=value;rebuildSchedule();draw();};
function editMessage(){$('messageHeading').textContent=String(selected+1).padStart(2,'0')+'번 메시지';const m=messages[selected];$('sender').value=m.sender;$('message').value=m.text;$('stamp').value=m.stamp;document.querySelectorAll('[data-message]').forEach(b=>{const i=Number(b.dataset.message);b.setAttribute('aria-pressed',i===selected);b.disabled=i>=config.messageCount;});$('pageInfo').textContent=wrapMessage(m.text).length+'페이지 · 최대 240자 · 줄바꿈 가능';}
document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.message);editMessage();$('previewMessage').click();});
for(const [id,key] of [['sender','sender'],['message','text'],['stamp','stamp']])$(id).oninput=()=>{messages[selected][key]=$(id).value;rebuildSchedule();draw();};
for(const id of ['brand','owner','standbyClock','standbyDate','lcdColor','size','resolution','textDensity','textBleed','vhsOpacity','tapeTone','vhsEmboss','bgColor','bgFit','bgZoom','bgX','bgY','blur','bgOpacity','messageCount','duration','gifWidth'])$(id).oninput=()=>{const field=$(id),numeric=field.type==='range'||['messageCount','gifWidth','resolution'].includes(id);config[id==='duration'?'baseDuration':id]=field.type==='checkbox'?field.checked:numeric?Number(field.value):field.value;if($(id+'Value'))$(id+'Value').textContent=field.value;if(id==='duration'||id==='messageCount'){selected=Math.min(selected,config.messageCount-1);rebuildSchedule();editMessage();}draw();};
$('previewMessage').onclick=()=>{playing=false;lastTick=0;time=schedule[selected].start+timing.readStart+.6;syncTime();draw();};
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;lastTick=0;syncTime();draw();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);syncTime();draw();};$('cancel').onclick=()=>{cancelled=true;};
canvas.onclick=()=>{if(busy||!ready)return;selected=stateAt(time).i;playing=false;showTab('message');editMessage();syncTime();const field=$(messages[selected].mode==='numeric'?'number':'message');field.scrollIntoView({block:'center',behavior:'smooth'});field.focus({preventScroll:true});};canvas.onkeydown=e=>{if(!busy&&ready&&[' ','Enter'].includes(e.key)){e.preventDefault();$('play').click();}};
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('이미지를 읽지 못했어요. PNG·JPG·WebP 파일을 확인해주세요.'));image.src=src;});
$('bgUpload').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){notify('20 MB 이하의 PNG·JPG·WebP 파일을 선택해주세요.');e.target.value='';return;}lock(true);let url;try{url=URL.createObjectURL(file);const image=await load(url);if(image.width*image.height>40000000)throw Error('4천만 화소 이하 이미지를 선택해주세요.');if(bgURL)URL.revokeObjectURL(bgURL);bgURL=url;url=null;bgImage=image;$('imageSettings').hidden=false;notify('배경 이미지를 추가했어요. 흐림과 위치를 조절해 보세요.');}catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);e.target.value='';lock(false);lastTick=0;draw();}};
$('bgReset').onclick=()=>{if(bgURL)URL.revokeObjectURL(bgURL);bgURL=null;bgImage=null;$('imageSettings').hidden=true;draw();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function tick(now){if(ready&&playing&&!busy){if(lastTick)time=(time+(now-lastTick)/1000)%config.duration;draw();syncTime();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
lock(true);notify('픽셀 폰트를 불러오는 중…');Promise.all([load('../assets/pager/photographic-pager-v2.png'),document.fonts.load('12px PagerPixel'),document.fonts.load('8px PagerSmall'),document.fonts.load('16px PagerUnicode')]).then(([image])=>{pagerPhoto=image;rebuildSchedule();editMessage();ready=true;lock(false);notify('');draw();}).catch(error=>notify('이미지 또는 폰트 로드 실패: '+error.message));

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
  download(blob, 'dear-pocket-signal-17.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
    if (action === 'save') {download(blob, 'dear-pocket-signal-17.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-pocket-signal-17.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});
