'use strict';

// Scene 07 shares scene 06's inspector, right panel, uploads and exporters.
window.HorrorEncounter = {
  returnFade:.22,
  pages:()=>[
    {
        "title": "",
        "story": "막차가 떠난 뒤에도\n승강장의 스피커는 꺼지지 않는다.\n\n잡음 사이로 당신의 이름이 들린다.\n이어지는 안내는 단 한마디.\n\n“두고 가신 분을 데려가 주세요.”\n\n당신은 분명 혼자 왔다."
    },
    {
        "title": "",
        "story": "스피커에서 짧은 웃음이 새어 나온다.\n\n“이제 함께 나가시면 됩니다.”\n\n출구 쪽 유리문이 저절로 열린다.\n발소리는 둘인데,\n유리에는 당신만 비친다."
    }
],
  setup() {
    Object.assign(defaults,{mysteryName:'怪異 마지막 안내 방송',storySize:26,buttonText:'뒤돌아보지 않는다',choiceA:'안내 방송을 듣는다',choiceB:'출구로 걸어간다',selectedChoice:0,logs:'[23:58:04]: 새로운 미스터리를 시작했다: 마지막 안내 방송!\n[23:59:12]: 당신은 안내 방송에 귀를 기울인다.\n[00:00:00]: 이 시간에… 누가 내 이름을 부르는 거지?',duration:6,resultLog:'[00:00:07]: 새로운 상태를 얻었다: 보이지 않는 동행자!'});
    Object.assign(config,defaults);pages=this.pages();
    imageAreas.scene={x:2,y:60,w:1067,h:700};
    sequenceStage=()=> 'detail';
    pageStart=index=>index===0 ? 0 : index>=pages.length ? .9 : .5+.4*(index-1)/(pages.length-1);
    $('openDetail').textContent='선택 결과';$('back').textContent='← 대화로';
    $('openDetail').onclick=()=>this.advance();$('back').onclick=()=>this.show(0);
    for(const id of ['mysteryDescription','blink']) {
      const input=$(id);input.hidden=true;
      const label=document.querySelector(`label[for="${id}"]`) || input.closest('label');
      if(label)label.hidden=true;
    }
    $('mysteryDescription').nextElementSibling.hidden=true;
    const storyHotspot=document.querySelector('[data-focus="story"]');
    storyHotspot.style.cssText='--x:32%;--y:24%;--w:41%;--h:43%';
    storyHotspot.querySelector('span').textContent='대화 / 결과';
    document.querySelector('[data-focus="sceneUpload"]').style.cssText='--x:1%;--y:13%;--w:30%;--h:54%';
    canvas.addEventListener('click',event=>{
      event.stopImmediatePropagation();
      if(busy||playing)return;
      const point=canvasPoint(event);manualPointer=point;
      if(point.y>=766&&point.y<=872&&point.x>=4&&point.x<1068) {
        if(pageAt(time)===0) {config.selectedChoice=point.x<536?0:1;syncForm();}
        this.advance();
      }
    },true);
  },
  async show(index) {
    if(busy)return;
    if(index===0 && pageAt(time)>0) {
      savePage();playing=false;manualPointer=null;lock(true);
      const started=performance.now(),half=this.returnFade;
      try {
        let elapsed=0;
        while(elapsed<half*2) {
          elapsed=Math.min(half*2,(await new Promise(requestAnimationFrame)-started)/1000);
          time=(config.duration-half+elapsed)%config.duration;draw();syncTime();
        }
        selectPage(0,false);
      } finally {lock(false);}
      return;
    }
    savePage();playing=false;selectPage(index,false);
    time=config.duration*(pageStart(index)+.02);draw();syncTime();
  },
  advance() {this.show((pageAt(time)+1)%pages.length);},
  drawLogs(t) {
    const lines=config.logs.split('\n').slice(0,3);
    if(pageAt(t)>0 && config.resultLog.trim()) lines.push(config.resultLog);
    ctx.save();ctx.beginPath();ctx.rect(2,926,1067,112);ctx.clip();
    font(28,light,'center');
    lines.slice(-3).forEach((line,i)=>ctx.fillText(fitLine(line,1040),534,928+i*38));
    ctx.restore();
  },
  draw(t) {
    const index=pageAt(t),phase=t/config.duration;
    ctx.save();ctx.beginPath();ctx.rect(2,60,1067,844);ctx.clip();
    ctx.fillStyle=dark;ctx.fillRect(2,60,1067,844);
    if(pictures.scene.rendered) ctx.drawImage(pictures.scene.rendered,2,60,1067,700);
    // Keep the background empty until an image is uploaded.
    ctx.fillStyle=light;ctx.fillRect(4,64,634,77);
    ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.strokeRect(7,67,628,71);
    font(29,dark);ctx.fillText(fitLine(config.mysteryName,594),22,88);
    ctx.fillStyle=light;ctx.fillRect(457,253,609,489);
    ctx.fillStyle=dark;ctx.fillRect(462,258,599,479);
    ctx.strokeStyle=light;ctx.lineWidth=1;ctx.strokeRect(466,262,591,471);
    const entry=pages[index],size=config.storySize,lineHeight=size+7;
    font(size,light,'center');
    const lines=wrapText([entry.title,entry.story].filter(Boolean).join('\n\n'),554);
    const top=Math.max(284,498-lines.length*lineHeight/2);
    let remaining=config.animation==='typewriter'?Math.floor(Math.max(0,t/config.duration-pageStart(index))/(pageStart(index+1)-pageStart(index))/.65*Array.from(entry.title+entry.story).length):Infinity;
    ctx.save();ctx.beginPath();ctx.rect(478,276,567,442);ctx.clip();
    for(const [i,line]of lines.entries()) {
      const chars=Array.from(line);ctx.fillText(chars.slice(0,Math.max(0,remaining)).join(''),761,Math.round(top+i*lineHeight));remaining-=chars.length;
    }
    ctx.restore();
    const buttons=index===0 ? [{x:4,y:766,w:530,h:106,text:config.choiceA},{x:538,y:766,w:530,h:106,text:config.choiceB}] : [{x:4,y:766,w:1064,h:106,text:config.buttonText}];
    const chosen=config.selectedChoice===1?802:269;
    const stops=index===0 ? [{at:0,x:802,y:842},{at:.12,x:802,y:842},{at:.22,x:269,y:842},{at:.32,x:269,y:842},{at:.42,x:chosen,y:842},{at:.5,x:chosen,y:842}] : [{at:0,x:chosen,y:842},{at:.56,x:chosen,y:842},{at:.64,x:535,y:842},{at:.93,x:535,y:842},{at:1,x:802,y:842}];
    let from=stops[0],to=stops[stops.length-1];
    for(let i=1;i<stops.length;i++)if(phase<=stops[i].at){from=stops[i-1];to=stops[i];break;}
    const mix=Math.max(0,Math.min(1,(phase-from.at)/(to.at-from.at||1)));
    const eased=mix*mix*(3-2*mix);
    let pointer={x:Math.round(from.x+(to.x-from.x)*eased),y:842};
    if(manualPointer&&!playing&&!busy)pointer=manualPointer;
    for(const b of buttons) {
      ctx.fillStyle=light;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.strokeRect(b.x+3,b.y+3,b.w-6,b.h-6);
      font(28,dark,'center');ctx.textBaseline='middle';ctx.fillText(fitLine(b.text,b.w-30),b.x+b.w/2,b.y+b.h/2);
      if(pointer.x>=b.x&&pointer.x<=b.x+b.w&&pointer.y>=b.y&&pointer.y<=b.y+b.h)drawButtonTone(b);
    }
    // A short stippled cut, like the reference, only affects the encounter area.
    for(let i=1;i<pages.length;i++) {
      const distance=Math.abs(t-config.duration*pageStart(i));
      if(distance<.13) {ctx.fillStyle=dark;for(let y=60;y<873;y+=4)for(let x=2;x<1069;x+=4)ctx.fillRect(x,y,2,2);}
    }
    ctx.translate(pointer.x,pointer.y);ctx.fillStyle=light;ctx.strokeStyle=dark;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,24);ctx.lineTo(6,18);ctx.lineTo(11,29);ctx.lineTo(16,27);ctx.lineTo(11,16);ctx.lineTo(20,16);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    const edge=Math.min(Math.max(0,t),Math.max(0,config.duration-t));
    if(pages.length>1 && edge<this.returnFade) {
      ctx.save();ctx.globalAlpha=1-edge/this.returnFade;ctx.fillStyle=dark;
      ctx.fillRect(2,60,1067,844);ctx.restore();
    }
  }
};
