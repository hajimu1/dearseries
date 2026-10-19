'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=768,H=832;
const config={shell:1,seconds:3,resolution:256,lcd:.15,moire:.25,moireColor:.65,moireSpacing:14,ghost:.3,ghostDelay:80,brightness:.9,vignette:.2,vignetteRange:.22,rings:true,score:null,gifWidth:768,loop:true,duration:11};
let ending=[],cuts=[],selected=0,time=0,playing=false,lastTick=0,busy=false,ready=false,cancelled=false,devices=[];
// Cover both LCD openings completely so the shell bitmap cannot leave dark edge strips.
const screenRects=[[213,100,343,260],[217,471,334,252]];
const screens=[0,1].map(()=>{const c=document.createElement('canvas');c.width=256;c.height=192;return c;});
const trail=document.createElement('canvas'),display=document.createElement('canvas');trail.width=display.width=256;trail.height=display.height=192;const moireMaps=new Map();let moireKey='';
async function comicPanels(sheet){
 const width=sheet.naturalWidth/2,height=sheet.naturalHeight/4;
 return Promise.all(Array.from({length:8},(_,i)=>{
  const panel=document.createElement('canvas');panel.width=width;panel.height=height;
  panel.getContext('2d').drawImage(sheet,(i%2)*width+3,Math.floor(i/2)*height+3,width-6,height-6,0,0,width,height);
  return load(panel.toDataURL('image/png'));
 }));
}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('이미지를 불러오지 못했어요. PNG·JPG·WebP 파일을 확인해주세요.'));image.src=src;});
const breathe=()=>new Promise(resolve=>setTimeout(resolve,0));
function notify(text){$('notice').textContent=text;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=`${time.toFixed(1)} / ${config.duration.toFixed(1)} s`;$('play').textContent=playing?'Ⅱ':'▶';}
function lock(value){busy=value;$('settingsFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video'])$(id).disabled=value;}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function photo(image){return {image,zoom:1,x:.5,y:.5,fit:'cover',raster:null};}
function raster(p){
 if(p.raster)return p.raster;
 const c=document.createElement('canvas');c.width=config.resolution;c.height=config.resolution*.75;
 const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#171827';g.fillRect(0,0,c.width,c.height);
 const scale=(p.fit==='contain'?Math.min:Math.max)(c.width/p.image.width,c.height/p.image.height)*p.zoom;
 const w=p.image.width*scale,h=p.image.height*scale;
 g.drawImage(p.image,Math.round((c.width-w)*p.x),Math.round((c.height-h)*p.y),Math.round(w),Math.round(h));
 const pixels=g.getImageData(0,0,c.width,c.height);
 for(let i=0;i<pixels.data.length;i+=4)for(let j=0;j<3;j++)pixels.data[i+j]=Math.round(pixels.data[i+j]/255*31)*255/31;
 g.putImageData(pixels,0,0);p.raster=c;return c;
}
function ring(g,x,y,r,color,width=3){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.strokeStyle=color;g.lineWidth=width;g.stroke();}


function scoreBurst(g,x,y,progress){
 g.save();g.translate(x,y-10*progress);const scale=.8+.25*Math.sin(Math.min(1,progress*3)*Math.PI/2);g.scale(scale,scale);g.globalAlpha=Math.min(1,(1-progress)*5);
 g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?16:35;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();
 g.lineJoin='round';g.lineWidth=8;g.strokeStyle='#17130c';g.stroke();g.fillStyle='#ff8b13';g.fill();g.lineWidth=3;g.strokeStyle='#ffdb30';g.stroke();
 g.transform(1,0,-.16,1,0,0);g.font='900 29px Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle='#10191b';g.strokeText('300',0,2);const gradient=g.createLinearGradient(0,-12,0,15);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.4,'#fffbd6');gradient.addColorStop(.55,'#ffda5c');gradient.addColorStop(1,'#ff8400');g.fillStyle=gradient;g.fillText('300',0,2);
 g.fillStyle='white';g.fillRect(-28,-23,3,3);g.fillRect(23,-19,3,3);g.restore();
}

