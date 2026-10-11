function reviewGif(blob,{width,height,frameMs,colors,previousSize}){
 const limit=15000000,mb=n=>(n/1000000).toFixed(2),host=document,dialog=host.createElement('dialog'),url=URL.createObjectURL(blob);
 dialog.id='gifReview';dialog.setAttribute('aria-labelledby','gifReviewTitle');dialog.style.cssText='max-width:560px;width:calc(100% - 48px);max-height:90vh;overflow:auto;padding:20px;background:#eee;color:#222;border:2px solid #777;font:14px/1.5 sans-serif;';
 dialog.innerHTML='<h2 id="gifReviewTitle" style="margin:0 0 8px;font-size:18px">GIF 용량 확인</h2><p id="gifActualSize" style="font-size:20px;margin:8px 0"></p><p id="gifSizeStatus"></p><img alt="완성된 GIF 미리보기" style="display:block;max-width:100%;max-height:32vh;margin:12px auto"><p id="gifExportDetails"></p><p>약간의 화질 손실로 줄이려면 색상·프레임 수를 낮추세요. 더 줄여야 한다면 가로 크기도 줄일 수 있어요. 재생 길이와 반복 순서는 유지됩니다.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><button data-gif-action="save">이 GIF 저장</button><button data-gif-action="light">색상·프레임 줄이기</button><button data-gif-action="small">가로 크기도 줄이기</button><button data-gif-action="cancel">닫기</button></div>';
 dialog.querySelector('#gifActualSize').textContent=mb(blob.size)+' MB / 15 MB'+(previousSize?' · 이전보다 '+Math.abs(Math.round((1-blob.size/previousSize)*100))+'% '+(blob.size<=previousSize?'감소':'증가'):'');
 dialog.querySelector('#gifSizeStatus').textContent=blob.size<=limit?'15MB 기준 이내입니다.':'15MB 기준을 초과합니다. 아래 옵션으로 줄인 뒤 실제 용량을 다시 확인하세요.';
 dialog.querySelector('#gifSizeStatus').style.color=blob.size<=limit?'#286134':'#a22525';
 dialog.querySelector('#gifExportDetails').textContent=width+' × '+height+' · 약 '+(1000/frameMs).toFixed(1)+'fps · '+colors+'색';
 dialog.querySelector('img').src=url;
 const lightFrames=frameMs<100?100:125;
 const light=dialog.querySelector('[data-gif-action="light"]');light.textContent='색상·프레임 줄이기 · 192색 / '+(1000/lightFrames)+'fps';light.disabled=colors<=192&&frameMs>=lightFrames;
 const smaller=Math.max(320,Math.round(width*.85));const small=dialog.querySelector('[data-gif-action="small"]');small.textContent='가로 크기도 줄이기 · '+smaller+'px';small.disabled=smaller>=width;
 host.body.append(dialog);dialog.showModal();
 return new Promise(resolve=>{let done=false;const finish=action=>{if(done)return;done=true;dialog.close();dialog.remove();URL.revokeObjectURL(url);resolve(action)};dialog.addEventListener('cancel',e=>{e.preventDefault();finish('cancel')});dialog.addEventListener('click',e=>{const button=e.target.closest('[data-gif-action]');if(button&&!button.disabled)finish(button.dataset.gifAction)})});
}
