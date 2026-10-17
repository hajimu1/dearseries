'use strict';
(() => {
  const $=id=>document.getElementById(id), editor=$('editor');
  const panels=[['home','홈','제목 · 새 소식 · 미니룸'],['profile','프로필','왼쪽 프로필 · 사진 · 소개'],['posts','게시물','현재 메뉴의 글 · 사진 · 방명록'],['skin','스킨','미니홈피 전체 배경'],['settings','설정','색상 · 메뉴 · 보조 영역']];
  const sections=new Map(), nav=document.createElement('div'), context=document.createElement('div');
  let selectedField='', selectedLabel='', activePanel='home';
  nav.className='inspector-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','편집 대상');
  context.className='selection-context';context.setAttribute('role','status');context.setAttribute('aria-live','polite');
  document.querySelector('.inspector-header p').textContent='화면에서 수정할 부분을 클릭하세요.';
  for(const [id,label,description] of panels){
    const section=document.createElement('section'), tab=document.createElement('button'), heading=document.createElement('h3');
    section.id='inspector-'+id;section.className='editor-panel editor-fields';section.setAttribute('role','tabpanel');section.setAttribute('aria-labelledby','inspector-tab-'+id);
    heading.textContent=description;section.append(heading);sections.set(id,section);editor.append(section);
    tab.id='inspector-tab-'+id;tab.type='button';tab.textContent=label;tab.dataset.inspector=id;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',section.id);
    tab.addEventListener('click',()=>{activate(id);if(id==='home')$('menu-home').click();if(id==='posts')$('editPage').dispatchEvent(new Event('change',{bubbles:true}));});
    nav.append(tab);
  }
  function heading(panel,label){const h=document.createElement('h4');h.textContent=label;sections.get(panel).append(h);}
  function moveField(panel,key){const field=$('edit-'+key);sections.get(panel).append(field.parentElement);}
  function moveControl(panel,id,host=sections.get(panel)){const control=$(id),label=document.querySelector(`label[for="${id}"]`);if(label)host.append(label);host.append(control);}
  function moveImage(panel,key,id,host=sections.get(panel)){
    const preview=document.createElement('img');preview.className='upload-preview';preview.dataset.preview=key;preview.alt='현재 '+({profile:'프로필 사진',room:'미니룸',photo:'사진첩 이미지',skin:'스킨'}[key]);host.append(preview);
    moveControl(panel,id,host);host.append(document.querySelector(`[data-restore="${key}"]`));
  }
  heading('home','홈피 상단');moveField('home','title');moveField('home','titleColor');['domain','today','total'].forEach(key=>moveField('home',key));
  heading('home','새 소식');['news','photoCount','boardCount','bookmarkCount'].forEach(key=>moveField('home',key));
  heading('home','Miniroom · 미니룸');moveImage('home','room','roomUpload');moveControl('home','roomFit');for(const key of ['roomX','roomY','roomZoom'])moveField('home',key);
  heading('home','미니룸 문구');for(const key of ['roomCaption','roomIndicator','roomTogether','roomReply'])moveField('home',key);
  for(let i=0;i<3;i++){heading('home',`일촌평 ${i+1}`);for(const key of ['Name','Message','Relation'])moveField('home',`friend${i}${key}`);}
  heading('profile','프로필 사진');moveImage('profile','profile','profileUpload');
  function fitControl(panel,key){const label=document.createElement('label'),select=$('roomFit').cloneNode(true);select.id=key+'Fit';select.dataset.key=key+'Fit';label.htmlFor=select.id;label.textContent='이미지 맞춤';sections.get(panel).append(label,select);}
  fitControl('profile','profile');for(const key of ['profileX','profileY','profileZoom'])moveField('profile',key);heading('profile','오늘의 기분 · 소개');['mood','intro','name','birthday','email','buddies'].forEach(key=>moveField('profile',key));
  const introAlignLabel=document.createElement('label'),introAlign=document.createElement('select');introAlignLabel.htmlFor='introAlign';introAlignLabel.textContent='소개글 정렬';introAlign.id='introAlign';introAlign.dataset.key='introAlign';
  for(const [value,label] of [['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬']])introAlign.add(new Option(label,value));
  $('edit-intro').parentElement.after(introAlignLabel,introAlign);
  moveControl('posts','editPage');sections.get('posts').append($('fields-page'),$('photo-upload-field'),$('visitor-upload-fields'));
  const photoFitHost=document.createElement('div');fitControl('posts','photo');photoFitHost.append(document.querySelector('label[for="photoFit"]'),$('photoFit'));$('photo-upload-field').append(photoFitHost,...['photoX','photoY','photoZoom'].map(key=>$('edit-'+key).parentElement));
  heading('skin','배경 방식');moveControl('skin','backgroundMode');
  const skinImageControls=document.createElement('div');skinImageControls.id='skinImageControls';sections.get('skin').append(skinImageControls);
  moveImage('skin','skin','skinUpload',skinImageControls);moveControl('skin','skinFit',skinImageControls);skinImageControls.append($('fields-skin'));
  heading('skin','배경 색상');moveField('skin','backgroundColor');heading('skin','프레임 색상');moveField('skin','frameColor');
  heading('settings','색상 · 메뉴');moveField('settings','tabColor');
  const menuLanguageLabel=document.createElement('label'),menuLanguage=document.createElement('select');menuLanguageLabel.htmlFor='menuLanguage';menuLanguageLabel.textContent='탭 언어';menuLanguage.id='menuLanguage';menuLanguage.dataset.key='menuLanguage';
  for(const [value,label] of [['en','English'],['ko','한국어']]){const option=document.createElement('option');option.value=value;option.textContent=label;menuLanguage.append(option);}
  sections.get('settings').append(menuLanguageLabel,menuLanguage);
  const fontLabel=document.createElement('label'),fontSelect=document.createElement('select');
  fontLabel.htmlFor='hompyFont';fontLabel.textContent='미니홈피 글꼴';fontSelect.id='hompyFont';fontSelect.dataset.key='hompyFont';
  for(const [value,label] of [['Dotum','돋움 (기본)'],['Mona10x12','Mona 10×12'],['Mona12','Mona 12'],['DanpungSaemmul','단풍샘물']])fontSelect.add(new Option(label,value));
  sections.get('settings').append(fontLabel,fontSelect);
  heading('settings','BGM');['showSide','bgmName','bgmColor','bgmPosition'].forEach(key=>moveField('settings',key));
  heading('settings','보조 문구');['showUtility','utilityText'].forEach(key=>moveField('settings',key));
  editor.replaceChildren(...sections.values());editor.before(nav,context);
  function makeGroup(host,label,open=false){
    const group=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
    group.className='editor-group';group.open=open;summary.textContent=label;body.className='editor-group-body';group.append(summary,body);host.append(group);return body;
  }
  for(const section of sections.values()){
    section.querySelector(':scope > h3')?.remove();
    let body=null;
    for(const child of [...section.children]){
      if(child.tagName==='H4'){body=makeGroup(section,child.textContent,!section.querySelector('details'));child.remove();}
      else if(body)body.append(child);
    }
  }
  // Fields are regenerated when the selected page changes; move the existing controls without replacing their listeners.
  function groupPageFields(){
    const host=$('fields-page');if(host.querySelector(':scope > details'))return;
    let body=null;
    for(const child of [...host.children]){
      const key=child.querySelector('[data-key]')?.dataset.key||'',entry=/^(visitor|diary)(\d+)(name|date)$/.exec(key);
      if(!body||entry&&((entry[1]==='visitor'&&entry[3]==='name')||entry[1]==='diary')){
        const label=entry?(entry[1]==='visitor'?'방명록 ':'일기 ')+(Number(entry[2])+1):key==='calendarDate'?'달력':'내용';
        body=makeGroup(host,label,!host.querySelector('details'));
      }
      body.append(child);
    }
  }
  const photoHost=$('photo-upload-field'),photoNodes=[...photoHost.children],photoBody=makeGroup(photoHost,'사진 · 배치');photoBody.append(...photoNodes);
  const visitorHost=$('visitor-upload-fields');visitorHost.querySelector('h4')?.remove();
  let visitorBody;
  for(const child of [...visitorHost.children]){
    if(child.matches('label[for^="visitorUpload"]'))visitorBody=makeGroup(visitorHost,`방명록 사진 ${Number(child.htmlFor.slice(-1))+1}`);
    if(visitorBody)visitorBody.append(child);
  }
  const syncBackgroundMode=()=>{const imageMode=$('backgroundMode').value==='image';$('skinImageControls').hidden=!imageMode;$('edit-backgroundColor').closest('details').hidden=imageMode;};
  $('backgroundMode').addEventListener('change',syncBackgroundMode);syncBackgroundMode();
  function activate(id){
    activePanel=id;for(const [key,section] of sections){const chosen=key===id;section.hidden=!chosen;const tab=$('inspector-tab-'+key);tab.setAttribute('aria-selected',String(chosen));tab.tabIndex=chosen?0:-1;}
    editor.scrollTop=0;context.textContent='';context.hidden=true;
  }
  function markSelection(id,label){
    selectedField=id;selectedLabel=label;
    document.querySelectorAll('.is-edit-target,.is-edit-field').forEach(el=>el.classList.remove('is-edit-target','is-edit-field'));
    document.querySelectorAll('[data-edit-field]').forEach(el=>{if(el.dataset.editField===id)el.classList.add('is-edit-target');});
    const field=$(id);if(field){field.classList.add('is-edit-field');context.textContent=label;context.hidden=false;}
  }
  function selectField(id,label){
    if(window.SceneBridge.busy())return;
    const field=$(id);if(!field)return;
    const panel=field.closest('.editor-panel');activate(panel.id.replace('inspector-',''));markSelection(id,label);
    for(let parent=field.parentElement;parent&&parent!==editor;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    field.focus({preventScroll:true});field.scrollIntoView({block:'center',inline:'nearest'});
  }
  const hotspots=[
    ['.hompy-title h1','edit-title','홈피 제목'],['.domain','edit-domain','홈피 주소'],['.counter b','edit-today','TODAY 방문 수'],['.counter em','edit-total','TOTAL 방문 수'],
    ['.mood','edit-mood','오늘의 기분'],['#profileImage','profileUpload','프로필 사진'],['.introduction','edit-intro','프로필 소개글'],['.owner','edit-name','프로필 이름'],['.mail','edit-email','이메일'],['#buddy','edit-buddies','파도타기 목록'],
    ['.news-empty','edit-news','새 소식'],['.news-counts button:nth-child(1)','edit-photoCount','사진첩 개수'],['.news-counts button:nth-child(2)','edit-boardCount','게시판 개수'],['.news-counts button:nth-child(3)','edit-bookmarkCount','즐겨찾기 개수'],
    ['#roomImage','roomUpload','미니룸 이미지'],['.room-meta>span:first-child','edit-roomCaption','미니룸 꾸미기 문구'],['.room-heading>span','edit-roomIndicator','미니룸 탭 오른쪽 문구'],['.room-stats .room-link:first-child','edit-roomTogether','함께 사진찍기 문구'],['.room-stats .room-link:last-child','edit-roomReply','미니룸 답글달기 문구'],
    ['#skinImage','skinUpload','전체 스킨 이미지'],['.book','edit-frameColor','프레임 색상'],['.utility','edit-utilityText','상단 유틸리티 문구'],['.bgm','edit-bgmName','BGM 제목'],
    ['.paper-note','edit-profileAbout','프로필 본문'],
    ['.photo-title','edit-photoTitle','사진 제목'],['.photo-title small','edit-photoDate','사진 날짜'],['.album-image','photoUpload','사진첩 이미지'],['.photo-caption','edit-photoCaption','사진 설명'],['.photo-caption + .entry-footer .photo-comments','edit-photoComments','사진첩 댓글 수'],['.photo-caption + .entry-footer .photo-scraps','edit-photoScraps','사진첩 스크랩 수'],['.board-table tbody','edit-boardLines','게시물 제목 목록'],['.board-table tbody td:last-child','edit-boardDates','게시물 날짜 목록']
  ];
  for(let i=0;i<6;i++)for(const [selector,part,label] of [['dt','label','왼쪽 항목명'],['dd','value','오른쪽 내용']])hotspots.push([`.profile-details [data-profile-row="${i}"] ${selector}`,`edit-profileRow${i}${part}`,`${i+1}번째 프로필 · ${label}`]);
  for(let i=0;i<3;i++)for(const [part,key,label] of [['name','Name','이름'],['message','Message','한마디'],['relation','Relation','관계명']])hotspots.push([`.friend-entry:nth-child(${i+1}) .friend-${part}`,`edit-friend${i}${key}`,`${i+1}번째 일촌 · ${label}`]);
  hotspots.push(['.calendar','edit-calendarDate','달력 기준 날짜']);
  for(let i=0;i<2;i++){hotspots.push([`.diary-entry:nth-of-type(${i+1}) h3`,`edit-diary${i}date`,`${i+1}번째 일기 · 날짜`],[`.diary-entry:nth-of-type(${i+1}) p`,`edit-diary${i}text`,`${i+1}번째 일기 · 내용`],[`.diary-entry:nth-of-type(${i+1}) .diary-comments`,`edit-diary${i}comments`,`${i+1}번째 일기 · 댓글 수`],[`.diary-entry:nth-of-type(${i+1}) .diary-scraps`,`edit-diary${i}scraps`,`${i+1}번째 일기 · 스크랩 수`]);}
  for(let i=0;i<3;i++){hotspots.push([`.guest-entry:nth-of-type(${i+1}) .guest-avatar`,`visitorUpload${i}`,`${i+1}번째 방명록 · 사진`]);for(const [selector,key,label] of [['.guest-header b','name','작성자'],['.guest-header time','date','날짜'],['.guest-body p','text','내용'],['.guest-reply','reply','답글']])hotspots.push([`.guest-entry:nth-of-type(${i+1}) ${selector}`,`edit-visitor${i}${key}`,`${i+1}번째 방명록 · ${label}`]);}
  function bindHotspots(){
    groupPageFields();
    for(const [selector,id,label] of hotspots)for(const el of document.querySelectorAll(selector)){
      el.dataset.editField=id;el.dataset.editLabel=label;el.title=label+' 편집';
      if(!el.matches('button,select,.book')){el.tabIndex=0;if(!el.hasAttribute('role'))el.setAttribute('role','button');el.setAttribute('aria-label',label+' 편집');}
    }
    const sources={profile:'profileImage',room:'roomImage',skin:'skinImage'};
    document.querySelectorAll('[data-preview]').forEach(image=>{const source=$(sources[image.dataset.preview]);if(source)image.src=source.src;});
    if(selectedField)markSelection(selectedField,selectedLabel);
  }
  document.querySelector('.hompy').addEventListener('click',event=>{
    const target=event.target.closest('[data-edit-field]');if(!target||(target.classList.contains('book')&&event.target!==target))return;
    if(target.matches('select'))return;
    event.preventDefault();event.stopPropagation();selectField(target.dataset.editField,target.dataset.editLabel);
  },true);
  document.querySelector('.hompy').addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key)||!event.target.dataset.editField)return;
    event.preventDefault();event.stopPropagation();selectField(event.target.dataset.editField,event.target.dataset.editLabel);
  },true);
  editor.addEventListener('focusin',event=>{
    const entry=hotspots.find(([,id])=>id===event.target.id);if(entry)markSelection(entry[1],entry[2]);
  });
  document.addEventListener('minihompy-render',bindHotspots);
  document.addEventListener('minihompy-page',event=>{
    const page=event.detail;selectedField='';document.querySelectorAll('.is-edit-target,.is-edit-field').forEach(el=>el.classList.remove('is-edit-target','is-edit-field'));
    if(page==='home')activate('home');
    else if(page==='setting')activate('settings');
    else {if($('editPage').value!==page){$('editPage').value=page;$('editPage').dispatchEvent(new Event('change',{bubbles:true}));}activate('posts');}
    bindHotspots();
  });
  nav.addEventListener('keydown',event=>{
    const buttons=[...nav.children],index=buttons.indexOf(event.target);let next;
    if(event.key==='ArrowRight')next=(index+1)%buttons.length;else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
    event.preventDefault();buttons[next].click();buttons[next].focus();
  });
  activate(activePanel);bindHotspots();
})();