function eliteBeat(g,progress,x,y){
 g.save();g.translate(x,y);const scale=.68+.12*Math.min(1,progress*5);g.scale(scale,scale);g.globalAlpha=Math.min(1,(1-progress)*6);
 g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?27:57;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.lineJoin='round';g.lineWidth=6;g.strokeStyle='#15101c';g.stroke();g.fillStyle='#ffb523';g.fill();g.lineWidth=3;g.strokeStyle='#ffedac';g.stroke();
 g.transform(1,0,-.13,1,0,0);g.font='italic 900 29px Arial';g.textAlign='center';g.textBaseline='middle';
 const pink=g.createLinearGradient(0,-48,0,52);pink.addColorStop(0,'#fff6ff');pink.addColorStop(.4,'#ff8de5');pink.addColorStop(1,'#e23dba');g.fillStyle=pink;g.strokeStyle='#170f1c';g.lineWidth=7;
 for(const [text,y] of [['Elite',-32],['Beat!!',0],['300',34]]){g.strokeText(text,0,y);g.fillText(text,0,y);}g.restore();
}
function smallScore(g,text,x,y){g.save();g.font='italic bold 18px Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle='#102334';g.strokeText(text,x,y);g.fillStyle='#b9f4ff';g.fillText(text,x,y);g.restore();}
function spinner(g,t){
 g.save();g.fillStyle='#85c9f6';g.fillRect(0,0,256,192);for(let y=0;y<72;y+=9){g.fillStyle='#fff79d';g.fillRect(0,y,256,7);g.fillStyle='#29271e';g.fillRect(0,y+7,256,2);}g.restore();
 g.save();g.translate(128,96);g.rotate(t*Math.PI*10);
 for(let i=0;i<8;i++){g.beginPath();g.moveTo(0,0);g.arc(0,0,69,i*Math.PI/4,(i+1)*Math.PI/4);g.closePath();g.fillStyle=i%2?'#ec3940':'#206dd7';g.fill();}
 ring(g,0,0,71,'#101d25',6);ring(g,0,0,67,'#fff7a6',3);ring(g,0,0,51,'#59df87',4);g.fillStyle='#287adc';g.beginPath();g.arc(0,0,20,0,Math.PI*2);g.fill();
 for(let i=0;i<3;i++){g.save();g.rotate(i*Math.PI*2/3);g.translate(0,-52);g.beginPath();for(let j=0;j<10;j++){const angle=-Math.PI/2+j*Math.PI/5,r=j%2?5:12;j?g.lineTo(Math.cos(angle)*r,Math.sin(angle)*r):g.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);}g.closePath();g.fillStyle='#fffde4';g.fill();g.restore();}g.restore();
 for(const x of [12,232])for(let j=0;j<10;j++){g.fillStyle=j<Math.floor(t*11)?'#ffe43f':'#df3144';g.fillRect(x,167-j*14,12,11);}
 smallScore(g,t>.65?'BONUS '+(Math.floor((t-.65)*10)+1)*100:'SPIN!',128,163);
}
const tapPatterns={
 triangle:[[60,130],[127,54],[197,130]],
 zigzag:[[48,63],[103,129],[153,62],[209,128]],
 diamond:[[128,44],[205,96],[128,148],[51,96]],
 stairs:[[48,143],[88,118],[128,94],[168,70],[208,45]],
 circle:Array.from({length:6},(_,i)=>[128+66*Math.cos(-Math.PI/2+i*Math.PI/3),96+52*Math.sin(-Math.PI/2+i*Math.PI/3)]),
 cross:[[52,48],[204,144],[128,96],[204,48],[52,144]]
};
const sliderPaths={
 arc:u=>[48+160*u,132-240*u*(1-u)],
 reverse:u=>[48+160*u,70+50*Math.sin(u*Math.PI)],
 wave:u=>[45+166*u,96+39*Math.sin(u*Math.PI*2)],
 loop:u=>[128+65*Math.cos(-Math.PI/2+u*Math.PI*2),96+51*Math.sin(-Math.PI/2+u*Math.PI*2)],
 infinity:u=>[128+75*Math.sin(u*Math.PI*2),96+43*Math.sin(u*Math.PI*4)],
 spiral:u=>{const r=88-72*u,a=-Math.PI/2+u*Math.PI*2.6;return [128+r*Math.cos(a),96+r*.82*Math.sin(a)];}
};
const autoPatterns=['triangle','arc','zigzag','reverse','diamond','wave','stairs','loop','circle','infinity','cross','spiral','spinner'];
const autoPatternOffset=Math.floor(Math.random()*autoPatterns.length);

