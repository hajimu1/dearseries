 'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=960,H=720;
const config={duration:8,baseDuration:8,gifWidth:640,resolution:960,loop:true,texture:.65,emboss:0,broadcastColor:0,colorUnevenness:0,bloom:0,scanlines:.55,flicker:.4,bgColor:'#e5e1d9',bgFit:'cover',bgZoom:1,bgX:0,bgY:0,bgBlur:0,bgOpacity:1,tvScale:.85,cleanPreview:false};
let time=0,playing=true,lastTick=0,busy=false,ready=false,cancelled=false,defaultImage=null,tvPhoto=null,images=[],selectedImage=0,bgImage=null,bgURL=null;
const editorTabs=['images','background','tone','export'];
function showEditorTab(name){for(const key of editorTabs){const active=key===name;$('tab-'+key).setAttribute('aria-selected',String(active));$('tab-'+key).tabIndex=active?0:-1;$('panel-'+key).hidden=!active;}$('settingsFields').hidden=name==='export';document.querySelector('.panel-scroll').scrollTop=0;}
editorTabs.forEach((key,index)=>{const tab=$('tab-'+key);tab.onclick=()=>showEditorTab(key);tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?editorTabs.length-1:(index+(e.key==='ArrowRight'?1:editorTabs.length-1))%editorTabs.length;showEditorTab(editorTabs[next]);$('tab-'+editorTabs[next]).focus();};});
const breathe=()=>new Promise(r=>setTimeout(r,0));
function notify(message){$('notice').textContent=message;}
function lock(value){busy=value;$('settingsFields').disabled=value;$('playbackFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video','gifWidth'])$(id).disabled=value||!ready;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=time.toFixed(1)+' / '+config.duration+' s';$('play').textContent=playing?'Ⅱ':'▶';}
const signal=document.createElement('canvas');signal.width=400;signal.height=300;const sc=signal.getContext('2d',{willReadFrequently:true});
const noise=document.createElement('canvas');noise.width=200;noise.height=150;const nc=noise.getContext('2d');
const highlights=document.createElement('canvas');highlights.width=400;highlights.height=300;const hc=highlights.getContext('2d');
function rounded(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
// Screen coordinates are measured on the 1448 × 1086 generated photograph.
function glass(){ctx.beginPath();ctx.moveTo(291,164);ctx.bezierCurveTo(500,143,966,143,1157,164);ctx.bezierCurveTo(1184,167,1189,183,1190,214);ctx.bezierCurveTo(1203,373,1204,594,1187,733);ctx.bezierCurveTo(1185,755,1175,766,1154,769);ctx.bezierCurveTo(918,791,511,793,294,770);ctx.bezierCurveTo(271,768,263,752,262,727);ctx.bezierCurveTo(246,560,249,355,264,204);ctx.bezierCurveTo(266,179,272,168,291,164);ctx.closePath();}
const MAX_IMAGES=6;
function imageEntry(image,name='기본 이미지',url=null){return {image,name,url,fit:'contain',zoom:1,x:0,y:0,caption:'',channel:'18'};}
function rebuildDuration(){config.duration=config.baseDuration+(images.length-1)*3;time=Math.min(time,config.duration);$('durationHelp').textContent=`전체 ${config.duration}초 · ${images.length}장 순서대로 방송한 뒤 꺼집니다. 추가 사진마다 3초 늘어납니다.`;syncTime();}
function stateAt(t){
 const local=((t%config.duration)+config.duration)%config.duration,base=config.baseDuration,start=base*.25,end=base*.83+(images.length-1)*3,slot=(end-start)/Math.max(1,images.length);
 const index=Math.max(0,Math.min(images.length-1,Math.floor((local-start)/slot)));
 return {p:local/config.duration,index,phase:local<base*.10?'off':local<start?'static':local<end?'broadcast':local<end+base*.08?'shutdown':'off',switching:index>0&&local<end&&local>=start&&local-start-index*slot<.12,shutdownProgress:(local-end)/(base*.08)};
}
function previewSelected(){playing=false;lastTick=0;const start=config.baseDuration*.25,span=config.baseDuration*.58+(images.length-1)*3;time=start+span/images.length*(selectedImage+.5);syncTime();draw();}
function updateImages(){
 $('imageList').replaceChildren();images.forEach((item,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',i===selectedImage);button.title=item.name;button.setAttribute('aria-label',`${i+1}번 이미지 선택: ${item.name}`);const thumb=document.createElement('img');thumb.src=item.image.src;thumb.alt='';const label=document.createElement('span');label.textContent=String(i+1).padStart(2,'0');button.append(thumb,label);button.onclick=()=>{selectedImage=i;updateImages();previewSelected();};$('imageList').append(button);});
 const add=document.createElement('button');add.type='button';add.id='addImage';add.className='add-image';add.textContent=images.length>=MAX_IMAGES?'6장 가득 참':'+ 이미지';add.disabled=images.length>=MAX_IMAGES;add.setAttribute('aria-label','방송 이미지 추가');add.onclick=()=>$('upload').click();$('imageList').append(add);
 $('imageCount').textContent=`${images.length} / ${MAX_IMAGES}장`;$('selectedImageLabel').textContent=`${selectedImage+1}번 이미지 · ${images[selectedImage].name}`;
 const item=images[selectedImage];for(const id of ['fit','zoom','x','y','caption','channel']){$(id).value=item[id];if($(id+'Value'))$(id+'Value').textContent=Math.round(item[id]*100)+'%';}
 $('removeImage').disabled=images.length===1;$('upload').disabled=images.length>=MAX_IMAGES;$('moveEarlier').disabled=selectedImage===0;$('moveLater').disabled=selectedImage===images.length-1;
}
function makeSignal(t,staticOnly){
 const item=images[stateAt(t).index],broadcast=item?.image;
 sc.fillStyle='#0c1116';sc.fillRect(0,0,400,300);
 if(!staticOnly&&broadcast){const scale=(item.fit==='cover'?Math.max:Math.min)(950/broadcast.width,639/broadcast.height),w=(item.fit==='stretch'?400:broadcast.width*scale*400/950)*item.zoom,h=(item.fit==='stretch'?300:broadcast.height*scale*300/639)*item.zoom;sc.filter=config.cleanPreview?'none':`saturate(${1+config.texture*.35}) contrast(1.1) blur(${config.texture*.55}px)`;sc.drawImage(broadcast,(400-w)/2+item.x*200,(300-h)/2+item.y*150,w,h);sc.filter='none';if(config.cleanPreview)return;
 // Composite video has low horizontal chroma resolution while luminance edges stay sharper.
 const pixels=sc.getImageData(0,0,400,300),src=new Uint8ClampedArray(pixels.data),radius=Math.round(config.texture*5);
 for(let y=0;y<300;y++)for(let x=0;x<400;x++){const i=(y*400+x)*4,l=.299*src[i]+.587*src[i+1]+.114*src[i+2];let cr=0,cb=0;for(let dx=-radius;dx<=radius;dx++){const k=(y*400+Math.max(0,Math.min(399,x+dx)))*4,lum=.299*src[k]+.587*src[k+1]+.114*src[k+2];cr+=src[k]-lum;cb+=src[k+2]-lum;}cr/=radius*2+1;cb/=radius*2+1;pixels.data[i]=l+cr;pixels.data[i+2]=l+cb;pixels.data[i+1]=l-.509*cr-.194*cb;}// A blendable broadcast grade: deeper blacks, stronger chroma and coarse color levels.
 const amount=config.broadcastColor;
 if(amount)for(let i=0;i<pixels.data.length;i+=4){const d=pixels.data,l=.299*d[i]+.587*d[i+1]+.114*d[i+2];for(let c=0;c<3;c++){const graded=Math.max(0,Math.min(255,(l+(d[i+c]-l)*1.5-22)*1.18)),stepped=Math.round(graded/12)*12;d[i+c]+=amount*(stepped-d[i+c]);}}
 // Smooth spatial chroma errors affect colored regions, leaving neutral tones neutral.
 if(config.colorUnevenness)for(let y=0;y<300;y++)for(let x=0;x<400;x++){
  const d=pixels.data,i=(y*400+x)*4,l=.299*d[i]+.587*d[i+1]+.114*d[i+2],cr=d[i]-l,cb=d[i+2]-l;
  const field=(Math.sin(x*.037+Math.sin(y*.051)*2)+Math.sin(y*.083+x*.017)+.5*Math.sin(x*.13-y*.07))/2.5;
  const angle=field*config.colorUnevenness*.55,gain=1+field*config.colorUnevenness*.3;
  const red=(cr*Math.cos(angle)-cb*Math.sin(angle))*gain,blue=(cr*Math.sin(angle)+cb*Math.cos(angle))*gain;
  d[i]=l+red;d[i+2]=l+blue;d[i+1]=l-.509*red-.194*blue;
 }
 sc.putImageData(pixels,0,0);applyVhsEmboss(sc,config.emboss);
 if(config.bloom){
  const light=sc.getImageData(0,0,400,300),d=light.data;
  for(let i=0;i<d.length;i+=4)d[i+3]=255*Math.pow(Math.max(0,(Math.max(d[i],d[i+1],d[i+2])-145)/110),1.5);
  hc.putImageData(light,0,0);sc.save();sc.globalCompositeOperation='screen';sc.globalAlpha=config.bloom*.85;sc.filter=`blur(${1+config.bloom*5}px)`;sc.drawImage(highlights,0,0);sc.restore();
 }
 sc.font='16px monospace';sc.fillStyle='#b4efb1';sc.shadowColor='#8cff90';sc.shadowBlur=3;sc.fillText(item.channel,24,27);sc.shadowBlur=0;
 if(item.caption){sc.fillStyle='#0009';sc.fillRect(15,257,370,30);sc.fillStyle='#efeee2';sc.font='14px sans-serif';sc.textAlign='center';sc.fillText(item.caption,200,278,350);sc.textAlign='left';}}
 let seed=(Math.floor(t*24)+1)*719;const bits=nc.createImageData(200,150);for(let i=0;i<bits.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)|0;const v=seed>>>24;bits.data[i]=v;bits.data[i+1]=v;bits.data[i+2]=Math.min(255,v+10);bits.data[i+3]=255;}nc.putImageData(bits,0,0);sc.globalAlpha=staticOnly?.92:config.texture*.13;sc.drawImage(noise,0,0,400,300);sc.globalAlpha=1;
 sc.fillStyle=`rgba(0,0,0,${(.07+config.texture*.13)*(staticOnly?1:config.scanlines/.55)})`;for(let y=0;y<300;y+=2)sc.fillRect(0,y,400,1);
 const band=(t*47)%370-70,grad=sc.createLinearGradient(0,band,0,band+65);grad.addColorStop(0,'transparent');grad.addColorStop(.5,'rgba(0,0,0,.16)');grad.addColorStop(1,'transparent');sc.fillStyle=grad;sc.fillRect(0,band,400,65);
 if(!staticOnly){sc.fillStyle=`rgba(0,0,0,${config.flicker*(.05+.08*(.5+.5*Math.sin(t*31)))})`;sc.fillRect(0,0,400,300);}
}
const qualityBuffer=document.createElement('canvas');
function draw(t=time){
 const state=stateAt(t),local=state.p*config.duration;
 ctx.fillStyle=config.bgColor;ctx.fillRect(0,0,W,H);
 if(bgImage){ctx.save();ctx.globalAlpha=config.bgOpacity;ctx.filter=`blur(${config.bgBlur}px)`;const scale=(config.bgFit==='cover'?Math.max:Math.min)(W/bgImage.width,H/bgImage.height)*config.bgZoom,w=bgImage.width*scale,h=bgImage.height*scale;ctx.drawImage(bgImage,(W-w)/2+config.bgX*W/2,(H-h)/2+config.bgY*H/2,w,h);ctx.restore();}
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(config.tvScale,config.tvScale);ctx.translate(-W/2,-H/2);
 ctx.save();ctx.filter='blur(14px)';ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(480,636,307,15,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(tvPhoto){
  ctx.save();ctx.translate(60,30);ctx.scale(840/1448,840/1448);ctx.drawImage(tvPhoto,0,0);
  if(state.phase!=='off'){
   ctx.save();glass();ctx.clip();ctx.fillStyle='#070c0e';ctx.fillRect(240,140,975,660);
   if(state.phase==='static'||state.phase==='broadcast'){
    // Model channel-change video muting; startup tuning retains its snow.
    if(state.switching){sc.fillStyle='#070c0e';sc.fillRect(0,0,400,300);}
    else makeSignal(local,state.phase==='static');
    // Keep the photo's geometry; the glass mask supplies the curved outer edge.
    ctx.drawImage(signal,250,149,950,639);
   }
   if(state.phase==='shutdown'){
    const q=state.shutdownProgress;ctx.save();ctx.globalAlpha=1-q;ctx.shadowColor='#c3e6ff';ctx.shadowBlur=22;
    const h=Math.max(2,610*Math.pow(1-q,8)),w=920*(1-Math.max(0,(q-.6)/.4));rounded(725-w/2,470-h/2,w,h,Math.min(h/2,18),'#e0f3ff');ctx.restore();
   }
   const shade=ctx.createRadialGradient(725,470,160,725,470,550);shade.addColorStop(0,'#0000');shade.addColorStop(.65,'#0000');shade.addColorStop(1,'#0009');ctx.fillStyle=shade;ctx.fillRect(240,140,975,660);
   // Retain the actual photographed glass highlights over the moving signal.
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=.16;ctx.drawImage(tvPhoto,0,0);ctx.restore();
  }
  ctx.restore();
 }
 ctx.restore();
 if(config.resolution<W){const width=config.resolution,height=width*H/W;if(qualityBuffer.width!==width){qualityBuffer.width=width;qualityBuffer.height=height;}const q=qualityBuffer.getContext('2d');q.clearRect(0,0,width,height);q.drawImage(canvas,0,0,width,height);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(qualityBuffer,0,0,W,H);ctx.restore();}
 $('phase').textContent=({off:'STANDBY / 대기',static:'TUNING / 지지직',broadcast:'ON AIR / 방송',shutdown:'POWER OFF / 화면 꺼짐'})[state.phase]+(state.phase==='broadcast'?` · ${state.index+1} / ${images.length}`:'');
}
for(const id of ['duration','gifWidth','resolution','tvScale','texture','emboss','broadcastColor','colorUnevenness','bloom','scanlines','flicker','bgColor','cleanPreview'])$(id).oninput=()=>{config[id==='duration'?'baseDuration':id]=$(id).type==='checkbox'?$(id).checked:['duration','gifWidth','resolution','tvScale','texture','emboss','broadcastColor','colorUnevenness','bloom','scanlines','flicker'].includes(id)?Number($(id).value):$(id).value;if($(id+'Value'))$(id+'Value').textContent=Math.round(config[id]*100)+'%';if(id==='duration')rebuildDuration();time%=config.duration;syncTime();draw();};
function setLook(emboss,color,unevenness=0,bloom=0,scanlines=.55){config.cleanPreview=false;$('cleanPreview').checked=false;for(const [id,value] of [['emboss',emboss],['broadcastColor',color],['colorUnevenness',unevenness],['bloom',bloom],['scanlines',scanlines]]){$(id).value=value;$(id).dispatchEvent(new Event('input'));}previewSelected();}
$('referenceLook').onclick=()=>setLook(.45,.55,.4,.5,.18);$('resetLook').onclick=()=>setLook(0,0);
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;lastTick=0;draw();syncTime();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);draw();syncTime();};$('cancel').onclick=()=>cancelled=true;
canvas.onkeydown=e=>{if([' ','Enter'].includes(e.key)&&!busy){e.preventDefault();$('play').click();}};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('이미지를 읽을 수 없어요.'));im.src=src;});
async function uploadImages(event,replace=false){
 const files=[...event.target.files];if(!files.length)return;
 if((replace&&files.length!==1)||(!replace&&images.length+files.length>MAX_IMAGES)){notify(`방송 이미지는 최대 ${MAX_IMAGES}장입니다. 일부를 삭제한 뒤 추가해주세요.`);event.target.value='';return;}
 if(files.some(file=>!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000)){notify('각 20 MB 이하 PNG·JPG·WebP를 선택해주세요.');event.target.value='';return;}
 lock(true);const pending=[];let committed=false;
 try{
  for(const file of files){const url=URL.createObjectURL(file),entry=imageEntry(null,file.name,url);pending.push(entry);entry.image=await load(url);if(entry.image.width*entry.image.height>40000000)throw Error('각 4천만 화소 이하 이미지를 선택해주세요.');}
  if(replace){if(images[selectedImage].url)URL.revokeObjectURL(images[selectedImage].url);Object.assign(pending[0],{caption:images[selectedImage].caption,channel:images[selectedImage].channel});images[selectedImage]=pending[0];}
  else{selectedImage=images.length;images.push(...pending);}
  committed=true;rebuildDuration();updateImages();previewSelected();notify(`${files.length}장 ${replace?'교체':'추가'} 완료 · 총 ${images.length}장`);
 }catch(error){notify(error.message);}finally{if(!committed)pending.forEach(item=>URL.revokeObjectURL(item.url));event.target.value='';lock(false);lastTick=0;updateImages();draw();}
}
function syncBackground(){const hasImage=!!bgImage;$('bgControls').hidden=!hasImage;$('bgRemove').disabled=!hasImage;$('bgPreview').hidden=!hasImage;if(hasImage)$('bgPreview').src=bgImage.src;else $('bgPreview').removeAttribute('src');for(const id of ['bgFit','bgZoom','bgX','bgY','bgBlur','bgOpacity']){$(id).value=config[id];if($(id+'Value'))$(id+'Value').textContent=id==='bgBlur'?config[id]+' px':Math.round(config[id]*100)+'%';}}
$('bgChoose').onclick=()=>$('bgUpload').click();
$('bgUpload').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){notify('20 MB 이하 PNG·JPG·WebP 배경을 선택해주세요.');e.target.value='';return;}lock(true);let url;try{url=URL.createObjectURL(file);const image=await load(url);if(image.width*image.height>40000000)throw Error('4천만 화소 이하 이미지를 선택해주세요.');if(bgURL)URL.revokeObjectURL(bgURL);bgURL=url;url=null;bgImage=image;syncBackground();notify('배경 이미지를 적용했어요.');}catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);e.target.value='';lock(false);lastTick=0;draw();}};
$('bgRemove').onclick=()=>{if(bgURL)URL.revokeObjectURL(bgURL);bgURL=null;bgImage=null;syncBackground();draw();};
for(const id of ['bgFit','bgZoom','bgX','bgY','bgBlur','bgOpacity'])$(id).oninput=()=>{config[id]=id==='bgFit'?$(id).value:Number($(id).value);syncBackground();draw();};
$('bgReset').onclick=()=>{Object.assign(config,{bgFit:'cover',bgZoom:1,bgX:0,bgY:0,bgBlur:0,bgOpacity:1});syncBackground();draw();};
$('replaceImage').onclick=()=>$('replaceUpload').click();
$('upload').onchange=e=>uploadImages(e);$('replaceUpload').onchange=e=>uploadImages(e,true);
$('reset').onclick=()=>{if(images[selectedImage].url)URL.revokeObjectURL(images[selectedImage].url);images[selectedImage]={...imageEntry(defaultImage),caption:images[selectedImage].caption,channel:images[selectedImage].channel};updateImages();previewSelected();};
$('removeImage').onclick=()=>{if(images.length===1)return;const [removed]=images.splice(selectedImage,1);if(removed.url)URL.revokeObjectURL(removed.url);selectedImage=Math.min(selectedImage,images.length-1);rebuildDuration();updateImages();previewSelected();};
for(const [id,delta] of [['moveEarlier',-1],['moveLater',1]])$(id).onclick=()=>{const next=selectedImage+delta;if(next<0||next>=images.length)return;[images[selectedImage],images[next]]=[images[next],images[selectedImage]];selectedImage=next;updateImages();previewSelected();};
for(const id of ['fit','zoom','x','y','caption','channel'])$(id).oninput=()=>{images[selectedImage][id]=['fit','caption','channel'].includes(id)?$(id).value:Number($(id).value);if($(id+'Value'))$(id+'Value').textContent=Math.round(images[selectedImage][id]*100)+'%';previewSelected();};
$('resetPosition').onclick=()=>{Object.assign(images[selectedImage],{zoom:1,x:0,y:0});updateImages();previewSelected();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function tick(now){if(ready&&playing&&!busy){if(lastTick)time=(time+(now-lastTick)/1000)%config.duration;draw();syncTime();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
lock(true);Promise.all([load('../assets/analog-tv/clean-broadcast-v1.png'),load('../assets/analog-tv/photographic-crt-v1.png')]).then(([im,photo])=>{defaultImage=im;images=[imageEntry(im)];tvPhoto=photo;ready=true;rebuildDuration();updateImages();lock(false);draw();syncTime();}).catch(e=>notify(e.message));

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
  download(blob, 'dear-analog-tv-18.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
    if (action === 'save') {download(blob, 'dear-analog-tv-18.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-analog-tv-18.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});
