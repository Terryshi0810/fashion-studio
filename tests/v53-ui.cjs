'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'v53-ui-results.json');
const checks = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const pass = (name, details = {}) => { checks.push({ name, pass: true, ...details }); console.log('PASS', name); };

function startServer(port) {
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => resolve(child), 5000);
    child.stdout.on('data', data => {
      text += data.toString();
      if (text.includes(`:${port}`)) { clearTimeout(timer); resolve(child); }
    });
    child.once('error', error => { clearTimeout(timer); reject(error); });
  });
}

async function login(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FashionBoot?.state.complete, null, { timeout: 20000 });
  await page.getByRole('button', { name: /点击开始/ }).click();
  const close = page.getByRole('button', { name: '关闭签到', exact: true });
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.evaluate(() => loopApp.navigate('work'));
  await wait(180);
}

async function geometry(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.atelier52');
    const nav = document.querySelector('#mobile-nav')?.getBoundingClientRect();
    const children = root ? [...root.children].filter(e => getComputedStyle(e).display !== 'none').map(e => ({ className: String(e.className), rect: e.getBoundingClientRect().toJSON() })) : [];
    const overlap = [];
    for (let i = 0; i < children.length; i++) for (let j = i + 1; j < children.length; j++) {
      const a = children[i].rect, b = children[j].rect;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlap.push([children[i].className, children[j].className]);
    }
    const outside = root ? [...root.querySelectorAll('button')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && r.height && (r.left < -1 || r.right > innerWidth + 1 || (nav && r.bottom > nav.top + 1));
    }).map(e => ({ text: e.textContent.trim(), rect: e.getBoundingClientRect().toJSON() })) : [];
    const broken = [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    return {
      children, overlap, outside, broken,
      nav: nav?.toJSON(),
      work: root?.getBoundingClientRect().toJSON(),
      board: root?.querySelector('.a52-board')?.getBoundingClientRect().toJSON(),
      cells: root?.querySelectorAll('.a52-cell').length || 0,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });
}

async function run() {
  const port = 8139;
  const server = await startServer(port);
  const browser = await chromium.launch({ executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const url = `http://127.0.0.1:${port}/fashion-studio-mobile-trial-v53.html`;
  fs.mkdirSync(path.join(__dirname, 'v53-screenshots'), { recursive: true });
  try {
    for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932], [1080, 1920]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await login(page, url);
      const g = await geometry(page);
      assert.deepEqual(g.overlap, []);
      assert.deepEqual(g.outside, []);
      assert.deepEqual(g.broken, []);
      assert.equal(g.documentWidth, width);
      assert.equal(g.cells, 63);
      assert.ok(g.board.width > 0 && g.board.height > 0);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(__dirname, 'v53-screenshots', `${width}x${height}-work.png`) });
      pass(`${width}×${height}: 工作台无重叠、无横向溢出、所有按钮在底部导航上方`, { geometry: g });

      if (width === 390) {
        const before = await page.evaluate(() => ({ energy: loopApp.game.state.energy, count: loopApp.game.state.atelier.board.filter(Boolean).length }));
        await page.locator('.a52-cell[data-index="28"]').tap();
        await wait(100);
        const after = await page.evaluate(() => ({ energy: loopApp.game.state.energy, count: loopApp.game.state.atelier.board.filter(Boolean).length }));
        assert.equal(after.energy, before.energy - 1);
        assert.equal(after.count, before.count + 1);
        pass('手机点击生产器成功出料并扣除1点体力');

        const source = page.locator('.a52-cell[data-index="21"]');
        const target = page.locator('.a52-cell[data-index="22"]');
        await source.dragTo(target);
        await wait(120);
        assert.equal(await page.evaluate(() => loopApp.game.state.atelier.board[21]), null);
        assert.equal(await page.evaluate(() => loopApp.game.state.atelier.board[22].itemId), 'top_02');
        pass('手机拖动同款材料完成二合');
      }
      await context.close();
    }

    // Exercise the packed APK's extracted web root as well as the source trial.
    const packed = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const packedPage = await packed.newPage();
    await login(packedPage, `http://127.0.0.1:${port}/pack-test/v53-signed-apk/index.html`);
    const packedGeometry = await geometry(packedPage);
    assert.deepEqual(packedGeometry.broken, []);
    assert.equal(packedGeometry.documentWidth, 390);
    pass('签名 APK 解包网页根目录可启动，工作台资源无丢失', { geometry: packedGeometry });
    await packed.close();
  } finally {
    await browser.close();
    server.kill();
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ pass: true, url, checks, limitation: 'Chromium 移动端视口与触控模拟；未进行实体 Android 手机安装。' }, null, 2));
  }
}

run().catch(error => {
  console.error(error.stack || error);
  fs.writeFileSync(out, JSON.stringify({ pass: false, checks, error: String(error.stack || error) }, null, 2));
  process.exitCode = 1;
});
