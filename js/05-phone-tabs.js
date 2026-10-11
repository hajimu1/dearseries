(()=>{
const editor=document.getElementById('editor'),aside=editor.parentElement;
document.querySelector('.brand strong').textContent='메신저 콜라주';
document.querySelector('.brand small').textContent='PROFILE · MUSIC · MESSAGES';
document.querySelector('.brand .mark').textContent='···';
let profile=document.getElementById('messengerProfile');
if(!profile){profile=document.createElement('div');profile.id='messengerProfile';profile.className='messenger-profile';profile.innerHTML='<img alt="연락처 프로필"><div><strong></strong><small>프로필 · 대화 설정</small></div>';aside.prepend(profile)}
const thumbnail=document.getElementById('thumb-profile'),contact=document.getElementById('contact');
const syncProfile=()=>{profile.querySelector('img').src=thumbnail.src;profile.querySelector('strong').textContent=contact.value||'나의 메신저'};
new MutationObserver(syncProfile).observe(thumbnail,{attributes:true,attributeFilter:['src']});contact.addEventListener('input',syncProfile);syncProfile();
let tabs=document.getElementById('phoneSettingsTabs');
if(!tabs){
 const imagePanel=document.createElement('section'),first=editor.querySelector('details');
 while(editor.firstElementChild!==first)imagePanel.append(editor.firstElementChild);
 editor.prepend(imagePanel);
 tabs=document.createElement('div');tabs.id='phoneSettingsTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','아이폰 설정 항목');aside.insertBefore(tabs,editor);
 [imagePanel,...editor.querySelectorAll(':scope > details')].forEach((panel,i)=>{
  panel.id='phone-settings-panel-'+i;panel.dataset.phonePanel='';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','phone-settings-tab-'+i);if(panel.tagName==='DETAILS')panel.open=true;
  const tab=document.createElement('button');tab.id='phone-settings-tab-'+i;tab.type='button';tab.textContent=['사진','음악','프로필·대화','화면·저장'][i];tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);tabs.append(tab);
 });
}
const buttons=[...tabs.children],panels=[...editor.querySelectorAll('[data-phone-panel]')];
function show(i){buttons.forEach((tab,j)=>{tab.setAttribute('aria-selected',String(i===j));tab.tabIndex=i===j?0:-1;panels[j].hidden=i!==j});editor.scrollTop=0}
buttons.forEach((tab,i)=>{tab.onclick=()=>show(i);tab.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;else if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();show(next);buttons[next].focus()}});
show(Math.max(0,buttons.findIndex(tab=>tab.getAttribute('aria-selected')==='true')));
})();
