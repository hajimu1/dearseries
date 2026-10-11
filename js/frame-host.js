// Only lifecycle messages cross frames; edits and uploaded images stay in their scene.
(() => {
  if (parent === window) return;
  const expectedOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  const origin = expectedOrigin === 'null' ? '*' : expectedOrigin;
  const send = message => parent.postMessage({channel: 'dear-series', ...message}, origin);
  let active = true, resumePlaying = true;
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== expectedOrigin || event.data?.channel !== 'dear-series') return;
    const message = event.data, bridge = window.SceneBridge;
    if (!bridge) return;
    if (message.kind === 'can-leave') send({kind: 'leave-result', token: message.token, busy: bridge.busy()});
    if (message.kind === 'active' && typeof message.value === 'boolean' && message.value !== active) {
      if (!message.value) {resumePlaying = bridge.playing(); bridge.setPlaying(false);}
      else bridge.setPlaying(resumePlaying);
      active = message.value;
    }
  });
  const started = Date.now();
  const timer = setInterval(() => {
    if (window.SceneBridge?.ready()) {clearInterval(timer); send({kind: 'ready'});}
    else if (Date.now() - started > 30000) {clearInterval(timer); send({kind: 'error', message: '장면을 불러오지 못했어요. 파일 누락 여부를 확인한 뒤 새로고침해 주세요.'});}
  }, 100);
})();