function patternFor(cut){return cuts[cut].pattern&&cuts[cut].pattern!=='auto'?cuts[cut].pattern:autoPatterns[(cut+autoPatternOffset)%autoPatterns.length];}
function drawPattern(g,cut,t){
 const pattern=patternFor(cut);
 g.textAlign='center';g.textBaseline='middle';g.lineCap='round';g.lineJoin='round';
 // Replace the final hit judgement itself, rather than append another reward afterwards.
 const lastHit=.82*(pattern==='spinner' ? 1 : sliderPaths[pattern] ? .88 : .79);
 // Let the final contact remain visible for 60 ms before replacing it with the judgement.
 const contactPause=pattern==='spinner'?0:.06/(cut===cuts.length-1?config.seconds*2/3:config.seconds*.69);
 const judgement=lastHit+contactPause;
 if(t>=judgement){
  if(pattern==='spinner')spinner(g,1);
  const position=pattern==='spinner'?[128,96]:sliderPaths[pattern]?sliderPaths[pattern](pattern==='reverse'?0:1):(tapPatterns[pattern]||tapPatterns.triangle).at(-1);
  const progress=pattern==='spinner'?Math.min(.8,(t-judgement)/(1-judgement)):(t-judgement)/(1-judgement);
  if(cut===cuts.length-1)eliteBeat(g,progress,...position);
  else scoreBurst(g,...position,progress);
  return;
 }
 t=Math.min(t,lastHit)/.82;
 if(pattern==='spinner'){spinner(g,t);return;}
 if(sliderPaths[pattern]){
  const point=sliderPaths[pattern];
  const progress=Math.max(0,Math.min(1,(t-.18)/.7)),u=pattern==='reverse'?1-Math.abs(1-progress*2):progress,[x,y]=point(u);
  const trace=()=>{g.beginPath();for(let i=0;i<=64;i++){const [x,y]=point(i/64);i?g.lineTo(x,y):g.moveTo(x,y);}};
  trace();g.strokeStyle='#fff5c9';g.lineWidth=29;g.stroke();trace();g.strokeStyle='#bc6e1999';g.lineWidth=24;g.stroke();trace();g.strokeStyle='#efbc5799';g.lineWidth=16;g.stroke();
  for(let i=0;i<=8;i++){
   const at=i/8;
   // Repeated sliders consume ticks on the return leg, not the outward leg.
   if(t>=.18&&(pattern==='reverse'?(progress>=.5&&at>=u-1e-9):at<=u+1e-9))continue;
   const [x,y]=point(at);g.fillStyle='#fff4cf';g.beginPath();g.arc(x,y,2,0,Math.PI*2);g.fill();}
  const [sx,sy]=point(0),[ex,ey]=point(1);ring(g,sx,sy,15,'#fff3ba');ring(g,ex,ey,15,'#fff3ba');
  if(t<.18)ring(g,sx,sy,17+22*(1-t/.18),'#ffda63',2);
  g.save();g.translate(x,y);g.rotate(progress*Math.PI*8);g.fillStyle='#ffda38';g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();g.save();g.clip();g.fillStyle='#e94f37';g.fillRect(-4,-13,8,26);g.restore();ring(g,0,0,12,'#fff9d6',2);g.fillStyle='#ffffffaa';g.beginPath();g.arc(-4,-5,3,0,Math.PI*2);g.fill();g.restore();
  if(pattern==='reverse'&&progress<.5){
   g.save();g.translate(ex,ey);g.scale(.8,.8);g.lineCap='round';g.lineJoin='round';
   const arrow=new Path2D();arrow.moveTo(10,9);arrow.lineTo(10,-2);arrow.bezierCurveTo(10,-15,-10,-15,-10,-2);arrow.lineTo(-10,5);
   g.strokeStyle='#78501e';g.lineWidth=8;g.stroke(arrow);g.strokeStyle='#fffbdc';g.lineWidth=4;g.stroke(arrow);
   g.beginPath();g.moveTo(-17,0);g.lineTo(-10,9);g.lineTo(-3,0);g.closePath();g.strokeStyle='#78501e';g.lineWidth=3;g.stroke();g.fillStyle='#fffbdc';g.fill();g.restore();
  }
  if(t>=.18&&t<.3)smallScore(g,'30',sx,Math.max(20,sy-27));
  if(t>=.3&&t<.88){const tick=(t-.3)/.58*6;if(tick%1<.75)smallScore(g,'10',x,Math.max(20,y-29));}
  return;
 }
 const positions=tapPatterns[pattern]||tapPatterns.triangle,gap=.5/(positions.length-1);
 positions.forEach(([x,y],i)=>{const age=i===positions.length-1?Math.min(1,(t-i*gap)/.29):(t-i*gap)/.29;if(age<0||age>1.65)return;
  if(age>1){scoreBurst(g,x,y,(age-1)/.65);return;}
  if(i<positions.length-1){const [nx,ny]=positions[i+1];g.fillStyle='#fff9';for(let j=1;j<5;j++){g.beginPath();g.arc(x+(nx-x)*j/5,y+(ny-y)*j/5,1.5,0,Math.PI*2);g.fill();}}
  ring(g,x,y,16,'#fff5b4',3);ring(g,x,y,16+26*(1-age),'#efbf45',2);g.fillStyle='#172334b0';g.beginPath();g.arc(x,y,13,0,Math.PI*2);g.fill();g.fillStyle='white';g.font='bold 17px monospace';g.fillText(String(i+1),x,y+1);
 });
}

