'use strict';
(() => {
  const panels=[['storySection','본문'],['sequenceSection','상태'],['imageSection','배경'],['characterSection','인물'],['logSection','기록'],['paletteSection','팔레트'],['motionSection','재생']];
  const nav=document.createElement('div');nav.className='editor-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','편집 항목');
  const activate=id=>{
    for(const [key] of panels){const section=$(key),selected=key===id;section.hidden=!selected;section.open=true;const tab=$(`edit-tab-${key}`);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
    $('settings').scrollTop=0;
  };
  panels.forEach(([id,label],index)=>{
    const tab=document.createElement('button');tab.type='button';tab.id=`edit-tab-${id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',id);tab.textContent=label;
    tab.onclick=()=>{if(!busy)activate(id);};
    tab.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(index+1)%panels.length;else if(event.key==='ArrowLeft')next=(index+panels.length-1)%panels.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=panels.length-1;else return;event.preventDefault();if(busy)return;activate(panels[next][0]);nav.children[next].focus();};
    const section=$(id);section.setAttribute('role','tabpanel');section.setAttribute('aria-labelledby',tab.id);nav.append(tab);
  });
  $('settings').before(nav);activate('storySection');
  $('hotspots').addEventListener('click',event=>{const button=event.target.closest('[data-section]');if(button&&!busy)activate(button.dataset.section);},true);
  const content=$('paletteSection').querySelector('.section-content');
  const search=document.createElement('input');search.type='search';search.placeholder='이름 또는 번호로 찾기';search.setAttribute('aria-label','팔레트 검색');search.className='palette-search';
  const grid=document.createElement('div');grid.className='palette-library';grid.setAttribute('role','group');grid.setAttribute('aria-label','팔레트 색상 미리보기');
  const select=$('palettePreset');
  for(const option of select.options){
    const colors=scenePalettes[option.value];if(!colors)continue;
    const button=document.createElement('button');button.type='button';button.className='palette-card';button.dataset.preset=option.value;button.setAttribute('aria-label',option.textContent);
    const strip=document.createElement('span');strip.className='palette-strip';strip.setAttribute('aria-hidden','true');
    for(const color of colors.slice(0,3)){const chip=document.createElement('i');chip.style.background=color;strip.append(chip);}
    const label=document.createElement('span');label.textContent=option.textContent;button.append(strip,label);
    button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));};grid.append(button);
  }
  select.after(search,grid);
  search.oninput=()=>{const query=search.value.trim().toLowerCase();for(const card of grid.children)card.hidden=!card.textContent.toLowerCase().includes(query);};
  for(const id of ['paletteInk','palettePaper','paletteAccent']){
    const input=$(id),row=document.createElement('div');row.className='palette-color-control';input.before(row);row.append(input);
    const code=document.createElement('output');code.htmlFor=id;code.id=`${id}Code`;row.append(code);
  }
  const sync=()=>{for(const card of grid.children)card.setAttribute('aria-pressed',String(card.dataset.preset===select.value));for(const id of ['paletteInk','palettePaper','paletteAccent'])$(`${id}Code`).textContent=$(id).value.toUpperCase();};
  $('settings').addEventListener('input',sync);$('reset').addEventListener('click',()=>{search.value='';search.oninput();sync();});sync();
  document.querySelector('.inspector-heading .eyebrow').textContent='WORLD OF HORROR';
  document.querySelector('.settings-count').textContent='EDIT / 07';
})();
