'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=1300,H=1024,phoneWidth=480,phoneHeight=960,phoneTop=32;
const defaults={timeText:'9:41',dateText:'10월 13일 화요일',appLabel:'메시지',nowText:'지금',wallpaper:'sunset',backgroundColor:'#e9e9ef',battery:100,arrivalGap:1.8,hold:2.4,deleteSpeed:1,deleteMode:'individual',gifWidth:720,loop:true};
const config={...defaults};
for(const kind of ['wallpaper','outside'])Object.assign(defaults,{[kind+'X']:.5,[kind+'Y']:.5,[kind+'Zoom']:1,[kind+'Blur']:0});
defaults.vhsOpacity=0;defaults.vhsEmboss=0;defaults.tapeTone=0;Object.assign(config,defaults);
const defaultMessages=()=>[{sender:'테스트1',text:'테스트 문구입니다.'},{sender:'테스트2',text:'테스트 문구입니다.'},{sender:'테스트3',text:'테스트 문구입니다.'}];
let messages=defaultMessages(),wallpaperImage=null,outsideImage=null,ready=false,time=0,playing=false,lastTick=0,busy=false,cancelled=false;
let clearAt=null,clearCount=null;
const alertControls=[['clearAlerts','알림 모두 닫기',405,30]].map(([id,label,x,width])=>{
  const button=document.createElement('button');button.id=id;button.type='button';button.className='alert-control';button.setAttribute('aria-label',label);button.hidden=true;$('previewShell').append(button);return {button,x,width};
});
function positionAlertControls(){
  const rect=canvas.getBoundingClientRect(),host=$('previewShell').getBoundingClientRect(),scale=Math.min(rect.width/W,rect.height/H);
  for(const {button,x,width} of alertControls){button.style.left=`${rect.left-host.left+(rect.width-W*scale)/2+((W-phoneWidth)/2+x)*scale}px`;button.style.top=`${rect.top-host.top+(rect.height-H*scale)/2+(phoneTop+271)*scale}px`;button.style.width=`${width*scale}px`;button.style.height=`${30*scale}px`;}
}
new ResizeObserver(positionAlertControls).observe(canvas);
function resetAlerts(){clearAt=null;clearCount=null;}
$('clearAlerts').onclick=()=>{if(busy)return;clearAt=time;clearCount=messages.filter((_,i)=>time>=arrival(i)).length;playing=true;lastTick=0;syncTime();draw();};
function duration(){config.duration=1+(messages.length-1)*config.arrivalGap+config.hold+(config.deleteMode==='all'?1:messages.length)/config.deleteSpeed+.8;$('scrub').max=config.duration;}
function notify(text){$('notice').textContent=text;}
function syncTime(){$('scrub').value=time;$('clock').textContent=`${time.toFixed(1)} / ${config.duration.toFixed(1)} s`;$('play').textContent=playing?'Ⅱ':'▶';}
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>1-Math.pow(1-clamp(v),3);
function box(x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function text(value,x,y,size=16,color='#fff',weight=400,align='left'){ctx.font=`${weight} ${size}px Phone, -apple-system, BlinkMacSystemFont, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(value,x,y);}
function lines(value,width,max){const result=[];let line='';for(const ch of value){if(ch==='\n'||ctx.measureText(line+ch).width>width){result.push(line);line=ch==='\n'?'':ch;}else line+=ch;}result.push(line);if(result.length>max){result.length=max;let last=result[max-1];while(ctx.measureText(last+'…').width>width)last=last.slice(0,-1);result[max-1]=last+'…';}return result;}
const background=document.createElement('canvas');background.width=phoneWidth;background.height=phoneHeight;
const wallpaperBase=document.createElement('canvas');wallpaperBase.width=phoneWidth;wallpaperBase.height=phoneHeight;const bg=wallpaperBase.getContext('2d');
const outsideBackground=document.createElement('canvas');outsideBackground.width=W;outsideBackground.height=H;
function drawBackground(target,image,kind){
  const c=target.getContext('2d'),w=target.width,h=target.height;
  c.clearRect(0,0,w,h);if(!image)return;
  const scale=Math.max(w/image.width,h/image.height)*config[kind+'Zoom'],sw=w/scale,sh=h/scale;
  const sx=Math.max(0,Math.min(image.width-sw,image.width*config[kind+'X']-sw/2)),sy=Math.max(0,Math.min(image.height-sh,image.height*config[kind+'Y']-sh/2));
  const blur=config[kind+'Blur'],pad=blur*2;
  c.save();c.filter=`blur(${blur}px)`;c.drawImage(image,sx,sy,sw,sh,-pad,-pad,w+pad*2,h+pad*2);c.restore();
}
function makeOutside(){drawBackground(outsideBackground,outsideImage,'outside');}
function makeWallpaper(){
  bg.clearRect(0,0,phoneWidth,phoneHeight);
  if(wallpaperImage){drawBackground(background,wallpaperImage,'wallpaper');return;}
  const colors=config.wallpaper==='sunset'?['#ffcf65','#ff744b','#e74577','#243f89']:config.wallpaper==='aurora'?['#166196','#ae163b','#ff204a','#21b0bd']:['#082633','#12666b','#379fa0','#d7ad75'];
  const g=bg.createLinearGradient(50,0,400,phoneHeight);colors.forEach((v,i)=>g.addColorStop(i/3,v));bg.fillStyle=g;bg.fillRect(0,0,phoneWidth,phoneHeight);
  bg.beginPath();bg.moveTo(-60,-20);bg.bezierCurveTo(120,50,30,350,220,420);bg.bezierCurveTo(410,520,370,720,180,990);bg.lineTo(-60,990);bg.closePath();const wave=bg.createLinearGradient(0,0,360,phoneHeight);wave.addColorStop(0,'#b4bccb');wave.addColorStop(.45,'#7a91ad');wave.addColorStop(.7,'#043d74');wave.addColorStop(1,'#812c8b');bg.fillStyle=wave;bg.fill();
  drawBackground(background,wallpaperBase,'wallpaper');
}
function arrival(index){return 1+index*config.arrivalGap;}
function closeStart(){return clearAt??arrival(messages.length-1)+config.hold;}
function deletion(index,t){
  const count=clearCount??messages.length;
  if(index>=count)return {offset:460,expand:1,finish:1,settle:1};
  const elapsed=(t-closeStart())*config.deleteSpeed-(config.deleteMode==='all'?0:count-1-index);
  if(config.deleteMode==='all')return {offset:0,expand:0,finish:ease((elapsed-.56)/.24),settle:0};
  const reveal=ease(elapsed/.3),expand=ease((elapsed-.32)/.24),finish=ease((elapsed-.56)/.24);
  return {offset:260*reveal+200*finish,expand,finish,settle:ease((elapsed-.8)/.18)};
}
function draw(t=time){
  if(!ready)return;ctx.resetTransform();ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.fillStyle=config.backgroundColor;ctx.fillRect(0,0,W,H);
  if(outsideImage)ctx.drawImage(outsideBackground,0,0);
  ctx.translate((W-phoneWidth)/2,phoneTop);
  const rim=ctx.createLinearGradient(18,0,462,0);[['0','#323339'],['.02','#e7e8ec'],['.05','#6b6c72'],['.1','#101114'],['.9','#101114'],['.95','#92949a'],['.98','#e3e4e8'],['1','#303137']].forEach(([p,c])=>rim.addColorStop(+p,c));
  box(17,5,446,950,65,rim);box(23,11,434,938,60,'#08090b');box(15,165,3,44,2,'#989ba2');box(15,229,3,64,2,'#989ba2');box(15,311,3,64,2,'#989ba2');box(462,251,3,100,2,'#989ba2');
  ctx.save();ctx.beginPath();ctx.roundRect(34,23,412,914,48);ctx.clip();ctx.drawImage(background,34,23,412,914);
  box(128,23,224,35,[0,0,25,25],'#000');box(208,33,53,5,3,'#17181b');box(276,30,10,10,5,'#142434');
  ctx.save();ctx.translate(-8,-5);
  for(let i=0;i<4;i++)box(359+i*5,55-i*3,3,6+i*3,1,'#fff');ctx.strokeStyle='white';ctx.lineWidth=2;ctx.beginPath();ctx.arc(393,59,10,Math.PI*1.22,Math.PI*1.78);ctx.stroke();ctx.beginPath();ctx.arc(393,59,6,Math.PI*1.22,Math.PI*1.78);ctx.stroke();box(391,58,4,3,2,'#fff');
  ctx.strokeStyle='white';ctx.lineWidth=1;ctx.strokeRect(411,50,23,11);box(413,52,19*config.battery/100,7,1,config.battery<20?'#ff3b30':'white');box(435,53,2,5,1,'white');
  ctx.restore();
  ctx.strokeStyle='white';ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(240,112,8,Math.PI,0);ctx.lineTo(248,117);ctx.moveTo(232,117);ctx.lineTo(232,112);ctx.stroke();box(229,117,22,18,4,'white');
  text(config.timeText,240,154,78,'white',200,'center');text(config.dateText,240,239,21,'white',400,'center');
  ctx.font='400 16px Phone,sans-serif';
  const cards=messages.map(message=>{
    const body=lines(message.text,358,2);
    return {body,height:body.length===1?94:(messages.length>=4?100:105)};
  });
  const arrived=messages.filter((_,i)=>t>=arrival(i)).length;
  const controlsVisible=arrived>0&&t<closeStart();
  $('clearAlerts').hidden=!controlsVisible;$('clearAlerts').disabled=busy;
  if(arrived>0){
    ctx.save();ctx.globalAlpha=1-deletion(0,t).finish;
    text('알림 센터',45,274,23,'white',400);
    const clearPhase=(t-closeStart())*config.deleteSpeed;
    if(config.deleteMode==='all'&&clearPhase>=.15){
      box(363,271,72,30,15,clearPhase>=.5?'#ffffffed':'#ffffffb8');text('지우기',399,278,15,'#292b30',400,'center');
    }else{
      box(405,271,30,30,15,config.deleteMode==='all'&&clearPhase>=0?'#ffffffed':'#ffffffb8');ctx.strokeStyle='#292b30';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(415,281);ctx.lineTo(425,291);ctx.moveTo(425,281);ctx.lineTo(415,291);ctx.stroke();
    }
    ctx.restore();
  }
  positionAlertControls();
  for(let i=0;i<messages.length;i++){
    const {body,height:cardHeight}=cards[i];
    const age=t-arrival(i);if(age<0)continue;const enter=ease(age/.42),dismiss=deletion(i,t);if(dismiss.finish===1)continue;
    // Newest notification appears first; older cards move down as it arrives.
    let shift=0;for(let j=i+1;j<(clearCount??messages.length);j++)shift+=(ease((t-arrival(j))/.42)-deletion(j,t).settle)*(cards[j].height+10);
    const y=306+shift;
    ctx.save();ctx.globalAlpha=enter*(1-dismiss.finish);ctx.translate(0,-(1-enter)*22);
    ctx.beginPath();ctx.rect(45,y,390,cardHeight);ctx.clip();
    if(dismiss.offset>0){
      ctx.save();ctx.globalAlpha*=1-dismiss.expand;
      box(185,y,120,cardHeight,17,'#ffffffb8');text('옵션',245,y+cardHeight/2-10,18,'#24252a',400,'center');ctx.restore();
      const clearX=315-130*dismiss.expand-140*dismiss.finish;
      box(clearX,y,435-clearX,cardHeight,17,'#ffffffb8');text('지우기',(clearX+435)/2,y+cardHeight/2-10,18,'#24252a',400,'center');
    }
    ctx.translate(-dismiss.offset,0);
    ctx.save();ctx.beginPath();ctx.roundRect(45,y,390,cardHeight,17);ctx.clip();ctx.filter='blur(15px)';ctx.drawImage(background,34,23,412,914);ctx.filter='none';box(45,y,390,cardHeight,17,'rgba(255,255,255,.67)');ctx.restore();
    const icon=ctx.createLinearGradient(0,y+12,0,y+36);icon.addColorStop(0,'#67e963');icon.addColorStop(1,'#13ba32');box(57,y+12,24,24,6,icon);box(61,y+17,16,11,6,'white');ctx.beginPath();ctx.moveTo(64,y+25);ctx.lineTo(63,y+30);ctx.lineTo(69,y+27);ctx.fillStyle='white';ctx.fill();
    ctx.font='400 13px Phone,sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#454852';
    const headerMetrics=ctx.measureText(config.appLabel),headerBaseline=y+24+(headerMetrics.actualBoundingBoxAscent-headerMetrics.actualBoundingBoxDescent)/2;
    ctx.fillText(config.appLabel,89,headerBaseline);
    ctx.textAlign='right';ctx.fillStyle='#55565e';const timeMetrics=ctx.measureText(config.nowText);ctx.fillText(config.nowText,421,y+24+(timeMetrics.actualBoundingBoxAscent-timeMetrics.actualBoundingBoxDescent)/2);
    ctx.save();ctx.beginPath();ctx.rect(58,y+42,361,cardHeight-44);ctx.clip();text(messages[i].sender,58,y+42,17,'#15151a',600);body.forEach((line,j)=>text(line,58,y+62+j*18,16,'#16161b'));ctx.restore();ctx.restore();
  }
  for(const x of [108,372]){box(x-25,847,50,50,25,'#0004');}
  box(102,859,12,3,1,'white');
  ctx.beginPath();ctx.moveTo(102,864);ctx.lineTo(114,864);ctx.lineTo(114,867);ctx.lineTo(111,871);ctx.lineTo(111,884);ctx.quadraticCurveTo(111,887,108,887);ctx.quadraticCurveTo(105,887,105,884);ctx.lineTo(105,871);ctx.lineTo(102,867);ctx.closePath();ctx.fillStyle='white';ctx.fill();
  box(106.5,874,3,7,1.5,'#536074');box(107,875,2,2,1,'white');
  box(359,864,27,18,4,'white');box(365,860,12,6,2,'white');ctx.strokeStyle='#657b91';ctx.lineWidth=2;ctx.beginPath();ctx.arc(373,873,5,0,Math.PI*2);ctx.stroke();
  box(175,921,130,4,2,'white');ctx.restore();
  applyVhs(ctx,config.vhsOpacity,t/config.duration);applyTapeTone(ctx,config.tapeTone);applyVhsEmboss(ctx,config.vhsEmboss);
  canvas.dataset.notifications=messages.filter((_,i)=>t>=arrival(i)&&deletion(i,t).finish<1).length;
}
function renderMessages(){resetAlerts();const root=$('messageRows');root.replaceChildren();messages.forEach((message,i)=>{const row=document.createElement('div');row.className='message-row';const head=document.createElement('header');head.textContent=`문자 ${i+1}`;const remove=document.createElement('button');remove.type='button';remove.textContent='삭제';remove.disabled=messages.length===1;remove.dataset.remove=i;head.append(remove);row.append(head);for(const [key,labelText] of [['sender','보낸 사람'],['text','문자 내용']]){const label=document.createElement('label');label.htmlFor=`${key}${i}`;label.textContent=labelText;const input=document.createElement(key==='text'?'textarea':'input');input.id=label.htmlFor;input.maxLength=key==='text'?180:28;input.value=message[key];input.dataset.message=i;input.dataset.key=key;row.append(label,input);}root.append(row);});$('addMessage').disabled=messages.length===5;$('messageCount').textContent=`${messages.length} / 5`;duration();time=Math.min(time,config.duration);syncTime();draw();}
function syncForm(){for(const input of document.querySelectorAll('[data-config]')){if(input.type==='checkbox')input.checked=config[input.id];else input.value=config[input.id];}}
$('addMessage').onclick=()=>{messages.push({sender:`테스트${messages.length+1}`,text:'테스트 문구입니다.'});renderMessages();};
$('editor').addEventListener('click',event=>{const button=event.target.closest('[data-remove]');if(button&&messages.length>1){messages.splice(+button.dataset.remove,1);renderMessages();}});
$('editor').addEventListener('input',event=>{const input=event.target;if(input.dataset.message!==undefined){messages[+input.dataset.message][input.dataset.key]=input.value;}else if(input.hasAttribute('data-config')){let value=input.type==='checkbox'?input.checked:input.value;if(input.type==='number'||input.type==='range'||input.id==='gifWidth'){if(value==='')return;value=Number(value);if(!Number.isFinite(value))return;value=Math.max(Number(input.min||0),Math.min(Number(input.max||960),value));}config[input.id]=value;if(input.id.startsWith('wallpaper'))makeWallpaper();if(input.id.startsWith('outside'))makeOutside();duration();}time=Math.min(time,config.duration);syncTime();draw();});
const tabs=[...document.querySelectorAll('[data-tab]')];function selectTab(tab){tabs.forEach(button=>{const selected=button===tab;button.setAttribute('aria-selected',selected);button.tabIndex=selected?0:-1;$(button.dataset.tab).hidden=!selected;});}tabs.forEach((tab,i)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=event=>{let n;if(event.key==='ArrowRight')n=(i+1)%3;else if(event.key==='ArrowLeft')n=(i+2)%3;else if(event.key==='Home')n=0;else if(event.key==='End')n=2;else return;event.preventDefault();selectTab(tabs[n]);tabs[n].focus();};});selectTab(tabs[0]);
async function uploadBackground(event,kind){const file=event.target.files[0];if(!file)return;const url=URL.createObjectURL(file);const image=new Image();lock(true);try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('이미지를 읽지 못했어요.'));image.src=url;});if(kind==='wallpaper'){wallpaperImage=image;makeWallpaper();}else{outsideImage=image;makeOutside();}draw();notify('배경 이미지를 바꿨어요.');}catch(error){notify(error.message);}finally{URL.revokeObjectURL(url);lock(false);event.target.value='';}}
$('wallpaperUpload').onchange=event=>uploadBackground(event,'wallpaper');
$('outsideUpload').onchange=event=>uploadBackground(event,'outside');
$('clearOutside').onclick=()=>{outsideImage=null;makeOutside();draw();};
$('clearWallpaper').onclick=()=>{wallpaperImage=null;makeWallpaper();draw();};
$('play').onclick=()=>{playing=!playing;if(time>=config.duration){time=0;resetAlerts();}lastTick=0;syncTime();};$('restart').onclick=()=>{resetAlerts();time=0;lastTick=0;draw();syncTime();};$('scrub').oninput=()=>{resetAlerts();playing=false;time=+$('scrub').value;draw();syncTime();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('previewShell').requestFullscreen();}catch{notify('전체 화면을 열지 못했어요.');}};
$('reset').onclick=()=>{if(!confirm('문자와 화면 설정을 처음으로 되돌릴까요?'))return;Object.assign(config,defaults);messages=defaultMessages();wallpaperImage=null;outsideImage=null;makeOutside();time=0;playing=false;syncForm();makeWallpaper();renderMessages();};
function lock(value){busy=value;$('settingsFields').disabled=value;for(const id of ['png','gif','video','play','scrub','reset','restart','fullscreen'])$(id).disabled=value;tabs.forEach(tab=>tab.disabled=value);}
function download(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
const breathe=()=>new Promise(resolve=>setTimeout(resolve,0));
function tick(stamp){if(playing&&!busy){if(lastTick)time+=(stamp-lastTick)/1000;if(time>=config.duration){if(config.loop)resetAlerts();time=config.loop?time%config.duration:config.duration;if(!config.loop)playing=false;}draw();syncTime();}lastTick=stamp;requestAnimationFrame(tick);}
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=value;lastTick=0;syncTime();}};
document.fonts.ready.then(()=>{ready=true;syncForm();makeWallpaper();renderMessages();canvas.dataset.ready='true';notify('문자를 편집하고 재생해보세요.');requestAnimationFrame(tick);});

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
  download(blob, 'iphone-lock-screen.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
    if (action === 'save') {download(blob, 'iphone-lock-screen.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `iphone-lock-screen.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});

