'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
const {fonts,font,fontLanguages,families,familyNames}=window.MagazineFonts;
const groups={left:[0,1,4,7],right:[3,6,9,10]},middle=[2,5,8,11,12,13];
let CELL_SIZE=180;
const originalPositions=[[3,0],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[1,4]];
const layouts={
 original:{name:'기존 계단형',rows:['...#.','..###','.###.','###..','.#...'],size:180},
 diamond:{name:'다이아몬드',size:128,rows:['..#..','.###.','#####','.###.','..#..']},
 zigzag:{size:180,name:'지그재그',rows:['..##.','.##..','..##.','.##..']},
 ribbon:{size:180,name:'대각 리본',rows:['...##','..###','.###.','##...']},
 drift:{size:180,name:'엇갈린 블록',rows:['..###','.###.','###..','.###.']},
 diagonal:{size:180,name:'사선 확장',rows:['..##.','.####','.###.','####.','.#...']}
};
let currentLayout='original';
function layoutPositions(key){const result=Array(14).fill(null);if(key==='original'){originalPositions.forEach((p,i)=>result[i]=p);return result;}const rows=layouts[key].rows,points=[];rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='#')points.push([x,y]);}));let left,right;
 if(key==='diamond'){left=points.filter(([x])=>x<2);right=left.map(([x,y])=>[4-x,y]);}else{const ordered=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);left=ordered.slice(0,4).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);right=ordered.slice(-4).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
 const used=new Set([...left,...right].map(p=>p.join(','))),center=points.filter(p=>!used.has(p.join(',')));for(const [indices,slots] of [[groups.left,left],[groups.right,right],[middle,center]])slots.forEach((p,i)=>result[indices[i]]=p);return result;}
let positions=layoutPositions(currentLayout);
const cells=positions.map((position,i)=>({x:position?350+position[0]*180:0,y:position?90+position[1]*180:0,visible:!!position,mode:'empty',color:'#e0e125',text:'',textX:50,textY:50,textSize:48,badgeX:0,badgeY:0,badge:false,badgeColor:'#fff000',badgeNumber:String(i+1).padStart(2,'0'),image:null,zoom:1,panX:0,panY:0}));
function activeCells(){return cells.filter(c=>c.visible);}
function cellLabel(i){for(const side of ['left','right']){const n=groups[side].indexOf(i);if(n>=0)return (side==='left'?'왼쪽':'오른쪽')+' '+String(n+1).padStart(2,'0');}return '가운데 '+(middle.indexOf(i)+1);}
const rows=(items)=>items.map((a,i)=>({number:String(i+1).padStart(2,'0'),title:a[0],detail:a[1]}));
const panels={left:{x:0,y:170,show:true,rows:rows([['Wheat Field','VINCENT VAN GOGH · 1889'],['Self-Portrait','VINCENT VAN GOGH · 1887'],['Water Pitcher','JOHANNES VERMEER · c.1662'],['Irises','VINCENT VAN GOGH · 1890']])},right:{x:1150,y:650,show:true,rows:rows([['The Death of Socrates','JACQUES LOUIS DAVID · 1787'],['A Vase of Flowers','EDGAR DEGAS · 1865'],['The Third-Class Carriage','HONORÉ DAUMIER · 1864'],['Self-Portrait','REMBRANDT · 1660']])}};
const config={numberFont:'Dela Gothic One',titleFont:'Dela Gothic One',detailFont:'Scene',cellFont:'Dela Gothic One',typeScale:1,background:'#2c186f',panelColor:'#e0e125',ink:'#191914',lineColor:'#000000',lineWidth:1};
let activeRow=0,selection={kind:'cell',index:0,field:null};
let selected=0,ready=false,busy=false,fontLoads=0;
window.SceneBridge={ready:()=>ready,busy:()=>busy||fontLoads>0,playing:()=>false,setPlaying:()=>{}};
function typeValue(owner,role,suffix,fallback){return owner[role+suffix]??config[role+suffix]??fallback;}
function text(value,x,y,size,font,width,owner=config,role='numberFont'){const stretch=typeValue(owner,role,'Width',1),spacing=typeValue(owner,role,'Spacing',0);ctx.save();ctx.letterSpacing=spacing+'px';ctx.font=window.MagazineFonts.font(font,size);let measured=ctx.measureText(value).width;if(measured*stretch>width){ctx.font=window.MagazineFonts.font(font,size*width/(measured*stretch));measured=ctx.measureText(value).width;}ctx.translate(x,y);ctx.scale(Math.min(stretch,width/Math.max(1,measured)),1);ctx.fillText(value,0,0);ctx.restore();}


