'use strict';
const tabs = [...document.querySelectorAll('nav a')];
const ids = tabs.map(tab => tab.hash.slice(1));
const frames = new Map();
const picker=document.getElementById('scenePicker'),pickerToggle=document.getElementById('scenePickerToggle');
function closePicker(){picker.open=false;}
const status = document.getElementById('status');
const expectedOrigin = location.protocol === 'file:' ? 'null' : location.origin;
const origin = expectedOrigin === 'null' ? '*' : expectedOrigin;
let active = null, pending = null, requestNumber = 0, noticeTimer;
const send = (frame, message) => frame.contentWindow.postMessage({channel: 'dear-series', ...message}, origin);
function notice(text, temporary = false) {
  clearTimeout(noticeTimer); status.textContent = text; status.hidden = !text;
  if (temporary) noticeTimer = setTimeout(() => {status.hidden = true;}, 3500);
}
function activate(id) {
  if (id!=='home'&&!ids.includes(id)) return;
  pending = null;
  for (const [key, frame] of frames) {frame.hidden = key !== id; send(frame, {kind: 'active', value: key === id});}
  active = id;
  document.getElementById('home').hidden=id!=='home';document.getElementById('sceneNavigation').hidden=id==='home';closePicker();
  if(id==='home'){
   document.getElementById('home').scrollTop=0;
   document.body.dataset.scene='home';document.title='Dear Series · Archive';
   tabs.forEach(tab=>{tab.setAttribute('aria-selected','false');tab.tabIndex=0;});notice('');
   if(location.hash!=='#home')history.replaceState(null,'','#home');return;
  }
  if (!frames.has(id)) {
    const frame = document.createElement('iframe');
    frame.id = `frame-${id}`; frame.title = tabs[ids.indexOf(id)].querySelector('b').textContent + ' 편집기';
    frame.className = 'scene-frame'; frame.setAttribute('role', 'tabpanel'); frame.setAttribute('aria-labelledby', `tab-${id}`);
    frame.allow = 'fullscreen'; frame.src = location.protocol === 'file:' && location.pathname.endsWith('/site/index.html') && ['13-magazine', '14-ds', '15-collage'].includes(id)
      ? `../offline/scenes/${id}.html?v=20261021-navigation-233`
      : `scenes/${id}.html?v=20261021-navigation-233`;
    frames.set(id, frame); document.getElementById('scenes').append(frame);
    notice('장면을 불러오는 중…');
  } else notice(frames.get(id).dataset.ready ? '' : '장면을 불러오는 중…');
  document.body.dataset.scene = id;
  document.title = `${tabs[ids.indexOf(id)].querySelector('b').textContent} · Dear Series`;
  tabs.forEach(tab => {const selected = tab.hash === '#' + id; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;});
  const index=ids.indexOf(id);document.getElementById('currentScene').textContent=String(index+1).padStart(2,'0')+' · '+tabs[index].querySelector('b').textContent;document.getElementById('scenePosition').textContent=(index+1)+' / '+ids.length;document.getElementById('previousScene').disabled=index===0;document.getElementById('nextScene').disabled=index===ids.length-1;
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
}
function requestScene(id) {
  if ((id!=='home'&&!ids.includes(id)) || id === active) return;
  if (!active || !frames.get(active)?.dataset.ready) {activate(id); return;}
  pending = {id, token: ++requestNumber};
  send(frames.get(active), {kind: 'can-leave', token: pending.token});
}
window.addEventListener('message', event => {
  if (event.origin !== expectedOrigin || event.data?.channel !== 'dear-series') return;
  const entry = [...frames].find(([, frame]) => frame.contentWindow === event.source);
  if (!entry) return;
  const [id, frame] = entry, message = event.data;
  if (message.kind === 'ready') {frame.dataset.ready = 'true'; send(frame, {kind: 'active', value: id === active}); if (id === active) notice('');}
  if (message.kind === 'leave-result' && id === active && pending?.token === message.token) {
    if (message.busy) {pending = null; history.replaceState(null, '', '#' + active); notice('이미지 처리나 저장이 끝난 뒤 장면을 바꿔주세요.', true);}
    else activate(pending.id);
  }
  if (message.kind === 'error' && id === active) notice(message.message || '장면을 불러오지 못했어요. 새로고침해 주세요.');
});
tabs.forEach((tab, index) => {
  tab.onclick = event => {event.preventDefault();pickerToggle.focus();closePicker();requestScene(ids[index]);};
  tab.onkeydown = event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); tabs.forEach((item,i)=>item.tabIndex=i===next?0:-1);tabs[next].focus();
  };
});
window.addEventListener('hashchange', () => requestScene(ids.includes(location.hash.slice(1))?location.hash.slice(1):'home'));
document.getElementById('previousScene').onclick=()=>requestScene(ids[ids.indexOf(active)-1]);
document.getElementById('nextScene').onclick=()=>requestScene(ids[ids.indexOf(active)+1]);
picker.addEventListener('toggle',()=>{if(picker.open){tabs.forEach((tab,i)=>tab.tabIndex=i===ids.indexOf(active)?0:-1);}});
document.addEventListener('click',event=>{if(!picker.contains(event.target))closePicker();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&picker.open){event.preventDefault();closePicker();pickerToggle.focus();}});
window.addEventListener('blur',closePicker);
document.querySelectorAll('header a[href="#home"]').forEach(link=>link.onclick=event=>{event.preventDefault();requestScene('home');});
[...tabs.keys()].reverse().forEach(i=>{
 const tab=tabs[i],card=document.createElement('a');card.href=tab.hash;card.className='template-card';card.dataset.category=tab.dataset.kind||'motion';
 const number=document.createElement('span');number.className='template-number';number.textContent=String(i+1).padStart(2,'0');
 const name=document.createElement('h3');name.textContent=tab.querySelector('b').textContent;
 const action=document.createElement('span');action.className='template-action';action.textContent=card.dataset.category==='prototype'?'UI 시안':card.dataset.category==='static'?'정적 이미지':'이미지 · 모션';
 card.append(number,name,action);card.onclick=event=>{event.preventDefault();requestScene(ids[i]);};document.getElementById('templateGrid').append(card);
});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{
 const filter=button.dataset.filter;let count=0;
 document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 document.querySelectorAll('.template-card').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)count++;});
 document.getElementById('entryCount').textContent=`${count} RECORD${count===1?'':'S'}`;
 document.getElementById('collectionTitle').textContent=filter==='all'?'ALL ENTRIES':filter==='static'?'PAPER & PRINT':'SCREEN & MOTION';
});
document.getElementById('backToTop').onclick=event=>{event.preventDefault();document.getElementById('home').scrollTo({top:0,behavior:'smooth'});};
activate(ids.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home');
