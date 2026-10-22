'use strict';
let recentEditTarget=null;
function syncRecentEdit(){ $('recentEdit').disabled=busy||!ready||!recentEditTarget;$('recentEdit').textContent=recentEditTarget?'최근 수정 · '+recentEditTarget.label:'아직 수정한 항목이 없어요'; }
function recordEdit(id){
 if(!ready)return;
 const field=$(id),tab=field?.closest('[role=tabpanel]')?.id.replace('panel-','')||'screen',slot=id.startsWith('slot')?selected:null;
 const label=(slot!==null?'슬롯 '+(slot+1)+' · ':'')+(document.querySelector('label[for="'+id+'"]')?.textContent.trim()||field?.textContent.trim()||'효과 위치');
 recentEditTarget={id,tab,slot,label};syncRecentEdit();
}
function initRecentEdit(){
$('recentEdit').onclick=()=>{
 const target=recentEditTarget;if(busy||!ready||!target)return;playing=false;lastTick=0;
 if(target.slot!==null){selected=target.slot;time=(.38+selected*.105)*config.duration;slotEditor();}
 showTab(target.tab);syncTime();draw();const field=$(target.id);if(field){field.scrollIntoView({block:'center',behavior:'smooth'});field.focus({preventScroll:true});field.classList.remove('edit-target');void field.offsetWidth;field.classList.add('edit-target');}
};

syncRecentEdit();
}
function releasePhoto(p){if(p.image?.src?.startsWith('blob:'))URL.revokeObjectURL(p.image.src);}