function endTiming(){const segment=config.seconds+2,pattern=config.seconds*2/3/segment,story=pattern+1/segment;return {pattern,story,success:story+.2/segment};}
function renderScreen(index,cut,phase,target=screens[index]){
 const c=target,g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,256,192);
 const final=cut===cuts.length-1,stages=endTiming(),story=final&&phase>=stages.story,transition=final?.94:.84;
 const isSpinner=patternFor(cut)==='spinner',patternEnd=isSpinner?(final?stages.story:1-.2/config.seconds):(final?stages.pattern:.69);
 const next=(cut+1)%cuts.length,progress=Math.max(0,Math.min(1,(phase-transition)/(1-transition))),current=raster(story?ending[index]:cuts[cut][index]),following=raster(cuts[next][index]);
 if(index===0){
  g.drawImage(current,0,0,256,192);
  // Delayed, stepped LCD response keeps a brief trace of the previous frame.
  const response=progress<.22?0:progress<.46?.35:progress<.70?.72:progress<.90?.93:1;
  if(response){g.save();g.globalAlpha=response;g.drawImage(following,0,0,256,192);g.restore();}
  if(response>0&&response<1){g.fillStyle='rgba(190,199,178,.045)';g.fillRect(0,0,256,192);}
 }
 else {
  // Keep the outgoing photo still; the next one covers it from left to right in six LCD steps.
  const duration=final?config.seconds+2:config.seconds;
  const cover=Math.max(0,Math.min(1,(phase*duration-(duration-.2))/.2));
  const shift=Math.round(256*Math.floor((cover+1e-8)*6)/6);
  g.drawImage(current,0,0,256,192);
  if(config.rings&&patternFor(cut)==='spinner'&&!story&&phase>=patternEnd*.82)spinner(g,1);
  if(shift)g.drawImage(following,shift-256,0,256,192);
 }

 if(index===1&&config.rings&&phase<patternEnd){
  const patternPhase=phase/patternEnd;
  g.save();g.globalAlpha=isSpinner?1:Math.min(1,(1-patternPhase)/.05);drawPattern(g,cut,patternPhase);g.restore();
 }
 if(index===1&&final&&phase>=stages.success&&phase<=.94){
  const pop=Math.min(1,(phase-stages.success)/.035),radius=77*(.82+.18*pop);
  ring(g,128,99,radius,'#090909',30);ring(g,128,99,radius,'#ff1689',22);
  const scoreText='SCORE '+String(config.score??cuts.length*1200).padStart(7,'0');
  g.fillStyle='#050505';g.fillRect(0,0,256,20);g.textAlign='center';g.textBaseline='middle';g.font='italic bold 13px monospace';g.lineWidth=2;g.strokeStyle='#34687c';g.strokeText(scoreText,128,10);g.fillStyle='#e5faff';g.fillText(scoreText,128,10);
 }

}
function frameAt(t){const loop=((t%config.duration)+config.duration)%config.duration,cut=Math.min(Math.floor(loop/config.seconds),cuts.length-1);return {cut,phase:(loop-cut*config.seconds)/(cut===cuts.length-1?config.seconds+2:config.seconds)};}
function updateMoire(w,h){
 const key=[config.moire,config.moireColor,config.moireSpacing].join(':');if(key!==moireKey){moireKey=key;moireMaps.clear();}
 const size=w+'x'+h;if(moireMaps.has(size))return moireMaps.get(size);
 const map=document.createElement('canvas');map.width=w;map.height=h;
 const g=map.getContext('2d'),pixels=g.createImageData(w,h),spacing=config.moireSpacing*h/384;
 for(let y=0;y<h;y++){
  const phase=y*Math.PI*2/spacing+.22*Math.sin(y*.019),beat=.65+.35*Math.sin(y*.041+.8),fine=Math.cos(y*Math.PI*2/2.7);
  const luminance=11*Math.sin(phase)+7*Math.sin(phase*1.073+.9)+4*fine;
  for(let x=0;x<w;x++){
   const i=(y*w+x)*4,envelope=.82+.18*Math.cos(x/w*Math.PI*2+.4);
   for(let channel=0;channel<3;channel++){
    const offset=channel*Math.PI*2/3,chroma=58*config.moireColor*beat*envelope*(.7*Math.sin(phase+offset)+.3*Math.sin(phase*.47-offset));
    pixels.data[i+channel]=128+luminance+chroma;
   }
   pixels.data[i+3]=config.moire*210;
  }
 }
 g.putImageData(pixels,0,0);moireMaps.set(size,map);return map;
}
// Feather only the perimeter; the controls sit on an opaque, smooth panel.
const controlPanels=['#f1f1f0','#f6c0d1','#b2e1f8'].map(color=>{
 const panel=document.createElement('canvas');panel.width=218;panel.height=430;
 const g=panel.getContext('2d');g.fillStyle=color;g.fillRect(0,0,218,430);
 g.globalCompositeOperation='destination-in';
 for(const [x0,y0,x1,y1] of [[0,0,218,0],[0,0,0,430]]){
  const fade=g.createLinearGradient(x0,y0,x1,y1),edge=18/(x1||y1);
  fade.addColorStop(0,'transparent');fade.addColorStop(edge,'#fff');fade.addColorStop(1-edge,'#fff');fade.addColorStop(1,'transparent');
  g.fillStyle=fade;g.fillRect(0,0,218,430);
 }
 return panel;
});
// Replace the complete controls, including their old rims, with clean canvas geometry.
function drawButtonFaces(){
 const [face,ink,light,dark]=[['#eeeeec','#787878','#fafaf8','#d4d4d2'],['#f2b4c8','#99465f','#ffe0ea','#dc8fa9'],['#a8ddf7','#34688e','#def4ff','#7cbada']][config.shell];
 ctx.save();ctx.translate(24,32);ctx.scale(720/1024,720/1024);ctx.translate(0,-190);
 ctx.drawImage(controlPanels[config.shell],778,790);
 ctx.drawImage(controlPanels[config.shell],32,790,210,430);
 function paintControl(shape,top,bottom){
  const shading=ctx.createLinearGradient(0,top,0,bottom);
  shading.addColorStop(0,light);shading.addColorStop(.24,face);shading.addColorStop(.76,face);shading.addColorStop(1,dark);
  ctx.save();ctx.shadowColor='rgba(45,24,35,.16)';ctx.shadowBlur=2;ctx.shadowOffsetY=2;
  ctx.fillStyle=shading;ctx.fill(shape);ctx.restore();
  ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.stroke(shape);
 }
 const cross=new Path2D();
 cross.moveTo(114,885);cross.lineTo(164,885);cross.lineTo(164,933);cross.lineTo(210,933);cross.lineTo(210,985);cross.lineTo(164,985);cross.lineTo(164,1033);cross.lineTo(114,1033);cross.lineTo(114,985);cross.lineTo(68,985);cross.lineTo(68,933);cross.lineTo(114,933);cross.closePath();
 paintControl(cross,885,1033);
 ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();
 for(const [x0,y0,x1,y1] of [[139,902,139,925],[139,994,139,1017],[85,959,105,959],[174,959,194,959]]){ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);}
 ctx.stroke();ctx.lineCap='butt';

 // A single cylinder keeps both caps and the MIC section under the same lighting.
 const hinge=ctx.createLinearGradient(0,700,0,783);
 hinge.addColorStop(0,dark);hinge.addColorStop(.13,face);hinge.addColorStop(.28,light);hinge.addColorStop(.48,face);hinge.addColorStop(.82,face);hinge.addColorStop(1,dark);
 ctx.beginPath();ctx.roundRect(24,700,976,83,41.5);
 ctx.fillStyle=hinge;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.stroke();
 // Matching end-cap seams, without the generated image's dark doubled edges.
 for(const x of [143,881]){
  ctx.beginPath();ctx.moveTo(x,701);ctx.lineTo(x,782);ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+2,703);ctx.lineTo(x+2,779);ctx.strokeStyle=light;ctx.lineWidth=1;ctx.stroke();
 }
 ctx.fillStyle=ink;
 ctx.beginPath();ctx.roundRect(508,726,7,28,3.5);ctx.fill();
 ctx.font='17px Arial';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('MIC.',528,742);
 for(const x of [928,948]){ctx.beginPath();ctx.roundRect(x,720,7,38,3.5);ctx.fill();}
 ctx.font='34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [x,y,r,label] of [[886,883,32,'X'],[829,942,32,'Y'],[943,942,32,'A'],[886,1000,32,'B'],[820,1109,16,''],[820,1168,16,'']]){
  const circle=new Path2D();circle.arc(x,y,r,0,Math.PI*2);paintControl(circle,y-r,y+r);
  ctx.fillStyle=ink;ctx.fillText(label,x,y+2);
 }
 ctx.font='18px Arial';ctx.textAlign='left';ctx.fillStyle=ink;
 ctx.fillText('START',848,1111);ctx.fillText('SELECT',848,1170);
 ctx.restore();
}
function screenVignette(g,x,y,w,h){
 if(!config.vignette)return;
 const shade='rgba(10,14,23,'+(config.vignette*.75)+')',clear='rgba(10,14,23,0)',range=config.vignetteRange;
 for(const [dx,dy] of [[w,0],[0,h]]){
  const gradient=g.createLinearGradient(x,y,x+dx,y+dy);
  gradient.addColorStop(0,shade);gradient.addColorStop(range*.35,'rgba(10,14,23,'+(config.vignette*.25)+')');gradient.addColorStop(range,clear);
  gradient.addColorStop(1-range,clear);gradient.addColorStop(1-range*.35,'rgba(10,14,23,'+(config.vignette*.25)+')');gradient.addColorStop(1,shade);
  g.fillStyle=gradient;g.fillRect(x,y,w,h);
 }
}
function draw(t=time){
 if(!ready)return;
 const {cut,phase}=frameAt(t);
 ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=true;ctx.drawImage(devices[config.shell],0,190,1024,1090,24,32,720,1090*720/1024);drawButtonFaces();
 for(let i=0;i<2;i++){
  renderScreen(i,cut,phase);const [x,y,w,h]=screenRects[i],d=display.getContext('2d');d.globalAlpha=1;d.drawImage(screens[i],0,0);
  // Sample past times rather than accumulated frames so scrubbing and exports match.
  if(config.ghost)for(const [delay,weight] of [[2,.12],[1,.28]]){const past=frameAt(t-config.ghostDelay*delay/1000);renderScreen(i,past.cut,past.phase,trail);d.globalAlpha=config.ghost*weight;d.drawImage(trail,0,0);}d.globalAlpha=1;
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,2);ctx.clip();
  ctx.imageSmoothingEnabled=false;ctx.drawImage(display,x,y,w,h);
  if(config.moire){ctx.save();ctx.globalCompositeOperation='soft-light';ctx.drawImage(updateMoire(w,h),x,y);ctx.restore();}
  if(config.brightness<1){ctx.fillStyle='rgba(0,0,0,'+(1-config.brightness)+')';ctx.fillRect(x,y,w,h);}
  if(config.lcd){ctx.fillStyle=`rgba(24,25,47,${config.lcd})`;for(let row=0;row<192;row++)ctx.fillRect(x,y+row*h/192,w,.35);for(let col=0;col<256;col++)ctx.fillRect(x+col*w/256,y,.25,h);}
  screenVignette(ctx,x,y,w,h);
  ctx.restore();
 }
 const stages=endTiming();$('phase').textContent=`CUT ${String(cut+1).padStart(2,'0')} / ${String(cuts.length).padStart(2,'0')} · ${phase<(cut===cuts.length-1?stages.pattern:.69)?'리듬':cut===cuts.length-1?(phase<stages.story?'패턴 후 대기':phase<stages.success?'성공 스토리':phase<=.94?'O · 성공!':'처음으로'):(phase<.84?'리듬 완료':'다음 컷으로')}`;
}
let activePhoto=0;
function showTab(name){
 for(const button of document.querySelectorAll('[role="tab"]')){const selected=button.id==='tab-'+name;button.setAttribute('aria-selected',selected);button.tabIndex=selected?0:-1;$(button.getAttribute('aria-controls')).hidden=!selected;}
}
function showPhoto(index){activePhoto=index;showTab('photos');for(let i=0;i<4;i++){if($('photo'+i))$('photo'+i).hidden=i!==index;document.querySelector('[data-photo="'+i+'"]').setAttribute('aria-pressed',i===index);}}
for(const button of document.querySelectorAll('[role="tab"]')){
 button.onclick=()=>showTab(button.id.slice(4));button.onkeydown=event=>{const tabs=[...document.querySelectorAll('[role="tab"]')];let index=tabs.indexOf(button);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();tabs[index].click();tabs[index].focus();};
}
for(const button of document.querySelectorAll('[data-photo]'))button.onclick=()=>showPhoto(Number(button.dataset.photo));
function choose(index){selected=index;playing=false;time=index*config.seconds;syncTime();editor();draw();}
function editor(){
 $('selectedCut').textContent=String(selected+1).padStart(2,'0')+' / '+String(cuts.length).padStart(2,'0');
 $('pattern').value=cuts[selected].pattern??'auto';
 $('cuts').replaceChildren();cuts.forEach((cut,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${String(i+1).padStart(2,'0')}`;b.setAttribute('aria-pressed',String(i===selected));b.onclick=()=>choose(i);$('cuts').append(b);});
 $('remove').disabled=cuts.length<=2;$('add').disabled=cuts.length>=6;
 $('photos').innerHTML=[0,1,2,3].map(i=>`<section class="photo" id="photo${i}"><img id="thumb${i}" alt="${i>1?'마지막 O 성공 장면 · ':''}${i%2?'아래':'위'} 화면 사진"><h3>${i>1?'O 성공 화면 · ':''}${i%2?'아래':'위'} 화면</h3><p class="help">${i>1?'마지막 O 장면에서만 쓰는 독립 사진입니다. 위 화면과 따로 편집할 수 있어요.':i?'리듬 링이 나타나는 화면':'컷의 스토리 화면'}</p><label for="upload${i}">사진 올리기</label><input id="upload${i}" type="file" accept="image/png,image/jpeg,image/webp"><label for="fit${i}">사진 배치</label><select id="fit${i}"><option value="cover">화면 채우기</option><option value="contain">사진 전체 보기</option></select><label for="zoom${i}">확대</label><input id="zoom${i}" type="range" min="1" max="3" step=".01"><label for="x${i}">좌우 위치</label><input id="x${i}" type="range" min="0" max="1" step=".01"><label for="y${i}">상하 위치</label><input id="y${i}" type="range" min="0" max="1" step=".01"><button type="button" id="reset${i}">배치 초기화</button></section>`).join('');
 for(let i=0;i<4;i++){
  $('photo'+i).hidden=i!==activePhoto;
  const target=i<2?cuts[selected]:ending,slot=i%2,p=target[slot];$('thumb'+i).src=p.image.src;
  for(const key of ['fit','zoom','x','y']){const input=$(key+i);input.value=p[key];input.oninput=()=>{p[key]=key==='fit'?input.value:Number(input.value);p.raster=null;draw();};}
  $('reset'+i).onclick=()=>{Object.assign(p,{zoom:1,x:.5,y:.5,fit:'cover',raster:null});editor();draw();};
  $('upload'+i).onchange=async event=>{
   const file=event.target.files[0];if(!file)return;
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>40000000){notify('40MB 이하의 PNG·JPG·WebP 사진을 선택해주세요.');return;}
   const wasPlaying=playing;playing=false;lock(true);let url;
   try{url=URL.createObjectURL(file);const image=await load(url);const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('사진을 읽지 못했어요.'));r.readAsDataURL(file);});image.src=data;await image.decode();target[slot]=photo(image);editor();notify(`${i>1?'O 성공 장면의 ':''}${i%2?'아래':'위'} 사진을 바꿨어요.`);}
   catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);lock(false);playing=wasPlaying;lastTick=0;syncTime();draw();}
  };
 }
}
$('add').onclick=()=>{if(cuts.length>=6)return;cuts.push(Object.assign(cuts[selected].map(p=>({...p})),{pattern:cuts[selected].pattern}));config.duration=cuts.length*config.seconds+2;choose(cuts.length-1);};
$('remove').onclick=()=>{if(cuts.length<=2)return;cuts.splice(selected,1);config.duration=cuts.length*config.seconds+2;choose(Math.min(selected,cuts.length-1));};
$('pattern').oninput=()=>{cuts[selected].pattern=$('pattern').value;draw();};
$('score').oninput=()=>{
 const value=$('score').value;
 config.score=value===''?null:Math.max(0,Math.min(9999999,Math.round(Number(value)||0)));
 if(value!=='')$('score').value=config.score;
 draw();
};
for(const key of ['shell','seconds','resolution','lcd','moire','moireColor','moireSpacing','ghost','ghostDelay','brightness','vignette','vignetteRange','rings','gifWidth'])$(key).oninput=()=>{
 config[key]=key==='rings'?$(key).checked:Number($(key).value);config.duration=cuts.length*config.seconds+2;time=Math.min(time,config.duration-.01);
 if(key==='resolution')[...cuts.flat(),...ending].forEach(p=>p.raster=null);
 for(const name of ['moire','moireColor','ghost','brightness','vignette','vignetteRange'])$(name+'Value').textContent=Math.round(config[name]*100)+'%';$('moireSpacingValue').textContent=config.moireSpacing;$('ghostDelayValue').textContent=config.ghostDelay+'ms';
 $('secondsValue').textContent=config.seconds.toFixed(1)+'초';$('lcdValue').textContent=Math.round(config.lcd*100)+'%';syncTime();draw();
};
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{time=0;playing=true;lastTick=0;syncTime();draw();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);syncTime();draw();};$('cancel').onclick=()=>cancelled=true;
canvas.onclick=event=>{if(busy||!ready)return;const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*W/r.width,y=(event.clientY-r.top)*H/r.height,loop=((time%config.duration)+config.duration)%config.duration,cut=Math.min(Math.floor(loop/config.seconds),cuts.length-1),elapsed=loop-cut*config.seconds,phase=elapsed/(cut===cuts.length-1?config.seconds+2:config.seconds),offset=cut===cuts.length-1&&phase>=endTiming().story?2:0;screenRects.forEach(([sx,sy,w,h],i)=>{if(x>=sx&&x<=sx+w&&y>=sy&&y<=sy+h){selected=cut;playing=false;lastTick=0;syncTime();editor();const target=i+offset;showPhoto(target);$('photo'+target).classList.add('selected');$('photo'+target).scrollIntoView({behavior:'smooth',block:'nearest'});$('upload'+target).focus({preventScroll:true});}});};
function tick(now){if(playing&&ready&&!busy){if(lastTick)time=(time+(now-lastTick)/1000)%config.duration;syncTime();draw();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
lock(true);
Promise.all([load('../assets/ds/ds-white-flat.png'),load('../assets/ds/ds-pink-flat.png'),load('../assets/ds/ds-sky-flat.png'),load('../assets/ds/birthday-delivery-comic.png')]).then(async loaded=>{devices=loaded.slice(0,3);const images=await comicPanels(loaded[3]);cuts=[0,1,2].map(i=>[photo(images[i*2]),photo(images[i*2+1])]);ending=images.slice(6).map(photo);ready=true;lock(false);editor();syncTime();draw();notify('');}).catch(error=>{notify(error.message);});

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
  download(blob, 'dear-ds-14.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
    if (action === 'save') {download(blob, 'dear-ds-14.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-ds-14.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});