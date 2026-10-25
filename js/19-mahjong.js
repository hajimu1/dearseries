 'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=1330,H=1730;
const board=document.createElement('canvas');board.width=640;board.height=768;const g=board.getContext('2d');g.imageSmoothingEnabled=false;
const config={scenario:'random',roundDuration:14,duration:56,loop:true,gifWidth:480,renderWidth:1330,newsprint:0,ricePaper:0,eastName:'Kakihara',southName:'Ichi',speechEnabled:false,eastSpeech:'ここで勝負だ…リーチ！',southSpeech:'いくよ、リーチ！',eastScore:25000,southScore:25000,roundLabel:'東1局 1本場',scoreTitle:'ROUND CLEAR',nextRoundText:'NEXT ROUND',tableColor:'#205b36',tableBorder:true,centerScoreColor:'#286c48',resultScoreColor:'#081b37',resultAccentColor:'#ffe577',resultSecondaryColor:'#8bb2dc',grain:.25};
let time=0,playing=true,lastTick=0,busy=false,ready=false,cancelled=false,atlas=null,tileAtlas=null,declarations=null;
const portraits={east:null,south:null},portraitURLs={east:null,south:null};
const paperTextures={},resolutionBuffer=document.createElement('canvas'),resolutionContext=resolutionBuffer.getContext('2d');
const portraitViews={east:{zoom:1,x:0,y:0},south:{zoom:1,x:0,y:0}};
const portraitColor={east:false,south:false};
function syncPortraitColor(side){$(side+'ColorValue').textContent=portraitHorror[side]?'흑백도트 우선':portraitColor[side]?'컬러':'흑백';}
const portraitHorror={east:false,south:false},portraitBrightness={east:0,south:0};
const portraitBayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const portraitDots={east:1,south:1},portraitBuffer=document.createElement('canvas'),portraitContext=portraitBuffer.getContext('2d');
const modes=['east-tsumo','south-ron','south-tsumo','east-ron','south-riichi-ron','south-yakuman-ron'];
let randomMode=modes[Math.floor(Math.random()*modes.length)];
function rollScenario(){randomMode=modes[Math.floor(Math.random()*modes.length)];}
const names={'east-tsumo':'동가 쯔모','south-ron':'남가 론 · 일반','south-tsumo':'남가 쯔모','east-ron':'동가 론','south-riichi-ron':'남가 론 · 리치노미','south-yakuman-ron':'남가 론 · 역만'};
const breathe=()=>new Promise(r=>setTimeout(r,0)),clamp=x=>Math.max(0,Math.min(1,x));
function notify(msg){$('notice').textContent=msg;}
function lock(value){busy=value;$('settingsFields').disabled=value;for(const id of ['play','restart','scrub','png','gif','video','gifWidth','renderWidth'])$(id).disabled=value||!ready;}
function syncTime(){$('scrub').max=config.duration;$('scrub').value=time;$('clock').textContent=time.toFixed(1)+' / '+config.duration+' s';$('play').textContent=playing?'Ⅱ':'▶';}
function showEditorTab(name){for(const key of ['game','players','export']){const yes=key===name;$('tab-'+key).setAttribute('aria-selected',yes);$('tab-'+key).tabIndex=yes?0:-1;$('panel-'+key).hidden=!yes;}$('savePanel').hidden=name!=='export';document.querySelector('.panel-scroll').scrollTop=0;}
['game','players','export'].forEach((key,i)=>{$('tab-'+key).onclick=()=>showEditorTab(key);$('tab-'+key).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;showEditorTab(['game','players','export'][n]);$('tab-'+['game','players','export'][n]).focus();};});
function roundLength(){return config.roundDuration*.8+7;}
function timeAtPhase(u){return u<.8?u*config.roundDuration:config.roundDuration*.8+(u-.8)*35;}
function rebuild(){config.duration=roundLength()*(config.scenario==='all'?modes.length:1);time%=config.duration;$('durationHelp').textContent=`전체 ${config.duration}초 · ${config.scenario==='random'?'매 판 무작위 결과':config.scenario==='all'?'결과 순환':'선택한 결과 반복'}`;syncTime();}
function stateAt(t){const local=((t%config.duration)+config.duration)%config.duration,round=config.scenario==='all'?Math.floor(local/roundLength()):0,elapsed=local%roundLength(),scoreTime=elapsed-config.roundDuration*.8,u=scoreTime<0?elapsed/config.roundDuration:.8+scoreTime/35,mode=config.scenario==='random'?randomMode:config.scenario==='all'?modes[round]:config.scenario,winAt=({'east-tsumo':.44,'south-ron':.53,'south-tsumo':.59,'east-ron':.66,'south-riichi-ron':.69,'south-yakuman-ron':.53}[mode])+.08/config.roundDuration;return {u,elapsed,scoreTime,round,mode,winAt,winner:mode.startsWith('east')?'east':'south',method:mode.endsWith('tsumo')?'tsumo':'ron',eastRiichi:u>=.19,southRiichi:u>=.35,win:u>=winAt,score:u>=.80,phase:u<.07?'대국 준비':u<.23?'동가 리치':u<.39?'남가 리치':u<winAt?'패 진행':u<.8?'화료 선언':'점수 정산'};}
const eastHand=['1m','1m','1m','9m','9m','9m','1p','1p','1p','9p','9p','9p','1s'];
const southHand=['3m','3m','4m','4m','5p','5p','6p','6p','4s','4s','6s','6s','C'];
const southRiichiHand=['3m','3m','3m','4m','4m','4p','5p','6p','6s','6s','6s','W','W'];
const southYakumanHand=['3m','3m','3m','6p','6p','6p','4s','4s','4s','6s','6s','6s','C'];
function southTiles(s){return s.mode==='south-yakuman-ron'?southYakumanHand:s.mode==='south-riichi-ron'?southRiichiHand:southHand;}
const eastRiver=['S','4s','4m','5p','W'],southRiver=['1m','9m','1s','9p','N'];
const tileKeys=['1m','3m','4m','9m','1p','5p','6p','8p','9p','1s','4s','6s','9s','E','S','W','N','P','C','back'];
const tileSources={},fourPin=document.createElement('canvas');
function initTileSources(){
 const columns=[[114,192],[361,191],[606,191],[852,190],[1097,191]],rows=[[30,250],[301,246],[567,249],[834,250]];
 tileKeys.forEach((key,i)=>{const [x,w]=columns[i%5],[y,h]=rows[Math.floor(i/5)];tileSources[key]=[x,y,w,h];});
 // Build four circles from the existing blank face and matching blue dot sprite.
 fourPin.width=192;fourPin.height=246;const p=fourPin.getContext('2d');p.imageSmoothingEnabled=false;
 p.drawImage(tileAtlas,...tileSources.P,0,0,192,246);
 for(const x of [20,108])for(const y of [33,138])p.drawImage(tileAtlas,134,334,64,64,x,y,64,64);
}
const TILE_W=32,TILE_H=48;
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function text(str,x,y,size=14,color='#fffde0',align='left'){g.font=`${size}px MahjongPixel, MahjongUnicode, monospace`;g.textAlign=align;g.textBaseline='top';g.fillStyle='#07140b';g.fillText(String(str),Math.round(x)+1,Math.round(y)+1);g.fillStyle=color;g.fillText(String(str),Math.round(x),Math.round(y));g.textAlign='left';}
function frame(x,y,w,h,fill='#123524'){rect(x+3,y+3,w,h,'#081b10');rect(x,y,w,h,'#d8d3a1');rect(x+2,y+2,w-4,h-4,'#565442');rect(x+4,y+4,w-8,h-8,fill);}
function tile(key,x,y,w=TILE_W,h=TILE_H,sideways=false,back=false){g.save();g.translate(Math.round(x),Math.round(y));if(sideways){g.translate(h,0);g.rotate(Math.PI/2);}if(key==='4p'&&!back)g.drawImage(fourPin,0,0,w,h);else g.drawImage(tileAtlas,...tileSources[back?'back':key] ,0,0,w,h);g.restore();}
function centeredLabel(label,cx,cy,size,color,maxWidth){
 g.save();g.textAlign='left';g.textBaseline='alphabetic';
 let metrics;
 do{g.font=`${size}px MahjongPixel, MahjongUnicode, monospace`;metrics=g.measureText(label);if(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight<=maxWidth||size<=4)break;size--;}while(true);
 const x=Math.round(cx+(metrics.actualBoundingBoxLeft-metrics.actualBoundingBoxRight)/2-.5),y=Math.round(cy+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2-.5);
 g.fillStyle='#07140b';g.fillText(label,x+1,y+1);g.fillStyle=color;g.fillText(label,x,y);g.restore();
}
function portrait(player,x,y){
 frame(x,y,96,96,'#111');const view=portraitViews[player],im=portraits[player];
 g.save();g.beginPath();g.rect(x+4,y+4,88,88);g.clip();
 const mono=!portraitColor[player]||portraitHorror[player];g.filter=mono?'grayscale(1)':'none';
 if(im){const scale=Math.max(88/im.width,88/im.height)*view.zoom;g.filter=(mono?'grayscale(1) ':'')+'contrast(1.25)';g.drawImage(im,x+48+view.x*44-im.width*scale/2,y+48+view.y*44-im.height*scale/2,im.width*scale,im.height*scale);}
 else{const crop=player==='east'?[160,1280,187,183]:[926,40,185,179],size=88*view.zoom;g.drawImage(atlas,...crop,x+48+view.x*44-size/2,y+48+view.y*44-size/2,size,size);}
 g.restore();
 if(portraitDots[player]>1||portraitHorror[player]||portraitBrightness[player]!==0){
  const resolution=Math.ceil(88/portraitDots[player]);if(portraitBuffer.width!==resolution){portraitBuffer.width=resolution;portraitBuffer.height=resolution;}
  portraitContext.imageSmoothingEnabled=true;portraitContext.clearRect(0,0,resolution,resolution);portraitContext.drawImage(board,x+4,y+4,88,88,0,0,resolution,resolution);
  if(portraitHorror[player]||portraitBrightness[player]!==0){
   const pixels=portraitContext.getImageData(0,0,resolution,resolution),p=pixels.data,brightness=portraitBrightness[player]*2.55;
   for(let py=0;py<resolution;py++)for(let px=0;px<resolution;px++){
    const i=(py*resolution+px)*4;
    if(portraitHorror[player]){const luminance=p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722+brightness,value=luminance>(portraitBayer[(py%4)*4+px%4]+.5)*16?255:0;p[i]=p[i+1]=p[i+2]=value;}
    else{p[i]+=brightness;p[i+1]+=brightness;p[i+2]+=brightness;}
    p[i+3]=255;
   }
   portraitContext.putImageData(pixels,0,0);
  }
  g.drawImage(portraitBuffer,x+4,y+4,88,88);
 }
 frame(x+6,y+102,84,21,'#0b1782');centeredLabel(config[player+'Name'],x+48,y+112.5,11,'#ffffdd',76);
}
function resetPortraitView(side){portraitViews[side]={zoom:1,x:0,y:0};for(const [key,value] of [['Zoom',1],['X',0],['Y',0]]){$(side+key).value=value;$(side+key+'Value').textContent=Math.round(value*100)+'%';}}
for(const side of ['east','south']){$(side+'Color').onchange=()=>{portraitColor[side]=$(side+'Color').checked;syncPortraitColor(side);draw();};$(side+'Brightness').oninput=()=>{portraitBrightness[side]=Number($(side+'Brightness').value);$(side+'BrightnessValue').textContent=(portraitBrightness[side]>0?'+':'')+portraitBrightness[side];draw();};$(side+'Horror').onchange=()=>{portraitHorror[side]=$(side+'Horror').checked;$(side+'HorrorValue').textContent=portraitHorror[side]?'ON':'OFF';syncPortraitColor(side);draw();};$(side+'Dots').oninput=()=>{portraitDots[side]=Number($(side+'Dots').value);$(side+'DotsValue').textContent=portraitDots[side]===1?'기본':portraitDots[side]+'단계';syncPortraitColor(side);draw();};for(const [key,property] of [['Zoom','zoom'],['X','x'],['Y','y']])$(side+key).oninput=()=>{portraitViews[side][property]=Number($(side+key).value);$(side+key+'Value').textContent=Math.round(portraitViews[side][property]*100)+'%';draw();};$(side+'PositionReset').onclick=()=>{resetPortraitView(side);draw();};}

