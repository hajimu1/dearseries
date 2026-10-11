defaults.vhsOpacity=0;config.vhsOpacity??=0;
const vhsBox=document.createElement('div');vhsBox.innerHTML='<label for="vhsOpacity">VHS 질감 · 전체 강도</label><input id="vhsOpacity" type="range" min="0" max="1" step="0.01"><p class="help">0은 원본. 저화질·스캔라인·색 번짐·엠보싱을 함께 조절합니다.</p>';
document.getElementById('phone-settings-panel-3').append(vhsBox);const vhsSlider=$('vhsOpacity');vhsSlider.value=config.vhsOpacity;vhsSlider.oninput=()=>{config.vhsOpacity=Number(vhsSlider.value);draw(time)};
const baseDraw=draw;draw=function(seconds){baseDraw(seconds);if(ready)applyVhs(outputCtx,config.vhsOpacity,seconds/config.duration)};
const baseSyncForm=syncForm;syncForm=function(){baseSyncForm();vhsSlider.value=config.vhsOpacity||0};

window.SceneBridge={ready:()=>ready,busy:()=>recording||loadingCount>0||$("savePng").disabled,playing:()=>playing,setPlaying:value=>{playing=value;last=0;syncPlay()}};
