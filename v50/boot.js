(function () {
  'use strict';
  const splash = document.getElementById('boot-splash');
  const label = document.getElementById('boot-progress-value');
  const stroke = document.getElementById('boot-progress-stroke');
  const status = document.getElementById('boot-status');
  const started = performance.now();
  const state = {value: 1, target: 4, phase: '正在读取游戏', complete: false, error: null};
  let last = started, finishAt = 0;
  function fail(message) {
    if (state.complete || state.error) return;
    state.error = String(message);
    splash.classList.add('boot-failed');
    status.textContent = state.error;
    document.getElementById('boot-retry').hidden = false;
  }
  function paint(now) {
    if (!splash.isConnected) return;
    const dt = Math.min(80, now - last); last = now;
    // Percentages follow completed work. The independent sweep keeps indicating
    // activity during decoding; no fixed timer dismisses an unfinished screen.
    if (!state.error) {
      state.value = Math.min(state.target, state.value + Math.max(.018 * dt, (state.target - state.value) * dt / 220));
      const percent = Math.min(100, Math.floor(state.value));
      label.textContent = percent + '%';
      stroke.style.strokeDashoffset = String(100 - state.value);
      if (finishAt && now >= finishAt && percent >= 100) {
        state.complete = true;
        document.documentElement.dataset.appReady = 'true';
        splash.classList.add('is-ready');
        setTimeout(() => splash.remove(), 380);
        return;
      }
    }
    requestAnimationFrame(paint);
  }
  const cssReady = new Promise((resolve, reject) => {
    const link = document.getElementById('fashion-styles');
    if (link.dataset.loaded === 'true') return resolve();
    if (link.dataset.failed === 'true') return reject(new Error('界面样式读取失败，请解压完整试玩包后重试。'));
    link.addEventListener('load', () => resolve(), {once:true});
    link.addEventListener('error', () => reject(new Error('界面样式读取失败，请解压完整试玩包后重试。')), {once:true});
  });
  // Attach a handler immediately so a missing stylesheet never produces an
  // unhandled rejection before the deferred runtime starts.
  cssReady.catch(e => fail(e.message));
  window.FashionBoot = {
    state, fail,
    async ready(assets, afterLoad) {
      try {
        status.textContent = state.phase = '正在读取场景与角色';
        let completed = 0;
        await Promise.all([cssReady, ...assets.map(src => new Promise((resolve, reject) => {
          const img = new Image();
          const timer = setTimeout(() => reject(new Error('资源读取超时：' + src)), 15000);
          img.onload = () => {
            clearTimeout(timer);
            completed++;
            state.target = 12 + completed / assets.length * 76;
            status.textContent = state.phase = `正在读取场景与角色 ${completed}/${assets.length}`;
            resolve();
          };
          img.onerror = () => {clearTimeout(timer);reject(new Error('找不到游戏资源：' + src + '。请使用完整试玩包或新版 APK。'));};
          img.src = src;
        }))]);
        // Scene/camera measurements must use the loaded stylesheet, including
        // when mobile networks deliver the runtime ahead of the CSS file.
        afterLoad?.();
        await new Promise(resolve => requestAnimationFrame(resolve));
        state.target = 96;
        status.textContent = state.phase = '准备进入时尚街区';
        await new Promise(resolve => setTimeout(resolve, Math.max(0, 1050 - (performance.now() - started))));
        state.target = 100;
        finishAt = performance.now() + 320;
      } catch (e) {fail(e.message);}
    }
  };
  // Existing runtime calls are bridged, but readiness is controlled above.
  window.__bootProgressV45 = true;
  window.__bootProgressV44 = {paint() {}, complete() {}};
  document.getElementById('boot-retry').addEventListener('click', () => location.reload());
  window.addEventListener('error', e => {
    if (e.target?.tagName === 'SCRIPT' && e.target.src.includes('v50-runtime')) fail('游戏脚本读取失败，请解压完整试玩包后重试。');
    else if (e.error && !window.loopApp) fail('游戏初始化失败，请重新加载。');
  }, true);
  setTimeout(() => {if (!window.loopApp && !state.error) fail('游戏启动超时，请检查试玩文件是否完整后重试。');}, 18000);
  requestAnimationFrame(paint);
})();
