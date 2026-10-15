'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');let W=900,H=1000;
const defaults={title:'SONNET XVIII',shop:'THE POETRY SHOP',typeface:'thermal',blockSpacing:1,texture:.55,textureOpacity:.8,taxMode:'none',supplyAmount:40,recordNumbering:'none',exportMode:'receipt',exportWidth:900,bleed:.45,paperFinish:'soft',paperEdge:'torn',subtitle:'A SUMMER KEPT IN WORDS',edition:'SELECTED LINES / 1609',record:'0900-001',terminal:'09',date:'2026.10.13',timeText:'09:41',operator:'001',mode:'note',sentence:'오늘의 마음을\n여기에 남깁니다.',note:"Shall I compare thee to a summer’s day?\nThou art more lovely and more temperate:\nRough winds do shake the darling buds of May,\nAnd summer’s lease hath all too short a date;\n\nSo long as men can breathe or eyes can see,\nSo long lives this, and this gives life to thee.",items:'기억 | 1 | 12.00\n다정함 | 2 | 24.00\n기다림 | 1 | 8.00',total:'PRICELESS',barcode:'20261013000900010000123',footer1:'WILLIAM SHAKESPEARE',footer2:'SONNET 18 / LINES 1–4, 13–14',paperColor:'#fafaf8',inkColor:'#48494b',backgroundColor:'#e4e3dc',density:.9,speed:70,gifWidth:480,loop:true};
const config={...defaults};let ready=false,time=0,playing=false,lastTick=0,busy=false,cancelled=false,commands=[],paperHeight=900;
function defaultHeader(){return [{type:'seal',text:defaults.shop,shape:'oval'},{type:'text',text:defaults.title,align:'center',size:14,weight:600},{type:'text',text:defaults.subtitle,align:'center'},{type:'text',text:defaults.edition,align:'center',size:12},{type:'divider',style:'dotted',boundary:true}];}
function defaultRecords(){return [{label:'COLLECTION',value:'THE SONNETS'},{label:'FIRST PUBLISHED',value:'1609'},{label:'POEM NO.',value:'018'},{label:'LANGUAGE',value:'ENGLISH'}];}
let records=defaultRecords();
function defaultFooter(){return [{type:'text',text:defaults.footer1,align:'center'},{type:'text',text:defaults.footer2,align:'center',size:12}];}
let footerBlocks=defaultFooter();
let headerBlocks=defaultHeader();
function defaultBody(){return [{type:'divider',style:'dotted',boundary:true},...defaults.note.split('\n\n').map(text=>({type:'text',text,align:'justify',size:12}))];}
function defaultTotalBlocks(){return [{type:'divider',style:'dotted',boundary:true}];}
let blocks=defaultBody(),totalBlocks=defaultTotalBlocks();
const paperTextures=Object.fromEntries(Object.entries({woven7:'../assets/receipt/woven7.jpg',woven8:'../assets/receipt/woven8.jpg',ledger36:'../assets/receipt/ledger36.jpg',aged184:'../assets/receipt/aged184.jpg',soft:'../assets/receipt/soft-paper.jpg',creased:'../assets/receipt/crumpled-paper.jpg',fibers:'../assets/receipt/fibers.jpg',grain:'../assets/receipt/grain.jpg',linen:'../assets/receipt/linen.jpg',folded:'../assets/receipt/folded.jpg'}).map(([key,src])=>{const image=new Image();image.src=src;return [key,image];}));
const paperTextureReady=Promise.all(Object.values(paperTextures).map(image=>image.decode().then(()=>true,()=>false))).then(results=>results.every(Boolean));
const textureCache=document.createElement('canvas');let textureHeight=0,textureFinish='';
const paperWidth=450,left=46,right=404;
function notify(value){$('notice').textContent=value;}
const receiptTypefaces={thermal:'"Courier New",Thermal',clean:'Receipt',gulim:'Gulim,"굴림"',dosmyungjo:'DosMyungjo',blueprint:'KkakdugiBlueprint',covendard:'Covendard'};
function font(size,weight=400){ctx.font=`${weight} ${size}px ${receiptTypefaces[config.typeface]},sans-serif`;}
function wrap(value,width,size,weight=400){font(size,weight);const result=[];for(const paragraph of String(value).split('\n')){let line='';for(const ch of paragraph){if(line&&ctx.measureText(line+ch).width>width){result.push(line);line='';}line+=ch;}result.push(line);}return result;}
function taxAmounts(){const supply=Math.round(config.supplyAmount*100),vat=Math.round(supply/10);return {supply:(supply/100).toFixed(2),vat:(vat/100).toFixed(2),total:((supply+vat)/100).toFixed(2)};}
function lineHeight(size){return Math.ceil(size*1.5);}
function rebuild(){
 commands=[];let y=32;$('blockSpacingValue').textContent=`${config.blockSpacing.toFixed(2)}배`;
 function block(value,size=13,align='left',width=358,weight=400){
  let count=0;
  for(const paragraph of String(value).split('\n')){
   let rows=wrap(paragraph,width,size,weight);
   if(align==='justify'&&/\s/.test(paragraph.trim())){
    rows=[];let line='';
    for(const word of paragraph.trim().split(/\s+/)){
     const candidate=line?line+' '+word:word;
     if(line&&ctx.measureText(candidate).width>width){rows.push(line);line='';}
     const parts=wrap(line?line+' '+word:word,width,size,weight);rows.push(...parts.slice(0,-1));line=parts[parts.length-1];
    }
    rows.push(line);
   }
   rows.forEach((value,i)=>{commands.push({kind:'text',value,x:align==='center'?225:align==='right'?right:left,y,size,weight,align:align==='justify'?'left':align,justify:align==='justify'&&value.trim().length>1?width:0});y+=lineHeight(size);count++;});
  }
  return count;
 }
 renderEntries(headerBlocks);
 for(const [index,entry] of records.entries()){
  const numbered=config.recordNumbering==='auto',labelX=left+(numbered?36:0);
  if(numbered)commands.push({kind:'text',value:String(index+1).padStart(3,'0'),x:left,y,size:13,weight:400,align:'left',recordNumber:true});
  const labels=wrap(entry.label,143-(numbered?36:0),13),values=wrap(entry.value,195,13);
  for(const [rows,x,align] of [[labels,labelX,'left'],[values,right,'right']])rows.forEach((value,i)=>commands.push({kind:'text',value,x,y:y+i*lineHeight(13),size:13,weight:400,align}));
  y+=Math.max(labels.length,values.length)*lineHeight(13);
 }
 function renderEntries(entries){
 const visible=entries.filter(entry=>entry.type!=='image'||entry.image);
 for(let i=0;i<visible.length;i++){const entry=visible[i],previous=visible[i-1];
  if(entry.type==='divider'&&entry.boundary){y+=20*config.blockSpacing;commands.push({kind:'rule',y,style:entry.style||'dotted'});y+=20*config.blockSpacing;continue;}
  if(previous&&!previous.boundary&&entry.type!=='spacer'&&previous.type!=='spacer')y+=(entry.type==='divider'||previous.type==='divider'?20:12)*config.blockSpacing;
  if(entry.type==='seal'){
   const rows=wrap(entry.text,260,13),shape=entry.shape||'cloud';
   ctx.textBaseline='alphabetic';ctx.textAlign='center';
   const metrics=rows.map(row=>ctx.measureText(row));
   const top=Math.min(...metrics.map((m,i)=>i*lineHeight(13)-m.actualBoundingBoxAscent));
   const bottom=Math.max(...metrics.map((m,i)=>i*lineHeight(13)+m.actualBoundingBoxDescent));
   const width=Math.max(110,...metrics.map(m=>m.width+72)),height=Math.max(shape==='cloud'?width/2.4:42,(bottom-top)*1.5+24);
   commands.push({kind:'header-frame',shape,x:(450-width)/2,y,width,height});
   const baseline=y+height/2-(top+bottom)/2;
   rows.forEach((value,i)=>commands.push({kind:'text',value,x:225+(metrics[i].actualBoundingBoxLeft-metrics[i].actualBoundingBoxRight)/2,y:baseline+i*lineHeight(13),size:13,align:'center',baseline:'alphabetic'}));
   y+=height;
  }
  else if(entry.type==='text'){block(entry.text,(entry.size||13)+((entry.textLevel||1)-1)*2,entry.align,358,entry.weight||400);}
  else if(entry.type==='divider')commands.push({kind:'rule',y,style:entry.style||'dotted'});
  else if(entry.type==='spacer')y+=entry.height;
  else if(entry.type==='image'&&entry.image){const width=358*entry.width/100,height=width*entry.image.height/entry.image.width;commands.push({kind:'image',image:entry.image,strength:entry.strength??.45,x:(450-width)/2,y,width,height});y+=height;}
 }}
 renderEntries(blocks);
 renderEntries(totalBlocks);const taxed=config.taxMode==='vat',amounts=taxAmounts();
 $('supplyFields').hidden=!taxed;$('total').disabled=taxed;$('taxCalculation').textContent=`VAT 10%: ${amounts.vat} · TOTAL: ${amounts.total}`;
 if(taxed)for(const [label,value] of [['SUPPLY AMOUNT',amounts.supply],['VAT (10%)',amounts.vat]]){commands.push({kind:'text',value:label,x:left,y,size:13,weight:400,align:'left'});block(value,13,'right',180);}
 commands.push({kind:'text',value:'TOTAL',x:left,y,size:13,weight:600,align:'left'});block(taxed?amounts.total:config.total,13,'right',230);y+=24;
 const barcodeRows=wrap(config.barcode,190,12);
 commands.push({kind:'barcode',y,width:190,height:44});y+=49;
 for(const value of barcodeRows){commands.push({kind:'text',value,x:225,y,size:12,align:'center',spread:190});y+=lineHeight(12);}
 y+=28*config.blockSpacing;renderEntries(footerBlocks);y+=36;
 paperHeight=Math.ceil(Math.max(720,y));syncExport();H=Math.max(1000,paperHeight+120);if(canvas.height!==H)canvas.height=H;config.duration=paperHeight/config.speed+5.5;$('scrub').max=config.duration;time%=config.duration;
 for(const mode of ['sentence','list','note'])$(mode+'Fields').hidden=config.mode!==mode;
 document.querySelectorAll('[data-paper]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.paper===config.paperColor));syncTime();draw();
}
const dividerStyles=[
 {id:'dotted',label:'점선 · 기본   · · · · ·',dash:[2,6]},
 {id:'fine',label:'촘촘한 점선   ·········',dash:[1,3]},
 {id:'short',label:'짧은 파선   - - - - -',dash:[5,4]},
 {id:'long',label:'긴 파선   ── ── ──',dash:[12,6]},
 {id:'dashdot',label:'일점쇄선   ─ · ─ · ─',dash:[10,4,2,4]},
 {id:'solid',label:'실선   ─────────',dash:[]},
 {id:'double',label:'이중 실선   ═════════',dash:[],double:true},
 {id:'equals',label:'등호   =========',symbol:'='},
 {id:'stars',label:'별표   *********',symbol:'*'},
 {id:'hash',label:'우물정   #########',symbol:'#'},
 {id:'plus',label:'더하기   +++++++++',symbol:'+'},
 {id:'wave',label:'물결   ~~~~~~~~~',symbol:'~'}
];
function drawDivider(cmd){
 const style=dividerStyles.find(s=>s.id===cmd.style)||dividerStyles[0];
 ctx.save();
 if(style.symbol){
  font(13);ctx.textAlign='center';ctx.textBaseline='alphabetic';
  const value=style.symbol.repeat(Math.floor((right-left)/ctx.measureText(style.symbol).width));
  const metrics=ctx.measureText(value);
  ctx.fillText(value,(left+right)/2,cmd.y+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
 }else{
  ctx.lineWidth=1;ctx.setLineDash(style.dash);ctx.beginPath();
  for(const offset of style.double?[-2,2]:[0]){ctx.moveTo(left,cmd.y+offset);ctx.lineTo(right,cmd.y+offset);}
  ctx.stroke();
 }
 ctx.restore();
}
function drawHeaderFrame({shape,x,y,width:w,height:h}){
 if(shape==='none')return;
 ctx.save();ctx.translate(x,y);ctx.lineWidth=.85;ctx.beginPath();
 if(shape==='oval'){ctx.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2);ctx.stroke();}
 else if(shape==='pixel'){
  // Paired stair-step brackets keep their thickness as a multiline header grows.
  for(let row=0;row<h;row+=3){const inset=Math.round(Math.abs(row-h/2)/Math.max(1,h/2)*6)*3;
   for(const offset of [0,7]){ctx.fillRect(inset+offset,row,3,3);ctx.fillRect(w-inset-offset-3,row,3,3);}
  }
 }else{
  // The silhouette is the outer union of three overlapping ellipses.
  const radius=w/4.8,angle=Math.acos((w/2-radius)/(2*radius));
  ctx.ellipse(radius,h/2,radius,h/2,0,-angle,angle,true);
  ctx.ellipse(w/2,h/2,radius,h/2,0,Math.PI-angle,angle,true);
  ctx.ellipse(w-radius,h/2,radius,h/2,0,Math.PI-angle,Math.PI+angle,true);
  ctx.ellipse(w/2,h/2,radius,h/2,0,-angle,-Math.PI+angle,true);
  ctx.closePath();ctx.stroke();
 }
 ctx.restore();
}
function paperOutline(){
 ctx.beginPath();
 if(config.paperEdge==='clean'){ctx.rect(0,0,paperWidth,paperHeight);return;}
 if(config.paperEdge==='rounded'){ctx.roundRect(0,0,paperWidth,paperHeight,14);return;}
 const rough=config.paperEdge==='rough',saw=config.paperEdge==='saw',step=rough?3:saw?10:6;
 const depth=(x,bottom)=>rough?2+((Math.imul(x+17,bottom?137:97)^(x*31))>>>0)%10:saw?(Math.floor(x/step)%2?0:8):(x%12?0:3);
 ctx.moveTo(0,depth(0,false));
 for(let x=step;x<paperWidth;x+=step)ctx.lineTo(x,depth(x,false));
 ctx.lineTo(paperWidth,depth(paperWidth,false));ctx.lineTo(paperWidth,paperHeight-depth(paperWidth,true));
 for(let x=paperWidth-step;x>0;x-=step)ctx.lineTo(x,paperHeight-depth(x,true));
 ctx.lineTo(0,paperHeight-depth(0,true));ctx.closePath();
}
function ink(){return config.inkColor;}
function receiptFrame(){
 const scale=1;
 return {reveal:paperHeight,scale,top:(H-paperHeight*scale)/2};
}
const thermalImageCache=new WeakMap();
function thermalImage(image,strength=1){
 let cached=thermalImageCache.get(image);
 if(!cached){
  const mask=document.createElement('canvas'),scale=Math.min(1,716/image.width,2048/image.height);
  mask.width=Math.max(1,Math.round(image.width*scale));mask.height=Math.max(1,Math.round(image.height*scale));
  const c=mask.getContext('2d');c.drawImage(image,0,0,mask.width,mask.height);
  const pixels=c.getImageData(0,0,mask.width,mask.height),data=pixels.data,w=mask.width,h=mask.height,gray=new Float32Array(w*h),smoothPixels=c.createImageData(w,h);
  for(let i=0;i<gray.length;i++){
   const k=i*4,alpha=data[k+3]/255,luma=(data[k]*.299+data[k+1]*.587+data[k+2]*.114)*alpha+255*(1-alpha);
   gray[i]=Math.max(0,Math.min(255,(luma-128)*1.12+140));
   smoothPixels.data[k]=smoothPixels.data[k+1]=smoothPixels.data[k+2]=255;smoothPixels.data[k+3]=255-luma;
  }
  // Diffuse tonal error into neighboring dots; cache the print so sliders stay responsive.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,k=i*4,value=gray[i],printed=value<128,error=value-(printed?0:255);
   data[k]=data[k+1]=data[k+2]=255;
   data[k+3]=printed?(((x*73+y*151)%97===0)?120:235):0;
   if(x+1<w)gray[i+1]+=error*7/16;
   if(y+1<h){if(x>0)gray[i+w-1]+=error*3/16;gray[i+w]+=error*5/16;if(x+1<w)gray[i+w+1]+=error/16;}
  }
  const smooth=document.createElement('canvas');smooth.width=w;smooth.height=h;smooth.getContext('2d').putImageData(smoothPixels,0,0);
  c.putImageData(pixels,0,0);cached={mask,smooth,tinted:document.createElement('canvas'),color:null};thermalImageCache.set(image,cached);
 }
 const color=ink();
 if(cached.color!==color||cached.strength!==strength){
  const c=cached.tinted.getContext('2d');cached.tinted.width=cached.mask.width;cached.tinted.height=cached.mask.height;
  c.globalAlpha=1-strength;c.drawImage(cached.smooth,0,0);c.globalCompositeOperation='lighter';c.globalAlpha=strength;c.drawImage(cached.mask,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,cached.tinted.width,cached.tinted.height);c.globalCompositeOperation='source-over';cached.color=color;cached.strength=strength;
 }
 return cached.tinted;
}
function drawReceiptText(cmd,dx=0,dy=0){
 const chars=Array.from(cmd.value);
 const metrics=ctx.measureText('한Ag'),ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
 const textY=cmd.baseline==='alphabetic'?cmd.y:cmd.y+(lineHeight(cmd.size)-ascent-descent)/2+ascent;
 if(cmd.justify&&chars.length>1){
  const words=cmd.value.trim().split(/\s+/),parts=words.length>1?words:chars;
  const widths=parts.map(part=>ctx.measureText(part).width),gap=(cmd.justify-widths.reduce((a,b)=>a+b,0))/(parts.length-1);
  let x=cmd.x;ctx.save();ctx.textAlign='left';parts.forEach((part,i)=>{ctx.fillText(part,x+dx,textY+dy);x+=widths[i]+gap;});ctx.restore();return;
 }
 if(!cmd.spread||chars.length<2){ctx.fillText(cmd.value,cmd.x+dx,textY+dy);return;}
 const widths=chars.map(ch=>ctx.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0);
 const gap=(cmd.spread-total)/(chars.length-1);let x=cmd.x-cmd.spread/2;
 ctx.save();ctx.textAlign='left';
 chars.forEach((ch,i)=>{ctx.fillText(ch,x+dx,textY+dy);x+=widths[i]+gap;});ctx.restore();
}
function draw(t=time,receiptOnly=false){if(!ready)return;W=config.exportMode==='background'?config.exportWidth:900;H=config.exportMode==='background'?paperHeight+120:Math.max(1000,paperHeight+120);if(canvas.width!==W)canvas.width=W;if(canvas.height!==H)canvas.height=H;canvas.style.width=W+'px';ctx.resetTransform();ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);if(!receiptOnly){ctx.fillStyle=config.backgroundColor;ctx.fillRect(0,0,W,H);}
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
 const frame=receiptFrame(t);
 if(frame.reveal>0){
  const top=frame.top,scale=frame.scale;
  ctx.save();ctx.translate((W-paperWidth*scale)/2,top);ctx.scale(scale,scale);
  ctx.beginPath();ctx.rect(-20,0,paperWidth+40,frame.reveal);ctx.clip();
  const localTop=-top/scale,localBottom=(H-top)/scale;
  ctx.shadowColor=receiptOnly?'transparent':'#00000014';ctx.shadowBlur=5;ctx.shadowOffsetY=2;ctx.fillStyle=config.paperColor;paperOutline();ctx.fill();ctx.shadowColor='transparent';ctx.clip();
  const shade=ctx.createLinearGradient(0,0,paperWidth,0);shade.addColorStop(0,'#00000009');shade.addColorStop(.2,'#ffffff05');shade.addColorStop(.85,'#00000000');shade.addColorStop(1,'#0000000b');ctx.fillStyle=shade;ctx.fillRect(0,0,paperWidth,paperHeight);
  const wash=ctx.createLinearGradient(0,0,70,paperHeight);wash.addColorStop(0,'#ffffff00');wash.addColorStop(.65,'#00000000');wash.addColorStop(1,'#00000016');ctx.fillStyle=wash;ctx.fillRect(0,0,450,paperHeight);
  const paperTexture=paperTextures[config.paperFinish];
  if(paperTexture?.naturalWidth){
   if(textureHeight!==paperHeight||textureFinish!==config.paperFinish){
    textureHeight=paperHeight;textureFinish=config.paperFinish;textureCache.width=450;textureCache.height=Math.min(2048,paperHeight);
    const c=textureCache.getContext('2d'),cropScale=Math.max(450/paperTexture.naturalWidth,paperHeight/paperTexture.naturalHeight);
    const cropWidth=450/cropScale,cropHeight=paperHeight/cropScale;
    c.drawImage(paperTexture,(paperTexture.naturalWidth-cropWidth)/2,(paperTexture.naturalHeight-cropHeight)/2,cropWidth,cropHeight,0,0,450,textureCache.height);
   }
   ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=config.textureOpacity*.9;
   ctx.drawImage(textureCache,0,0,paperWidth,paperHeight);ctx.restore();
  }
  ctx.globalAlpha=config.textureOpacity/.8;ctx.fillStyle='#00000009';const first=Math.max(0,Math.floor(localTop/5)*5),last=Math.min(frame.reveal,localBottom);for(let y=first;y<last;y+=5)for(let x=4;x<450;x+=11){const n=(x*13+y*17)%19;if(n<5)ctx.fillRect(x+n,y,1,1);}
  ctx.strokeStyle=ink();ctx.globalAlpha=.2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(450,3);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=config.density;ctx.fillStyle=ink();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;
  for(const cmd of commands){if(cmd.y+(cmd.height||80)<localTop||cmd.y>localBottom)continue;if(cmd.kind==='image'){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(thermalImage(cmd.image,cmd.strength),cmd.x,cmd.y,cmd.width,cmd.height);ctx.restore();}else if(cmd.kind==='header-frame'){drawHeaderFrame(cmd);}else if(cmd.kind==='text'){font(cmd.size,cmd.weight||400);ctx.textAlign=cmd.align;ctx.textBaseline='alphabetic';if(config.bleed>0){ctx.save();ctx.globalAlpha*=config.bleed*.24;drawReceiptText(cmd,-.5,.25);drawReceiptText(cmd,.5,-.25);ctx.restore();}drawReceiptText(cmd);}else if(cmd.kind==='rule'){drawDivider(cmd);}else{let seed=0;for(const ch of config.barcode)seed=(seed*31+ch.codePointAt(0))>>>0;let x=(450-cmd.width)/2;const end=x+cmd.width;while(x<end-4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const width=1+seed%4;ctx.fillRect(x,cmd.y,Math.min(width,end-x),cmd.height);x+=width+2+(seed>>>8)%3;}}}
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.globalAlpha=1;
  const visibleTop=Math.max(0,Math.floor(localTop/3)*3),visibleBottom=Math.min(frame.reveal,localBottom);
  for(let y=visibleTop;y<visibleBottom;y+=3){
   for(let x=2;x<448;x+=7){const n=(Math.imul(x+17,y+31)>>>0)%101;ctx.fillStyle=n%2?'#33291c':'#ffffff';ctx.globalAlpha=config.texture*(config.textureOpacity/.8)*(.035+n%5*.01);ctx.fillRect(x+(n%6),y,1+(n%2),1);}
   ctx.fillStyle=config.paperColor;ctx.globalAlpha=config.texture*.55;const start=(y*37)%113;for(let x=start;x<448;x+=113)ctx.fillRect(x,y,14+(y%11),.65);
  }
  // Fixed scan bands stay in the same place when editing or exporting.
  for(let y=visibleTop;y<visibleBottom;y+=2){ctx.globalAlpha=config.texture*(.025+((y*17)%13)/500);ctx.fillStyle='#343434';ctx.fillRect(0,y,450,.45);}
  for(let x=39;x<450;x+=97){ctx.globalAlpha=config.texture*.07;ctx.fillStyle=config.paperColor;ctx.fillRect(x,0,1,paperHeight);}

  ctx.restore();
 }
 ctx.restore();
}
function syncTime(){$('scrub').value=time;$('clock').textContent=`${time.toFixed(1)} / ${config.duration.toFixed(1)} s`;$('play').textContent=playing?'Ⅱ':'▶';}
function syncExport(){
 const background=config.exportMode==='background';$('exportBackgroundFields').hidden=!background;
 $('exportWidthValue').textContent=config.exportWidth+'px';
 $('exportSize').textContent=`저장 크기 · ${background?config.exportWidth:paperWidth} × ${background?paperHeight+120:paperHeight}px · ${background?'배경 포함':'투명 배경'}`;
 $('png').textContent=background?'배경 + 영수증 PNG 저장':'영수증 PNG 저장';
}
function syncForm(){syncExport();$('textureOpacityValue').textContent=Math.round(config.textureOpacity*100)+'%';document.querySelectorAll('[data-config]').forEach(input=>input.value=config[input.id]);}
document.querySelectorAll('[data-region]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-region]').forEach(item=>{const active=item===button;item.setAttribute('aria-pressed',active);$(item.dataset.region).hidden=!active;});});
const tabs=[...document.querySelectorAll('[data-tab]')];function selectTab(tab){tabs.forEach(button=>{const active=button===tab;button.setAttribute('aria-selected',active);button.tabIndex=active?0:-1;$(button.dataset.tab).hidden=!active;});}tabs.forEach((tab,i)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectTab(tabs[n]);tabs[n].focus();};});selectTab(tabs[0]);
async function applySetting(e){const input=e.target;if(!input.hasAttribute('data-config'))return;let value=input.value;if(input.type==='number'||input.type==='range'||input.id==='gifWidth'){if(value==='')return;value=Number(value);if(!Number.isFinite(value))return;value=Math.max(+input.min||0,Math.min(+input.max||960,value));}if(input.id==='typeface'){
 const family=receiptTypefaces[value];lock(true);notify('서체를 불러오고 있어요…');
 try{await Promise.all([document.fonts.load(`400 13px ${family}`,'한글ABC'),document.fonts.load(`600 14px ${family}`,'한글ABC')]);}
 catch{input.value=config.typeface;notify('서체를 불러오지 못했어요. 다시 선택해 주세요.');return;}
 finally{lock(false);}
 notify('선택한 서체를 적용했어요.');
 }
config[input.id]=value;syncExport();if(input.id==='textureOpacity')$('textureOpacityValue').textContent=Math.round(value*100)+'%';if(['exportWidth','exportMode','textureOpacity','texture','bleed','density','inkColor','backgroundColor','paperColor','paperFinish','paperEdge'].includes(input.id))draw();else rebuild();}
$('editor').oninput=e=>{if(e.target.type!=='color')applySetting(e);};
$('editor').onchange=e=>{if(e.target.type==='color')applySetting(e);};
document.querySelectorAll('[data-paper]').forEach(button=>button.onclick=()=>{config.paperColor=button.dataset.paper;syncForm();rebuild();});
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;lastTick=0;draw();syncTime();};$('scrub').oninput=()=>{playing=false;time=+$('scrub').value;draw();syncTime();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('previewShell').requestFullscreen();}catch{notify('전체 화면을 열지 못했어요.');}};
$('reset').onclick=()=>{if(!confirm('영수증 내용을 처음 설정으로 되돌릴까요?'))return;Object.assign(config,defaults);headerBlocks=defaultHeader();footerBlocks=defaultFooter();records=defaultRecords();renderRecords();blocks=defaultBody();totalBlocks=defaultTotalBlocks();renderBlocks();syncForm();time=0;playing=false;rebuild();};
function lock(value){busy=value;$('settingsFields').disabled=value;for(const id of ['png','savePng','gif','video','play','scrub','reset','restart','fullscreen'])$(id).disabled=value;tabs.forEach(tab=>tab.disabled=value);}
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
const breathe=()=>new Promise(resolve=>setTimeout(resolve,0));
function tick(stamp){if(playing&&!busy){if(lastTick)time=(time+(stamp-lastTick)/1000)%config.duration;draw();syncTime();}lastTick=stamp;requestAnimationFrame(tick);}
window.SceneBridge={ready:()=>canvas.dataset.ready==='true',busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=value;lastTick=0;syncTime();}};
const receiptFontsReady=Promise.all([document.fonts.load('13px Thermal','한글'),document.fonts.load('13px Receipt','한글')]).then(()=>true,()=>false);
Promise.all([receiptFontsReady,paperTextureReady]).then(([fontsLoaded,textureLoaded])=>{ready=true;syncForm();renderRecords();renderBlocks();rebuild();time=paperHeight/config.speed+.8;draw();syncTime();canvas.dataset.ready='true';$('previewLoading').hidden=true;notify(!fontsLoaded?'인쇄 서체를 불러오지 못했어요. 페이지를 다시 열어주세요.':textureLoaded?'전체 영수증을 편집하고 PNG로 저장하세요.':'종이 질감을 불러오지 못했어요. 기본 종이로 표시합니다.');requestAnimationFrame(tick);}).catch(error=>{ready=false;canvas.dataset.ready='false';$('previewLoading').textContent='미리보기를 표시하지 못했어요. 새로고침해 주세요.';notify('미리보기를 표시하지 못했어요. 새로고침해 주세요. ('+error.message+')');console.error(error);});

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