function stick(y){g.save();g.font='16px MahjongPixel, MahjongUnicode, monospace';const w=Math.ceil(g.measureText(config.roundLabel).width),x=320-w/2;g.restore();rect(x+1,y+1,w,5,'#091d11');rect(x,y,w,4,'#efedcc');rect(319,y+1,3,2,'#ae2330');}
function hand(player,s,extra){const y=player==='east'?580:159,keys=player==='east'?eastHand:southTiles(s),reveal=player==='east'||s.win&&s.winner===player&&(s.method!=='ron'||s.elapsed-s.winAt*config.roundDuration>=1-1e-8);keys.forEach((key,i)=>tile(key,76+i*34,y,TILE_W,TILE_H,false,!reveal));if(extra)tile(extra,536,y,TILE_W,TILE_H,false,!reveal);}
function river(player,s){const y=player==='east'?454:220,base=player==='east'?eastRiver:southRiver;let x=208;for(const key of base){tile(key,x,y);x+=34;}if(s[player+'Riichi'])tile(player==='east'?'9s':'5p',x,y,TILE_W,TILE_H,true);}
function winTile(s){return s.winner==='east'?'1s':s.mode==='south-riichi-ron'?'4m':'C';}
function eastDraw(s){return s.mode==='east-tsumo'?'1s':(s.mode==='south-ron'||s.mode==='south-yakuman-ron')?'C':'N';}
function flying(key,from,to,p,back=false,sideways=false){
 const q=clamp(p),e=1-Math.pow(1-q,3);let x,y;
 // Cross-table tiles travel around the score plaque and its dedicated riichi rail.
 if(Math.min(from[1],to[1])<432&&Math.max(from[1],to[1])>415){
  const lane=from[0]===108?150:580,points=[from,[lane,from[1]],[lane,to[1]],to],part=Math.min(2,Math.floor(e*3)),f=e*3-part;
  x=points[part][0]+(points[part+1][0]-points[part][0])*f;y=points[part][1]+(points[part+1][1]-points[part][1])*f;
 }else{x=from[0]+(to[0]-from[0])*e;y=from[1]+(to[1]-from[1])*e;}
 g.save();g.translate(Math.round(x),Math.round(y));if(sideways){g.translate(TILE_H*e,0);g.rotate(Math.PI/2*e);}tile(key,0,0,TILE_W,TILE_H,false,back);g.restore();
}
const declarationSources={};
function initDeclarations(){
 const c=document.createElement('canvas');c.width=declarations.width;c.height=declarations.height;const d=c.getContext('2d');d.drawImage(declarations,0,0);const pixels=d.getImageData(0,0,c.width,c.height).data;
 ['riichi','tsumo','ron'].forEach((key,index)=>{let left=c.width,top=c.height,right=0,bottom=0;const bands=[0,550,1030,c.height],start=bands[index],end=bands[index+1];for(let y=start;y<end;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}declarationSources[key]=[left,top,right-left+1,bottom-top+1];});
}
function callout(key,age){
 const source=declarationSources[key],p=clamp(age/.035),pulse=1+.10*Math.sin(p*Math.PI),scale=Math.min(450/source[2],170/source[3])*pulse;
 const w=Math.round(source[2]*scale),h=Math.round(source[3]*scale),y=Math.round(370-h/2-8*(1-p));
 g.drawImage(declarations,...source,Math.round(320-w/2),y,w,h);

}
// Scripted hands: East triple yakuman; South seven pairs or riichi-only ron.
function handResult(s){
 if(s.winner==='east')return {rows:[['清老頭','役満'],['四暗刻単騎','ダブル役満']],limit:'三倍役満',points:144000};
 if(s.mode==='south-yakuman-ron')return {rows:[['四暗刻単騎','ダブル役満']],limit:'ダブル役満',points:64000};
 if(s.mode==='south-riichi-ron')return {rows:[['立直','1翻']],limit:'1翻 · 40符',points:1300};
 const rows=[['立直','1翻'],['一発','1翻'],['七対子','2翻']];
 if(s.method==='tsumo')rows.push(['門前清自摸和','1翻']);
 return {rows,limit:s.method==='tsumo'?'満貫 · 5翻':'4翻 · 25符',points:s.method==='tsumo'?8000:6400};
}
function resultProgress(s){return s.score?clamp(s.scoreTime-handResult(s).rows.length):0;}
function visibleYaku(s){return s.score?Math.min(handResult(s).rows.length,Math.max(0,Math.floor(s.scoreTime+1e-8)+1)):0;}
function balances(s,progress=1){const east=config.eastScore-(s.eastRiichi?1000:0),south=config.southScore-(s.southRiichi?1000:0),points=handResult(s).points*progress,pot=2000*progress;if(!s.score)return {east,south};return {east:Math.round(east+(s.winner==='east'?points+pot:-points)),south:Math.round(south+(s.winner==='south'?points+pot:-points))};}
function riichiSpeech(side,u,start,end){
 const message=config[side+'Speech'].trim();if(!config.speechEnabled||!message)return;
 const age=(u-start)*config.roundDuration,remaining=(end-u)*config.roundDuration;
 const x=side==='east'?185:80,y=side==='east'?650:48,w=350,h=68;
 g.save();g.globalAlpha=Math.min(clamp(age/.18),clamp(remaining/.16));
 // One continuous outline keeps the tail and body shadow joined without seams.
 const outline=[[4,0],[w-4,0],[w,4],[w,h-25],[w+18,h+9],[w,h-8],[w,h-4],[w-4,h],[4,h],[0,h-4],[0,4]];
 const bubblePath=(dx,dy)=>{g.beginPath();outline.forEach(([px,py],i)=>{const sx=x+(side==='east'?w-px:px)+dx,sy=y+py+dy;if(i)g.lineTo(sx,sy);else g.moveTo(sx,sy);});g.closePath();};
 g.lineWidth=2;g.lineJoin='round';
 bubblePath(side==='east'?-4:4,5);g.fillStyle=g.strokeStyle='#102319';g.fill();g.stroke();
 bubblePath(0,0);g.fillStyle='#f4edcf';g.strokeStyle='#101a13';g.fill();g.stroke();
 g.font='bold 14px MahjongPixel, MahjongUnicode, monospace';
 const lines=[''];for(const ch of message){let i=lines.length-1;if(g.measureText(lines[i]+ch).width>w-36){lines.push('');i++;}lines[i]+=ch;}
 g.textAlign='left';g.textBaseline='top';g.fillStyle='#000000';lines.slice(0,2).forEach((line,i)=>g.fillText(line,Math.round(x+18),Math.round(y+(lines.length>1?15:25)+i*22)));
 g.restore();
}
function drawTableBorder(){
 const rail=28,lip=6;
 ctx.save();
 ctx.fillStyle='#956b32';
 ctx.fillRect(0,0,W,rail);ctx.fillRect(0,H-rail,W,rail);
 ctx.fillRect(0,rail,rail,H-rail*2);ctx.fillRect(W-rail,rail,rail,H-rail*2);
 ctx.fillStyle='#424e42';
 ctx.fillRect(rail,rail,W-rail*2,lip);ctx.fillRect(rail,H-rail-lip,W-rail*2,lip);
 ctx.fillRect(rail,rail,lip,H-rail*2);ctx.fillRect(W-rail-lip,rail,lip,H-rail*2);
 ctx.fillStyle='#bd9550';ctx.fillRect(rail,2,W-rail*2,2);ctx.fillRect(2,rail,2,H-rail*2);
 ctx.fillStyle='#62441f';ctx.fillRect(rail,H-4,W-rail*2,4);ctx.fillRect(W-4,rail,4,H-rail*2);
 // Stepped mitre joints retain the scene's pixel-art edges at every corner.
 ctx.fillStyle='#424e42';
 for(let d=0;d<rail;d+=4){ctx.fillRect(d,d,6,6);ctx.fillRect(W-d-6,d,6,6);ctx.fillRect(d,H-d-6,6,6);ctx.fillRect(W-d-6,H-d-6,6,6);}
 ctx.restore();
}
function finishSurface(){
 ctx.save();ctx.globalCompositeOperation='multiply';
 for(const key of ['newsprint','ricePaper']){
  const image=paperTextures[key],amount=config[key];if(!amount||!image)continue;
  const scale=Math.max(W/image.naturalWidth,H/image.naturalHeight),sw=W/scale,sh=H/scale;
  ctx.globalAlpha=amount*.9;ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,0,0,W,H);
 }
 ctx.restore();
 if(config.renderWidth<W){
  const width=config.renderWidth,height=Math.round(width*H/W);
  if(resolutionBuffer.width!==width||resolutionBuffer.height!==height){resolutionBuffer.width=width;resolutionBuffer.height=height;}
  resolutionContext.imageSmoothingEnabled=false;resolutionContext.drawImage(canvas,0,0,width,height);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(resolutionBuffer,0,0,W,H);
 }
}
function draw(t=time){if(!atlas||!tileAtlas)return;const s=stateAt(t),u=s.u;g.imageSmoothingEnabled=false;rect(0,0,640,768,config.tableColor);
 // Fixed sparse grain, not random per-frame noise, keeps the loop and exports reproducible.
 if(config.grain){g.fillStyle=`rgba(0,0,0,${config.grain*.2})`;for(let y=0;y<768;y+=3)for(let x=0;x<640;x+=3)if((x*17+y*31)%23<4)g.fillRect(x,y,1,1);}
 portrait('south',480,25);portrait('east',42,636);frame(446,25,25,34,'#0b1782');centeredLabel('南',458.5,42,17,'#ffffda',21);frame(146,636,25,34,'#856323');centeredLabel('東',158.5,653,17,'#fff5b0',21);
 for(let i=0;i<7;i++)tile(i===3?'8p':'P',94,263+i*34,TILE_W,TILE_H,true,i!==3);
 const extraEast=s.mode==='south-riichi-ron'?(u>=.44&&u<.45?'N':u>=.64&&u<.65?'4m':null):s.win&&s.method==='tsumo'&&s.winner==='east'?winTile(s):u>=.44&&(u<.49||s.mode==='east-tsumo')?eastDraw(s):null,extraSouth=s.win&&s.method==='tsumo'&&s.winner==='south'?winTile(s):null;hand('east',s,extraEast);hand('south',s,extraSouth);river('east',s);river('south',s);
 frame(217,338,206,77,config.centerScoreColor);
 const scoreProgress=resultProgress(s),b=balances(s,scoreProgress);
 centeredLabel(String(b.south),320,350,12,'#fffde5',150);
 centeredLabel(config.roundLabel,320,369,16,'#f4efc7',178);
 centeredLabel('供託 '+(s.southRiichi?2:s.eastRiichi?1:0),320,385,10,'#e5eac8',150);
 centeredLabel(String(b.east),320,402,12,'#fffde5',150);
 centeredLabel('東',238,400,16,'#f6d35c',22);centeredLabel('南',402,350,16,'#c9dbff',22);
 if(s.eastRiichi)stick(426);if(s.southRiichi)stick(326);
 if(u>=.11&&u<.19)flying('9s',[536,580],[378,454],(u-.11)/.08,false,true);if(u>=.27&&u<.35)flying('5p',[536,159],[378,220],(u-.27)/.08,false,true);
 if(s.mode==='south-riichi-ron'){
  // South's post-riichi draw/discard ends ippatsu before East deals the winning 4m.
  if(u>=.40&&u<.44)flying('N',[108,300],[536,580],(u-.40)/.04);
  if(u>=.45&&u<.49)flying('N',[536,580],[208,506],(u-.45)/.04);
  if(u>=.49)tile('N',208,506);
  if(u>=.50&&u<.54)flying('E',[108,300],[536,159],(u-.50)/.04,true);
  if(u>=.54&&u<.55)tile('E',536,159,TILE_W,TILE_H,false,true);
  if(u>=.55&&u<.59)flying('E',[536,159],[208,272],(u-.55)/.04);
  if(u>=.59)tile('E',208,272);
  if(u>=.60&&u<.64)flying('4m',[108,300],[536,580],(u-.60)/.04);
  if(u>=.65&&u<.69)flying('4m',[536,580],[242,506],(u-.65)/.04);
  if(u>=.69)tile('4m',242,506);
 }else{
 if(u>=.40&&u<.44)flying(eastDraw(s),[108,300],[536,580],(u-.40)/.04);
 if(s.mode!=='east-tsumo'){
  if(u>=.49&&u<.53)flying(eastDraw(s),[536,580],[208,506],(u-.49)/.04);
  if(u>=.53)tile(eastDraw(s),208,506);
  if(s.mode==='south-tsumo'||s.mode==='east-ron'){
   const key=s.mode==='south-tsumo'?'C':'1s';if(u>=.55&&u<.59)flying(key,[108,300],[536,159],(u-.55)/.04,true);
   if(u>=.59&&!s.win&&u<(s.mode==='south-tsumo'?s.winAt:.62))tile(key,536,159,TILE_W,TILE_H,false,true);
   if(s.mode==='east-ron'){if(u>=.62&&u<.66)flying('1s',[536,159],[208,272],(u-.62)/.04);if(u>=.66)tile('1s',208,272);}
  }
 }
 }
 if(u>=.08&&u<.23){callout('riichi',u-.08);riichiSpeech('east',u,.08,.23);}
 if(u>=.24&&u<.39){callout('riichi',u-.24);riichiSpeech('south',u,.24,.39);}
 if(s.win&&!s.score)callout(s.method,u-s.winAt);
 if(s.score){
  const result=handResult(s),count=visibleYaku(s);
  frame(133,263,374,278,config.resultScoreColor);text(config.scoreTitle,320,278,18,config.resultAccentColor,'center');
  text(config[s.winner+'Name']+' / '+(s.method==='tsumo'?'ツモ':'ロン'),320,305,13,config.resultSecondaryColor,'center');
  result.rows.slice(0,count).forEach(([name,han],i)=>{text(name,166,335+i*23,16);text(han,474,335+i*23,16,config.resultAccentColor,'right');});
  if(s.scoreTime>=result.rows.length){text(result.limit,166,438,15,config.resultAccentColor);text('+'+Math.round(result.points*scoreProgress).toLocaleString('en-US'),474,434,24,config.resultAccentColor,'right');text('供託 +2,000',474,466,12,'#a9dfb5','right');text('東 '+b.east,166,496,13);text('南 '+b.south,474,496,13,'#fffde0','right');}
  if(u>.95&&Math.floor(u*80)%2===0)text(config.nextRoundText,320,522,10,config.resultSecondaryColor,'center');
 }

 // Outer bounds of the portrait/name frames: x=42..579, y=25..762.
 // Add 64 logical pixels on all four sides without rescaling the artwork.
 ctx.imageSmoothingEnabled=false;ctx.fillStyle=config.tableColor;ctx.fillRect(0,0,W,H);ctx.drawImage(board,44,78,1280,1536);if(config.tableBorder)drawTableBorder();finishSurface();
 const fade=u<.025?1-u/.025:u>.975?(u-.975)/.025:0;if(fade){ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,W,H);}
 $('phase').textContent=`${s.round+1} / ${config.scenario==='all'?modes.length:1} · ${names[s.mode]} · ${s.phase}`;
}
function selectPlayer(side){for(const key of ['east','south']){$('player-'+key).hidden=key!==side;$('choose-'+key).setAttribute('aria-pressed',String(key===side));}}
for(const side of ['east','south'])$('choose-'+side).onclick=()=>selectPlayer(side);
function editTarget(id,tab,side){
 if(busy||!ready)return;
 showEditorTab(tab);if(side)selectPlayer(side);
 const control=$(id);control.focus({preventScroll:true});control.scrollIntoView({block:'nearest',behavior:'auto'});
 control.classList.remove('edit-flash');void control.offsetWidth;control.classList.add('edit-flash');
}
function sceneTarget(px,py){
 const x=(px-44)/2,y=(py-78)/2,hit=(a,b,w,h)=>x>=a&&x<=a+w&&y>=b&&y<=b+h;
 if(config.tableBorder&&(px<34||px>W-34||py<34||py>H-34))return ['tableBorder','export'];
 for(const [side,a,b] of [['south',480,25],['east',42,636]]){
  if(hit(a+6,b+102,84,21))return [side+'Name','players',side];
  if(hit(a,b,96,96))return [side+'Upload','players',side];
 }
 const state=stateAt(time);
 if(config.speechEnabled&&config.eastSpeech.trim()&&state.u>=.08&&state.u<.23&&hit(173,650,362,68))return ['eastSpeech','players','east'];
 if(config.speechEnabled&&config.southSpeech.trim()&&state.u>=.24&&state.u<.39&&hit(80,48,362,68))return ['southSpeech','players','south'];
 if(state.score&&state.u>.95&&hit(149,516,342,24))return ['nextRoundText','game'];
 if(state.score&&hit(133,263,374,278))return y<330?['scoreTitle','game']:['resultScoreColor','export'];
 if(hit(217,338,206,77)){
  if(y<357)return ['southScore','players','south'];
  if(y>390)return ['eastScore','players','east'];
  return ['roundLabel','game'];
 }
 if((state.win&&!state.score&&hit(95,270,450,200))||hit(76,159,492,48)||hit(76,580,492,48)||hit(208,220,218,100)||hit(208,454,218,100))return ['scenario','game'];
 return ['tableColor','export'];
}
canvas.addEventListener('click',event=>{
 if(busy||!ready)return;
 const box=canvas.getBoundingClientRect(),px=(event.clientX-box.left)*W/box.width,py=(event.clientY-box.top)*H/box.height;
 editTarget(...sceneTarget(px,py));
});
canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();editTarget('eastUpload','players','east');}});
$('speechEnabled').onchange=()=>{config.speechEnabled=$('speechEnabled').checked;$('speechEnabledValue').textContent=config.speechEnabled?'ON':'OFF';draw();};
$('tableBorder').onchange=()=>{config.tableBorder=$('tableBorder').checked;$('tableBorderValue').textContent=config.tableBorder?'ON':'OFF';draw();};
for(const id of ['scenario','roundDuration','eastName','southName','eastSpeech','southSpeech','eastScore','southScore','roundLabel','scoreTitle','nextRoundText','tableColor','centerScoreColor','resultScoreColor','resultAccentColor','resultSecondaryColor','grain','newsprint','ricePaper','renderWidth','gifWidth'])$(id).oninput=()=>{const el=$(id);if(el.type==='number'){config[id]=Math.min(Number(el.max),Math.max(Number(el.min),Number(el.value)||Number(el.min)));}else config[id]=el.type==='range'||['roundDuration','gifWidth','renderWidth'].includes(id)?Number(el.value):el.value;if(id==='scenario'){time=0;lastTick=0;if(config.scenario==='random')rollScenario();}if(id==='scenario'||id==='roundDuration')rebuild();if(['grain','newsprint','ricePaper'].includes(id))$(id+'Value').textContent=Math.round(config[id]*100)+'%';draw();};
for(const [id,u] of [['previewRiichi',.30],['previewWin',.73],['previewScore',.96]])$(id).onclick=()=>{playing=false;time=stateAt(time).round*roundLength()+timeAtPhase(u);syncTime();draw();};
$('play').onclick=()=>{playing=!playing;lastTick=0;syncTime();};$('restart').onclick=()=>{if(config.scenario==='random')rollScenario();time=0;lastTick=0;draw();syncTime();};$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value);draw();syncTime();};$('cancel').onclick=()=>cancelled=true;
canvas.onkeydown=e=>{if([' ','Enter'].includes(e.key)&&!busy){e.preventDefault();$('play').click();}};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('이미지를 읽을 수 없어요.'));im.src=src;});
for(const side of ['east','south']){$(side+'Upload').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000){notify('20 MB 이하 PNG·JPG·WebP를 선택해주세요.');e.target.value='';return;}lock(true);let url;try{url=URL.createObjectURL(file);const im=await load(url);if(im.width*im.height>40000000)throw Error('4천만 화소 이하 이미지를 선택해주세요.');if(portraitURLs[side])URL.revokeObjectURL(portraitURLs[side]);portraitURLs[side]=url;url=null;portraits[side]=im;resetPortraitView(side);notify('사진을 바꿨어요.');}catch(error){notify(error.message);}finally{if(url)URL.revokeObjectURL(url);e.target.value='';lock(false);lastTick=0;draw();}};$(side+'Reset').onclick=()=>{if(portraitURLs[side])URL.revokeObjectURL(portraitURLs[side]);portraitURLs[side]=null;portraits[side]=null;resetPortraitView(side);draw();};}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function tick(now){if(ready&&playing&&!busy){if(lastTick){const next=time+(now-lastTick)/1000;if(config.scenario==='random'&&next>=config.duration)rollScenario();time=next%config.duration;}draw();syncTime();}lastTick=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.SceneBridge={ready:()=>ready,busy:()=>busy,playing:()=>playing,setPlaying:value=>{playing=!!value;lastTick=0;syncTime();}};
lock(true);Promise.all([load('../assets/mahjong/user-board-20251027.png'),load('../assets/mahjong/tiles-v2.png'),load('../assets/mahjong/declarations-v2.png'),load('../assets/magazine/textures/newsprint.jpg'),load('../assets/magazine/textures/rice-paper.jpg'),document.fonts.load('16px MahjongPixel'),document.fonts.load('16px MahjongUnicode')]).then(([im,tiles,labels,newsprint,ricePaper])=>{paperTextures.newsprint=newsprint;paperTextures.ricePaper=ricePaper;atlas=im;tileAtlas=tiles;declarations=labels;initTileSources();initDeclarations();ready=true;rebuild();lock(false);draw();notify('');}).catch(e=>notify(e.message));

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
  download(blob, 'dear-riichi-arcade-19.png'); notify(`PNG 저장 완료 · ${W} × ${H}`);
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
    if (action === 'save') {download(blob, 'dear-riichi-arcade-19.gif'); notify(`GIF 저장 완료 · ${(blob.size / 1_000_000).toFixed(2)} MB / 15 MB`); break;}
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
    download(blob, `dear-riichi-arcade-19.${extension}`); notify(`${extension.toUpperCase()} 영상 저장 완료 · 무음`);
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
  }
});
