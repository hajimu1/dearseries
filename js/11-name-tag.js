'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),backCanvas=$('sceneBack');
let ctx=canvas.getContext('2d');
const defaults={backKicker:'A LITTLE MORE',backTitle:'ABOUT ME*',nickname:'J',wake:'7 AM',bed:'11 PM',weekends:'Coffee, music &\nlong walks',outfit:'White tee & denim',favoriteApp:'Pinterest',book:'A Room of One’s Own',title:'CREATORS*',kicker:'THE',name:'JANG',role:'メイド♡',handle:'@dearalien',serial:'DS—0011',note:'BIRTHDAY / YYYY.MM.DD',lettering:'handwriting',paper:'#f1eedf',ink:'#232621',accent:'#aa5367',grain:.25,reflection:.08,background:'studio',backgroundColor:'#d5d6d0',backgroundBlur:8,faceGap:40,zoom:1.5,cropX:.5,cropY:.05,mono:'color'};
let state={...defaults},ready=false,busy=false,photo,defaultPhoto;
const assets={};
let backgroundPhoto=null,backgroundVersion=0,backgroundKey='';
const backgroundCanvas=$('stageBackground');
function paintBackground(target){
 const c=target.getContext('2d'),w=target.width,h=target.height;c.clearRect(0,0,w,h);
 if(state.background==='transparent')return;
 c.fillStyle=state.background==='white'?'#fafafa':state.backgroundColor;c.fillRect(0,0,w,h);
 if(state.background==='photo'&&backgroundPhoto){
  const pad=state.backgroundBlur*3,scale=Math.max((w+pad*2)/backgroundPhoto.width,(h+pad*2)/backgroundPhoto.height),iw=backgroundPhoto.width*scale,ih=backgroundPhoto.height*scale;
  c.save();c.filter=`blur(${state.backgroundBlur}px)`;c.drawImage(backgroundPhoto,(w-iw)/2,(h-ih)/2,iw,ih);c.restore();
 }
}
function text(value,x,y,size,weight=400,color=state.ink,width=550,font='DM'){
 ctx.fillStyle=color;ctx.font=`${font==='Georgia'?'italic ':''}${weight} ${size}px ${font},Scene,sans-serif`;ctx.fillText(value,x,y,width);
}
function line(x,y,w,dashed=false){ctx.strokeStyle=state.ink;ctx.lineWidth=1.5;ctx.setLineDash(dashed?[5,7]:[]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();ctx.setLineDash([]);}
function handwritingFamily(char){
 if(/\p{Script=Hangul}/u.test(char))return 'EastSeaDokdo';
 if(/\p{Script=Han}/u.test(char))return 'ZhiMangXing';
 if(/[\p{Script=Hiragana}\p{Script=Katakana}ー々〆]/u.test(char))return 'HachiMaruPop';
 return 'RockSalt';
}
function handwriting(value,x,y,width,sizeScale=1){
 const sizes={RockSalt:34,EastSeaDokdo:58,ZhiMangXing:52,HachiMaruPop:38},runs=[];
 for(const char of value){const family=handwritingFamily(char),last=runs.at(-1);if(last?.family===family)last.value+=char;else runs.push({family,value:char});}
 const setFont=(run,scale)=>{ctx.font=`${run.family==='HachiMaruPop'?700:400} ${sizes[run.family]*scale}px ${run.family},HachiMaruPop,Scene,sans-serif`;};
 let total=0,ascent=0,descent=0;
 for(const run of runs){setFont(run,1);const m=ctx.measureText(run.value);total+=m.width;ascent=Math.max(ascent,m.actualBoundingBoxAscent);descent=Math.max(descent,m.actualBoundingBoxDescent);}
 const scale=Math.min(sizeScale,width/(total||1),49*sizeScale/(ascent+descent||1)),baseline=Math.min(y,y+9-descent*scale);
 ctx.fillStyle=state.accent;
 for(const run of runs){setFont(run,scale);ctx.fillText(run.value,x,baseline);x+=ctx.measureText(run.value).width;}
}
const backFields=[
 ['NAME','name',660],['NICKNAME','nickname',738],['OCCUPATION','role',816],
 ['WAKE UP AT','wake',894,234,252],['IN BED BY','bed',894,534,252],
 ['ON THE WEEKENDS…','weekends',978,234,552,2],['GO-TO OUTFIT','outfit',1098],
 ['FAVORITE APP','favoriteApp',1180],['BOOK REC.','book',1262,234,552,2]
];
for(const [label,key] of backFields){defaults['label_'+key]=label;state['label_'+key]=label;}
let side='front';
function star(x,y,size=17){ctx.fillStyle=state.ink;ctx.beginPath();for(let point=0;point<10;point++){const angle=-Math.PI/2+point*Math.PI/5,radius=point%2?size*7.5/17:size;const px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;if(point===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();}
function drawBack(){
 for(let i=0;i<=10;i++){star(250+i*524/10,580,14);star(250+i*524/10,1368,14);}
 for(let i=1;i<15;i++){star(250,580+i*788/15,14);star(774,580+i*788/15,14);}
 ctx.save();ctx.translate(114,188);ctx.scale(.78,.85);
 text(state.backKicker,234,560,18,650,state.ink,552);
 text(state.backTitle,230,616,70,950,state.ink,556);line(234,635,552,true);
 for(const [label,key,y,x=234,width=552,rows=1] of backFields){
  text(state['label_'+key],x,y,20,650,state.ink,width);
  const values=state[key].split(/\r?\n/);
  for(let row=0;row<rows;row++){
   const value=row===rows-1?values.slice(row).join(' '):values[row]||'';
   if(state.lettering==='handwriting')handwriting(value,x+4,y+38+row*35,width-8,.88);
   else text(value,x+4,y+38+row*35,34,state.lettering==='sans'?600:400,state.accent,width-8,state.lettering==='sans'?'DM':'Georgia');
  }
  if(key!=='book')line(x,y+52+(rows-1)*35,width,true);
 }
 ctx.restore();
}
function setSide(value){
 if(busy||!ready)return;side=value;document.querySelectorAll('[data-side]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.side===side)));
 document.querySelector('[data-panel=type]').textContent=side==='back'?'01 · 뒷면':'01 · 앞면';$('png').textContent=(side==='back'?'뒷면':'앞면')+' PNG 저장 ↓';canvas.classList.toggle('selected',side==='front');backCanvas.classList.toggle('selected',side==='back');draw();
}
function draw(){
 $('stage').style.setProperty('--face-gap',state.faceGap+'px');
 const key=[state.background,state.backgroundColor,state.backgroundBlur,state.faceGap,backgroundVersion].join('|');
 if(key!==backgroundKey){backgroundCanvas.width=2048+state.faceGap;backgroundCanvas.height=1536;paintBackground(backgroundCanvas);backgroundKey=key;}
 ctx=canvas.getContext('2d');drawFace('front');
 ctx=backCanvas.getContext('2d');drawFace('back');
 ctx=canvas.getContext('2d');
}
function drawFace(face){
 ctx.clearRect(0,0,1024,1536);
 ctx.save();ctx.translate(face==='front'?80:-80,0);
 ctx.save();ctx.shadowColor='#24292244';ctx.shadowBlur=14;ctx.shadowOffsetY=8;ctx.fillStyle=state.paper;ctx.fillRect(190,520,644,908);ctx.restore();
 if(assets.paper){ctx.save();ctx.globalAlpha=state.grain;ctx.globalCompositeOperation='multiply';ctx.drawImage(assets.paper,190,520,644,908);ctx.restore();}
 if(face==='back')drawBack();else{
 text(state.kicker,232,612,86,950,state.ink,340);

 text(state.title,230,692,88,950,state.ink,556);line(234,713,552,true);
 ctx.fillStyle=state.ink;
 for(let i=0;i<8;i++)star(328+i*52,752);
 ctx.fillStyle='#fffdf5';ctx.fillRect(376,796,272,334.4);ctx.save();ctx.beginPath();ctx.rect(382.4,802.4,259.2,321.6);ctx.clip();
 if(photo){const scale=Math.max(259.2/photo.width,321.6/photo.height)*state.zoom,w=photo.width*scale,h=photo.height*scale;ctx.filter=state.mono==='bw'?'grayscale(1)':'none';ctx.drawImage(photo,382.4+(259.2-w)*state.cropX,802.4+(321.6-h)*state.cropY,w,h);}ctx.restore();
 for(const [label,key,y] of [['NAME','name',1190],['POST','role',1260],['USERNAME','handle',1330]]){
  text(label,234,y-4,14,500,state.ink,100);
  if(state.lettering==='handwriting')handwriting(state[key],354,y,422);
  else text(state[key],354,y,39,state.lettering==='sans'?650:400,state.accent,422,state.lettering==='sans'?'DM':'Georgia');
  line(234,y+15,552);
 }
 }
 if(face==='front'){
 text(state.note,234,1385,16,600,state.ink,410);
 ctx.save();ctx.textAlign='right';text(state.serial,786,1385,17,650,state.ink,130);ctx.restore();
 }
 // The generated transparent sleeve sits above the editable card, including its seams and clasp.
 if(assets.holder)ctx.drawImage(assets.holder,0,0,1024,1536);
 if(assets.reflection&&state.reflection){ctx.save();ctx.beginPath();ctx.roundRect(172,500,680,968,20);ctx.clip();ctx.globalCompositeOperation='screen';ctx.globalAlpha=state.reflection;ctx.drawImage(assets.reflection,172,500,680,968);ctx.restore();}
 ctx.restore();
}
function sync(){for(const el of document.querySelectorAll('[data-key]'))el.value=state[el.id];for(const key of ['grain','reflection'])$(key+'Value').textContent=Math.round(state[key]*100)+'%';$('backgroundBlurValue').textContent=state.backgroundBlur+'px';$('faceGapValue').textContent=state.faceGap+'px';$('backgroundColor').disabled=state.background==='transparent';}
function lock(value){busy=value;$('fields').disabled=value;$('png').disabled=value||!ready;$('pngPair').disabled=value||!ready;$('reset').disabled=value||!ready;document.querySelectorAll('[data-side]').forEach(el=>el.disabled=value||!ready);}
function panel(name,field){document.querySelectorAll('.panel').forEach(el=>el.hidden=el.id!=='panel-'+name);document.querySelectorAll('[data-panel]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.panel===(name==='back'?'type':name))));document.querySelectorAll('.editing-target').forEach(el=>el.classList.remove('editing-target'));if(field){$(field).classList.add('editing-target');$(field).focus({preventScroll:true});$(field).scrollIntoView({block:'nearest'});}}
document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{if(el.dataset.panel==='photo')setSide('front');panel(el.dataset.panel==='type'&&side==='back'?'back':el.dataset.panel);});
document.querySelectorAll('[data-side]').forEach(el=>el.onclick=()=>{setSide(el.dataset.side);panel(side==='back'?'back':'type');});
$('editor').onsubmit=event=>event.preventDefault();
$('editor').oninput=event=>{const el=event.target;if(!el.hasAttribute('data-key'))return;state[el.id]=el.type==='range'?Number(el.value):el.value;if(el.id==='faceGap')state.faceGap=Math.max(10,state.faceGap);if(el.id==='backgroundColor')state.background='studio';sync();draw();};
function editFace(event){
 if(busy||!ready)return;setSide(event.currentTarget===backCanvas?'back':'front');
 const box=event.currentTarget.getBoundingClientRect();let x=(event.clientX-box.left)*1024/box.width,y=(event.clientY-box.top)*1536/box.height;
 x+=side==='front'?-80:80;
 if(side==='back'){
  x=(x-114)/.78;y=(y-188)/.85;
  const field=backFields.find(([,key,top,left=234,width=552,rows=1])=>x>=left&&x<=left+width&&y>=top-20&&y<=top+52+(rows-1)*35);
  if(field){const label=y<=field[2]+5,key=label?'label_'+field[1]:field[1];panel(!label&&['name','role'].includes(key)?'type':'back',key);}
  else if(y<640)panel('back',y<575?'backKicker':'backTitle');else panel('material');return;
 }
 if(x>=376&&x<=648&&y>=796&&y<=1130.4)panel('photo','upload');
 else if(y>=1150&&y<=1350)panel('type',y<1225?'name':y<1295?'role':'handle');
 else if(y>=1360&&y<=1400)panel('type',x>650?'serial':'note');
 else if(y>=520&&y<720)panel('type',y<630?'kicker':'title');else panel('material');
}
canvas.onclick=backCanvas.onclick=editFace;
async function uploadImage(input,isBackground=false){const file=input.files[0];if(!file)return;lock(true);let url;try{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PNG, JPG, WEBP 이미지를 선택해주세요.');if(file.size>20000000)throw Error('20MB 이하 이미지를 선택해주세요.');
 url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();const scale=Math.min(1,1800/Math.max(image.width,image.height)),next=document.createElement('canvas');next.width=Math.max(1,Math.round(image.width*scale));next.height=Math.max(1,Math.round(image.height*scale));next.getContext('2d').drawImage(image,0,0,next.width,next.height);if(isBackground){backgroundPhoto=next;backgroundVersion++;state.background='photo';}else{photo=next;state.zoom=1;state.cropX=state.cropY=.5;}sync();draw();$('notice').textContent=isBackground?'배경 사진을 적용했습니다.':'사진을 적용했습니다.';
 }catch(error){$('notice').textContent=error.message||'사진을 불러오지 못했습니다.';}finally{if(url)URL.revokeObjectURL(url);input.value='';lock(false);}}
$('upload').onchange=()=>uploadImage($('upload'));
$('backgroundUpload').onchange=()=>uploadImage($('backgroundUpload'),true);
$('removeBackground').onclick=()=>{backgroundPhoto=null;backgroundVersion++;state.background='studio';sync();draw();};
$('removePhoto').onclick=()=>{photo=defaultPhoto;state.zoom=defaults.zoom;state.cropX=defaults.cropX;state.cropY=defaults.cropY;sync();draw();};
$('reset').onclick=()=>{state={...defaults};photo=defaultPhoto;backgroundPhoto=null;backgroundVersion++;sync();draw();$('notice').textContent='기본 네임 태그로 되돌렸습니다.';};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{$('notice').textContent='전체 화면을 열 수 없습니다.';}};
async function savePng(pair=false){lock(true);try{draw();const output=document.createElement('canvas');output.width=pair?2048+state.faceGap:1024;output.height=1536;paintBackground(output);const context=output.getContext('2d');if(pair){context.drawImage(canvas,0,0);context.drawImage(backCanvas,1024+state.faceGap,0);}else context.drawImage(side==='back'?backCanvas:canvas,side==='back'?80:-80,0);
const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 생성에 실패했습니다.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`name-tag-11-${pair?"front-back":side}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);$('notice').textContent='네임 태그 PNG를 저장했습니다.';}catch(error){$('notice').textContent=error.message;}finally{lock(false);}};
$('png').onclick=()=>savePng();$('pngPair').onclick=()=>savePng(true);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>false,setPlaying:()=>{}};
(async()=>{sync();lock(true);try{
 await Promise.all([document.fonts.load('850 74px DM'),document.fonts.load('400 16px Scene'),...['RockSalt','EastSeaDokdo','ZhiMangXing','HachiMaruPop'].map(family=>document.fonts.load(`${family==='HachiMaruPop'?700:400} 40px ${family}`)),...Object.entries({holder:'../assets/name-tag/pvc-holder.png',reflection:'../assets/name-tag/reflection-smooth.png',paper:'../assets/receipt/soft-paper.jpg',photo:'../assets/name-tag/sample-portrait.png'}).map(async([key,url])=>{const image=new Image();image.src=url;await image.decode();assets[key]=image;})]);
 defaultPhoto=photo=assets.photo;ready=true;draw();$('notice').textContent='사진이나 글씨를 클릭하면 해당 편집 항목으로 이동합니다.';
 }catch{$('notice').textContent='목업을 불러오지 못했습니다. 연결과 파일을 확인한 후 새로고침해주세요.';}finally{lock(false);}})();
