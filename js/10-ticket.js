'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');
const defaults={flight:'DS 1015',cabin:'ECONOMY',baggage:'1 PC / 23 KG',flightStatus:'CONFIRMED',terminal:'1',boardingGroup:'02',origin:'TOKYO',gate:'A08',seat:'14D',boardingTime:'18:00',bottomLeft:'ONE WAY',bottomMiddle:'01',passengerUnit:'PERSON',headingCode:'026',footerRight:'KEEP THIS TICKET',stamp:0,threshold:128,imageNoise:0,topStamp:0,topThreshold:128,topImageNoise:0,arrival:'2026-10-15',time:'18:30',destination:'SEOUL',serial:'100015',heading:'SOMEWHERE, TOGETHER.',message:'Landing in 3h 9m',footer:'VALID FOR ONE JOURNEY',paper:'#df572f',ink:'#191a17',texture:.2,bleed:0,density:1,paperFinish:'soft',textureOpacity:.35,zoom:1,cropX:.5,cropY:.5,topZoom:1,topCropX:.5,topCropY:.5};
const cabinCodes={ECONOMY:'Y','PREMIUM ECONOMY':'W',BUSINESS:'J',FIRST:'F'};
let state={...defaults},photo=null,ready=false,busy=false,queued=false,photoVersion=0,topPhoto=null,defaultTopPhoto=null,topPhotoVersion=0;
const grain=document.createElement('canvas');grain.width=1200;grain.height=480;
const gc=grain.getContext('2d');let seed=1015;
for(let i=0;i<42000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%1200;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%480;gc.fillStyle=i%2?'#00000037':'#ffffff6e';gc.fillRect(x,y,.7,.7);}
const tintCache={};
const paperBase=document.createElement('canvas');paperBase.width=1200;paperBase.height=480;const paperBaseContext=paperBase.getContext('2d');
const paperTextures=Object.fromEntries(Object.entries({soft:'../assets/receipt/soft-paper.jpg',fibers:'../assets/receipt/fibers.jpg',grain:'../assets/receipt/grain.jpg',folded:'../assets/receipt/folded.jpg',aged184:'../assets/receipt/aged184.jpg'}).map(([key,src])=>{const image=new Image();image.src=src;return [key,image];}));
const paperTextureReady=Promise.all(Object.values(paperTextures).map(image=>image.decode().then(()=>true,()=>false))).then(results=>results.every(Boolean));
const paperSurface=document.createElement('canvas');paperSurface.width=1200;paperSurface.height=480;let surfaceFinish='';
function drawPaperSurface(){
 const image=paperTextures[state.paperFinish];if(!image?.complete||!image.naturalWidth||!state.textureOpacity)return;
 if(surfaceFinish!==state.paperFinish){
  const c=paperSurface.getContext('2d'),scale=Math.max(1200/image.naturalWidth,480/image.naturalHeight),w=1200/scale,h=480/scale;
  c.clearRect(0,0,1200,480);c.drawImage(image,(image.naturalWidth-w)/2,(image.naturalHeight-h)/2,w,h,0,0,1200,480);surfaceFinish=state.paperFinish;
 }
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=state.textureOpacity*.9;ctx.drawImage(paperSurface,0,0);ctx.restore();
}
function printText(value,x,y,maxWidth){
 ctx.save();
 if(state.bleed>0){
  const size=Number(/([\d.]+)px/.exec(ctx.font)?.[1]||16),spread=state.bleed*Math.min(2.4,Math.max(.65,size*.04));
  ctx.save();ctx.globalAlpha*=state.bleed*.65;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=spread*2;ctx.lineJoin='round';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=spread*.8;ctx.strokeText(value,x,y,maxWidth);ctx.restore();
 }
 ctx.fillText(value,x,y,maxWidth);ctx.restore();
}
function printPath(path,stroke=false,size=48){
 if(state.bleed>0){
  const spread=state.bleed*Math.min(2.4,Math.max(.65,size*.04));
  ctx.save();ctx.globalAlpha*=state.bleed*.65;ctx.strokeStyle=stroke?ctx.strokeStyle:ctx.fillStyle;ctx.lineWidth=(stroke?ctx.lineWidth:0)+spread*2;ctx.lineJoin='round';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=spread*.8;ctx.stroke(path);ctx.restore();
 }
 stroke?ctx.stroke(path):ctx.fill(path);
}
function serialGuideBridge(x,y){
 const start=x+ctx.measureText('No.').width,end=x+ctx.measureText('No. ').width;
 // Match all four guide bands in the bundled Playwrite font at 48px.
 ctx.save();ctx.strokeStyle=state.ink;
 for(const [offset,width] of [[-48.048,.48],[-24.168,.24],[-.48,.96],[23.568,.48]]){
  const path=new Path2D();path.moveTo(start,y+offset);path.lineTo(end,y+offset);ctx.lineWidth=width;printPath(path,true);
 }
 ctx.restore();
}
// Original geometry: a rounded fuselage, swept wings and graduated route dots.
const planeShape=new Path2D('M-24-4 L-13-4 L-21-21 Q-21-23-17-22 L2-5 L18-5 Q26-5 29 0 Q26 5 18 5 L2 5 L-17 22 Q-21 23-21 21 L-13 4 L-24 4 L-29 11 L-34 11 L-31 0 L-34-11 L-29-11 Z');
function flightMark(){
 ctx.save();ctx.fillStyle=state.ink;
 for(const [x,r] of [[908,5.5],[921,4],[932,2.8],[1018,2.8],[1030,4],[1045,5.5]]){const path=new Path2D();path.arc(x,316,r,0,Math.PI*2);printPath(path);}
 ctx.translate(977,316);printPath(planeShape);ctx.restore();
}
function flightProperties(){
 ctx.strokeStyle=state.ink;ctx.lineWidth=1;ctx.strokeRect(255,36,220,53);ctx.strokeRect(503,36,96,53);
 ctx.save();ctx.font='500 11px "DM Sans"';
 const rows=[['FLIGHT',state.flight],['CLASS',state.cabin],['BAGGAGE',state.baggage],['STATUS',state.flightStatus]].map(([label,value])=>{
  const l=ctx.measureText(label),v=ctx.measureText(value);
  return {label,value,ascent:Math.max(l.actualBoundingBoxAscent,v.actualBoundingBoxAscent),descent:Math.max(l.actualBoundingBoxDescent,v.actualBoundingBoxDescent)};
 });
 const gap=(41-rows.reduce((sum,row)=>sum+row.ascent+row.descent,0))/3;let y=42;
 for(const row of rows){
  y+=row.ascent;t(row.label,261,y,11,500,'left','"DM Sans"',62,'alphabetic');t(row.value,469,y,11,500,'right','"DM Sans"',136,'alphabetic');y+=row.descent+gap;
 }
 ctx.restore();
 ctx.fillStyle=state.ink;ctx.fillRect(503,36,48,53);
 ctx.save();ctx.fillStyle=state.paper;ctx.textAlign='center';ctx.textBaseline='top';ctx.font='500 9px "DM Sans"';printText('TERMINAL',527,45,44);ctx.font='600 21px "DM Sans"';printText(state.terminal,527,60,36);ctx.restore();
 t('GROUP',575,45,9,500,'center','"DM Sans"',44);t(state.boardingGroup,575,60,21,600,'center','"DM Sans"',36);
}
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function imageLayer(slot='main'){
 const image=slot==='main'?photo:topPhoto,version=slot==='main'?photoVersion:topPhotoVersion;
 const stamp=slot==='main'?state.stamp:state.topStamp,threshold=slot==='main'?state.threshold:state.topThreshold,noise=slot==='main'?state.imageNoise:state.topImageNoise;
 const key=[version,state.paper,state.ink,stamp,threshold,noise].join('/');if(tintCache[slot]?.key===key)return tintCache[slot].canvas;
 const tinted=document.createElement('canvas');tinted.width=image.width;tinted.height=image.height;const c=tinted.getContext('2d');c.drawImage(image,0,0);const pixels=c.getImageData(0,0,tinted.width,tinted.height),ink=rgb(state.ink);
 for(let i=0;i<pixels.data.length;i+=4){
  const d=pixels.data,l=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;
  // Keep grain fixed while dragging controls so the image does not flicker.
  let hash=Math.imul((i/4)^1597334677,2246822519);hash^=hash>>>13;
  const random=(hash>>>0)/4294967295;
  const noisy=Math.max(0,Math.min(1,l+(random-.5)*noise));
  const cut=noisy*255>=threshold?1:0;
  const tone=noisy*(1-stamp)+cut*stamp;
  // Highlights expose the actual paper, including its surface texture.
  for(let k=0;k<3;k++)d[i+k]=ink[k];
  d[i+3]=Math.round(d[i+3]*(tone>=.98?0:1-tone));
 }
 c.putImageData(pixels,0,0);tintCache[slot]={key,canvas:tinted};return tinted;
}
function t(value,x,y,size=16,weight=500,align='left',family='"DM Sans"',maxWidth=1200,baseline='top'){ctx.fillStyle=state.ink;ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign=align;ctx.textBaseline=baseline;printText(value,x,y,maxWidth);}
function rule(x,y,x2,y2,dash=[]){const path=new Path2D();path.moveTo(x,y);path.lineTo(x2,y2);ctx.setLineDash(dash);ctx.strokeStyle=state.ink;ctx.lineWidth=1.4;printPath(path,true,24);ctx.setLineDash([]);}
function circle(x,y,r,fill=false){const path=new Path2D();path.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=state.ink;ctx.lineWidth=1.5;printPath(path,!fill,28);}
function landscape(){
 ctx.save();ctx.translate(0,10);
 ctx.fillStyle=state.ink;ctx.beginPath();for(let i=0;i<48;i++){let a=i*Math.PI/24,r=i%2?29:48;let x=477+Math.cos(a)*r,y=231+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(255,377);ctx.lineTo(344,273);ctx.lineTo(396,321);ctx.lineTo(484,260);ctx.lineTo(601,377);ctx.closePath();ctx.fill();ctx.restore();
}
function route(){
 t('FROM',658,94,10);t(state.origin,658,112,28,700,'left','"DM Sans"',135);
 ctx.save();ctx.strokeStyle=state.ink;ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';for(const x of [686,716]){const path=new Path2D();path.moveTo(x,144);path.lineTo(x,161);path.moveTo(x-7,154);path.lineTo(x,161);path.lineTo(x+7,154);printPath(path,true,28);}ctx.restore();
 t('ARRIVAL',994,94,10);t(state.time||'--:--',994,118,22,700);
 ctx.fillStyle=state.ink;circle(801,133,3,true);
 const curve=new Path2D();curve.moveTo(801,133);curve.quadraticCurveTo(831,107,861,104);ctx.strokeStyle=state.ink;ctx.lineWidth=2;printPath(curve,true,28);
 const dotted=new Path2D();dotted.moveTo(872,104);dotted.quadraticCurveTo(920,98,969,132);ctx.setLineDash([3,6]);ctx.lineWidth=1.7;printPath(dotted,true,28);ctx.setLineDash([]);
 const arrow=new Path2D();arrow.moveTo(869,103);arrow.lineTo(857,99);arrow.lineTo(860,105);arrow.lineTo(858,111);arrow.closePath();printPath(arrow,false,28);
 circle(969,132,7);circle(969,132,2.5,true);t(state.message.replace(/\s+/g,' '),836,139,13,500,'left','"DM Sans"',145);
}
function drawPhoto(slot,x,y,w,h){
 const img=imageLayer(slot),zoom=slot==='main'?state.zoom:state.topZoom,cropX=slot==='main'?state.cropX:state.topCropX,cropY=slot==='main'?state.cropY:state.topCropY;
 const scale=Math.max(w/img.width,h/img.height)*zoom,dw=img.width*scale,dh=img.height*scale;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x-(dw-w)*cropX,y-(dh-h)*cropY,dw,dh);ctx.restore();
}
function draw(){
 const ink=state.ink,paper=state.paper;
 const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(state.arrival),year=parts?parts[1]:'----',day=parts?String(Number(parts[3])):'--',month=parts?['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][Number(parts[2])-1]:'---';
 const weekday=parts?['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date(Number(parts[1]),Number(parts[2])-1,Number(parts[3])).getDay()]:'---';
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1200,480);ctx.fillStyle=paper;ctx.fillRect(0,0,1200,480);drawPaperSurface();paperBaseContext.drawImage(canvas,0,0);
 rule(224,28,224,452,[5,5]);rule(630,22,630,458);
 ctx.save();ctx.translate(27,454);ctx.rotate(-Math.PI/2);
 ctx.fillStyle=ink;ctx.beginPath();ctx.roundRect(0,0,428,27,13.5);ctx.fill();
 ctx.fillStyle=paper;ctx.font='600 14px "DM Sans"';ctx.textBaseline='top';
 ctx.textAlign='left';printText(weekday,12,7);ctx.textAlign='center';printText(month+' '+day+', '+year,214,7);ctx.textAlign='right';printText(state.boardingTime||'--:--',416,7);ctx.restore();
 t(month,200,60,16,650,'right');t(day,204,65,100,900,'right','Georgia');t(year,200,176,17,500,'right');
 rule(76,238,200,238);t('GATE',129,248,10,500,'right');t('SEAT',200,248,10,500,'right');t(state.gate,129,267,23,650,'right','"DM Sans"',53);t(state.seat,200,267,23,650,'right','"DM Sans"',53);rule(138,238,138,306);
 rule(76,306,200,306);t('BOARDING TIME',200,318,10,500,'right');t(state.boardingTime||'--:--',200,339,31,600,'right','"DM Sans"',124);ctx.save();ctx.fillStyle=ink;ctx.fillRect(76,397,124,21);ctx.fillStyle=paper;ctx.font='700 12px "DM Sans"';ctx.textAlign='center';ctx.textBaseline='middle';printText('NO. '+state.serial,138,407.5,114);ctx.restore();
 rule(76,418,200,418);rule(76,450,200,450);rule(117,418,117,450);rule(159,418,159,450);
 for(const [label,value,x] of [['GATE',state.gate,96.5],['SEAT',state.seat,138],['CLASS',cabinCodes[state.cabin],179.5]]){
  t(label,x,429,8,700,'center','"DM Sans"',37,'alphabetic');t(value,x,443,16,700,'center','"DM Sans"',35,'alphabetic');
 }
 flightProperties();
 if(photo)drawPhoto('main',252,97,350,303);else landscape();
 rule(252,408,602,408);rule(462,408,462,458);
 t('JOURNEY TYPE',252,424,10,400,'left','"DM Sans"',190,'alphabetic');t(state.bottomLeft,252,451,31,700,'left','"DM Sans"',175,'alphabetic');
 t('PASSENGERS',477,424,10,400,'left','"DM Sans"',125,'alphabetic');t(state.bottomMiddle,477,452,31,700,'left','"DM Sans"',43,'alphabetic');t(state.passengerUnit,525,450,11,400,'left','"DM Sans"',77,'alphabetic');
 t(state.heading,658,63,25,700,'left','"DM Sans"',330,'alphabetic');t(state.headingCode,1058,62,12,400,'right','"DM Sans"',50,'alphabetic');
 if(topPhoto)drawPhoto('top',650,87,408,108);
 rule(650,76,1058,76);
 ctx.save();ctx.translate(0,112);route();ctx.restore();
 t(state.destination,654,283,72,850,'left','"DM Sans"',244);flightMark();
 ctx.fillStyle=ink;ctx.fillRect(658,375,400,34);
 rule(658,375,1058,375);rule(658,409,1058,409);rule(658,460,1058,460);rule(743,409,743,460);rule(970,409,970,460);
 ctx.save();ctx.strokeStyle=paper;ctx.lineWidth=1.4;ctx.beginPath();for(const x of [743,970]){ctx.moveTo(x,375);ctx.lineTo(x,409);}ctx.stroke();
 ctx.fillStyle=paper;ctx.font='500 13px "DM Sans"';ctx.textAlign='center';ctx.textBaseline='middle';printText('GATE',700.5,392);printText('Boarding time',856.5,392);printText('SEAT',1014,392);ctx.restore();
 ctx.save();ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='alphabetic';
 for(const [value,x,size,width] of [[state.gate,700.5,30,75],[state.boardingTime||'--:--',856.5,37,207],[state.seat,1014,30,74]]){
  ctx.font='600 '+size+'px "DM Sans"';const bounds=ctx.measureText(value);
  printText(value,x,434.5+(bounds.actualBoundingBoxAscent-bounds.actualBoundingBoxDescent)/2,width);
 }
 ctx.restore();
 t(state.footer,658,34,12,700,'left','"DM Sans"',230,'alphabetic');t(state.footerRight,1058,34,12,700,'right','"DM Sans"',160,'alphabetic');rule(1076,28,1076,452,[4,5]);
 ctx.save();ctx.translate(1123,240);ctx.rotate(Math.PI/2);ctx.fillStyle=ink;ctx.font='400 48px "Playwrite CA Guides", cursive';ctx.textAlign='left';ctx.textBaseline='alphabetic';const serial='No. '+state.serial,serialBounds=ctx.measureText(serial);ctx.scale(Math.min(1,400/(serialBounds.actualBoundingBoxLeft+serialBounds.actualBoundingBoxRight)),1);const serialX=(serialBounds.actualBoundingBoxLeft-serialBounds.actualBoundingBoxRight)/2,serialY=(serialBounds.actualBoundingBoxAscent-serialBounds.actualBoundingBoxDescent)/2;printText(serial,serialX,serialY);serialGuideBridge(serialX,serialY);ctx.restore();
 // Fade the complete print against the textured paper in one pass.
 if(state.density<1){ctx.save();ctx.globalAlpha=1-state.density;ctx.drawImage(paperBase,0,0);ctx.restore();}
 ctx.save();ctx.globalAlpha=state.texture;ctx.drawImage(grain,0,0);ctx.restore();
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';for(const [x,y,r] of [[0,0,22],[1200,0,22],[0,480,22],[1200,480,22],[224,0,24],[224,480,24]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function redraw(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(ready)draw();});}
function outputs(){for(const key of ['texture','stamp','imageNoise','topStamp','topImageNoise','bleed','density','textureOpacity'])$(key+'Value').value=Math.round(state[key]*100)+'%';$('thresholdValue').value=state.threshold;$('topThresholdValue').value=state.topThreshold;}
function sync(){for(const key in state)$(key).value=state[key];outputs();}
function selectPanel(name,target,focus=false){
 if(busy)return;
 document.querySelectorAll('.editor-panel').forEach(panel=>panel.hidden=panel.id!=='panel-'+name);
 document.querySelectorAll('[data-panel]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.panel===name)));
 document.querySelectorAll('.control.is-active').forEach(control=>control.classList.remove('is-active'));
 const control=target&&$(target)?.closest('.control');
 if(control){control.classList.add('is-active');const body=$('panelBody');body.scrollTop+=control.getBoundingClientRect().top-body.getBoundingClientRect().top-16;if(focus)$(target).focus({preventScroll:true});}
 else $('panelBody').scrollTop=0;
}
document.querySelectorAll('[data-panel]').forEach(button=>button.onclick=()=>selectPanel(button.dataset.panel));
const ticketRegions=[
 ['date','arrival','날짜',68,42,144,175],['date','serial','티켓 번호',1077,28,100,424],
 ['boarding','gate','게이트',76,238,62,68],['boarding','seat','좌석',138,238,62,68],['boarding','boardingTime','탑승 시간',76,307,124,76],
 ['date','serial','티켓 번호',76,397,124,21],['boarding','gate','게이트',76,418,41,32],['boarding','seat','좌석',117,418,42,32],['flight','cabin','좌석 등급',159,418,41,32],
 ['date','arrival','날짜',27,26,27,428],
 ['flight','flight','항공편',255,36,220,14],['flight','cabin','좌석 등급',255,50,220,11],['flight','baggage','수하물',255,61,220,11],['flight','flightStatus','탑승 상태',255,72,220,17],
 ['flight','terminal','터미널',503,36,48,53],['flight','boardingGroup','탑승 그룹',551,36,48,53],
 ['mainImage',null,'가운데 이미지',252,97,350,303],['topImage',null,'상단 이미지',650,87,408,108],
 ['text','bottomLeft','여정 종류',252,408,210,50],['text','bottomMiddle','승객 수',462,408,140,50],
 ['text','footer','상단 왼쪽 안내',658,20,230,19],['text','footerRight','상단 오른쪽 안내',898,20,160,19],
 ['text','headingCode','제목 코드',1000,30,58,46],['text','heading','사진 위 문구',650,30,350,46],
 ['route','origin','출발지',650,203,140,74],['route','time','도착 시간',990,203,68,65],['route','message','이동 경로 문구',794,210,190,67],['route','destination','도착지',650,281,408,70],
 ['boarding','gate','게이트',658,375,85,85],['boarding','boardingTime','탑승 시간',743,375,227,85],['boarding','seat','좌석',970,375,88,85]
];
let activeRegion=null;
function regionAt(event){const box=canvas.getBoundingClientRect(),x=(event.clientX-box.left)*1200/box.width,y=(event.clientY-box.top)*480/box.height;return ticketRegions.find(([, , ,a,b,w,h])=>x>=a&&x<=a+w&&y>=b&&y<=b+h);}
function showRegion(region,focus=false){
 const mark=$('hoverMark');
 if(!region||busy){mark.hidden=true;activeRegion=null;return;}
 activeRegion=region;if(focus)selectPanel(region[0],region[1],true);
 const [,,label,x,y,w,h]=region;mark.hidden=false;mark.style.left=x/12+'%';mark.style.top=y/4.8+'%';mark.style.width=w/12+'%';mark.style.height=h/4.8+'%';mark.firstElementChild.textContent=label;
}
canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')showRegion(regionAt(event));});
canvas.addEventListener('pointerleave',()=>showRegion(null));
canvas.addEventListener('click',event=>showRegion(regionAt(event),true));
function update(el){const key=el.id;state[key]=el.type==='range'?Number(el.value):el.value;outputs();redraw();}
$('editor').addEventListener('input',e=>{if(e.target.hasAttribute('data-key')&&e.target.type!=='color')update(e.target);});
$('editor').addEventListener('change',e=>{if(e.target.hasAttribute('data-key')&&e.target.type==='color')update(e.target);});
document.querySelectorAll('[data-paper]').forEach(button=>button.onclick=()=>{state.paper=button.dataset.paper;sync();redraw();});
function lock(value){busy=value;$('fields').disabled=value;$('png').disabled=value||!ready;}
async function uploadImage(input,slot){
 const file=input.files[0];if(!file)return;lock(true);let url;
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PNG, JPG, WEBP 이미지를 선택해주세요.');
  if(file.size>20000000)throw Error('20MB 이하 이미지를 선택해주세요.');
  url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),next=document.createElement('canvas');
  next.width=Math.max(1,Math.round(image.naturalWidth*scale));next.height=Math.max(1,Math.round(image.naturalHeight*scale));next.getContext('2d').drawImage(image,0,0,next.width,next.height);
  if(slot==='main'){photo=next;photoVersion++;state.zoom=1;state.cropX=state.cropY=.5;}
  else{topPhoto=next;topPhotoVersion++;state.topZoom=1;state.topCropX=state.topCropY=.5;}
  sync();draw();$('notice').textContent='이미지를 적용했습니다.';
 }catch(error){$('notice').textContent=error.message||'이미지를 불러오지 못했습니다.';}
 finally{if(url)URL.revokeObjectURL(url);input.value='';lock(false);}
}
$('upload').onchange=()=>uploadImage($('upload'),'main');
$('uploadTop').onchange=()=>uploadImage($('uploadTop'),'top');
$('removeImage').onclick=()=>{photo=null;photoVersion++;state.zoom=1;state.cropX=state.cropY=.5;sync();redraw();};
$('removeTopImage').onclick=()=>{topPhoto=defaultTopPhoto;topPhotoVersion++;state.topZoom=1;state.topCropX=.5;state.topCropY=defaults.topCropY;sync();redraw();};
$('reset').onclick=()=>{state={...defaults};photo=null;topPhoto=defaultTopPhoto;photoVersion++;topPhotoVersion++;sync();redraw();$('notice').textContent='';};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('previewShell').requestFullscreen();}catch{$('notice').textContent='이 브라우저에서는 전체 화면을 열 수 없습니다.';}};
$('png').onclick=async()=>{lock(true);try{draw();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG를 생성하지 못했습니다.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='arrival-ticket-10.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);$('notice').textContent='티켓 PNG를 저장했습니다.';}catch(error){$('notice').textContent=error.message;}finally{lock(false);}};
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>false,setPlaying:()=>{}};
(async()=>{
 sync();lock(true);
 try{await Promise.all([document.fonts.load('400 16px "DM Sans"'),document.fonts.load('500 11px "DM Sans"'),document.fonts.load('700 28px "DM Sans"'),document.fonts.load('850 72px "DM Sans"'),document.fonts.load('500 17px Ticket'),document.fonts.load('400 48px "Playwrite CA Guides"')]);}
 catch{$('notice').textContent='기본 서체로 표시합니다.';}
 try{const image=new Image();image.src='../assets/ticket/landscape-banner-generated.png';await image.decode();defaultTopPhoto=topPhoto=image;}
 catch{$('notice').textContent='기본 사진을 불러오지 못했습니다. 이미지를 선택해주세요.';}
 const texturesLoaded=await paperTextureReady;ready=true;draw();lock(false);if(topPhoto)$('notice').textContent=texturesLoaded?'':'일부 종이 표면을 불러오지 못했습니다. 기본 종이로 표시합니다.';
})();
