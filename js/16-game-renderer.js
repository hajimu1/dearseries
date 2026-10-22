'use strict';
const gameThemes={
 gothic:{ink:'#e6dcc3',dim:'#aaa18c',edge:'#796b50',glow:'#ab2117',fill:'#120e09',font:'GameSerif',menuX:87},
 sepia:{ink:'#241b13',dim:'#504333',edge:'#89734c',glow:'#816c33',fill:'#c8b594',font:'GameSerif',menuX:582},
 crystal:{ink:'#edf5ff',dim:'#b7cbe6',edge:'#c6def9',glow:'#417ec0',fill:'#102e70',font:'GameSepia',menuX:87,accent:'#bceaff',variant:true},
 terminal:{ink:'#b4efc7',dim:'#76ac8b',edge:'#437e59',glow:'#164e31',fill:'#061b12',font:'Courier New',menuX:87,accent:'#92ffb0',variant:true},
 noir:{ink:'#e6e4df',dim:'#a5a3a0',edge:'#636461',glow:'#512421',fill:'#101112',font:'GameArchive',menuX:87,accent:'#c96759',variant:true},
 street:{ink:'#f8fcff',dim:'#193955',edge:'#d8edfa',glow:'#219bd3',fill:'#81aed5',font:'Arial',menuX:87}
};
const artLayer=document.createElement('canvas'),crtBuffer=document.createElement('canvas'),wear=document.createElement('canvas');
artLayer.width=960;artLayer.height=720;wear.width=480;wear.height=360;
// Fixed grain is repeatable when seeking and at the loop seam.
{const g=wear.getContext('2d');let seed=1602;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<19000;i++){const a=random()*.23;g.fillStyle=random()>.55?`rgba(233,218,175,${a})`:`rgba(0,0,0,${a})`;g.fillRect(random()*480,random()*360,random()*3+.4,random()*1.5+.4);}for(let i=0;i<65;i++){const x=random()*480,y=random()*360;g.strokeStyle='#a3986940';g.beginPath();g.moveTo(x,y);g.lineTo(x+random()*20,y+random()*3);g.stroke();}}
function phaseAt(t){const u=((t%config.duration)+config.duration)%config.duration/config.duration;return {u,open:u<.22?0:u<.32?ease((u-.22)/.1):u<.84?1:1-ease((u-.84)/.1),slot:Math.min(3,Math.max(0,Math.floor((u-.36)/.105))),back:u>=.79&&u<.94};}
const textMask=document.createElement('canvas'),textureLayer=document.createElement('canvas');
textMask.width=textureLayer.width=960;textMask.height=textureLayer.height=720;
const maskContext=textMask.getContext('2d'),textureContext=textureLayer.getContext('2d');
function smoothStep(value){const p=clamp(value);return p*p*(3-2*p);}
function menuPosition(u){return config.target*(u>=.84?1-smoothStep((u-.84)/.1):smoothStep((u-.08)/.035));}
function blendInk(from,to,amount){const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));const a=rgb(from),b=rgb(to);return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*amount).toString(16).padStart(2,'0')).join('');}
function protectSmallText(value,x,y,size,max){
 if(size>21||ctx.globalAlpha===0)return;const width=Math.min(ctx.measureText(String(value)).width,max),left=ctx.textAlign==='center'?x-width/2:ctx.textAlign==='right'?x-width:x;
 maskContext.save();maskContext.setTransform(ctx.getTransform());maskContext.globalAlpha=ctx.globalAlpha;maskContext.fillStyle='#fff';maskContext.fillRect(left-3,y-size-2,width+6,size+7);maskContext.restore();
}
function applyTexture(scanlines=false){
 const g=textureContext;g.clearRect(0,0,960,720);g.save();
 if(scanlines){g.fillStyle=`rgba(0,0,0,${config.scanlines})`;for(let y=0;y<720;y+=3)g.fillRect(0,y,960,1);}else{g.globalAlpha=config.grain;g.drawImage(wear,0,0,960,720);}
 g.globalAlpha=.85;g.globalCompositeOperation='destination-out';g.drawImage(textMask,0,0);g.restore();ctx.drawImage(textureLayer,0,0);
}
function positionLoadWindow(open){
 ctx.globalAlpha=open;
 switch(config.theme){
  case 'street':ctx.translate(0,-(1-open)*650+Math.sin(open*Math.PI)*7);break;
  case 'sepia':ctx.translate(480,358-(1-open)*35);ctx.rotate(-.012*(1-open));ctx.translate(-480,-358);break;
  case 'crystal':ctx.translate(480,358);ctx.scale(.94+.06*open,.94+.06*open);ctx.translate(-480,-358);break;
  case 'terminal':ctx.beginPath();ctx.rect(48,88,864,540*open);ctx.clip();break;
  case 'noir':ctx.translate(-22*(1-open),0);ctx.globalAlpha=open*open;break;
  default:ctx.translate(0,-18*(1-open));ctx.globalAlpha=open*open;
 }
}
function text(value,x,y,size=20,color=gameThemes[config.theme].ink,weight='400',max=850){ctx.font=`${weight} ${size}px Arial, "Malgun Gothic", sans-serif`;ctx.fillStyle=color;ctx.fillText(String(value),x,y,max);protectSmallText(value,x,y,size,max);}
function wrapped(value,x,y,width,size=18,maxLines=3){ctx.font=`${size}px Arial, "Malgun Gothic", sans-serif`;let line='',row=0;for(const ch of String(value)){if((ctx.measureText(line+ch).width>width||ch==='\n')&&line){text(line,x,y+row*size*1.4,size,gameThemes[config.theme].dim);line='';if(++row>=maxLines)return;}if(ch!=='\n')line+=ch;}if(line&&row<maxLines)text(line,x,y+row*size*1.4,size,gameThemes[config.theme].dim);}
function gameText(value,x,y,size,width,color,italic=false){
 const theme=gameThemes[config.theme];if(config.theme==='noir'){ctx.save();ctx.font=`400 ${size*.86}px KookminUniversitySunggokSerif, GameHan, GameArchive, monospace`;ctx.fillStyle=color||theme.ink;ctx.fillText(value,x,y,width);ctx.restore();return;}ctx.save();ctx.font=`${italic?'italic ':''}600 ${size}px KookminUniversitySunggokSerif, GameHan, "${theme.font}", "Times New Roman", "Malgun Gothic", serif`;ctx.lineJoin='round';ctx.lineWidth=config.theme==='street'?5:3;ctx.strokeStyle=config.theme==='sepia'?'#e9d9b477':'#080504';ctx.shadowColor='#000';ctx.shadowBlur=2;ctx.shadowOffsetX=2;ctx.shadowOffsetY=3;ctx.strokeText(value,x,y,width);ctx.shadowBlur=0;ctx.fillStyle=color||theme.ink;ctx.fillText(value,x,y,width);ctx.restore();
}
function slotHeading(value,x,y,size,width,color,maxStreetSize=23){
 if(config.theme!=='street'){gameText(value,x,y,size,width,color);return;}
 ctx.save();ctx.beginPath();ctx.rect(x-1,y-size-3,width+2,size+8);ctx.clip();
 const font=n=>`700 ${n}px KookminUniversitySunggokSerif, GameHan, Arial, sans-serif`;
 let label=String(value),fitted=Math.min(size,maxStreetSize);ctx.font=font(fitted);
 while(fitted>16&&ctx.measureText(label).width>width){ctx.font=font(--fitted);}
 if(ctx.measureText(label).width>width){while(label&&ctx.measureText(label+'…').width>width)label=label.slice(0,-1);label+='…';}
 ctx.fillStyle='#142e47';ctx.fillText(label,x,y);ctx.restore();
}
function ornament(x,y,w,color){
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor='#000';ctx.shadowOffsetY=2;
 for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(x+w*.5,y);ctx.bezierCurveTo(x+w*.5+sign*w*.22,y-18,x+w*.5+sign*w*.4,y+27,x+w*.5+sign*w*.49,y-7);ctx.bezierCurveTo(x+w*.5+sign*w*.3,y+9,x+w*.5+sign*w*.24,y-14,x+w*.5,y);ctx.stroke();}
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+w/2,y-6);ctx.lineTo(x+w/2+6,y);ctx.lineTo(x+w/2,y+6);ctx.lineTo(x+w/2-6,y);ctx.closePath();ctx.fill();ctx.restore();
}
function panel(x,y,w,h,active=false){if(config.theme==='street'){streetPanel(x,y,w,h,active);return;}ctx.save();ctx.globalAlpha*=config.panelOpacity;paintPanel(x,y,w,h,active);ctx.restore();}
function paintPanel(x,y,w,h,active=false){
 const theme=gameThemes[config.theme];
 if(config.theme==='noir'){
  ctx.fillStyle=active?'#352622':'#141517';ctx.fillRect(x,y,w,h);ctx.strokeStyle=active?config.accent:'#66645e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+14);ctx.lineTo(x,y);ctx.lineTo(x+w-14,y);ctx.lineTo(x+w,y+14);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.stroke();
  ctx.fillStyle=active?config.accent:'#42423e';ctx.fillRect(x+5,y+8,3,h-16);ctx.fillStyle='#c9c3b00b';for(let py=y+12;py<y+h;py+=6)ctx.fillRect(x+12,py,w-24,1);return;
 }
 if(theme.variant){
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,active?theme.glow:theme.fill);g.addColorStop(1,config.theme==='crystal'?'#050f36':theme.fill);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.strokeStyle=active?config.accent:theme.edge;ctx.lineWidth=config.theme==='crystal'?2:1;ctx.strokeRect(x+1,y+1,w-2,h-2);
  if(config.theme==='crystal'){ctx.strokeStyle='#e9f6ff77';ctx.strokeRect(x+5,y+5,w-10,h-10);}
  if(config.theme==='terminal'){ctx.fillStyle=theme.edge;for(const px of [x,x+w-8])for(const py of [y,y+h-3])ctx.fillRect(px,py,8,3);}
  if(config.theme==='noir'&&active){ctx.fillStyle=config.accent;ctx.fillRect(x,y,4,h);}return;
 }ctx.fillStyle=active?theme.glow+'b0':theme.fill+'d9';ctx.fillRect(x,y,w,h);ctx.strokeStyle=active?config.accent:theme.edge;ctx.lineWidth=active?2:1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.strokeStyle='#000b';ctx.strokeRect(x+3,y+3,w-6,h-6);
 const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#e5d9ad22');g.addColorStop(.48,'#ffffff00');g.addColorStop(1,'#0005');ctx.fillStyle=g;ctx.fillRect(x+4,y+4,w-8,h-8);
 ctx.save();ctx.globalAlpha=.45;ctx.drawImage(wear,0,0,480,360,x+3,y+3,w-6,h-6);ctx.restore();
}
function streetPanel(x,y,w,h,active=false){
 ctx.save();ctx.globalAlpha*=config.panelOpacity;const rim=ctx.createLinearGradient(0,y,0,y+h);rim.addColorStop(0,'#f3fbff');rim.addColorStop(.08,'#8298a5');rim.addColorStop(.15,'#e0eff3');rim.addColorStop(.82,'#7795aa');rim.addColorStop(1,'#e8f8ff');ctx.fillStyle=rim;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#172934';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 const fill=ctx.createLinearGradient(0,y,0,y+h);fill.addColorStop(0,active?'#e7fbff':'#bbd7ed');fill.addColorStop(1,active?'#59bfeb':'#709bc5');ctx.fillStyle=fill;ctx.fillRect(x+7,y+7,w-14,h-14);ctx.strokeStyle=active?'#27f2ff':'#496880';ctx.strokeRect(x+7,y+7,w-14,h-14);ctx.fillStyle='#ffffff24';for(let sy=y+10;sy<y+h-9;sy+=4)ctx.fillRect(x+9,sy,w-18,1);ctx.restore();
}
function streetBackdrop(){
 ctx.save();const blue=ctx.createLinearGradient(0,0,W,H);blue.addColorStop(0,'#315e8d');blue.addColorStop(.52,'#4c8ac0');blue.addColorStop(1,'#a2bed9');ctx.fillStyle=blue;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#d7edff44';ctx.lineWidth=19;for(const r of [117,161,211]){ctx.beginPath();ctx.arc(730,397,r,.18,Math.PI*1.87);ctx.stroke();}ctx.lineWidth=2;ctx.strokeStyle='#b7e6ff45';for(let row=0;row<7;row++)for(let col=0;col<7;col++){const x=38+col*58,y=220+row*66+(col%2)*33;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(x+36*Math.cos(a),y+36*Math.sin(a));}ctx.closePath();ctx.stroke();}
 ctx.fillStyle='#e4f6ff38';for(let y=96;y<660;y+=5)ctx.fillRect(0,y,470,2);
 streetPanel(481,99,446,524);image(ctx,menuPhoto,493,111,422,500);const tint=ctx.createLinearGradient(0,400,0,611);tint.addColorStop(0,'#17375700');tint.addColorStop(1,'#102c50dd');ctx.fillStyle=tint;ctx.fillRect(493,111,422,500);
 ctx.fillStyle='#252b32';ctx.fillRect(0,0,W,55);ctx.fillRect(0,653,W,67);ctx.fillStyle='#d7eafa';ctx.fillRect(0,55,W,4);ctx.fillRect(0,650,W,4);text('MAIN MENU',38,38,25,'#fff','700',430);text('MEMORY CARD  /  01',663,37,16,'#d3e8fb','700',270);
 streetPanel(36,274,420,303);ctx.restore();
}
function noirBackdrop(){
 ctx.save();ctx.fillStyle='#0b0c0e';ctx.fillRect(0,0,W,H);ctx.fillStyle='#302f2b';ctx.fillRect(513,76,400,549);ctx.fillStyle='#a29d90';ctx.fillRect(504,68,400,549);image(ctx,menuPhoto,516,80,376,482);
 ctx.fillStyle='#2d2b27';text('SUBJECT 01 / ARCHIVED IMAGE',529,585,12,'#2d2b27','700',350);text('MEMORY RECORD — NO SIGNAL',529,604,9,'#57534a','400',350);
 ctx.strokeStyle='#c4beb0';ctx.lineWidth=1;for(const [x,y,dx,dy] of [[491,55,1,1],[917,55,-1,1],[491,630,1,-1],[917,630,-1,-1]]){ctx.beginPath();ctx.moveTo(x,y+dy*14);ctx.lineTo(x,y);ctx.lineTo(x+dx*14,y);ctx.stroke();}
 ctx.save();ctx.translate(795,89);ctx.rotate(.06);ctx.strokeStyle=config.accent;ctx.strokeRect(-65,-17,130,30);text('RESTRICTED',-57,3,16,config.accent,'700',114);ctx.restore();ctx.restore();
}
function menuTop(){return config.theme==='street'?274+(303-46*config.menuItems.length)/2:276;}
function arrow(x,y){if(config.theme==='terminal'){text('>',x,y+18,24,config.accent,'700',20);return;}if(config.theme==='noir'){ctx.fillStyle=config.accent;ctx.fillRect(x,y+4,4,14);return;}ctx.save();ctx.fillStyle=config.accent;ctx.strokeStyle='#211607';ctx.lineWidth=2;ctx.shadowColor='#000';ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+15,y+10);ctx.lineTo(x,y+20);ctx.lineTo(x+4,y+10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
function titleLogo(){
 const street=config.theme==='street',sepia=config.theme==='sepia',x=sepia?458:60,w=sepia?456:config.theme==='noir'?400:560,titleLines=config.title.split(/\r?\n/,2),twoLines=titleLines.length>1;
 const [first,second]=titleLines,theme=gameThemes[config.theme];ctx.save();
 if(street){ctx.translate(14,0);ctx.transform(1,0,-.13,1,0,0);}
 const fill=ctx.createLinearGradient(0,58,0,220);fill.addColorStop(0,street?'#fff':'#e4cd9b');fill.addColorStop(.3,street?'#aaa':'#d4b78b');fill.addColorStop(.49,street?'#eee':'#8d241b');fill.addColorStop(.52,street?'#48484a':'#ce5134');fill.addColorStop(1,street?'#ddd':'#54271a');
 ctx.font=`${street?'italic 900':sepia||config.theme==='noir'?'400':'600'} ${(config.theme==='noir'?(twoLines?66:80):sepia?(twoLines?78:94):(twoLines?91:110))*config.titleScale}px KookminUniversitySunggokSerif, GameHan, "${street?'Impact':sepia?'GameSepia':theme.variant?theme.font:'GameSerif'}", Georgia, serif`;ctx.lineJoin='round';ctx.strokeStyle='#120b06';ctx.lineWidth=9;ctx.shadowColor='#000b';ctx.shadowBlur=4;ctx.shadowOffsetX=5;ctx.shadowOffsetY=7;
 const titleOffset=street?22:0;const lines=twoLines?[[first,128+titleOffset],[second,(config.theme==='noir'?195:211)+titleOffset]]:[[first,181+titleOffset]];
 for(const [line,y] of lines){if(theme.variant){ctx.shadowColor=theme.glow;ctx.shadowBlur=config.theme==='terminal'?6:0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=2;ctx.fillStyle=theme.ink;ctx.fillText(line,x,y,w);continue;}if(sepia){ctx.textAlign='center';ctx.shadowColor='#f4dfb8';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=1;ctx.fillStyle='#38291e';ctx.fillText(line,x+w/2,y,w-24);continue;}
  let lineFill=fill;
  if(street){const metrics=ctx.measureText(line);lineFill=ctx.createLinearGradient(0,y-(metrics.actualBoundingBoxAscent||70),0,y+(metrics.actualBoundingBoxDescent||0));for(const [stop,color] of [[0,'#fff'],[.3,'#aaa'],[.49,'#eee'],[.52,'#48484a'],[1,'#ddd']])lineFill.addColorStop(stop,color);ctx.shadowBlur=4;ctx.shadowOffsetX=5;ctx.shadowOffsetY=7;}
  ctx.strokeText(line,x,y,w);ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#b9a680';ctx.lineWidth=2;ctx.strokeText(line,x,y,w);ctx.fillStyle=lineFill;ctx.fillText(line,x,y,w);ctx.strokeStyle='#120b06';ctx.lineWidth=9;}
 ctx.restore();if(street){ctx.fillStyle='#d4e9f9';ctx.fillRect(x,250,456-x,2);}else if(sepia){ctx.fillStyle='#59432b80';ctx.fillRect(x+32,231,w-64,1);}else if(config.theme==='noir'){text('ARCHIVE / 01     ·     PERSONAL RECORD',x,58,10,theme.dim,'400',410);ctx.fillStyle=config.accent;ctx.fillRect(x,224,34,2);}else if(theme.variant){ctx.fillStyle=theme.edge;ctx.fillRect(x,232,390,1);}else ornament(x,225,w,'#8e5a36');text(config.subtitle,x+8,street?269:254,13,sepia?'#362a1c':theme.variant?theme.dim:'#cebea2','400',street?456-x-8:w-15);
}
// Positions and phase depend only on the timeline, so previews and exports match.
const effectSeeds=Array.from({length:72},(_,i)=>{
 const rand=n=>{const v=Math.sin((i+1)*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
 return {angle:rand(1)*Math.PI*2,radius:Math.sqrt(rand(2)),phase:rand(3),size:rand(4)};
});
function drawClickEffect(u,visibility=1){
 if(config.effect==='off'||config.effectStrength===0||visibility===0)return;
 const tint=config.theme==='terminal'?'111,178,137':config.theme==='crystal'?'146,182,221':config.theme==='noir'?'158,155,150':config.theme==='street'?'156,175,190':config.theme==='sepia'?'161,142,108':'191,170,133';
 const phase=((u-config.effectPhase)*config.effectCycles%1+1)%1,cx=config.effectX*W,cy=config.effectY*H;
 const nodes=effectSeeds.slice(0,config.effect==='constellation'?38:72).map((s,i)=>{
  const p=(phase+s.phase)%1,pulse=Math.sin(Math.PI*p)**2,a=s.angle+.10*Math.sin(phase*Math.PI*2+s.phase*6.28);
  const r=config.effectSpread*s.radius*(.91+.09*Math.sin(phase*Math.PI*2+s.phase*6.28));
  return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.72,alpha:(.08+.92*pulse)*config.effectStrength*visibility,size:s.size,pulse,index:i};
 });
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,678);ctx.clip();ctx.globalCompositeOperation='screen';
 if(config.effect==='constellation'){
  ctx.lineWidth=.7;
  nodes.forEach((a,i)=>{let links=0;for(let j=i+1;j<nodes.length&&links<3;j++){const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y),limit=config.effectSpread*.43;if(d<limit){ctx.strokeStyle=`rgba(${tint},${Math.min(a.alpha,b.alpha)*(1-d/limit)*.65})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();links++;}}});
 }
 for(const n of nodes){
  ctx.globalAlpha=n.alpha;ctx.fillStyle=`rgb(${tint})`;ctx.beginPath();ctx.arc(n.x,n.y,config.effect==='constellation'?.75+n.size*.6:.45+n.size*.8,0,Math.PI*2);ctx.fill();
  const bright=n.index%(config.effect==='glow'?8:11)===0;
  if(!bright||config.effect==='constellation')continue;
  ctx.globalAlpha=n.alpha*.85;
  const radius=(config.effect==='glow'?26:14)*( .4+n.pulse*.6);
  const glow=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,radius);glow.addColorStop(0,`rgba(${tint},.4)`);glow.addColorStop(.2,`rgba(${tint},.18)`);glow.addColorStop(1,`rgba(${tint},0)`);ctx.fillStyle=glow;ctx.fillRect(n.x-radius,n.y-radius,radius*2,radius*2);
  const length=(config.effect==='sparkle'?19:9)*(.2+n.pulse*.8);ctx.fillStyle=`rgb(${tint})`;ctx.beginPath();ctx.moveTo(n.x,n.y-length);ctx.lineTo(n.x+1,n.y-1);ctx.lineTo(n.x+length*.65,n.y);ctx.lineTo(n.x+1,n.y+1);ctx.lineTo(n.x,n.y+length);ctx.lineTo(n.x-1,n.y+1);ctx.lineTo(n.x-length*.65,n.y);ctx.lineTo(n.x-1,n.y-1);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
function drawSlotDetail(s,opacity){if(opacity<=0)return;ctx.save();ctx.globalAlpha*=opacity;
  const theme=gameThemes[config.theme],street=config.theme==='street',detailInk=street?'#142e47':theme.ink;
  image(ctx,s.photo,584,195,296,180);ctx.strokeStyle=theme.edge;ctx.lineWidth=2;ctx.strokeRect(584,195,296,180);
  slotHeading(s.title,588,406,28,284,theme.ink);wrapped(s.place,589,430,285,14,2);
  ctx.save();ctx.globalAlpha=.4;ctx.fillStyle=theme.edge;ctx.fillRect(589,463,285,1);ctx.restore();
  text(config.player,589,490,18,detailInk,'700',192);text('Lv. '+s.level,801,490,14,detailInk,'700',73);
  text('PLAY TIME',589,523,10,theme.dim,'700',90);text(s.time,701,523,21,detailInk,'700',173);
  text('SAVED',589,551,10,theme.dim,'700',90);text(s.date,701,551,12,detailInk,'400',173);
  wrapped(s.note,589,582,285,13,2);ctx.restore();}
function draw(t=time){
 const {u,open,slot,back}=phaseAt(t),theme=gameThemes[config.theme],sepia=config.theme==='sepia',street=config.theme==='street';ctx.clearRect(0,0,W,H);maskContext.clearRect(0,0,W,H);
 ctx.save();if(config.theme==='noir')ctx.filter='grayscale(1) contrast(1.2)';if(config.theme==='terminal')ctx.filter='grayscale(1) brightness(.65)';if(sepia){ctx.translate(W,0);ctx.scale(-1,1);}image(ctx,background,0,0,W,H);
 const a=artLayer.getContext('2d');a.clearRect(0,0,W,H);image(a,menuPhoto,0,0,W,H);a.globalCompositeOperation='destination-in';const fade=a.createLinearGradient(0,0,W,0);fade.addColorStop(0,'#0000');fade.addColorStop(.32,'#0000');fade.addColorStop(.6,'#000');fade.addColorStop(1,'#000');a.fillStyle=fade;a.fillRect(0,0,W,H);a.globalCompositeOperation='source-over';ctx.drawImage(artLayer,0,0);ctx.restore();
 if(sepia){ctx.fillStyle='#d6bb83';ctx.globalCompositeOperation='screen';ctx.globalAlpha=.48;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
 else{const fade=ctx.createLinearGradient(0,0,700,0);fade.addColorStop(0,street?'#030715ba':'#08060280');fade.addColorStop(1,'#0000');ctx.fillStyle=fade;ctx.fillRect(0,0,W,H);}
 ctx.fillStyle=`rgba(0,0,0,${config.shade})`;ctx.fillRect(0,0,W,H);
 if(street)streetBackdrop();if(config.theme==='noir')noirBackdrop();
 if(theme.variant){ctx.fillStyle=config.theme==='crystal'?'#12357755':config.theme==='terminal'?'#062d1880':'#08090b55';ctx.fillRect(0,0,W,H);}
 ctx.save();ctx.globalAlpha=1-open;titleLogo();if(theme.variant&&config.theme!=='noir')panel(55,266,415,310);
 const menuCursor=menuPosition(u),menuIndex=Math.round(menuCursor);
 config.menuItems.forEach((item,i)=>{
  const x=theme.menuX,y=menuTop()+(street?35:30)+i*46,active=i===menuIndex,w=sepia?330:348;
  if(config.theme==='noir'){text(String(i+1).padStart(2,'0'),55,y-2,12,active?config.accent:theme.dim,'400',25);ctx.fillStyle='#5c5b543f';ctx.fillRect(x+8,y+12,330,1);}
  if(active){const hy=menuTop()+(street?35:30)+menuCursor*46;const pulse=.75+.25*Math.cos(u*Math.PI*8);ctx.save();ctx.globalAlpha*=pulse;const glow=ctx.createLinearGradient(x-20,0,x+w,0);glow.addColorStop(0,theme.glow+'00');glow.addColorStop(.16,theme.glow+'d0');glow.addColorStop(.74,theme.glow+'99');glow.addColorStop(1,theme.glow+'00');ctx.fillStyle=glow;ctx.shadowColor=theme.glow;ctx.shadowBlur=config.theme==='noir'?0:18;ctx.fillRect(x-20,hy-(street?32:29),w+10,37);ctx.restore();if(sepia){ctx.strokeStyle='#aa945c';ctx.strokeRect(x-16,hy-30,w,38);}arrow(x-25-(config.theme==='noir'?21:0),hy-(street?22:18));}
  gameText(item.toUpperCase(),x+8,y,street?35:38,w-22,blendInk(theme.ink,street?'#d5ffff':sepia?'#fff4ca':config.accent,1-clamp(Math.abs(i-menuCursor))),false);
 });
 text(config.theme==='noir'?'OPERATOR NOTES':'INFORMATION',theme.menuX+8,609,10,theme.dim,'700',320);wrapped(config.description,theme.menuX+8,632,sepia?320:350,14,2);ctx.restore();
 if(open>0){
  ctx.fillStyle=`rgba(0,0,0,${open*.65})`;ctx.fillRect(0,0,W,H);ctx.save();positionLoadWindow(open);
  panel(48,88,864,540);ctx.fillStyle=theme.fill+'c0';ctx.fillRect(53,93,854,90);if(street){ctx.fillStyle='#253c54';ctx.fillRect(55,95,850,83);ctx.fillStyle='#e6f4ff';ctx.fillRect(55,178,850,3);}else if(theme.variant){ctx.fillStyle=theme.edge;ctx.fillRect(78,174,800,1);}else{ctx.fillStyle=theme.edge+'70';ctx.fillRect(78,176,800,1);}gameText(config.mode,78,158,53,600,theme.ink,street);text(config.theme==='noir'?'ARCHIVE / 04 FILES':'MEMORY CARD 01',724,150,13,theme.ink,'700',155);
  for(let i=0;i<4;i++){
   const s=slots[i],y=194+i*94,active=slot===i;panel(81,y,481,83,active);image(ctx,s.photo,90,y+7,93,67);ctx.strokeStyle=theme.edge;ctx.strokeRect(90,y+7,93,67);text('0'+(i+1),194,y+22,11,theme.dim,'700');slotHeading(s.title,226,y+(street?30:27),street?22:27,street?316:320,active&& !street?config.accent:theme.ink);text(s.place,195,y+47,12,theme.dim,'400',350);text(`Lv. ${s.level}   /   ${s.time}`,195,y+68,12,theme.ink,'700',350);if(active)arrow(60,y+31);
  }
  const blend=slot===0?1:smoothStep((u-(.36+slot*.105))/.018);
  if(blend<1)drawSlotDetail(slots[slot-1],1-blend);
  drawSlotDetail(slots[slot],blend);
  if(config.theme==='terminal'&&open<1){ctx.fillStyle=config.accent;ctx.globalAlpha*=.4;ctx.fillRect(48,88+540*open-2,864,2);}
  text(config.theme==='noir'?'RECORD INDEX  /  01—04':'4 FILES   /   MEMORY CARD (PS2)',90,603,11,theme.dim,'700');ctx.restore();
 }
 ctx.fillStyle='#050403d9';ctx.fillRect(0,678,W,42);text(config.footer,37,704,12,'#b6b0a1','700',472);text('↑↓  Select',544,704,15,'#ccc8bc','700');text('×',678,706,23,'#7195a9','700');text('OK',706,704,15,'#ccc8bc','700');text('○',799,706,22,back?config.accent:'#b6998e','700');text('Back',829,704,15,back?'#fff':'#ccc8bc','700');
 applyTexture();
 const v=ctx.createRadialGradient(480,350,245,480,350,600);v.addColorStop(0,'#0000');v.addColorStop(1,street?'#0002':'#000a');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
 // Fade before the load window arrives; restore only after it has fully left.
 if(open===0)drawClickEffect(u,u<.22?clamp((.22-u)/.04):clamp((u-.94)/.04));
 // Process the small capture before enlargement, so exports share the same pixels.
 const sw=config.resolution,sh=sw*.75;
 if(crtBuffer.width!==sw||crtBuffer.height!==sh){crtBuffer.width=sw;crtBuffer.height=sh;}
 const capture=crtBuffer.getContext('2d',{willReadFrequently:true});capture.imageSmoothingEnabled=true;capture.drawImage(canvas,0,0,sw,sh);
 if(config.colorLevels||config.colorBleed){
  const frame=capture.getImageData(0,0,sw,sh),data=frame.data,source=config.colorBleed?new Uint8ClampedArray(data):null;
  const radius=Math.ceil(config.colorBleed),mix=config.colorBleed/3,step=config.colorLevels?255/(config.colorLevels-1):0;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
   const i=(y*sw+x)*4;
   for(let c=0;c<3;c++){
    let value=data[i+c];
    if(source){let sum=0;for(let dx=-radius;dx<=radius;dx++)sum+=source[(y*sw+Math.max(0,Math.min(sw-1,x+dx)))*4+c];const avg=sum/(radius*2+1);const luma=.299*source[i]+.587*source[i+1]+.114*source[i+2];let avgLuma=0;for(let dx=-radius;dx<=radius;dx++){const j=(y*sw+Math.max(0,Math.min(sw-1,x+dx)))*4;avgLuma+=.299*source[j]+.587*source[j+1]+.114*source[j+2];}value+=(avg-avgLuma/(radius*2+1)-(source[i+c]-luma))*mix;}
    data[i+c]=step?Math.round(Math.max(0,Math.min(255,value))/step)*step:value;
   }
  }
  capture.putImageData(frame,0,0);
 }
 ctx.imageSmoothingEnabled=config.pixelScaling!=='nearest';ctx.drawImage(crtBuffer,0,0,W,H);ctx.imageSmoothingEnabled=true;
 applyTexture(true);
 $('phase').textContent=open===0?'01 / MAIN MENU':back?'03 / BACK → MAIN MENU':open<1?'02 / MEMORY CARD · 창 전환':`02 / ${config.mode} · SLOT 0${slot+1}`;
}
