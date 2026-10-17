'use strict';
(() => {
  const defaultPhoto = '../assets/minihompy/default-photo.png';
  const defaultGuestAvatar = '../assets/minihompy/guest-avatar.png';
  const images = {profile:defaultPhoto, room:'../assets/minihompy/miniroom-room.png', photo:'../assets/minihompy/photo-album.png', skin:defaultPhoto, visitor0:defaultGuestAvatar, visitor1:defaultGuestAvatar, visitor2:defaultGuestAvatar};
  const defaultImages = {...images};
  const content = document.getElementById('content');
  const tabs = [...document.querySelectorAll('[data-page]')];
  const state = {
    title:'테스트문구 1', today:'461', total:'10398901', domain:'http://www.cyworld.com/test',
    mood:'테스트문구 2', intro:'테스트문구 3\n테스트문구 4', name:'테스트문구 5', birthday:'', email:'', buddies:'파도타기 0명\n테스트문구 6\n테스트문구 7',
    news:'테스트문구 8\n테스트문구 9\n테스트문구 10', photoCount:'0/2732', boardCount:'0/417', bookmarkCount:'0/1',
    roomCaption:'미니룸꾸미기[16]',roomIndicator:'^^',roomTogether:'함께 사진찍기',roomReply:'미니룸 답글달기', friend0Name:'소연',friend0Message:'여기 오면 괜히 기분 좋아져 ♡',friend0Relation:'반짝친구',friend1Name:'민지',friend1Message:'오늘도 행복한 하루 보내!',friend1Relation:'우리사이',friend2Name:'하늘',friend2Message:'자주 놀러올게~ :)',friend2Relation:'오랜친구', profileAbout:'테스트문구 12\n테스트문구 13', likes:'테스트문구 14',
    photoTitle:'테스트문구 15', photoDate:'2006.05.24', photoCaption:'테스트문구 16\n테스트문구 17', photoComments:'3', photoScraps:'0',
    boardLines:'테스트문구 18\n테스트문구 19\n테스트문구 20\n테스트문구 21\n테스트문구 22', boardDates:'05.24\n05.24\n05.24\n05.24\n05.24',
    bgmName:'기억을 걷는 시간', bgmColor:'#789b74', utilityText:'테스트문구 24', frameColor:'#afd1d8', titleColor:'#d4a7c1', tabColor:'#318da5', backgroundColor:'#d4d7d5',
    showUtility:false, showSide:true, backgroundMode:'solid', menuLanguage:'en', hompyFont:'Dotum', bgmPosition:0, profileFit:'cover', roomFit:'cover', photoFit:'cover', skinFit:'cover',
    profileX:50,profileY:50,profileZoom:100,roomX:50,roomY:50,roomZoom:100,photoX:50,photoY:50,photoZoom:100,skinX:50,skinY:100,skinZoom:100,
    calendarDate:'2006-05-24',diary0date:'2006-05-24',diary0weather:'맑음',diary0text:'테스트문구 25',diary0comments:'2',diary0scraps:'0',
    diary1date:'2006-05-21',diary1weather:'흐림',diary1text:'테스트문구 26',diary1comments:'2',diary1scraps:'0',
    visitor0name:'테스트문구 27',visitor0date:'2006.05.24 14:32',visitor0text:'테스트문구 28',visitor0reply:'테스트문구 29',visitor0replyDate:'2006.05.24 14:38',
    visitor1name:'테스트문구 30',visitor1date:'2006.05.23 20:16',visitor1text:'테스트문구 31',visitor1reply:'테스트문구 32',visitor1replyDate:'2006.05.23 20:20',
    visitor2name:'테스트문구 33',visitor2date:'2006.05.21 11:08',visitor2text:'테스트문구 34',visitor2reply:'테스트문구 35',visitor2replyDate:'2006.05.21 11:11',
    visitor0Fit:'cover',visitor0X:50,visitor0Y:50,visitor0Zoom:100,visitor1Fit:'cover',visitor1X:50,visitor1Y:50,visitor1Zoom:100,visitor2Fit:'cover',visitor2X:50,visitor2Y:50,visitor2Zoom:100
  };
  const menuLabels={en:{home:'Home',profile:'Profile',diary:'Diary',photo:'Photo',board:'Board',visitor:'Visitor',setting:'Setting'},ko:{home:'홈',profile:'프로필',diary:'다이어리',photo:'사진첩',board:'게시판',visitor:'방명록',setting:'설정'}};
  function renderMenuLabels(){tabs.forEach(tab=>tab.textContent=menuLabels[state.menuLanguage][tab.dataset.page]);}
  state.profileRows=[{label:'이름',value:state.name},{label:'생일',value:''},{label:'좋아하는 것',value:state.likes}];
  let active='home', roomTab='miniroom', busy=false;
  const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = key => escape(state[key]);
  const lines = key => text(key).replaceAll('\n','<br>');
  const homeFields = [
    ['title','홈피 제목'],['domain','홈피 주소'],['today','TODAY'],['total','TOTAL'],['mood','TODAY IS'],
    ['intro','소개글','textarea'],['name','이름'],['birthday','생일 / 이름 옆 문구'],['email','이메일'],['buddies','파도타기 목록 · 한 줄에 하나','textarea'],
    ['news','Updated news 문구','textarea'],['photoCount','사진첩 새 글 / 전체'],['boardCount','게시판 새 글 / 전체'],['bookmarkCount','즐겨찾기 새 글 / 전체'],
    ['roomCaption','미니룸 꾸미기 문구'],['roomIndicator','미니룸 탭 오른쪽 문구'],['roomTogether','함께 사진찍기 문구'],['roomReply','미니룸 답글달기 문구'],
    ...['room','profile','photo'].flatMap(key=>[[`${key}X`,'좌우 위치','range'],[`${key}Y`,'상하 위치','range'],[`${key}Zoom`,'확대 배율','range']]),
    ...[0,1,2].flatMap(i=>[[`friend${i}Name`,`${i+1}번째 이름`],[`friend${i}Message`,`${i+1}번째 한마디`],[`friend${i}Relation`,`${i+1}번째 관계명`]])
  ];
  const pageFields = {
    profile:[['profileAbout','자기소개','textarea']],
    diary:[['calendarDate','달력 기준 날짜','date'],...[0,1].flatMap(i=>[[`diary${i}date`,`${i+1}번째 일기 날짜`,'date'],[`diary${i}weather`,'날씨'],[`diary${i}text`,'일기 내용','textarea'],[`diary${i}comments`,'댓글 수','number'],[`diary${i}scraps`,'스크랩 수','number']])],
    photo:[['photoTitle','사진 제목'],['photoDate','날짜'],['photoCaption','사진 설명','textarea'],['photoComments','댓글 수','number'],['photoScraps','스크랩 수','number']],
    visitor:[0,1,2].flatMap(i=>[[`visitor${i}name`,`${i+1}번째 작성자`],[`visitor${i}date`,'날짜'],[`visitor${i}text`,'방명록 내용','textarea'],[`visitor${i}reply`,'답글','textarea'],[`visitor${i}replyDate`,'답글 날짜'],[`visitor${i}X`,'사진 좌우 위치','range'],[`visitor${i}Y`,'사진 상하 위치','range'],[`visitor${i}Zoom`,'사진 확대','range']]),
    board:[['boardLines','게시물 제목 · 한 줄에 하나','textarea'],['boardDates','게시물 날짜 · 제목 순서대로 한 줄에 하나','textarea']]
  };
  const weekdayNames=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  function dateParts(key){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(state[key]);if(!match)return null;
    const [,year,month,day]=match.map(Number),date=new Date(Date.UTC(year,month-1,day));
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return {year,month,day,weekday:weekdayNames[date.getUTCDay()]};
  }
  function formatDiaryDate(key){const date=dateParts(key);return date?`${date.year}. ${String(date.month).padStart(2,'0')}. ${String(date.day).padStart(2,'0')} ${date.weekday}`:'';}
  function fields(target, definitions) {
    target.replaceChildren();
    for(const [key,label,type='text'] of definitions) {
      const wrap=document.createElement('div'), caption=document.createElement('label'), input=document.createElement(type==='textarea'?'textarea':'input');
      caption.htmlFor='edit-'+key;caption.textContent=label;input.id=caption.htmlFor;input.dataset.key=key;
      if(type==='textarea') {input.rows=3;input.maxLength=2000;}
      else {input.type=type;if(type==='text')input.maxLength=120;}
      if(type==='range'){input.min=key.endsWith('Zoom')?'100':'0';input.max=key.endsWith('Zoom')?'300':'100';input.step=key.endsWith('Zoom')?'5':'1';}
      if(type==='number'){input.min='0';input.max='99999';input.step='1';}
      if(type==='checkbox') input.checked=state[key]; else input.value=state[key];
      wrap.className=type==='checkbox'?'check-field':'field';wrap.append(caption,input);
      if(type==='range'){const output=document.createElement('output');output.htmlFor=input.id;output.textContent=input.value+'%';wrap.append(output);}
      target.append(wrap);
    }
  }
  // shortcut: edits are in memory, add persistence when a saved-project workflow is requested.
  const pages = {
    home:()=>`<h2 class="section-title">Updated news <small>TODAY STORY</small></h2><div class="news"><div class="news-empty">${state.news.split('\n').filter(line=>line.trim()).map(line=>`<p class="news-row"><span aria-hidden="true">▸</span>${escape(line)}</p>`).join('')}</div><div class="news-counts"><button data-go="photo">사진첩 <b>${text('photoCount')}</b></button><button data-go="board">게시판 <b>${text('boardCount')}</b></button><button data-go="profile">즐겨찾기 <b>${text('bookmarkCount')}</b></button></div></div>
      <div class="room-heading"><div class="room-tabs" role="tablist" aria-label="미니룸 보기"><button id="room-miniroom" role="tab" aria-controls="room-preview" aria-selected="${roomTab==='miniroom'}" data-room="miniroom">Miniroom</button><button id="room-storyroom" role="tab" aria-controls="room-preview" aria-selected="${roomTab==='storyroom'}" data-room="storyroom">Storyroom</button></div><span>${text('roomIndicator')}</span></div>
      <div class="miniroom" id="room-preview" role="tabpanel" aria-labelledby="room-${roomTab}"><img id="roomImage" alt="미니룸 미리보기"></div>
      <div class="room-meta"><span class="room-actions"><b>▸ ${text('roomCaption')}</b><i>◈</i><em>사진첩</em></span><span class="room-stats"><span class="room-link">${text('roomTogether')}</span><span class="room-link">${text('roomReply')}</span></span></div><h2 class="section-title friends-title">What friends say <small>한마디로 표현해봐~</small></h2><ul class="friend-lines">${[0,1,2].map(i=>`<li class="friend-entry"><span class="friend-name">${text(`friend${i}Name`)}</span><span class="friend-message">${text(`friend${i}Message`)}</span><span class="friend-relation">(${text(`friend${i}Relation`)})</span></li>`).join('')}</ul>`,
    profile:()=>`<h2 class="section-title">${menuLabels[state.menuLanguage].profile} <small>나를 소개합니다</small></h2><div class="page-toolbar">▸ 내 소개 <span>프로필 / 기본 정보</span></div><dl class="profile-details">${state.profileRows.map((row,i)=>`<div data-profile-row="${i}"><dt>${escape(row.label)}</dt><dd>${escape(row.value).replaceAll('\n','<br>')}</dd></div>`).join('')}</dl><div class="paper-note"><h3>ABOUT ME</h3>${lines('profileAbout')}</div>`,
    diary:()=>{const selected=dateParts('calendarDate')||{year:2006,month:5,day:24},monthNames=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];return `<h2 class="section-title">${menuLabels[state.menuLanguage].diary} <small>나의 하루를 기록해요</small></h2><div class="calendar"><strong>${String(selected.month).padStart(2,'0')}<small>${selected.year}. ${monthNames[selected.month-1]}</small></strong><div class="calendar-days">${Array.from({length:new Date(Date.UTC(selected.year,selected.month,0)).getUTCDate()},(_,i)=>`<span class="${i+1===selected.day?'selected':''}">${i+1}</span>`).join('')}</div></div>${[0,1].map(i=>`<article class="diary-entry"><h3>${escape(formatDiaryDate(`diary${i}date`))}　 날씨 : ${text(`diary${i}weather`)}</h3><p>${lines(`diary${i}text`)}</p><div class="entry-footer">공개 · 댓글 <span class="diary-comments">${text(`diary${i}comments`)}</span> · 스크랩 <span class="diary-scraps">${text(`diary${i}scraps`)}</span></div></article>`).join('')}`},
    photo:()=>`<h2 class="section-title">${menuLabels[state.menuLanguage].photo} <small>사진 속 작은 기억들</small></h2><div class="page-toolbar">▸ 일상 다반사 <span>전체보기 · 목록보기</span></div><h3 class="photo-title">${text('photoTitle')} <small>${text('photoDate')}</small></h3><div class="album-frame"><img class="album-image" data-photo alt="사진첩 이미지"></div><p class="photo-caption">${lines('photoCaption')}</p><div class="entry-footer">댓글 <span class="photo-comments">${text('photoComments')}</span> · 스크랩 <span class="photo-scraps">${text('photoScraps')}</span></div>`,
    visitor:()=>`<h2 class="section-title">${menuLabels[state.menuLanguage].visitor} <small>다녀간 흔적을 남겨주세요</small></h2><div class="page-toolbar">전체 128개의 이야기 <span>일촌공개</span></div>${[0,1,2].map(i=>`<article class="guest-entry"><div class="guest-header"><span>No. ${128-i}</span><b>${text(`visitor${i}name`)} <svg class="guest-author-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-3.05 0-5.5 1.55-5.5 3.45V15h11v-2.05c0-1.9-2.45-3.45-5.5-3.45Z"/></svg></b><time>${text(`visitor${i}date`)}</time></div><div class="guest-body"><div class="guest-avatar"><img data-avatar="visitor${i}" alt="방명록 프로필"></div><p>${lines(`visitor${i}text`)}</p></div><div class="guest-reply">↳ <span class="guest-reply-author">${text('name')}</span> : ${lines(`visitor${i}reply`)} <time>(${text(`visitor${i}replyDate`)})</time></div></article>`).join('')}<div class="pagination">◀　<b>1</b>　2　3　4　5　▶</div>`,
    board:()=>`<h2 class="section-title">${menuLabels[state.menuLanguage].board} <small>우리들의 이야기</small></h2><div class="page-toolbar">▸ 자유 게시판 <span>목록보기</span></div><table class="board-table"><thead><tr><th>번호</th><th>제목</th><th>이름</th><th>날짜</th></tr></thead><tbody>${state.boardLines.split('\n').filter(line=>line.trim()).map((line,i)=>`<tr><td>${i+1}</td><td>${escape(line)}</td><td>${text('name')}</td><td>${escape(state.boardDates.split('\n')[i]||'')}</td></tr>`).join('')}</tbody></table><div class="pagination">◀　<b>1</b>　▶</div>`,
    setting:()=>`<h2 class="section-title">${menuLabels[state.menuLanguage].setting} <small>미니홈피 관리</small></h2><p class="setting-note">오른쪽 편집 패널에서 홈피의 내용과 이미지를 바꿀 수 있습니다.<br>수정한 내용은 다른 메뉴에 다녀와도 유지됩니다.</p><div class="setting-row"><b>미니룸</b>이미지 1장</div><div class="setting-row"><b>메뉴</b>Home / Profile / Diary / Photo / Board / Visitor</div><div class="setting-row"><b>BGM</b>플레이어 모양 표시</div>`
  };
  function imageSource(image,key) {
    image.src=images[key];
    image.style.objectFit=state[key+'Fit'];
    image.style.objectPosition=`${state[key+'X']}% ${state[key+'Y']}%`;
    image.style.transform=`scale(${state[key+'Zoom']/100})`;
    image.style.transformOrigin=`${state[key+'X']}% ${state[key+'Y']}%`;
  }
  const originalFontSizes=new Map();
  function applyFontSize(){
    for(const [element,size] of originalFontSizes)element.style.fontSize=size;
    originalFontSizes.clear();
    if(state.hompyFont!=='DanpungSaemmul')return;
    const elements=[...document.querySelector('.hompy').querySelectorAll('*')];
    const sizes=elements.map(element=>getComputedStyle(element).fontSize);
    elements.forEach((element,index)=>{originalFontSizes.set(element,element.style.fontSize);element.style.fontSize=`calc(${sizes[index]} + ${element.closest('.history')?4:element.closest('.buddy-select')?0:2}pt)`;});
  }
  function renderPage(preserveScroll=false) {
    const scroll=content.scrollTop;
    content.innerHTML=pages[active]();content.dataset.activePage=active;
    const room=content.querySelector('#roomImage');if(room)imageSource(room,'room');
    content.querySelectorAll('[data-photo]').forEach(image=>imageSource(image,'photo'));
    content.querySelectorAll('[data-avatar]').forEach(image=>imageSource(image,image.dataset.avatar));
    applyFontSize();
    content.scrollTop=preserveScroll?scroll:0;
    document.dispatchEvent(new Event('minihompy-render'));
  }
  async function saveCurrentImage() {
    if(busy)return;
    const button=document.getElementById('saveImage'),status=document.getElementById('saveStatus'),source=document.querySelector('.hompy');
    busy=true;button.disabled=true;status.textContent='PNG를 만드는 중…';
    try {
      await document.fonts.ready;
      const clone=source.cloneNode(true),sourceNodes=[source,...source.querySelectorAll('*')],cloneNodes=[clone,...clone.querySelectorAll('*')];
      const rootStyle=getComputedStyle(source),css=[];
      const dataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
      for(const sheet of document.styleSheets){
        let rules=[...sheet.cssRules].map(rule=>rule.cssText).join('\n');
        for(const match of [...rules.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]){
          if(match[1].startsWith('data:')||match[1].startsWith('#'))continue;
          const response=await fetch(new URL(match[1],sheet.href||location.href));if(!response.ok)throw new Error('저장용 자산을 불러오지 못했습니다.');
          rules=rules.replaceAll(match[0],`url("${await dataURL(await response.blob())}")`);
        }
        css.push(rules);
      }
      for(const property of rootStyle)if(property.startsWith('--'))clone.style.setProperty(property,rootStyle.getPropertyValue(property));
      for(const property of ['font-family','font-size','font-weight','font-style','line-height','letter-spacing','color'])clone.style.setProperty(property,rootStyle.getPropertyValue(property));
      for(let i=0;i<sourceNodes.length;i++){
        const original=sourceNodes[i],copy=cloneNodes[i];
        copy.classList.remove('is-edit-target','is-edit-field');
        if(original instanceof HTMLSelectElement){copy.value=original.value;[...copy.options].forEach((option,index)=>option.toggleAttribute('selected',original.options[index].selected));}
        if(original instanceof HTMLInputElement)copy.setAttribute('value',original.value);
        if(original.scrollTop||original.scrollLeft){if(!copy.children.length){const inner=document.createElement('span');inner.style.display='block';inner.append(...copy.childNodes);copy.append(inner);}for(const child of copy.children)child.style.translate=`${-original.scrollLeft}px ${-original.scrollTop}px`;}
      }
      clone.style.margin='0';clone.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      clone.querySelector('.prototype-note')?.remove();
      for(const [index,image] of [...source.querySelectorAll('img')].entries()){
        if(!image.naturalWidth)await image.decode();
        const pixels=document.createElement('canvas');pixels.width=image.naturalWidth;pixels.height=image.naturalHeight;
        pixels.getContext('2d').drawImage(image,0,0);clone.querySelectorAll('img')[index].src=pixels.toDataURL('image/png');
      }
      const stylesheet=document.createElement('style');stylesheet.textContent=css.join('\n');clone.prepend(stylesheet);
      const bounds=source.getBoundingClientRect(),width=Math.ceil(bounds.width),height=Math.ceil((source.querySelector('.hompy-body')?.getBoundingClientRect().bottom||bounds.bottom)-bounds.top);
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
      // SVG foreignObject in a Blob URL taints Chrome's canvas; an inline data URL keeps it exportable.
      const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG를 생성하지 못했습니다.');
      const url=URL.createObjectURL(blob),download=document.createElement('a');download.href=url;download.download='minihompy-current.png';download.style.cssText='position:fixed;left:-10000px';document.body.append(download);download.click();download.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      status.textContent='현재 미니홈피 화면을 PNG로 저장했습니다.';
    } catch(error) {status.textContent=error.name==='AbortError'?'PNG 저장을 취소했습니다.':error.name==='SecurityError'?'이미지 보안 제한으로 PNG를 저장하지 못했습니다. 이미지 파일을 다시 선택해 주세요.':'PNG 저장에 실패했습니다. 다시 시도해 주세요.';}
    finally {busy=false;button.disabled=false;}
  }
  function renderFrame() {
    document.querySelector('.hompy').dataset.font=state.hompyFont;
    const assign=(selector,value)=>{document.querySelector(selector).textContent=value;};
    assign('.hompy-title h1',state.title);assign('.domain',state.domain);assign('.counter b',state.today);assign('.counter em',state.total);
    assign('.mood span',state.mood);assign('.introduction',state.intro);assign('.owner b',state.name);assign('.owner small',state.birthday);assign('.mail',state.email);
    document.querySelector('.owner>span').hidden=true;document.querySelector('.mail').hidden=!state.email;
    const buddy=document.getElementById('buddy'),selected=buddy.value;
    buddy.replaceChildren(...state.buddies.split('\n').filter(Boolean).map(value=>new Option(value,value)));if([...buddy.options].some(option=>option.value===selected))buddy.value=selected;
    imageSource(document.getElementById('profileImage'),'profile');
    imageSource(document.getElementById('skinImage'),'skin');
    document.querySelector('.utility').hidden=!state.showUtility;document.querySelector('.side-tools').hidden=!state.showSide;
    document.querySelector('.skin-art').hidden=state.backgroundMode!=='image';
    document.querySelector('.hompy').classList.toggle('with-side',state.showSide);
    assign('.utility>span:first-child',state.utilityText);assign('.bgm p','♪ '+state.bgmName);
    for(const [key,variable] of [['frameColor','--frame'],['titleColor','--title'],['tabColor','--tab'],['backgroundColor','--background'],['bgmColor','--bgm-accent']])document.documentElement.style.setProperty(variable,state[key]);
  }
  function showPage(name) {
    if(!Object.hasOwn(pages,name)||busy)return;
    active=name;tabs.forEach(tab=>{const selected=tab.dataset.page===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    content.setAttribute('aria-labelledby',`menu-${name}`);renderPage();
    document.dispatchEvent(new CustomEvent('minihompy-page',{detail:name}));
  }
  fields(document.getElementById('fields-home'),homeFields);
  fields(document.getElementById('fields-skin'),[['skinX','좌우 위치','range'],['skinY','상하 위치','range'],['skinZoom','확대 배율','range']]);
  fields(document.getElementById('fields-style'),[['frameColor','하늘색 프레임','color'],['titleColor','홈피 제목 색상','color'],['tabColor','전체 포인트 색상','color'],['backgroundColor','단색 배경 색상','color'],['bgmColor','BGM 포인트 색상','color'],['bgmPosition','BGM 재생 위치','range'],['showUtility','상단 유틸리티 표시','checkbox'],['utilityText','유틸리티 문구'],['showSide','우측 BGM 표시','checkbox'],['bgmName','BGM 제목']]);
  const editPage=document.getElementById('editPage');
  function showEditorPage() {
    const host=document.getElementById('fields-page');fields(host,pageFields[editPage.value]);
    if(editPage.value==='profile'){
      const rows=document.createElement('div');rows.className='profile-row-editor';
      rows.innerHTML=state.profileRows.map((row,i)=>`<fieldset><legend>${i+1}번째 항목</legend><label for="edit-profileRow${i}label">왼쪽 항목명</label><input id="edit-profileRow${i}label" data-profile-row="${i}" data-profile-part="label" maxlength="120" value="${escape(row.label)}"><label for="edit-profileRow${i}value">오른쪽 내용</label><textarea id="edit-profileRow${i}value" data-profile-row="${i}" data-profile-part="value" rows="2" maxlength="2000">${escape(row.value)}</textarea><button type="button" data-profile-remove="${i}" ${state.profileRows.length===1?'disabled':''}>항목 제거</button></fieldset>`).join('')+`<button type="button" data-profile-add ${state.profileRows.length===6?'disabled':''}>+ 항목 추가 (${state.profileRows.length}/6)</button>`;
      host.prepend(rows);
    }
    document.getElementById('photo-upload-field').hidden=editPage.value!=='photo';document.getElementById('visitor-upload-fields').hidden=editPage.value!=='visitor';
  }
  showEditorPage();editPage.addEventListener('change',()=>{showEditorPage();showPage(editPage.value);});
  function updateField(input){
    if(input.dataset.profileRow!==undefined){const row=state.profileRows[Number(input.dataset.profileRow)],part=input.dataset.profilePart;if(!row||!['label','value'].includes(part))return;row[part]=input.value;renderPage(true);return;}
    const key=input.dataset.key;if(!key||!Object.hasOwn(state,key))return;
    const output=input.parentElement.querySelector('output');if(output)output.textContent=input.value+'%';
    state[key]=input.type==='checkbox'?input.checked:input.value;if(key==='bgmPosition'){seek.value=state[key];return;}renderMenuLabels();renderFrame();renderPage(true);
  }
  const editor=document.getElementById('editor');
  const player=document.querySelector('.player'),seek=player.querySelector('input[type="range"]'),toggle=player.querySelector('[data-bgm-action="toggle"]');
  function setBgmPlaying(playing){
    player.dataset.playing=String(playing);toggle.setAttribute('aria-label',playing?'일시정지':'재생');toggle.setAttribute('aria-pressed',String(playing));toggle.querySelector('.play-icon').hidden=playing;toggle.querySelector('.pause-icon').hidden=!playing;
  }
  function setBgmPosition(value){state.bgmPosition=value;seek.value=value;const control=document.getElementById('edit-bgmPosition');if(control){control.value=value;control.parentElement.querySelector('output').textContent=value+'%';}}
  document.getElementById('saveImage').addEventListener('click',saveCurrentImage);
  editor.addEventListener('input',event=>{if(event.target.tagName!=='SELECT')updateField(event.target);});
  editor.addEventListener('change',event=>{if(event.target.tagName==='SELECT')updateField(event.target);});
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(!busy&&target.hasAttribute('data-profile-add')&&state.profileRows.length<6){state.profileRows.push({label:'새 항목',value:''});showEditorPage();renderPage(true);document.getElementById(`edit-profileRow${state.profileRows.length-1}label`).focus();}
    if(!busy&&target.dataset.profileRemove!==undefined&&state.profileRows.length>1){const index=Number(target.dataset.profileRemove);if(Number.isInteger(index)&&index>=0&&index<state.profileRows.length){state.profileRows.splice(index,1);showEditorPage();renderPage(true);document.getElementById(`edit-profileRow${Math.min(index,state.profileRows.length-1)}label`).focus();}}
    if(target.dataset.page)showPage(target.dataset.page);
    if(target.dataset.go)showPage(target.dataset.go);
    if(target.dataset.bgmAction){const action=target.dataset.bgmAction,playing=action==='toggle'?!player.matches('[data-playing=true]'):action==='stop'?false:player.matches('[data-playing=true]');if(action==='next'||action==='stop')setBgmPosition(0);setBgmPlaying(playing);}
    if(target.dataset.room&&!busy){roomTab=target.dataset.room;showPage('home');document.getElementById(`room-${roomTab}`).focus();}
    if(target.dataset.restore&&!busy){const key=target.dataset.restore;if(images[key].startsWith('blob:'))URL.revokeObjectURL(images[key]);images[key]=defaultImages[key];renderFrame();renderPage(true);document.getElementById('uploadStatus').textContent='기본 이미지로 돌아왔습니다.';}
  });
  document.querySelector('.menu').addEventListener('keydown',event=>{
    const index=tabs.indexOf(event.target);if(index<0||busy)return;
    let next;if(event.key==='ArrowDown')next=(index+1)%tabs.length;else if(event.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
    event.preventDefault();showPage(tabs[next].dataset.page);tabs[next].focus();
  });
  document.addEventListener('change',async event=>{
    const input=event.target,key=input.dataset.upload;if(!key)return;
    const file=input.files[0],status=document.getElementById('uploadStatus');if(!file)return;
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){status.textContent='PNG, JPG, WebP 또는 GIF 이미지를 선택해 주세요.';input.value='';return;}
    if(file.size>20000000){status.textContent='20 MB 이하의 이미지를 선택해 주세요.';input.value='';return;}
    if(busy){input.value='';return;}
    busy=true;document.querySelectorAll('[data-upload]').forEach(el=>el.disabled=true);status.textContent='이미지를 불러오는 중…';
    const url=URL.createObjectURL(file),image=new Image();
    try{image.src=url;await image.decode();if(images[key].startsWith('blob:'))URL.revokeObjectURL(images[key]);images[key]=url;if(key==='skin'){const mode=document.getElementById('backgroundMode');mode.value='image';mode.dispatchEvent(new Event('change',{bubbles:true}));}renderFrame();renderPage(true);status.textContent='이미지가 반영되었습니다.';}
    catch{URL.revokeObjectURL(url);status.textContent='이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.';}
    finally{busy=false;document.querySelectorAll('[data-upload]').forEach(el=>el.disabled=false);input.value='';}
  });
  window.SceneBridge={ready:()=>true,busy:()=>busy,playing:()=>player.dataset.playing==='true',setPlaying:setBgmPlaying};
  renderMenuLabels();renderFrame();showPage(active);
})();