const surface={paperFinish:'soft',textureOpacity:.35,grain:.2};
  const grain=document.createElement('canvas');grain.width=1600;grain.height=1100;
  const gc=grain.getContext('2d');let seed=1313;
  for(let i=0;i<80000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%1600;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%1100;gc.fillStyle=i%3?'#22221845':'#fffbeaa0';gc.fillRect(x,y,.7,.7);}
  const paperTextures=Object.fromEntries(Object.entries({soft:'../assets/receipt/soft-paper.jpg',fibers:'../assets/receipt/fibers.jpg',grain:'../assets/receipt/grain.jpg',folded:'../assets/receipt/folded.jpg',aged184:'../assets/receipt/aged184.jpg','stained-paper':'../assets/magazine/textures/stained-paper.jpg','glued-paper':'../assets/magazine/textures/glued-paper.jpg','newsprint':'../assets/magazine/textures/newsprint.jpg','rice-paper':'../assets/magazine/textures/rice-paper.jpg','kraft-wrinkles':'../assets/magazine/textures/kraft-wrinkles.jpg','light-copy':'../assets/magazine/textures/light-copy.jpg','surface-0':'../assets/15-collage/textures/surface-0.jpg','surface-5':'../assets/15-collage/textures/surface-5.jpg','surface-7':'../assets/15-collage/textures/surface-7.jpg','surface-12':'../assets/15-collage/textures/surface-12.jpg','surface-14':'../assets/15-collage/textures/surface-14.jpg','surface-15':'../assets/15-collage/textures/surface-15.jpg','surface-17':'../assets/15-collage/textures/surface-17.jpg','surface-19':'../assets/15-collage/textures/surface-19.jpg','surface-23':'../assets/15-collage/textures/surface-23.jpg','surface-24':'../assets/15-collage/textures/surface-24.jpg','surface-29':'../assets/15-collage/textures/surface-29.jpg','surface-39':'../assets/15-collage/textures/surface-39.jpg','surface-47':'../assets/15-collage/textures/surface-47.jpg','surface-49':'../assets/15-collage/textures/surface-49.jpg','surface-50':'../assets/15-collage/textures/surface-50.jpg','surface-58':'../assets/15-collage/textures/surface-58.jpg','surface-59':'../assets/15-collage/textures/surface-59.jpg','surface-60':'../assets/15-collage/textures/surface-60.jpg'}).map(([key,src])=>{const image=new Image();image.src=src;return [key,image];}));
  const paperTextureReady=Promise.all(Object.values(paperTextures).map(image=>image.decode()));
function drawSurface(){
 ctx.save();const image=paperTextures[surface.paperFinish];
 if(image?.complete&&image.naturalWidth&&surface.textureOpacity>0){
  const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),w=canvas.width/scale,h=canvas.height/scale;
  ctx.globalCompositeOperation='multiply';ctx.globalAlpha=surface.textureOpacity*(['kraft-wrinkles','surface-58','surface-59','surface-60'].includes(surface.paperFinish)?.3:['surface-0','surface-12','surface-14','surface-17','surface-47'].includes(surface.paperFinish)?.55:.9);ctx.drawImage(image,(image.naturalWidth-w)/2,(image.naturalHeight-h)/2,w,h,0,0,canvas.width,canvas.height);
 }
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=surface.grain;ctx.drawImage(grain,0,0);ctx.restore();
}
for(const key of Object.keys(surface)){$(key).value=surface[key];const output=document.querySelector('output[for="'+key+'"]');const sync=()=>{if(output)output.value=Math.round(surface[key]*100)+'%';};sync();$(key).oninput=()=>{surface[key]=key==='paperFinish'?$(key).value:Number($(key).value);sync();draw();};}