$('savePng').onclick = $('png').onclick = () => exportScene(async () => {
  draw(time,true);
  const receipt=document.createElement('canvas');receipt.width=paperWidth;receipt.height=paperHeight;
  receipt.getContext('2d').drawImage(canvas,(W-paperWidth)/2,receiptFrame().top,paperWidth,paperHeight,0,0,paperWidth,paperHeight);
  draw();
  let output=receipt;
  if(config.exportMode==='background'){
   output=document.createElement('canvas');output.width=config.exportWidth;output.height=paperHeight+120;
   const c=output.getContext('2d');c.fillStyle=config.backgroundColor;c.fillRect(0,0,output.width,output.height);
   c.drawImage(receipt,(output.width-paperWidth)/2,60);
  }
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG 저장에 실패했어요. 다시 시도해주세요.');
  if (cancelled) throw new Error('저장을 취소했어요.');
  download(blob, 'receipt-09.png'); notify(`PNG 저장 완료 · ${output.width} × ${output.height} · ${config.exportMode==='background'?'배경 포함':'투명 배경'}`);
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
    if (action === 'save') {download(blob, 'receipt-09.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `receipt-09.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});

function renderBlocks(){renderBlockRegion('header');renderBlockRegion('body');renderBlockRegion('footer');renderBlockRegion('total');}
function renderBlockRegion(region){
 const isHeader=region==='header',isFooter=region==='footer',isTotal=region==='total',entries=isTotal?totalBlocks:isHeader?headerBlocks:isFooter?footerBlocks:blocks,prefix=isTotal?'total-':isHeader?'header-':isFooter?'footer-':'',addButton=$(isTotal?'addTotalBlock':isHeader?'addHeaderBlock':isFooter?'addFooterBlock':'addBlock');
 const root=$(isTotal?'totalBlockRows':isHeader?'headerBlockRows':isFooter?'footerBlockRows':'blockRows');root.replaceChildren();
 const names={seal:'헤더',text:'텍스트',divider:'구분선',image:'이미지',spacer:'여백'};
 entries.forEach((entry,index)=>{
  const row=document.createElement('div');row.className='block-row';const header=document.createElement('header'),title=document.createElement('strong');title.textContent=`${index+1}. ${names[entry.type]}`;header.append(title);
  for(const [label,action,disabled] of [['↑',-1,index===0],['↓',1,index===entries.length-1],['삭제',0,false]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',`${isHeader?'상단 ':isFooter?'하단 ':''}${index+1}번 블록 ${action===-1?'위로':action===1?'아래로':'삭제'}`);button.disabled=disabled;button.onclick=()=>{if(action){[entries[index],entries[index+action]]=[entries[index+action],entries[index]];}else entries.splice(index,1);renderBlocks();rebuild();};header.append(button);}row.append(header);
  function field(labelText,input){const label=document.createElement('label');input.id=`${prefix}block-${index}-${row.childElementCount}`;label.htmlFor=input.id;label.textContent=labelText;row.append(label,input);return input;}
  if(entry.type==='text'||entry.type==='seal'){
   const input=field('내용',document.createElement('textarea'));input.maxLength=10000;input.value=entry.text;input.oninput=()=>{entry.text=input.value;rebuild();};
   if(entry.type==='seal'){
    const shape=field('헤더 도형',document.createElement('select'));
    for(const [value,label] of [['none','없음'],['cloud','구름형 · 3봉'],['oval','타원형'],['pixel','픽셀 꺾쇠']])shape.add(new Option(label,value));
    shape.value=entry.shape||'cloud';shape.onchange=()=>{entry.shape=shape.value;rebuild();};
    const hint=document.createElement('p');hint.textContent='긴 헤더는 도형이 넓어지고, 용지 너비를 넘으면 줄바꿈에 맞춰 높이가 늘어납니다.';row.append(hint);
   }
   if(entry.type==='text'){
    const size=field('텍스트 크기',document.createElement('select'));
    for(const [value,label] of [['1','본문 1 · 기본'],['2','본문 2 · 조금 크게'],['3','본문 3 · 더 크게']])size.add(new Option(label,value));
    size.value=String(entry.textLevel||1);size.onchange=()=>{entry.textLevel=Number(size.value);rebuild();};
    const align=field('정렬',document.createElement('select'));for(const [value,label] of [['left','왼쪽'],['center','가운데'],['right','오른쪽'],['justify','양끝 맞춤']])align.add(new Option(label,value));align.value=entry.align;align.onchange=()=>{entry.align=align.value;rebuild();};}
  }else if(entry.type==='image'){
   const input=field(entry.image?'이미지 교체':'이미지 첨부',document.createElement('input'));input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=async()=>{
    const file=input.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15000000){notify('15 MB 이하의 PNG·JPG·WebP 이미지를 선택하세요.');input.value='';return;}
    let url;lock(true);try{url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();const scale=Math.min(1,1024/Math.max(image.width,image.height)),buffer=document.createElement('canvas');buffer.width=Math.max(1,Math.round(image.width*scale));buffer.height=Math.max(1,Math.round(image.height*scale));buffer.getContext('2d').drawImage(image,0,0,buffer.width,buffer.height);entry.image=buffer;renderBlocks();rebuild();notify('이미지를 감열지 흑백 인쇄로 적용했어요.');}catch{notify('이미지를 읽지 못했어요. 다른 파일을 선택하세요.');}finally{if(url)URL.revokeObjectURL(url);lock(false);}
   };
   const strength=field('감열지 효과 · %',document.createElement('input'));strength.type='range';strength.min=0;strength.max=100;strength.step=5;strength.value=Math.round((entry.strength??.45)*100);
   const amount=document.createElement('output');amount.htmlFor=strength.id;amount.textContent=`${strength.value}%`;row.append(amount);
   strength.oninput=()=>{entry.strength=Math.max(0,Math.min(100,Number(strength.value)))/100;amount.textContent=`${strength.value}%`;rebuild();};
   const help=document.createElement('p');help.textContent='낮게: 또렷한 흑백 · 높게: 거친 점 인쇄';row.append(help);
   const width=field('이미지 너비 · %',document.createElement('input'));width.type='range';width.min=20;width.max=100;width.value=entry.width;width.oninput=()=>{entry.width=Math.max(20,Math.min(100,Number(width.value)));rebuild();};
  }else if(entry.type==='divider'){
   const style=field('구분선 종류',document.createElement('select'));
   for(const option of dividerStyles)style.add(new Option(option.label,option.id));
   style.value=entry.style||'dotted';style.onchange=()=>{entry.style=style.value;rebuild();};
  }else if(entry.type==='spacer'){
   const input=field('여백 높이',document.createElement('input'));input.type='number';input.min=4;input.max=200;input.value=entry.height;input.oninput=()=>{if(input.value===''||!Number.isFinite(input.valueAsNumber))return;entry.height=Math.max(4,Math.min(200,input.valueAsNumber));rebuild();};
  }
  root.append(row);
 });addButton.disabled=entries.length>=30;
}
for(const region of ['header','body','footer','total']){
 const isHeader=region==='header',isFooter=region==='footer',isTotal=region==='total';
 $(isTotal?'addTotalBlock':isHeader?'addHeaderBlock':isFooter?'addFooterBlock':'addBlock').onclick=()=>{const entries=isTotal?totalBlocks:isHeader?headerBlocks:isFooter?footerBlocks:blocks;if(entries.length>=30)return;const type=$(isTotal?'totalBlockType':isHeader?'headerBlockType':isFooter?'footerBlockType':'blockType').value;entries.push(type==='text'?{type,text:'A little space for words.',align:isHeader||isFooter?'center':'left'}:type==='seal'?{type,text:defaults.shop,shape:'cloud'}:type==='image'?{type,image:null,width:isFooter?50:100}:type==='spacer'?{type,height:24}:{type:'divider'});renderBlocks();rebuild();};
}

function renderRecords(){
 const root=$('recordRows');root.replaceChildren();
 records.forEach((entry,index)=>{
  const row=document.createElement('div');row.className='record-row';
  const title=document.createElement('strong');title.textContent=`기록 ${index+1}`;row.append(title);
  const actions=document.createElement('div');actions.className='record-actions';
  for(const [action,name,path] of [[-1,'위로','M12 19V5m-6 6 6-6 6 6'],[1,'아래로','M12 5v14m-6-6 6 6 6-6'],[0,'삭제','M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7']]){
   const button=document.createElement('button');button.type='button';button.className=action?'record-move':'record-delete';button.dataset.action=action;button.title=name;button.setAttribute('aria-label',`기록 ${index+1} ${name}`);
   button.innerHTML=`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
   button.disabled=action===-1&&index===0||action===1&&index===records.length-1;
   button.onclick=()=>{
    if(action)[records[index],records[index+action]]=[records[index+action],records[index]];else records.splice(index,1);
    renderRecords();rebuild();
    const target=root.children[Math.min(index+action,records.length-1)];
    const next=target?.querySelector(`button[data-action="${action}"]:not(:disabled)`)||target?.querySelector('button:not(:disabled)')||$('addRecord');
    next.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',behavior:'smooth'});
   };actions.append(button);
  }row.append(actions);
  for(const [key,name] of [['label','왼쪽 · 이름'],['value','오른쪽 · 값']]){
   const label=document.createElement('label');label.textContent=name;
   const input=document.createElement('input');input.type='text';input.maxLength=120;input.value=entry[key];input.setAttribute('aria-label',`기록 ${index+1} ${name}`);input.oninput=()=>{entry[key]=input.value;rebuild();};label.append(input);row.append(label);
  }
  root.append(row);
 });$('addRecord').disabled=records.length>=30;
}
$('addRecord').onclick=()=>{if(records.length>=30)return;records.push({label:'항목',value:'내용'});renderRecords();rebuild();};

