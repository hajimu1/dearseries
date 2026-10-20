'use strict';
(() => {
  const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=1080,H=1440;
  const page={masthead:'ODDMENTS',subtitle:'A catalogue of ordinary wonders. Objects, stories & other small obsessions.',issue:'VOL. 013 — AUTUMN 2026',edition:'INDEPENDENT JOURNAL / $6',footer:'DEAR SERIES     •     COLLECTED WITH CURIOSITY. KEPT WITH LOVE.',paper:'#f4edda',ink:'#272720',grain:.2};
  const items=[
    {name:'01 / 램프 · 중앙 기사',photo:0,color:'#e5e486',ink:page.ink,kicker:'01 / THE EVENING COMPANION',title:'After\ndark.',body:'A little light changes everything. Cast in brass, crowned with a milky globe, this quiet companion keeps the evening open a little longer. For reading, dreaming, and doing absolutely nothing.'},
    {name:'02 / 카메라',photo:1,color:'#eaa169',ink:page.ink,kicker:'02 / LOOK CLOSELY',title:'Still, life.',body:'Fold it open. Find the light. A pocket-sized invitation to notice what was here all along.'},
    {name:'03 / 시계 사진',photo:3,color:'#dba8b7',ink:page.ink,kicker:'03 / SLOW MORNINGS',title:'Time, kept.',body:'A familiar face. A small ritual. No hurry at all.'},
    {name:'04 / 인용 문구',color:'#272720',ink:'#e5b3c0',kicker:'A NOTE FROM THE EDITOR',title:'Nothing here\nis quite\nordinary.',body:'THE BEAUTY IS IN THE LOOKING.'},
    {name:'05 / 짧은 기사',color:'#efca92',ink:page.ink,kicker:'FIELD NOTES / 05',title:'A small\nobsession.',body:'Some things ask to be kept. Not because they are useful, or rare, but because they make a room feel more like our own.\n\nWe collect these little interruptions: a pleasing shape, a familiar sound, an object with a story we have yet to learn.'},
    {name:'06 / 비행기',photo:4,color:'#d8c8ee',ink:page.ink,kicker:'06 / A FLIGHT OF FANCY',title:'It flies!',body:'For the traveller who never quite comes down to earth.'},
    {name:'07 / 향수병',photo:2,color:'#dba8b7',ink:page.ink,kicker:'07 / THE DRESSING TABLE',title:'Glass\nmemories.',body:'A bright little vessel for something invisible.'},
    {name:'08 / 전화기',photo:5,color:'#eaa169',ink:page.ink,kicker:'08 / LONG DISTANCE',title:'Call me\nlater.',body:'The satisfying weight of a receiver. The delicious possibility of a conversation.'}
  ];
  const layouts=[
    {box:[336,190,408,890],kicker:[357,208],image:[358,237,364,542],title:[357,790,366,155,86],body:[359,966,362,90,18]},
    {box:[36,190,300,320],kicker:[54,208],image:[51,231,270,159],title:[54,394,264,48,40],body:[54,443,264,45,16]},
    {box:[36,510,300,330],kicker:[54,527],title:[54,552,264,48,39],image:[80,510,256,330],body:[54,804,264,24,14]},
    {box:[36,840,300,216],kicker:[54,858],title:[54,890,264,123,36],body:[54,1027,264,18,11]},
    {box:[36,1056,300,304],kicker:[54,1074],title:[54,1102,264,85,39],body:[54,1200,264,143,15]},
    {box:[336,1080,408,280],kicker:[357,1098],title:[357,1119,366,51,47],image:[359,1172,362,146],body:[357,1326,366,20,14]},
    {box:[744,190,300,448],kicker:[762,208],title:[762,240,264,88,43],image:[776,335,236,248],body:[762,596,264,27,14]},
    {box:[744,1030,300,330],kicker:[762,958],image:[744,1030,256,330],title:[762,1203,264,93,46],body:[762,1309,264,37,15]}
  ];
  // The right-hand editorial bridge keeps a text interval between the two photographs.
  items.push({name:'09 / 수집에 관한 기사',color:'#f4edda',ink:page.ink,kicker:'ON THE SHELF / 09',title:'The art of\nkeeping.',body:'A collection is a kind of portrait. What we choose to live with tells a story in its own quiet language.\n\nHold on to the things that make you look twice.'});
  layouts.push({box:[744,638,300,302],kicker:[762,656],title:[762,687,264,87,39],body:[762,786,264,130,16]});
  items.forEach(item=>Object.assign(item,{showKicker:true,stamp:.8,threshold:148,noise:.18,fit:'contain',zoom:1,cropX:.5,cropY:.5}));
  const {fonts,font,fontLanguages,families,familyNames}=window.MagazineFonts;
  Object.assign(page,{density:1,bleed:0,paperFinish:'soft',textureOpacity:.35});
  page.mastheadFont='Alfa Slab One';
  const titleFonts=['Corben Bold','Instrument Serif','Forum','Corben','Instrument Serif','BBH Hegarty','Arapey Italic','Montenegrin Gothic One','Instrument Serif'];
  items.forEach((item,i)=>Object.assign(item,{titleFont:titleFonts[i],bodyFont:'Arapey',titleSize:1,titleWidth:1,titleOffsetY:0,titleAlign:'left',titleBox:false,bodySize:1,bodyWidth:1,bodyOffsetY:0,bodyAlign:'left',bodyLineHeight:1,photoShape:'rectangle',photoPaper:item.color,photoInk:item.ink,photoLabel1:'',photoLabel1X:0,photoLabel1Y:0,photoLabel2:'',photoLabel2X:0,photoLabel2Y:0,photoLabel3:'',photoLabel3X:0,photoLabel3Y:0,photoLabelColor:'#e5e486',dayLabel:'WEDNESDAY',dayLabelColor:'#4f9cc8'}));
  Object.assign(items[7],{dayLabel:'LONG DISTANCE',phoneBannerColor:'#51428f',phoneBannerTextColor:'#f4dd43',phoneBannerTop:'THIS EDITION IS OFFICIALLY ABOUT',phoneBannerMain:'CALL ME',phoneBannerBottom:'A LONG DISTANCE CONVERSATION'});
  Object.assign(items[6],{photoLabel1:'07',photoLabel2:'EAU DE PARFUM',photoLabel3:'GLASS / MEMORY'});
  Object.assign(items[3],{name:'04 / 원형 사진 · 짧은 글',photo:3,title:'A little time',body:'A small ritual.\nA familiar face.\n\nKeep a little time for the things you love.',photoShape:'circle',photoPaper:'#e9977e',photoInk:page.ink,titleSize:.7,titleAlign:'right',clipBody:true});
  Object.assign(layouts[3],{kicker:[54,852],image:[57,902,130,130],arc:[122,967,74],body:[224,883,95,155,17]});
  Object.assign(items[4],{name:'05 / 사진 · 짧은 기사',photo:1,title:'Small treasures',body:'Some things ask to be kept. A pleasing shape, a familiar sound.\n\nObjects with stories we have yet to learn.',clipBody:true});
  Object.assign(layouts[4],{title:[54,1100,264,63,34],body:[207,1167,112,175,17],image:[54,1166,138,176]});
  Object.assign(layouts[5],{title:[373,1126,334,48,48],body:[373,1180,334,29,15],frame:[357,1116,366,99],image:[337,1081,406,278]});
  items[5].fit='cover';
  items[2].fit='cover';
  items[7].fit='cover';
  Object.assign(items[0],{lampFigure:'FIG. 01 / c.1960',lampSide:'THE EVENING COLLECTION'});
  Object.assign(items[8],{name:'09 / 수집가의 승차권 · 편집 코너',kicker:'ODDMENTS COLLECTORS CLUB',title:'KEEP.',body:'ONE GOOD FIND\nWEEKLY PASS',titleFont:'BBH Hegarty',ticketDate:'2026\nEDITION',ticketNumbers:'3 9 4 8 5 7 6',ticketBadge:'36',ticketSerial:'26045',ticketBadgeRight:'36',ticketSerialRight:'26045',ticketLeft:'A collection is a kind of portrait. Keep what makes you look twice.',ticketRight:'Admit one curious mind. Good for small discoveries, all week long.'});
  items[8].ticketCaptions='01 / CAMERA\n02 / GLASS\n03 / CALL';
  items[0].body='A little light changes everything. Cast in brass and crowned with a milky globe, this quiet companion keeps the evening open. For reading one more chapter, writing a letter, or letting the day settle. A small pool of light. A whole world within it.';
  items[0].clipBody=true;layouts[0].body=[359,958,362,108,18];
  items[1].body='Fold it open. Find the light. Keep a little of the day: a face, a window, a place you almost walked past. Ordinary things, worth a second look.';
  items[1].clipBody=true;layouts[1].body=[54,443,264,59,15];
  items[4].body='A pleasing shape. A familiar sound. Small things with long stories.\n\nKeep them close. Let them gather dust, memories, and a little meaning.';
  items[6].body='A trace of perfume. A flash of glass. Some memories stay long after the bottle is empty.';
  items[6].clipBody=true;layouts[6].body=[762,586,264,39,14];
  items[8].ticketLeft='A collection is a quiet self-portrait. Keep what makes you look twice, then look once more.';
  items[8].ticketRight='Admit one curious mind. Valid for small discoveries, unexpected detours, and everyday wonder.';
  const extraFields={0:[['lampFigure','사진 번호 · 연도'],['lampSide','세로 문구']],8:[['ticketDate','연도 · 판 정보'],['ticketNumbers','숫자 칸 · 공백으로 구분'],['ticketBadge','왼쪽 원형 배지'],['ticketSerial','왼쪽 일련번호'],['ticketBadgeRight','오른쪽 원형 배지'],['ticketSerialRight','오른쪽 일련번호'],['ticketLeft','왼쪽 짧은 기사'],['ticketRight','오른쪽 짧은 기사'],['ticketCaptions','작은 사진 설명 · 한 줄에 하나']]};
  page.pageNumber='013';
  const positions=['중앙 상단','왼쪽 상단','왼쪽 가운데','왼쪽 아래 1','왼쪽 아래 2','중앙 하단','오른쪽 상단','오른쪽 하단','오른쪽 가운데'];
  items.forEach((item,i)=>{item.name=String(i+1).padStart(2,'0')+' / '+positions[i];item.typography={};});page.typography={};
  const photos=[],originalPhotos=[],versions=[],tintCache=[],ticketPhotos=[null,null,null];
  const ticketSettings=Array.from({length:3},()=>({stamp:.8,threshold:148,noise:.18,fit:'cover',zoom:1,cropX:.5,cropY:.5,photoInk:page.ink}));let selectedTicket=0;
  let selected=0,ready=false,busy=false,queued=false;
  let fontLoads=0;
  const fontRequests=new Map();
  const grain=document.createElement('canvas');grain.width=W;grain.height=H;
  const gc=grain.getContext('2d');let seed=1313;
  for(let i=0;i<80000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%W;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%H;gc.fillStyle=i%3?'#22221845':'#fffbeaa0';gc.fillRect(x,y,.7,.7);}
  const paperTextures=Object.fromEntries(Object.entries({soft:'../assets/receipt/soft-paper.jpg',fibers:'../assets/receipt/fibers.jpg',grain:'../assets/receipt/grain.jpg',folded:'../assets/receipt/folded.jpg',aged184:'../assets/receipt/aged184.jpg','stained-paper':'../assets/magazine/textures/stained-paper.jpg','glued-paper':'../assets/magazine/textures/glued-paper.jpg','punched-scan':'../assets/magazine/textures/punched-scan.jpg','newsprint':'../assets/magazine/textures/newsprint.jpg','rice-paper':'../assets/magazine/textures/rice-paper.jpg','kraft-wrinkles':'../assets/magazine/textures/kraft-wrinkles.jpg','white-wrinkles':'../assets/magazine/textures/white-wrinkles.jpg','light-copy':'../assets/magazine/textures/light-copy.jpg','scan-lines':'../assets/magazine/textures/scan-lines.jpg','toner-marks':'../assets/magazine/textures/toner-marks.jpg'}).map(([key,src])=>{const image=new Image();image.src=src;return [key,image];}));
  const paperTextureReady=Promise.all(Object.values(paperTextures).map(image=>image.decode()));
  const printBuffer=document.createElement('canvas');printBuffer.width=canvas.width;printBuffer.height=canvas.height;
  function finishPrint(){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);
    if(page.bleed>0){
      const c=printBuffer.getContext('2d');c.clearRect(0,0,printBuffer.width,printBuffer.height);c.drawImage(canvas,0,0);
      // Darken keeps flat ink colors intact while spreading every printed edge.
      ctx.globalCompositeOperation='darken';ctx.globalAlpha=Number(page.bleed)*.8;ctx.filter='blur('+(Number(page.bleed)*4.8)+'px)';ctx.drawImage(printBuffer,0,0);ctx.filter='none';ctx.globalCompositeOperation='source-over';
    }
    ctx.globalAlpha=1-Number(page.density);ctx.fillStyle=page.paper;ctx.fillRect(0,0,canvas.width,canvas.height);
    const image=paperTextures[page.paperFinish];
    if(image?.complete&&image.naturalWidth&&page.textureOpacity>0){
      const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),w=canvas.width/scale,h=canvas.height/scale;
      ctx.globalCompositeOperation='multiply';ctx.globalAlpha=Number(page.textureOpacity)*(['kraft-wrinkles','scan-lines','toner-marks'].includes(page.paperFinish)?.3:.9);ctx.drawImage(image,(image.naturalWidth-w)/2,(image.naturalHeight-h)/2,w,h,0,0,canvas.width,canvas.height);
    }
    ctx.restore();
  }
  function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
  function imageLayer(index,item=items[index],image=photos[index]){
    const key=[versions[index],item.photoInk,item.stamp,item.threshold,item.noise].join('/');
    if(tintCache[index]?.key===key&&tintCache[index].image===image)return tintCache[index].canvas;
    const tinted=document.createElement('canvas');tinted.width=image.width;tinted.height=image.height;
    const c=tinted.getContext('2d');c.drawImage(image,0,0);const pixels=c.getImageData(0,0,tinted.width,tinted.height),ink=rgb(item.photoInk);
    // Same luminance, fixed noise, threshold and stamp interpolation as Arrival Ticket's imageLayer.
    for(let i=0;i<pixels.data.length;i+=4){
      const d=pixels.data,l=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;
      let hash=Math.imul((i/4)^1597334677,2246822519);hash^=hash>>>13;
      const random=(hash>>>0)/4294967295,noisy=Math.max(0,Math.min(1,l+(random-.5)*item.noise));
      const cut=noisy*255>=item.threshold?1:0,tone=noisy*(1-item.stamp)+cut*item.stamp;
      for(let k=0;k<3;k++)d[i+k]=ink[k];
      d[i+3]=Math.round(d[i+3]*(tone>=.98?0:1-tone));
    }
    c.putImageData(pixels,0,0);tintCache[index]={key,image,canvas:tinted};return tinted;
  }
  function lines(value,width,preserveSpaces=false){
    const result=[];
    const separator=preserveSpaces?'':' ';
    for(const paragraph of value.split('\n')){
      if(!paragraph){result.push({text:'',last:true});continue;}
      let line='';
      for(const word of preserveSpaces?paragraph.match(/\s+|\S+/g):paragraph.split(/\s+/)){
        if(ctx.measureText(word).width>width){
          if(line){result.push({text:line,last:false});line='';}
          for(const char of word){if(line&&ctx.measureText(line+char).width>width){result.push({text:line,last:false});line='';}line+=char;}
        }else if(line&&ctx.measureText(line+separator+word).width>width){result.push({text:line,last:false});line=word;}
        else line+=(line?separator:'')+word;
      }
      if(line)result.push({text:line,last:true});
    }
    return result;
  }
  const fieldNames={masthead:'매거진 이름',subtitle:'한 줄 소개',issue:'발행 정보',edition:'호수 · 가격',footer:'하단 문구',pageNumber:'쪽 번호',kicker:'분류 제목',title:'제목',body:'본문',dayLabel:'세로 라벨',lampFigure:'사진 번호 · 연도',lampSide:'세로 문구',photoLabel1:'사진 라벨 1',photoLabel2:'사진 라벨 2',photoLabel3:'사진 라벨 3',phoneBannerTop:'배너 윗줄',phoneBannerMain:'배너 가운데',phoneBannerBottom:'배너 아랫줄',ticketDate:'연도 · 판 정보',ticketNumbers:'숫자 칸',ticketBadge:'왼쪽 원형 배지',ticketBadgeRight:'오른쪽 원형 배지',ticketSerial:'왼쪽 일련번호',ticketSerialRight:'오른쪽 일련번호',ticketLeft:'왼쪽 짧은 기사',ticketRight:'오른쪽 짧은 기사',ticketCaptions:'사진 설명'};
  const textSpecs=new Map();let hitRegions=[],activeText=null,activeImage=null;
  const textId=(owner,key)=>(owner===page?'page':items.indexOf(owner))+':'+key;
  function addHit(owner,key,box,kind='text'){
    const [x,y,w,h]=box,t=ctx.getTransform(),points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[(t.a*a+t.c*b+t.e)/2,(t.b*a+t.d*b+t.f)/2]);
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);hitRegions.push({owner,key,kind,box:[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]});
  }
  function textStyle(owner,key,defaults){return {font:'Scene',size:14,width:1,lineHeight:1.25,tracking:0,align:'left',color:owner.ink||page.ink,x:0,y:0,visible:true,contain:false,...defaults,...owner.typography[key]};}
  function paintText(owner,key,value,rect,defaults={},options={}){
    const style=textStyle(owner,key,defaults),[left,top,w,h]=rect,id=textId(owner,key);
    if(!textSpecs.has(id))textSpecs.set(id,{owner,key,rect,defaults:textStyle(owner,key,defaults),base:{...defaults},options});
    if(!style.visible||options.visible===false)return;
    if(options.fixedPosition){style.x=0;style.y=0;style.contain=true;}
    ctx.save();ctx.font=font(style.font,style.size);ctx.letterSpacing=style.tracking+'px';ctx.fillStyle=style.color;ctx.textBaseline='top';
    const x=left+style.x,y=top+style.y,limit=w/style.width;
    let rows=options.single?[{text:String(value).replace(/\n/g,' '),last:true}]:lines(String(value),limit,true),size=style.size;
    const clipToBox=style.contain&&!style.x&&!style.y;
    if(style.contain){while(rows.length*size*style.lineHeight>h&&size>6){size=Math.max(6,size-.5);ctx.font=font(style.font,size);rows=options.single?rows:lines(String(value),limit,true);}if(clipToBox){ctx.beginPath();ctx.rect(left,top,w,h);ctx.clip();}}
    rows.forEach(({text,last},i)=>{
      const tw=Math.min(ctx.measureText(text).width*style.width,w),tx=style.align==='center'?x+(w-tw)/2:style.align==='right'?x+w-tw:x,ty=y+i*size*style.lineHeight;
      if(options.background&&text.trim()){ctx.fillStyle=options.background;ctx.fillRect(tx-7,ty-3,tw+14,size*style.lineHeight+6);ctx.fillStyle=style.color;}
      ctx.save();ctx.translate(tx,ty);ctx.scale(style.width,1);ctx.textAlign='left';
      if(style.align==='justify'&&!last&&text.trim().includes(' ')){
        const words=text.trim().split(/\s+/),gap=(limit-words.reduce((sum,word)=>sum+ctx.measureText(word).width,0))/(words.length-1);let at=0;
        words.forEach(word=>{ctx.fillText(word,at,0);at+=ctx.measureText(word).width+gap;});
      }else ctx.fillText(text,0,0,limit);
      ctx.restore();if(text.trim()){const hx=clipToBox?Math.max(left,tx):tx,hy=clipToBox?Math.max(top,ty):ty,hw=clipToBox?Math.max(0,Math.min(left+w,tx+tw)-hx):tw,hh=clipToBox?Math.max(0,Math.min(top+h,ty+size*style.lineHeight)-hy):size*style.lineHeight;if(hw&&hh)addHit(owner,key,[hx,hy,hw,hh]);}
    });ctx.restore();
  }
  function blockText(owner,key,rect,title=false,options={}){
    const prefix=title?'title':'body';paintText(owner,key,owner[key],rect,{font:owner[prefix+'Font'],size:rect[4]*owner[prefix+'Size'],width:owner[prefix+'Width'],align:owner[prefix+'Align'],lineHeight:title?.98:1.27*owner.bodyLineHeight,y:rect[3]*owner[prefix+'OffsetY'],contain:!title&&!!owner.clipBody},options);
  }
  function drawPhoto(index,rect){
    if(!photos[index])return;
    const image=imageLayer(index),item=items[index],[x,y,w,h]=rect;
    const scale=(item.fit==='cover'?Math.max(w/image.width,h/image.height):Math.min(w/image.width,h/image.height))*item.zoom;
    const dw=image.width*scale,dh=image.height*scale;
    ctx.save();ctx.beginPath();if(item.photoShape==='circle')ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);else ctx.rect(x,y,w,h);ctx.clip();
    if(item.photoShape==='circle'){ctx.fillStyle=item.photoPaper;ctx.fillRect(x,y,w,h);}
    ctx.drawImage(image,x+(w-dw)*item.cropX,y+(h-dh)*item.cropY,dw,dh);ctx.restore();addHit(item,'photo',rect,'photo');
  }
  function drawPhotoLabels(item){
    const [x,y,w,h]=layouts[6].image,[bx,by,bw,bh]=layouts[6].box,positions=[[x+12,y+36],[x+156,y+111],[x-4,y+179]];
    for(let i=0;i<3;i++){
      const key='photoLabel'+(i+1),text=item[key],style=textStyle(item,key,{size:16,contain:true});
      ctx.save();ctx.font=font(style.font,style.size);ctx.letterSpacing=style.tracking+'px';
      const width=Math.min(bw-16,ctx.measureText(text).width*style.width+16),height=Math.min(bh-16,style.size*style.lineHeight+8);
      const left=Math.max(bx+8,Math.min(bx+bw-8-width,positions[i][0]+item[key+'X']*w+style.x)),top=Math.max(by+8,Math.min(by+bh-8-height,positions[i][1]+item[key+'Y']*h+style.y));
      if(text.trim()&&style.visible){ctx.fillStyle=item.photoLabelColor;ctx.fillRect(left,top,width,height);addHit(item,key,[left,top,width,height]);}
      paintText(item,key,text,[left+8,top+4,Math.max(1,width-16),height-8],{size:16,contain:true},{single:true,fixedPosition:true});ctx.restore();
    }
  }
  function drawDayLabel(item,[x,y,w,h],side='left'){
    ctx.save();ctx.translate(side==='right'?x+w-22:x+22,y+h/2);ctx.rotate(-Math.PI/2);
    paintText(item,'dayLabel',item.dayLabel,[-h/2+10,-8,h-20,20],{size:13,align:'center',contain:true},{single:true});ctx.restore();
  }
  function drawPhoneBanner(item,x,y,w){
    [['phoneBannerTop',9,4,16],['phoneBannerMain',30,23,49],['phoneBannerBottom',9,74,14]].forEach(([key,size,top,h])=>paintText(item,key,item[key],[x+8,y+top,w-16,h],{font:'Scene',size,align:'center',color:item.phoneBannerTextColor,contain:true,lineHeight:1},{single:true}));
  }
  function arcTitle(item,[cx,cy,r]){
    const base={font:item.titleFont,size:24*item.titleSize,width:item.titleWidth,align:item.titleAlign,y:r*2*item.titleOffsetY},style=textStyle(item,'title',base);
    textSpecs.set(textId(item,'title'),{owner:item,key:'title',rect:[cx-r,cy-r,r*2,r*2],base,defaults:style,options:{arc:true}});
    if(!style.visible)return;
    const x=cx+style.x,y=cy+style.y,chars=[...item.title.replace(/\n/g,' ')];ctx.save();ctx.font=font(style.font,style.size);ctx.fillStyle=style.color;
    const widths=chars.map(char=>Math.max(.1,ctx.measureText(char).width+style.tracking)*style.width),total=widths.reduce((a,b)=>a+b,0);
    if(!total){ctx.restore();return;}const scale=Math.min(1,r*2.5/total),sweep=total*scale/r;let angle=style.align==='left'?-sweep:style.align==='right'?0:-sweep/2;
    ctx.textAlign='center';ctx.textBaseline='bottom';
    chars.forEach((char,i)=>{const span=widths[i]*scale/r,mid=angle+span/2;ctx.save();ctx.translate(x+Math.sin(mid)*r,y-Math.cos(mid)*r);ctx.rotate(mid);ctx.scale(scale*style.width,scale);ctx.fillText(char,0,0);if(char.trim())addHit(item,'title',[-ctx.measureText(char).width/2,-style.size,ctx.measureText(char).width,style.size]);ctx.restore();angle+=span;});ctx.restore();
  }
  function lampDetails(){
    const item=items[0];paintText(item,'lampFigure',item.lampFigure,[367,245,170,18],{size:11},{single:true});
    ctx.save();ctx.translate(720,493);ctx.rotate(-Math.PI/2);paintText(item,'lampSide',item.lampSide,[-120,0,240,18],{size:12,align:'center'},{single:true});ctx.restore();
  }
  function ticketDetails(textOnly=false){
    const item=items[8],x=756,y=651,ink=item.ink,accent=item.ticketAccent,green=item.ticketBadgeColor;
    const numbers=item.ticketNumbers.trim().split(/\s+/),cells=[[0,20,42,40],[234,20,42,40],[28,60,42,34],[206,60,42,34],[64,94,42,31],[170,94,42,31],[117,125,42,30]];
    if(!textOnly){
      ctx.fillStyle=accent;ctx.fillRect(x+42,y+20,192,40);ctx.fillRect(x+70,y+60,136,34);ctx.fillRect(x+106,y+94,64,31);
      ctx.fillStyle=ink;for(const [a,b,w,h] of cells)ctx.fillRect(x+a,y+b,w,h);
      ctx.fillStyle=green;for(const center of [16,260]){ctx.beginPath();ctx.arc(x+center,y+139,14,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle=ink;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y+160);ctx.lineTo(x+276,y+160);ctx.moveTo(x+138,y+165);ctx.lineTo(x+138,y+219);ctx.moveTo(x,y+224);ctx.lineTo(x+276,y+224);ctx.stroke();
      [1,6,7].forEach((index,i)=>{const box=[x+i*92,y+229,92,39];drawTicketPhoto(imageLayer(9+i,ticketSettings[i],ticketPhotos[i]||photos[index]),box,ticketSettings[i]);addHit(item,'ticketPhoto'+i,box,'ticketPhoto');});return;
    }
    paintText(item,'kicker',item.kicker,[x,y,276,18],{font:'Arapey',size:10,align:'center'},{single:true,visible:item.showKicker});
    blockText(item,'title',[x+48,y+21,180,40,39],true);
    paintText(item,'body',item.body,[x+76,y+64,124,31],{font:'Special Elite',size:12,align:'center',contain:true});
    paintText(item,'ticketDate',item.ticketDate,[x+110,y+98,56,28],{font:'Kiwi Maru',size:10,align:'center',contain:true});
    cells.forEach(([a,b,w,h],i)=>paintText(item,'ticketNumbers',numbers[i]||'',[x+a+3,y+b+2,w-6,h-4],{font:'Alfa Slab One',size:30,align:'center',color:green,contain:true},{single:true}));
    for(const [key,left] of [['ticketBadge',x+4],['ticketBadgeRight',x+248]])paintText(item,key,item[key],[left,y+131,24,17],{font:'BBH Hegarty',size:15,align:'center',lineHeight:1,contain:true},{single:true});
    paintText(item,'ticketSerial',item.ticketSerial,[x+37,y+135,73,21],{font:'Special Elite',size:14,contain:true},{single:true});paintText(item,'ticketSerialRight',item.ticketSerialRight,[x+166,y+135,73,21],{font:'Special Elite',size:14,align:'right',contain:true},{single:true});
    paintText(item,'ticketLeft',item.ticketLeft,[x,y+167,127,53],{font:item.bodyFont,size:11,contain:true});paintText(item,'ticketRight',item.ticketRight,[x+149,y+167,127,53],{font:item.bodyFont,size:11,contain:true});
    item.ticketCaptions.split('\n').slice(0,3).forEach((caption,i)=>paintText(item,'ticketCaptions',caption,[x+i*92,y+273,90,12],{size:7,contain:true},{single:true}));
  }
  function drawTicketPhoto(image,[x,y,w,h],settings){
    const scale=(settings.fit==='cover'?Math.max(w/image.width,h/image.height):Math.min(w/image.width,h/image.height))*settings.zoom,dw=image.width*scale,dh=image.height*scale;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-dw)*settings.cropX,y+(h-dh)*settings.cropY,dw,dh);ctx.restore();
  }
  function draw(){
    queued=false;hitRegions=[];textSpecs.clear();ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle=page.paper;ctx.fillRect(0,0,W,H);ctx.fillStyle=page.ink;
    paintText(page,'issue',page.issue,[36,33,620,20],{size:11},{single:true});paintText(page,'edition',page.edition,[674,33,370,20],{size:11,align:'right'},{single:true});ctx.fillRect(36,60,1008,1.5);
    paintText(page,'masthead',page.masthead,[35,68,1005,96],{font:page.mastheadFont,size:94},{single:true});
    paintText(page,'subtitle',page.subtitle,[38,167,1004,22],{font:'Arapey',size:13},{single:true});
    items.forEach((item,i)=>{
      const layout=layouts[i],[x,y,w,h]=layout.box;ctx.fillStyle=item.color;ctx.fillRect(x,y,w,h);ctx.fillStyle=item.ink;
      if(layout.split){ctx.fillStyle=page.paper;ctx.fillRect(layout.split,y,x+w-layout.split,h);ctx.strokeStyle=page.ink;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(layout.split,y);ctx.lineTo(layout.split,y+h);ctx.stroke();ctx.fillStyle=item.ink;}
      if(layout.split)drawPhoto(i,layout.image);
      if(layout.image&&!layout.split)drawPhoto(i,layout.image);
      if(i===2){ctx.fillStyle=item.dayLabelColor;ctx.fillRect(x,y,44,h);ctx.fillStyle=page.ink;ctx.fillRect(x+44,y,.5,h);}
      if(i===7){ctx.fillStyle=item.phoneBannerColor;ctx.fillRect(x,y-90,w,90);ctx.fillStyle=page.ink;ctx.fillRect(x,y-90,w,.5);ctx.fillRect(x,y-.5,w,.5);drawPhoneBanner(item,x,y-90,w);ctx.fillStyle=item.dayLabelColor;ctx.fillRect(x+w-44,y,44,h);ctx.fillStyle=page.ink;ctx.fillRect(x+w-44,y,.5,h);}
      if(layout.frame){ctx.fillStyle=item.frameColor;ctx.fillRect(...layout.frame);ctx.strokeStyle=item.ink;ctx.lineWidth=2;ctx.strokeRect(...layout.frame);}
      if(i===8)ticketDetails();
      ctx.strokeStyle=page.ink;ctx.lineWidth=.9;ctx.strokeRect(x,y,w,h);
      if(i===7){ctx.fillStyle=page.ink;ctx.fillRect(x,y,.5,h);}
    });
    ctx.fillStyle=page.ink;ctx.fillRect(36,1374,1008,1.5);paintText(page,'footer',page.footer,[36,1390,880,22],{size:10},{single:true});paintText(page,'pageNumber',page.pageNumber,[964,1386,80,25],{font:'Arapey',size:18,align:'right'},{single:true});
    items.forEach((item,i)=>{
      const layout=layouts[i],[x,,w]=layout.box;ctx.fillStyle=item.ink;
      if(i===2||i===7){drawDayLabel(item,layout.box,i===7?'right':'left');return;}
      if(i===8){ticketDetails(true);return;}
      paintText(item,'kicker',item.kicker,[...layout.kicker,w-36,20],{size:10},{single:true,visible:item.showKicker});
      if(layout.arc)arcTitle(item,layout.arc);else blockText(item,'title',layout.title,true,{background:item.titleBox?item.photoLabelColor:null});
      blockText(item,'body',layout.body);
      if(i===6)drawPhotoLabels(item);
      if(i===0)lampDetails();
    });
    ctx.save();ctx.fillStyle='#000';ctx.fillRect(744,940,1,420);ctx.fillRect(744,1029.5,300,1);ctx.fillRect(999.5,1030,1,330);ctx.fillRect(79.5,510,1,330);ctx.restore();
    finishPrint();
    ctx.save();ctx.globalAlpha=page.grain;ctx.drawImage(grain,0,0);ctx.restore();
    refreshHighlight();if(ready&&!busy&&!fontLoads)$('status').textContent='';
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(draw);}}
  document.querySelectorAll('[data-preview-zoom]').forEach(button=>button.addEventListener('click',()=>{
    $('preview').dataset.zoom=button.dataset.previewZoom;
    document.querySelectorAll('[data-preview-zoom]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
  }));
  function placeSelection(box,label){
    const [x,y,w,h]=box;Object.assign($('selection').style,{left:x/W*100+'%',top:y/H*100+'%',width:w/W*100+'%',height:h/H*100+'%'});$('selection').dataset.label=label;$('selection').hidden=false;
  }
  function refreshHighlight(){
    const matches=activeText?hitRegions.filter(hit=>hit.kind==='text'&&textId(hit.owner,hit.key)===activeText):activeImage?hitRegions.filter(hit=>hit.owner===items[selected]&&hit.key===activeImage):[];
    if(matches.length){const left=Math.min(...matches.map(hit=>hit.box[0])),top=Math.min(...matches.map(hit=>hit.box[1])),right=Math.max(...matches.map(hit=>hit.box[0]+hit.box[2])),bottom=Math.max(...matches.map(hit=>hit.box[1]+hit.box[3]));placeSelection([left,top,right-left,bottom-top],activeText?fieldNames[textSpecs.get(activeText)?.key]||'글자':'사진');}
    else if(activeText){$('selection').hidden=true;}
    else if(!$('selection').hidden)placeSelection(layouts[selected].box,items[selected].name);
  }
  function showSelection(){activeText=null;activeImage=null;placeSelection(layouts[selected].box,items[selected].name);$('selectionContext').textContent=items[selected].name;document.querySelectorAll('[data-block]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.block)===selected)));}
  function openTab(name){document.querySelectorAll('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==name);document.querySelectorAll('[data-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.tab===name)));$('editor').scrollTop=0;if(name==='type')syncType();}
  function outputs(){document.querySelectorAll('input[type=range]').forEach(input=>{const output=document.querySelector('output[for="'+input.id+'"]');if(output)output.value=(input.id==='threshold'||input.id==='ticket-threshold')?input.value:Math.round(Number(input.value)*100)+'%';});}
  function sync(){
    $('extraFields').replaceChildren();
    for(const [key,label] of extraFields[selected]||[]){const caption=document.createElement('label'),input=document.createElement('textarea');caption.htmlFor='extra-'+key;caption.textContent=label;input.id='extra-'+key;input.dataset.item=key;input.rows=2;input.maxLength=key.startsWith('ticketL')||key.startsWith('ticketR')?180:80;$('extraFields').append(caption,input);}
    $('ticketPhotoControls').hidden=selected!==8;syncTicketPhoto();
    document.querySelectorAll('[data-page]').forEach(input=>input.value=page[input.dataset.page]);
    document.querySelectorAll('[data-item]').forEach(input=>{if(input.type==='checkbox')input.checked=Boolean(items[selected][input.dataset.item]);else input.value=items[selected][input.dataset.item];});
    $('photoLabels').hidden=selected!==6;
    $('dayLabelControls').hidden=selected!==2&&selected!==7;
    $('phoneBannerControls').hidden=selected!==7;
    $('articleTextControls').hidden=selected===2||selected===7;
    $('articleTypographyControls').hidden=false;
    $('ticketColorControls').hidden=selected!==8;
    $('frameColorControl').hidden=selected!==5;
    $('titleBoxControl').hidden=selected!==6;
    document.querySelectorAll('[data-image]').forEach(input=>input.value=items[selected][input.dataset.image]);
    $('articleSelect').value=selected;$('photoSelect').value=selected;
    const hasPhoto=items[selected].photo!==undefined;$('photoControls').hidden=!hasPhoto;$('noPhoto').hidden=hasPhoto||selected===8;$('editPhoto').hidden=!hasPhoto&&selected!==8;
    $('photoTitle').textContent=items[selected].name;outputs();
  }
  function choose(index){selected=index;sync();showSelection();}
  for(const [language] of fontLanguages)$('fontLanguage').add(new Option(language,language));
  function currentSpec(){return textSpecs.get(activeText);}
  function fillFamilies(){
    const spec=currentSpec(),style=spec&&textStyle(spec.owner,spec.key,spec.base),current=style&&fonts[style.font][0],query=$('fontSearch').value.trim().toLowerCase(),language=$('fontLanguage').value;
    $('fontFamily').replaceChildren();
    for(const category of ['고딕','세리프','그외']){
      const group=document.createElement('optgroup');group.label=category;
      for(const entry of families.values())if(entry.category===category&&(!language||entry.language===language)&&(!query||(entry.family+' '+(familyNames[entry.family]||'')).toLowerCase().includes(query))){group.append(new Option((familyNames[entry.family]||entry.family)+' · '+entry.language,entry.family));}
      if(group.children.length)$('fontFamily').append(group);
    }
    $('fontFamily').value=current||'';$('fontResult').textContent=$('fontFamily').options.length+'개 서체 · 굵기는 아래에서 선택';
  }
  function fillVariants(key){
    const family=fonts[key][0];$('fontVariant').replaceChildren();
    for(const variant of families.get(family).variants.sort((a,b)=>a.weight-b.weight||a.italic.localeCompare(b.italic)))$('fontVariant').add(new Option(variant.weight+(variant.italic==='italic'?' · 이탤릭':' · 기본'),variant.key));
    $('fontVariant').value=key;$('fontSample').style.font=font(key,22);$('fontSample').textContent=String(currentSpec()?.owner[currentSpec()?.key]||'가나다 Aa 123').slice(0,70);
  }
  function syncType(){
    if(!textSpecs.size)return;
    if(!textSpecs.has(activeText))activeText=textId(items[selected],selected===2||selected===7?'dayLabel':'title');
    const spec=currentSpec();if(!spec)return;
    const scope=spec.owner===page?'page':String(items.indexOf(spec.owner));$('textScope').value=scope;$('textTarget').replaceChildren();
    for(const [id,entry] of textSpecs)if(entry.owner===spec.owner)$('textTarget').add(new Option(fieldNames[entry.key]||entry.key,id));
    $('textTarget').value=activeText;$('typeText').value=spec.owner[spec.key];
    const style=textStyle(spec.owner,spec.key,spec.base);
    document.querySelectorAll('[data-type]').forEach(input=>{const value=style[input.dataset.type];if(input.type==='checkbox')input.checked=value;else input.value=value;});
    $('typeSize').max=spec.key==='phoneBannerMain'?'42':'160';
    $('typeVisible').checked=spec.key==='kicker'?spec.owner.showKicker&&style.visible:style.visible;
    $('typeLineHeight').disabled=!!spec.options.arc;$('typeContain').disabled=!!(spec.options.arc||spec.options.fixedPosition);
    $('typeAlign').querySelector('[value=justify]').disabled=!!(spec.options.arc||spec.options.single);
    $('selectionContext').textContent=(spec.owner===page?'지면':spec.owner.name)+' / '+fieldNames[spec.key];
    fillFamilies();fillVariants(style.font);outputs();refreshHighlight();
  }
  function selectText(owner,key,focus=true){
    if(owner!==page){selected=items.indexOf(owner);sync();}
    activeText=textId(owner,key);activeImage=null;$('fontSearch').value='';$('fontLanguage').value='';openTab('type');
    document.querySelectorAll('[data-block]').forEach(button=>button.setAttribute('aria-pressed',String(owner===items[Number(button.dataset.block)])));
    if(focus){$('typeText').focus({preventScroll:true});$('typeText').scrollIntoView({block:'nearest'});}refreshHighlight();
  }
  $('textScope').add(new Option('지면 전체','page'));
  items.forEach((item,i)=>{
    $('articleSelect').add(new Option(item.name,i));$('textScope').add(new Option(item.name,i));if(item.photo!==undefined||i===8)$('photoSelect').add(new Option(item.name,i));
    const button=document.createElement('button');button.type='button';button.dataset.block=i;button.textContent=String(i+1).padStart(2,'0');button.title=item.name;button.setAttribute('aria-label',item.name);button.addEventListener('click',()=>{choose(i);openTab('article');});$('blockMap').append(button);
  });
  $('articleSelect').addEventListener('change',event=>choose(Number(event.target.value)));
  $('photoSelect').addEventListener('change',event=>{choose(Number(event.target.value));activeImage='photo';refreshHighlight();});
  document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>openTab(button.dataset.tab)));
  $('editPhoto').addEventListener('click',()=>{activeText=null;activeImage='photo';openTab('photo');refreshHighlight();});
  $('textScope').addEventListener('change',()=>{const owner=$('textScope').value==='page'?page:items[Number($('textScope').value)],entry=[...textSpecs.values()].find(entry=>entry.owner===owner);if(entry)selectText(owner,entry.key,false);});
  $('textTarget').addEventListener('change',()=>{const spec=textSpecs.get($('textTarget').value);selectText(spec.owner,spec.key,false);});
  $('fontSearch').addEventListener('input',fillFamilies);$('fontLanguage').addEventListener('change',fillFamilies);
  async function changeFont(key){
    const spec=currentSpec();if(!spec||!fonts[key])return;
    const {owner,key:field}=spec,previous=owner.typography[field]?.font;owner.typography[field]??={};owner.typography[field].font=key;
    const request={},id=textId(owner,field);fontRequests.set(id,request);fontLoads++;setBusy(busy);$('status').textContent='선택한 서체를 불러오는 중…';
    try{await document.fonts.load(font(key,24),String(owner[field]).slice(0,100)||'가나다 Aa 123');}
    catch{if(fontRequests.get(id)===request){if(previous)owner.typography[field].font=previous;else delete owner.typography[field].font;}$('status').textContent='서체를 불러오지 못했습니다.';}
    finally{fontLoads--;setBusy(busy);draw();if(activeText===id)syncType();}
  }
  $('fontFamily').addEventListener('change',()=>{const entry=families.get($('fontFamily').value);if(entry)changeFont((entry.variants.find(v=>v.weight===400&&v.italic==='normal')||entry.variants[0]).key);});
  $('fontVariant').addEventListener('change',()=>changeFont($('fontVariant').value));
  $('typeText').addEventListener('input',()=>{const spec=currentSpec();if(!spec)return;spec.owner[spec.key]=$('typeText').value;sync();schedule();$('fontSample').textContent=$('typeText').value.slice(0,70);});
  function updateType(event){
    const input=event.target,key=input.dataset.type,spec=currentSpec();if(!key||!spec)return;
    let value=input.type==='checkbox'?input.checked:input.type==='number'||input.type==='range'?Number(input.value):input.value;
    if(input.type==='number'||input.type==='range'){if(input.value===''||!Number.isFinite(value))return;value=Math.max(Number(input.min),Math.min(Number(input.max),value));}
    spec.owner.typography[spec.key]??={};spec.owner.typography[spec.key][key]=value;if(key==='visible'&&spec.key==='kicker')spec.owner.showKicker=value;
    outputs();schedule();
  }
  $('editor').addEventListener('input',event=>{if(event.target.tagName!=='SELECT')updateType(event);});$('editor').addEventListener('change',event=>{if(event.target.tagName==='SELECT')updateType(event);});
  $('resetType').addEventListener('click',()=>{const spec=currentSpec();if(!spec)return;delete spec.owner.typography[spec.key];draw();syncType();});
  $('editor').addEventListener('focusin',event=>{const input=event.target,key=input.dataset.item||input.dataset.page,owner=input.dataset.page?page:items[selected];if(key&&textSpecs.has(textId(owner,key))){activeText=textId(owner,key);activeImage=null;$('selectionContext').textContent=(owner===page?'지면':owner.name)+' / '+fieldNames[key];refreshHighlight();}});
  canvas.addEventListener('click',event=>{
    if(busy||!ready)return;const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*W,y=(event.clientY-bounds.top)/bounds.height*H;
    const contains=box=>x>=box[0]&&x<=box[0]+box[2]&&y>=box[1]&&y<=box[1]+box[3],hits=hitRegions.filter(hit=>contains(hit.box)),hit=hits.findLast(hit=>hit.kind==='text')||hits.at(-1);
    if(hit){
      if(hit.kind==='text'){selectText(hit.owner,hit.key);return;}
      choose(items.indexOf(hit.owner));activeImage=hit.key;if(hit.kind==='ticketPhoto'){selectedTicket=Number(hit.key.slice(-1));syncTicketPhoto();}openTab('photo');refreshHighlight();const control=hit.kind==='photo'?$('upload'):document.querySelector('[data-ticket-photo="'+hit.key.slice(-1)+'"]');control?.focus({preventScroll:true});control?.scrollIntoView({block:'nearest'});return;
    }
    const [bx,by,bw]=layouts[7].box,banner=x>=bx&&x<=bx+bw&&y>=by-90&&y<by,index=banner?7:layouts.findIndex(({box})=>contains(box));
    if(index>=0){choose(index);openTab('article');if(banner)$('phoneBannerControls').scrollIntoView({block:'nearest'});}else{activeText=null;activeImage=null;openTab('page');$('selection').hidden=true;$('selectionContext').textContent='지면 전체';}
  });
  canvas.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&ready){event.preventDefault();selectText(items[selected],selected===2||selected===7?'dayLabel':'title');}});
  async function update(event){
    const input=event.target,value=input.type==='range'?Number(input.value):input.type==='checkbox'?input.checked:input.value;
    if(input.dataset.page){const key=input.dataset.page;page[key]=value;
      if(key==='ink'){
        items.forEach(item=>{item.ink=value;item.photoInk=value;});
        ticketSettings.forEach(settings=>settings.photoInk=value);items[7].phoneBannerTextColor=value;
        for(const owner of [page,...items])for(const style of Object.values(owner.typography))if(Object.hasOwn(style,'color'))style.color=value;
        draw();sync();if(activeText)syncType();return;
      }
    }
    else if(input.dataset.item)items[selected][input.dataset.item]=value;
    else if(input.dataset.image)items[selected][input.dataset.image]=value;
    else return;outputs();schedule();
  }
  $('editor').addEventListener('input',event=>{if(event.target.tagName!=='SELECT')update(event);});
  $('editor').addEventListener('change',event=>{if(event.target.tagName==='SELECT')update(event);});
  $('editor').addEventListener('change',async event=>{
    const input=event.target;if(input.dataset.ticketPhoto===undefined||!input.files[0])return;
    const file=input.files[0],index=Number(input.dataset.ticketPhoto);if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){$('status').textContent='20 MB 이하의 PNG·JPG·WebP 이미지를 선택해 주세요.';input.value='';return;}
    setBusy(true);const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();const scale=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight)),resized=document.createElement('canvas');resized.width=Math.max(1,Math.round(image.naturalWidth*scale));resized.height=Math.max(1,Math.round(image.naturalHeight*scale));resized.getContext('2d').drawImage(image,0,0,resized.width,resized.height);ticketPhotos[index]=resized;selectedTicket=index;syncTicketPhoto();draw();$('status').textContent='하단 사진을 등록했어요.';}catch{$('status').textContent='사진을 읽지 못했습니다. 다른 파일을 선택해 주세요.';}finally{URL.revokeObjectURL(url);input.value='';setBusy(false);}
  });
  $('editor').addEventListener('submit',event=>event.preventDefault());
  function mixColor(a,b,ratio){const left=rgb(a),right=rgb(b);return '#'+left.map((v,i)=>Math.round(v+(right[i]-v)*ratio).toString(16).padStart(2,'0')).join('');}
  function toneParts(){
    items.forEach(item=>{item.photoPaper=item.color;item.dayLabelColor=mixColor(item.color,page.ink,.16);item.photoLabelColor=mixColor(item.color,page.paper,.45);});
    items[3].photoPaper=mixColor(items[1].color,page.paper,.25);items[5].frameColor=mixColor(items[5].color,page.paper,.45);
    items[7].phoneBannerColor=mixColor(items[7].color,page.ink,.5);items[7].phoneBannerTextColor=page.paper;
    items[8].ticketAccent=mixColor(items[8].color,items[1].color,.55);items[8].ticketBadgeColor=mixColor(items[8].color,items[0].color,.65);
  }
  const palettes={original:['#e5e486','#eaa169','#dba8b7','#272720','#efca92','#d8c8ee','#dba8b7','#eaa169','#f4edda'],mint:['#c9d8bd','#e6aa83','#b7c7c1','#293b36','#e4ddc7','#aebfaf','#e3bdad','#e6aa83','#f0eadb'],paper:['#e7ddc5','#d7c6a5','#eee6d5','#282a25','#dfd3bc','#cbbda4','#d7c6a5','#dfd3bc','#f3eddf']};
  document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;const colors=palettes[button.dataset.palette];items.forEach((item,i)=>{item.color=colors[i];item.ink=i===3?colors[2]:page.ink;});toneParts();sync();schedule();}));
  function setBusy(value){busy=value;const disabled=value||!ready;if($('controls').disabled!==disabled)$('controls').disabled=disabled;$('save').disabled=disabled||fontLoads>0;}
  document.querySelectorAll('[data-ticket-restore]').forEach(button=>button.addEventListener('click',()=>{ticketPhotos[Number(button.dataset.ticketRestore)]=null;draw();}));
  function syncTicketPhoto(){
    $('ticketPhotoSelect').value=selectedTicket;
    document.querySelectorAll('[data-ticket-slot]').forEach(el=>el.hidden=Number(el.dataset.ticketSlot)!==selectedTicket);
    document.querySelectorAll('[data-ticket-image]').forEach(input=>input.value=ticketSettings[selectedTicket][input.dataset.ticketImage]);outputs();
  }
  $('ticketPhotoSelect').addEventListener('change',()=>{selectedTicket=Number($('ticketPhotoSelect').value);activeText=null;activeImage='ticketPhoto'+selectedTicket;syncTicketPhoto();refreshHighlight();});
  function updateTicketPhoto(event){const input=event.target,key=input.dataset.ticketImage;if(!key)return;ticketSettings[selectedTicket][key]=input.type==='range'?Number(input.value):input.value;outputs();schedule();}
  $('ticketPhotoControls').addEventListener('input',event=>{if(event.target.tagName!=='SELECT')updateTicketPhoto(event);});
  $('ticketPhotoControls').addEventListener('change',event=>{if(event.target.tagName==='SELECT')updateTicketPhoto(event);});
  $('restore').addEventListener('click',()=>{photos[selected]=originalPhotos[selected];versions[selected]++;schedule();});
  $('upload').addEventListener('change',async event=>{
    const file=event.target.files[0],index=selected;if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){$('status').textContent='20 MB 이하의 PNG·JPG·WebP 이미지를 선택해 주세요.';event.target.value='';return;}
    setBusy(true);$('status').textContent='사진을 불러오는 중…';const url=URL.createObjectURL(file);
    try{const image=new Image();image.src=url;await image.decode();const resized=document.createElement('canvas'),scale=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));resized.width=Math.max(1,Math.round(image.naturalWidth*scale));resized.height=Math.max(1,Math.round(image.naturalHeight*scale));resized.getContext('2d').drawImage(image,0,0,resized.width,resized.height);photos[index]=resized;versions[index]++;draw();$('status').textContent='사진을 바꿨어요.';}
    catch{ $('status').textContent='사진을 읽지 못했습니다. 다른 파일을 선택해 주세요.'; }
    finally{URL.revokeObjectURL(url);event.target.value='';setBusy(false);}
  });
  $('save').addEventListener('click',async()=>{
    if(busy||fontLoads||!ready)return;setBusy(true);$('status').textContent='PNG를 만드는 중…';
    try{await document.fonts.ready;draw();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='dear-magazine-13.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);$('status').textContent='2160 × 2880 PNG를 저장했습니다.';}
    catch{ $('status').textContent='저장하지 못했습니다. 다시 시도해 주세요.'; }
    finally{setBusy(false);}
  });
  window.SceneBridge={ready:()=>ready,busy:()=>busy||fontLoads>0,playing:()=>false,setPlaying:()=>{}};
  async function init(){
    try{
      const atlas=new Image(),telephone=new Image();atlas.src='../assets/magazine/curiosities-contact-sheet.png';telephone.src='../assets/magazine/rotary-telephone-v2.png';await Promise.all([atlas.decode(),telephone.decode(),paperTextureReady]);
      const initialFonts=new Set([page.mastheadFont,'Corben Bold','Alfa Slab One','BBH Hegarty','Beau Rivage','Special Elite','Kiwi Maru',...items.filter((_,i)=>i!==2).flatMap(item=>[item.titleFont,item.bodyFont])]);
      await Promise.all([document.fonts.load('14px Scene'),document.fonts.load('600 14px Scene'),document.fonts.load('14px MagazineText'),...[...initialFonts].map(key=>document.fonts.load(font(key,24)))]);
      const crops=[[130,0,270,505],[515,0,505,505],[1050,0,480,505],[5,512,500,505],[512,512,512,512],[1024,512,512,512]];
      items.forEach((item,i)=>{if(item.photo===undefined)return;const [x,y,w,h]=crops[item.photo],image=document.createElement('canvas');image.width=w;image.height=h;image.getContext('2d').drawImage(atlas,x/1536*atlas.width,y/1024*atlas.height,w/1536*atlas.width,h/1024*atlas.height,0,0,w,h);photos[i]=image;originalPhotos[i]=image;versions[i]=0;});
      photos[7]=telephone;originalPhotos[7]=telephone;
      ready=true;sync();draw();setBusy(false);showSelection();
    }catch{ $('status').textContent='사진이나 서체를 불러오지 못했습니다. 파일 경로를 확인한 뒤 다시 열어 주세요.'; }
  }
  toneParts();init();
})();