function textPosition(c){return {x:c.x+CELL_SIZE*c.textX/100,y:c.y+CELL_SIZE*c.textY/100};}
function badgePosition(c){return {x:c.x+24+(CELL_SIZE-48)*c.badgeX/100,y:c.y+24+(CELL_SIZE-48)*c.badgeY/100};}
function draw(){
 ctx.fillStyle=config.background;ctx.fillRect(0,0,1600,1100);ctx.textBaseline='middle';
 for(const c of activeCells()){
  if(c.mode==='empty')continue;
  ctx.save();ctx.beginPath();ctx.rect(c.x,c.y,CELL_SIZE,CELL_SIZE);ctx.clip();ctx.fillStyle=c.color;ctx.fillRect(c.x,c.y,CELL_SIZE,CELL_SIZE);
  if(c.mode==='image'&&c.image){const im=c.image,s=Math.max(CELL_SIZE/im.width,CELL_SIZE/im.height)*c.zoom*(c.baseZoom||1),w=im.width*s,h=im.height*s;ctx.drawImage(im,c.x-(w-CELL_SIZE)*(c.panX+1)/2,c.y-(h-CELL_SIZE)*(c.panY+1)/2,w,h);}
  if(c.text){const at=textPosition(c);ctx.fillStyle=config.ink;ctx.textAlign='center';text(c.text,at.x,at.y,CELL_SIZE*c.textSize/180,c.cellFont||config.cellFont,CELL_SIZE-22,c,'cellFont');ctx.textAlign='left';}ctx.restore();

 }
 // Shared square edges are drawn once, after all images, on the pixel grid.
 if(config.lineWidth){const edges=new Map();for(const c of activeCells()){for(const edge of [[c.x,c.y,c.x+CELL_SIZE,c.y],[c.x,c.y+CELL_SIZE,c.x+CELL_SIZE,c.y+CELL_SIZE],[c.x,c.y,c.x,c.y+CELL_SIZE],[c.x+CELL_SIZE,c.y,c.x+CELL_SIZE,c.y+CELL_SIZE]])edges.set(edge.join(','),edge);}
 ctx.strokeStyle=config.lineColor;ctx.lineWidth=config.lineWidth;const offset=config.lineWidth%2===1?.5:0;ctx.beginPath();for(const [x1,y1,x2,y2] of edges.values()){ctx.moveTo(x1+offset,y1+offset);ctx.lineTo(x2+offset,y2+offset);}ctx.stroke();}
 for(const c of activeCells()){if(!c.badge)continue;const at=badgePosition(c);ctx.save();ctx.beginPath();ctx.arc(at.x,at.y,16,0,Math.PI*2);ctx.fillStyle=c.badgeColor;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#000';ctx.textAlign='center';text(c.badgeNumber,at.x,at.y,13,config.numberFont,24);ctx.restore();}
 for(const [side,p] of Object.entries(panels)){if(!p.show)continue;const right=side==='right';ctx.textAlign=right?'right':'left';ctx.fillStyle=config.panelColor;ctx.fillRect(p.x,p.y,450,342);ctx.fillStyle=config.ink;ctx.strokeStyle=config.ink;ctx.lineWidth=4;
  p.rows.forEach((r,i)=>{const y=p.y+19+i*76;ctx.beginPath();ctx.moveTo(p.x+16,y);ctx.lineTo(p.x+434,y);ctx.stroke();text(r.number,p.x+(right?431:19),y+38,54*config.typeScale,r.numberFont||config.numberFont,82,r,'numberFont');text(r.title,p.x+(right?339:111),y+28,25*config.typeScale,r.titleFont||config.titleFont,318,r,'titleFont');text(r.detail,p.x+(right?338:112),y+56,15*config.typeScale,r.detailFont||config.detailFont,315,r,'detailFont');});
  ctx.beginPath();ctx.moveTo(p.x+16,p.y+323);ctx.lineTo(p.x+434,p.y+323);ctx.stroke();ctx.textAlign='left';
 }
 drawSurface();
}
function tab(name){for(const n of ['photos','info','style','layout']){$(n).hidden=n!==name;$('tab-'+n).setAttribute('aria-selected',String(n===name));}refreshHighlight();}
for(const n of ['photos','info','style','layout'])$('tab-'+n).onclick=()=>{if(n==='style'){if(selection.kind==='row')openFont((selection.field||'title')+'Font',selection.side+':'+selection.index);else openFont('cellFont','cell:'+selected);}else{if(n==='photos')chooseCell(selected);else if(n==='info')chooseRow($('side').value,activeRow);else tab(n);}};
function syncCell(){const c=cells[selected];$('textControls').hidden=!middle.includes(selected);$('cellTitle').textContent=cellLabel(selected)+' · 사진';$('linkedInfo').hidden=!Object.values(groups).some(g=>g.includes(selected));for(const key of ['mode','zoom','panX','panY','textX','textY','textSize','badgeX','badgeY'])$(key).value=c[key];$('cellColor').value=c.color;$('cellText').value=c.text;$('badge').checked=c.badge;$('badgeAll').checked=activeCells().every(cell=>cell.badge);$('badgeAll').indeterminate=activeCells().some(cell=>cell.badge)&&!$('badgeAll').checked;$('badgeNumber').value=c.badgeNumber;$('badgeColor').value=c.badgeColor;for(const key of ['zoom','panX','panY'])$(key).disabled=c.mode!=='image'||!c.image;$('remove').disabled=!c.image;[...$('cellMap').children].forEach(b=>{const i=Number(b.dataset.cell);b.setAttribute('aria-pressed',String(i===selected));b.textContent=cellLabel(i).replace('왼쪽 ','L').replace('오른쪽 ','R').replace('가운데 ','·');b.title=cellLabel(i);b.setAttribute('aria-label',cellLabel(i)+' 사진 편집');b.style.backgroundImage=cells[i].mode==='image'&&cells[i].image?`url("${cells[i].image.src}")`:'';b.style.backgroundColor=cells[i].mode==='empty'?'transparent':cells[i].color;});}
function syncMap(){const rows=layouts[currentLayout].rows;$('cellMap').style.gridTemplateColumns='repeat('+rows[0].length+',1fr)';$('cellMap').style.gridTemplateRows='repeat('+rows.length+',29px)';$('cellMap').replaceChildren();positions.forEach((point,i)=>{if(!point)return;const [col,row]=point;const b=document.createElement('button');b.dataset.cell=i;b.style.gridArea=(row+1)+' / '+(col+1);b.onclick=()=>chooseCell(i);$('cellMap').append(b);});}
function applyLayout(key){if(!layouts[key])return;currentLayout=key;positions=layoutPositions(key);CELL_SIZE=layouts[key].size||140;panels.left.y=170;panels.right.y=650;const rows=layouts[key].rows,left=key==='original'?350:(1600-rows[0].length*CELL_SIZE)/2,top=key==='original'?90:(1100-rows.length*CELL_SIZE)/2;cells.forEach((c,i)=>{const point=positions[i];c.visible=!!point;if(point)Object.assign(c,{x:left+point[0]*CELL_SIZE,y:top+point[1]*CELL_SIZE});});if(!cells[selected].visible){selected=0;if(selection.kind==='cell')selection={kind:'cell',index:0,field:null};}syncMap();syncCell();draw();refreshHighlight();fillScopes();fillFamilies();fillVariants();for(const button of $('layoutPresets').children)button.setAttribute('aria-pressed',String(button.dataset.layout===key));$('layoutName').textContent=layouts[key].name+' · '+activeCells().length+'칸';}

for(const [key,layout] of Object.entries(layouts)){const button=document.createElement('button');button.type='button';button.dataset.layout=key;button.setAttribute('aria-label',layout.name+' 배치');const icon=document.createElement('span');icon.className='layout-icon';icon.style.gridTemplateRows='repeat('+layout.rows.length+',1fr)';layout.rows.forEach(row=>[...row].forEach(value=>{const square=document.createElement('i');square.className=value==='#'?'filled':'';icon.append(square);}));const label=document.createElement('span');label.textContent=layout.name;button.append(icon,label);button.onclick=()=>applyLayout(key);$('layoutPresets').append(button);}
$('editLayout').onclick=()=>tab('layout');
syncMap();

for(const [id,key] of [['mode','mode'],['cellColor','color'],['cellText','text'],['zoom','zoom'],['panX','panX'],['panY','panY']])$(id).oninput=()=>{cells[selected][key]=['zoom','panX','panY'].includes(key)?Number($(id).value):$(id).value;draw();syncCell();};
$('badge').onchange=()=>{cells[selected].badge=$('badge').checked;$('badgeAll').checked=activeCells().every(cell=>cell.badge);$('badgeAll').indeterminate=activeCells().some(cell=>cell.badge)&&!$('badgeAll').checked;draw();};
$('badgeAll').onchange=()=>{cells.forEach(cell=>cell.badge=$('badgeAll').checked);$('badgeAll').indeterminate=false;syncCell();draw();};
$('badgeColor').oninput=()=>{cells[selected].badgeColor=$('badgeColor').value;draw();};
$('badgeColorAll').onclick=()=>{cells.forEach(c=>c.badgeColor=cells[selected].badgeColor);draw();$('status').textContent='전체 배지에 색상을 적용했어요.';};
$('badgePositionAll').onchange=()=>{if($('badgePositionAll').checked){const {badgeX,badgeY}=cells[selected];cells.forEach(c=>Object.assign(c,{badgeX,badgeY}));draw();}};
$('badgeNumber').oninput=()=>{cells[selected].badgeNumber=$('badgeNumber').value;draw();};
$('fillPhoto').onclick=()=>{Object.assign(cells[selected],{zoom:1,panX:0,panY:0});syncCell();draw();};
$('cellFontEdit').onclick=()=>openFont('cellFont','cell:'+selected);
for(const key of ['textX','textY','textSize','badgeX','badgeY'])$(key).oninput=()=>{(key.startsWith('badge')&&$('badgePositionAll').checked?cells:[cells[selected]]).forEach(c=>c[key]=Number($(key).value));selection={kind:'cell',index:selected,field:key.startsWith('text')?'text':'badge'};draw();refreshHighlight();};
for(const kind of ['text','badge'])$(kind+'PositionReset').onclick=()=>{(kind==='badge'&&$('badgePositionAll').checked?cells:[cells[selected]]).forEach(c=>Object.assign(c,kind==='text'?{textX:50,textY:50}:{badgeX:0,badgeY:0}));selection={kind:'cell',index:selected,field:kind};syncCell();draw();refreshHighlight();};

function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요.'));im.src=src;});}
$('upload').onchange=async()=>{const file=$('upload').files[0];if(!file)return;const c=cells[selected],url=URL.createObjectURL(file);busy=true;$('png').disabled=true;try{const im=await loadImage(url);if(c.objectURL)URL.revokeObjectURL(c.objectURL);Object.assign(c,{image:im,objectURL:url,mode:'image',zoom:1,panX:0,panY:0});draw();syncCell();$('status').textContent='이미지를 교체했어요.';}catch(e){URL.revokeObjectURL(url);$('status').textContent=e.message;}finally{busy=false;updateSave();$('upload').value='';}};
$('remove').onclick=()=>{const c=cells[selected];if(c.objectURL)URL.revokeObjectURL(c.objectURL);Object.assign(c,{image:null,objectURL:null,mode:'empty',text:''});syncCell();draw();};
function chooseCell(i){selected=i;selection={kind:'cell',index:i,field:null};syncCell();tab('photos');}
function chooseRow(side,index,field='title'){activeRow=index;$('side').value=side;selection={kind:'row',side,index,field};syncRows();tab('info');}
function syncRows(){const side=$('side').value,p=panels[side],r=p.rows[activeRow];$('showPanel').checked=p.show;$('rows').replaceChildren();$('rowSelect').replaceChildren();
 p.rows.forEach((row,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-pressed',String(i===activeRow));b.setAttribute('aria-label',(side==='left'?'왼쪽':'오른쪽')+' '+(i+1)+'행 편집');b.onclick=()=>chooseRow(side,i);$('rowSelect').append(b);});
 for(const [key,label] of [['number','번호'],['title','제목'],['detail','아래 설명']]){const l=document.createElement('label');l.textContent=label;const line=document.createElement('div');line.className='field-line';const input=document.createElement('input');input.value=r[key];input.dataset.field=key;input.maxLength=key==='number'?8:100;input.setAttribute('aria-label',(side==='left'?'왼쪽':'오른쪽')+' '+(activeRow+1)+'행 '+label);input.onfocus=()=>{selection={kind:'row',side,index:activeRow,field:key};refreshHighlight();};input.oninput=()=>{r[key]=input.value;draw();};const button=document.createElement('button');button.type='button';button.textContent='서체';button.setAttribute('aria-label',label+' 서체 편집');button.onclick=()=>openFont(key+'Font',side+':'+activeRow);line.append(input,button);l.append(line);$('rows').append(l);}
}
$('side').onchange=()=>chooseRow($('side').value,activeRow);$('showPanel').onchange=()=>{panels[$('side').value].show=$('showPanel').checked;draw();refreshHighlight();};
$('linkedInfo').onclick=()=>{for(const side of ['left','right']){const i=groups[side].indexOf(selected);if(i>=0)chooseRow(side,i);}};
function refreshHighlight(){const overlay=$('selection');if(!overlay)return;let x,y,w,h,label;
 if(selection.kind==='row'){const p=panels[selection.side],right=selection.side==='right',y0=p.y+19+selection.index*76;x=p.x+16;y=y0;w=418;h=76;label=(selection.side==='left'?'왼쪽':'오른쪽')+' '+String(selection.index+1).padStart(2,'0');if(selection.field==='number'){x=p.x+(right?349:19);w=82;label+=' · 번호';}else if(selection.field==='title'){x=p.x+(right?21:111);y+=7;w=318;h=35;label+=' · 제목';}else if(selection.field==='detail'){x=p.x+(right?23:112);y+=43;w=315;h=27;label+=' · 아래 설명';}overlay.hidden=!p.show;
 }else{const c=cells[selection.index];x=c.x;y=c.y;w=h=CELL_SIZE;label=cellLabel(selection.index);if(selection.field==='badge'){const at=badgePosition(c);x=at.x-17;y=at.y-17;w=h=34;label+=' · 번호 배지';}else if(selection.field==='text'){const at=textPosition(c);x=Math.max(c.x,at.x-CELL_SIZE*.44);y=Math.max(c.y,at.y-CELL_SIZE*.22);w=Math.min(CELL_SIZE*.88,c.x+CELL_SIZE-x);h=Math.min(CELL_SIZE*.44,c.y+CELL_SIZE-y);label+=' · 칸 문구';}else label+=' · 사진';overlay.hidden=false;}
 if(!$('layout').hidden){overlay.hidden=true;label='지면 전체 · 배치, 텍스처와 색상';}
 Object.assign(overlay.style,{left:x/16+'%',top:y/11+'%',width:w/16+'%',height:h/11+'%'});overlay.dataset.label=label;$('selectionContext').textContent=label;
}
for(const [id,field] of [['textSize','text'],['badgeColor','badge'],['badgeColorAll','badge'],['cellText','text'],['badge','badge'],['badgeNumber','badge'],['textX','text'],['textY','text'],['badgeX','badge'],['badgeY','badge'],['upload',null],['zoom',null],['panX',null],['panY',null]])$(id).addEventListener('focus',()=>{selection={kind:'cell',index:selected,field};refreshHighlight();});
function updateSave(){ $('png').disabled=busy||!ready||fontLoads>0; }
for(const [language] of fontLanguages)$('fontLanguage').add(new Option(language,language));
function fontOwner(){const scope=$('fontScope').value;if(scope==='all'||scope==='bulk')return config;const [side,index]=scope.split(':');return side==='cell'?cells[Number(index)]:panels[side].rows[Number(index)];}
function currentFont(){return fontOwner()[$('fontTarget').value]||config[$('fontTarget').value];}
function fillScopes(preferred=$('fontScope').value){$('fontScope').replaceChildren(new Option('모두 변경 (개별 지정도 덮어쓰기)','bulk'),new Option('공통 기본 서체 (개별 지정은 유지)','all'));if($('fontTarget').value==='cellFont'){cells.forEach((c,i)=>{if(c.visible)$('fontScope').add(new Option(cellLabel(i)+' · 칸 문구','cell:'+i));});}else{for(const side of ['left','right'])panels[side].rows.forEach((r,i)=>$('fontScope').add(new Option((side==='left'?'왼쪽':'오른쪽')+' '+(i+1)+'행',side+':'+i)));} $('fontScope').value=[...$('fontScope').options].some(o=>o.value===preferred)?preferred:'all';}
function openFont(target,scope){if(scope!=='all'&&scope!=='bulk'){const [side,index]=scope.split(':');selection=side==='cell'?{kind:'cell',index:Number(index),field:'text'}:{kind:'row',side,index:Number(index),field:target.replace('Font','')};if(side==='cell')selected=Number(index);else{activeRow=Number(index);$('side').value=side;}}$('fontTarget').value=target;fillScopes(scope);syncCell();syncRows();fillFamilies();fillVariants();tab('style');if(scope==='bulk'||scope==='all'){$('selection').hidden=true;$('selectionContext').textContent=$('fontTarget').selectedOptions[0].textContent+' · '+(scope==='bulk'?'모두 변경':'공통 기본값');}}
$('fontScope').onchange=()=>openFont($('fontTarget').value,$('fontScope').value);
$('resetFont').onclick=()=>{const owner=fontOwner();if(owner!==config){delete owner[$('fontTarget').value];fillFamilies();fillVariants();draw();}};
function fillFamilies(){
 const current=fonts[currentFont()][0],query=$('fontSearch').value.trim().toLowerCase(),language=$('fontLanguage').value;
 $('fontFamily').replaceChildren();
 for(const category of ['고딕','세리프','그외']){const group=document.createElement('optgroup');group.label=category;
 for(const entry of families.values())if(entry.category===category&&(!language||entry.language===language)&&(!query||(entry.family+' '+(familyNames[entry.family]||'')).toLowerCase().includes(query)))group.append(new Option((familyNames[entry.family]||entry.family)+' · '+entry.language,entry.family));
 if(group.children.length)$('fontFamily').append(group);}
 $('fontFamily').value=current;$('fontResult').textContent=$('fontFamily').options.length+'개 서체 · 굵기는 아래에서 선택';
}
function fillVariants(){const key=currentFont(),family=fonts[key][0];$('fontVariant').replaceChildren();
 for(const variant of families.get(family).variants.sort((a,b)=>a.weight-b.weight||a.italic.localeCompare(b.italic)))$('fontVariant').add(new Option(variant.weight+(variant.italic==='italic'?' · 이탤릭':' · 기본'),variant.key));
 $('resetFont').disabled=fontOwner()===config||!fontOwner()[$('fontTarget').value];$('fontVariant').value=key;const scope=$('fontScope').value;$('fontScopeHint').textContent=scope==='bulk'?'이 종류의 글자를 모두 함께 변경합니다. 개별 설정도 바뀝니다.':scope==='all'?'별도로 서체를 지정하지 않은 글자에 적용됩니다.':$('fontScope').selectedOptions[0].textContent+'의 '+$('fontTarget').selectedOptions[0].textContent+'만 변경합니다.';$('resetFont').hidden=scope==='bulk'||scope==='all';$('fontSample').style.font=font(key,22);syncTypography();}
function fontOwners(){return $('fontScope').value==='bulk'?[config,...($('fontTarget').value==='cellFont'?cells:Object.values(panels).flatMap(p=>p.rows))]:[fontOwner()];}
function syncTypography(){const owner=fontOwner(),role=$('fontTarget').value,width=typeValue(owner,role,'Width',1),spacing=typeValue(owner,role,'Spacing',0);$('fontWidth').value=Math.round(width*100);$('fontSpacing').value=spacing;$('fontWidthValue').value=Math.round(width*100)+'%';$('fontSpacingValue').value=spacing+'px';const sample=document.createElement('span');sample.textContent=(owner===config?'가나다 Aa 123 · Picture Index':role==='cellFont'?owner.text:owner[role.replace('Font','')])||'가나다 Aa 123';sample.style.display='inline-block';sample.style.letterSpacing=spacing+'px';sample.style.transform='scaleX('+width+')';$('fontSample').replaceChildren(sample);}
for(const [id,suffix,divisor] of [['fontWidth','Width',100],['fontSpacing','Spacing',1]])$(id).oninput=()=>{const role=$('fontTarget').value;for(const owner of fontOwners())owner[role+suffix]=Number($(id).value)/divisor;syncTypography();draw();};
$('resetTypography').onclick=()=>{const role=$('fontTarget').value;for(const owner of fontOwners()){if(owner===config){owner[role+'Width']=1;owner[role+'Spacing']=0;}else{delete owner[role+'Width'];delete owner[role+'Spacing'];}}syncTypography();draw();};
const fontRequests=new WeakMap();
for(const [id,target] of [["bulkNumber","numberFont"],["bulkTitle","titleFont"],["bulkDetail","detailFont"]])$(id).onclick=()=>openFont(target,"bulk");
async function changeFont(key){if(!fonts[key])return;const target=$('fontTarget').value,bulk=$('fontScope').value==='bulk',owners=bulk?[config,...(target==='cellFont'?cells:Object.values(panels).flatMap(p=>p.rows))]:[fontOwner()],request={};const previous=owners.map(owner=>{const value=owner[target];if(!fontRequests.has(owner))fontRequests.set(owner,new Map());fontRequests.get(owner).set(target,request);owner[target]=key;return value;});let failed=false;fontLoads++;updateSave();$('status').textContent='선택한 서체를 불러오는 중…';
 try{await document.fonts.load(font(key,24),'가나다 Aa 123 '+Object.values(panels).flatMap(p=>p.rows.map(r=>r.title+' '+r.detail+' '+r.number)).join(' ')+cells.map(c=>c.text).join(' '));}
 catch{failed=true;owners.forEach((owner,i)=>{if(fontRequests.get(owner).get(target)===request){if(previous[i])owner[target]=previous[i];else delete owner[target];}});$('status').textContent='서체를 불러오지 못했습니다.';}
 finally{fontLoads--;updateSave();draw();fillVariants();if(!fontLoads&&!failed)$('status').textContent=bulk?'전체에 서체를 적용했어요.':'서체를 적용했어요.';}}

$('fontFamily').onchange=()=>{const entry=families.get($('fontFamily').value);if(entry)changeFont((entry.variants.find(v=>v.weight===400&&v.italic==='normal')||entry.variants[0]).key);};
$('fontVariant').onchange=()=>changeFont($('fontVariant').value);
$('fontTarget').onchange=()=>{const target=$('fontTarget').value,scope=$('fontScope').value;openFont(target,scope==='bulk'||scope==='all'?scope:target==='cellFont'?'cell:'+selected:$('side').value+':'+activeRow);};$('fontSearch').oninput=fillFamilies;$('fontLanguage').onchange=fillFamilies;
for(const key of Object.keys(config).filter(key=>!key.endsWith('Font')))$(key).oninput=()=>{config[key]=['typeScale','lineWidth'].includes(key)?Number($(key).value):$(key).value;draw();};
fillScopes();fillFamilies();fillVariants();
canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1600/r.width,y=(e.clientY-r.top)*1100/r.height;for(const [side,p] of Object.entries(panels)){if(p.show&&x>=p.x&&x<=p.x+450&&y>=p.y&&y<=p.y+342){const i=Math.max(0,Math.min(3,Math.floor((y-p.y-19)/76))),field=(side==='right'?x>=p.x+342:x<p.x+108)?'number':(y-p.y-19-i*76<43?'title':'detail');chooseRow(side,i,field);$('rows').querySelector('[data-field='+field+']').focus({preventScroll:true});return;}}const i=cells.findIndex(c=>c.visible&&x>=c.x&&x<=c.x+CELL_SIZE&&y>=c.y&&y<=c.y+CELL_SIZE);if(i>=0){chooseCell(i);const at=badgePosition(cells[i]);if(cells[i].badge&&Math.hypot(x-at.x,y-at.y)<=18){selection.field='badge';document.querySelector('.badge-settings').open=true;refreshHighlight();$('badgeNumber').focus({preventScroll:true});}}};
function download(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dear-series-15.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('png').onclick=async()=>{if(busy||fontLoads||!ready)return;busy=true;$('png').disabled=true;try{await document.fonts.ready;draw();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 생성에 실패했어요.');download(blob);$('status').textContent='PNG를 저장했어요.';}catch(e){$('status').textContent=e.message;}finally{busy=false;updateSave();}};
(async()=>{try{const images=await Promise.all(['../assets/15-collage/wheat.jpg','../assets/15-collage/436532.jpg','../assets/15-collage/437881.jpg','../assets/15-collage/436528.jpg','../assets/15-collage/436105.jpg','../assets/15-collage/436121.jpg','../assets/15-collage/436095.jpg','../assets/15-collage/437397.jpg'].map(loadImage));for(const [side,offset] of [['left',0],['right',4]])groups[side].forEach((index,i)=>Object.assign(cells[index],{mode:'image',image:images[offset+i],text:'',badge:true,badgeNumber:String(i+1).padStart(2,'0'),...((side==='right'&&[0,1,2].includes(i))||(side==='left'&&[0,2].includes(i))?{baseZoom:1.12}:{})}));middle.forEach((index,i)=>Object.assign(cells[index],{mode:'color',color:i===1?'#15132e':'#e0e125',text:['ART','','15','','',''][i],badge:false}));await Promise.all([...new Set([config.numberFont,config.titleFont,config.detailFont,config.cellFont,'MagazineText'])].map(key=>document.fonts.load(font(key,24),'가나다 Aa 123')));await paperTextureReady;await document.fonts.ready;ready=true;updateSave();$('status').textContent='사진 칸이나 좌우 목록을 눌러 편집하세요.';}catch(e){$('status').textContent=e.message;}syncRows();applyLayout(currentLayout);})();

document.fonts.addEventListener("loadingdone",()=>{if(ready)draw();});
