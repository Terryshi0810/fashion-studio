(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FashionGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const STACK = 10;
  const REGEN = 120000;
  const CHAINS = [
    { name: '女装', generator: '针线篮', cost: 1, level: 1, names: ['花语 T 恤', '蜜桃衬衫', '玫瑰连衣裙', '薄荷纱裙', '暮色晚礼服', '流光高定'], tags: ['自然', '甜美', '甜美', '自然', '优雅', '优雅'] },
    { name: '鞋履', generator: '鞋履工坊', cost: 2, level: 8, names: ['心意棉袜', '蝴蝶结平底鞋', '薄荷运动鞋', '焦糖乐福鞋', '蜜桃高跟鞋', '经典短靴'], tags: ['自然', '甜美', '自然', '优雅', '甜美', '优雅'] },
    { name: '配饰', generator: '配饰匣', cost: 4, level: 12, names: ['玫瑰发结', '花园丝巾', '午后草帽', '云朵手提包', '琥珀墨镜', '翡翠戒指'], tags: ['甜美', '自然', '自然', '甜美', '优雅', '优雅'] }
  ];
  const FLOORS = [
    { name: '女装沙龙', level: 1, cost: 0, subtitle: '故事开始的地方', y: 84 },
    { name: '鞋履长廊', level: 8, cost: 350, subtitle: '让每一步都有风景', y: 65 },
    { name: '配饰展厅', level: 12, cost: 550, subtitle: '藏在细节里的心意', y: 49 },
    { name: '高定工坊', level: 18, cost: 950, subtitle: '把灵感缝进时光', y: 35 },
    { name: '星光秀场', level: 25, cost: 1600, subtitle: '属于你的闪耀时刻', y: 22 },
    { name: '天台花园', level: 32, cost: 2400, subtitle: '在花香里相遇', y: 9 }
  ];
  const TASKS = [
    { title: '让橱窗重新亮起来', description: '姑妈最喜欢的玫瑰色，应该被更多人看见。', cost: 280, xp: 80, floor: 0, zone: '橱窗', theme: 'sweet' },
    { title: '添一处温柔的休息角', description: '一把舒适的椅子，一杯热茶，等老朋友回来。', cost: 360, xp: 100, floor: 1, zone: '休息区', theme: 'natural' },
    { title: '开启配饰展厅', description: '小小的配饰，装着大大的心意。', cost: 550, xp: 120, floor: 2, unlock: true },
    { title: '找回姑妈的设计手稿', description: '完成 3 个顾客订单，寻找藏在衣服里的线索。', orders: 3, xp: 120, gems: 5 },
    { title: '为展厅添一束花', description: '让新开的配饰展厅，也带上花园的气息。', cost: 420, xp: 100, floor: 2, zone: '货架', theme: 'natural' },
    { title: '筹备第一场时装秀', description: '参加一次花园午后评比赛，让大家记住百货的名字。', contest: 1, xp: 150, gems: 8 }
  ];
  const THEMES = { sweet: '玫瑰甜心', natural: '薄荷花园', elegant: '鎏金时光' };
  const CONTEST = { name: '花园午后', tags: ['自然', '甜美'], thresholds: [150, 215, 260], rewards: [{ coins: 150, gems: 3, fragments: 3 }, { coins: 300, gems: 8, fragments: 5 }, { coins: 500, gems: 15, fragments: 8 }] };
  const key = (c, t) => `${c}:${t}`;
  const dateKey = now => new Date(now).toISOString().slice(0, 10); // GDD reset: 00:00 UTC = 08:00 Beijing.
  const capEnergy = level => Math.min(200, 100 + Math.max(0, level - 14) * 5);
  const xpNeed = level => level * 100;
  const validItemKey = value => typeof value === 'string' && /^[0-2]:[0-5]$/.test(value);
  const allKeys = () => CHAINS.flatMap((_, c) => Array.from({ length: 6 }, (_, t) => key(c, t)));
  const clone = value => JSON.parse(JSON.stringify(value));
  class RuleError extends Error {}
  function assert(test, message) { if (!test) throw new RuleError(message); }
  function daily(now) { return { date: dateKey(now), gift: false, energyBuys: 0, ad: 0, refresh: 0, purchased: {}, contestAttempts: 0 }; }
  function fresh(now = Date.now()) {
    const board = Array(36).fill(null);
    board[14] = { c: 0, t: 0, n: 9 };
    board[15] = { c: 0, t: 0, n: 1 };
    board[8] = { c: 0, t: 1, n: 2 };
    board[21] = { c: 1, t: 0, n: 4 };
    board[22] = { c: 1, t: 1, n: 1 };
    board[27] = { c: 2, t: 0, n: 3 };
    return {
      version: VERSION, coins: 1280, gems: 80, energy: 68, energyMax: 100,
      level: 12, xp: 65, energyAt: now, board,
      discovered: ['0:0', '0:1', '1:0', '1:1', '2:0'], claimed: [], fragments: 0, chainClaims: [],
      floors: [0, 1], decorations: { '0:橱窗': 'elegant', '1:休息区': 'sweet' }, ownedDecor: [], task: 0,
      orders: [{ id: 1, guest: '姑妈', needs: [{ c: 0, t: 1, n: 1 }], coins: 180, gems: 2, xp: 50, created: now }, { id: 2, guest: '苏珊', needs: [{ c: 1, t: 1, n: 1 }], coins: 220, gems: 0, xp: 60, created: now }, { id: 3, guest: '莉莉', needs: [{ c: 2, t: 0, n: 2 }], coins: 150, gems: 1, xp: 40, created: now }],
      nextOrderId: 4, ordersDone: 0, merges: 0, contestEntries: 0,
      contest: { outfit: ['0:1', '1:1', '2:0'], best: 0, result: null, claimed: [] },
      daily: daily(now), tutorial: false, savedAt: now
    };
  }
  function validate(input) {
    assert(input && input.version === VERSION, '存档版本不支持');
    const s = clone(input);
    const int = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
    for (const field of ['coins', 'gems', 'fragments', 'ordersDone', 'merges', 'contestEntries']) assert(int(s[field], 0, 100000000), '存档资源数据异常');
    assert(int(s.level, 1, 40) && int(s.xp, 0, xpNeed(s.level) - 1), '存档等级数据异常');
    assert(s.energyMax === capEnergy(s.level) && int(s.energy, 0, s.energyMax), '存档体力数据异常');
    assert(Number.isFinite(s.energyAt) && s.energyAt > 0, '存档时间异常');
    assert(Array.isArray(s.board) && s.board.length === 36, '棋盘数据异常');
    s.board.forEach(item => { if (item) assert(int(item.c, 0, 2) && int(item.t, 0, 5) && int(item.n, 1, item.t === 5 ? 10 : 9), '服装堆叠数据异常'); });
    for (const f of ['discovered', 'claimed']) assert(Array.isArray(s[f]) && s[f].every(validItemKey) && new Set(s[f]).size === s[f].length, '图鉴数据异常');
    assert(s.claimed.every(k => s.discovered.includes(k)), '图鉴领取记录异常');
    assert(Array.isArray(s.chainClaims) && s.chainClaims.every(c => int(c, 0, 2)) && new Set(s.chainClaims).size === s.chainClaims.length, '系列奖励异常');
    assert(Array.isArray(s.floors) && s.floors.includes(0) && s.floors.every(f => int(f, 0, 5)) && new Set(s.floors).size === s.floors.length, '楼层数据异常');
    assert(s.decorations && typeof s.decorations === 'object' && !Array.isArray(s.decorations), '装饰数据异常');
    Object.entries(s.decorations).forEach(([k, v]) => assert(/^[0-5]:(橱窗|货架|休息区)$/.test(k) && THEMES[v], '装饰风格异常'));
    assert(Array.isArray(s.ownedDecor) && s.ownedDecor.every(k => /^(sweet|natural|elegant):(橱窗|货架|休息区)$/.test(k)), '装饰库存异常');
    assert(int(s.task, 0, TASKS.length), '任务数据异常');
    assert(Array.isArray(s.orders) && s.orders.length === 3 && int(s.nextOrderId, 4, 100000000), '订单数据异常');
    s.orders.forEach(o => {
      assert(int(o.id, 1, s.nextOrderId - 1) && typeof o.guest === 'string' && o.guest.length <= 20 && Number.isFinite(o.created), '订单信息异常');
      assert(Array.isArray(o.needs) && o.needs.length >= 1 && o.needs.length <= 3, '订单需求异常');
      o.needs.forEach(n => assert(int(n.c, 0, 2) && int(n.t, 0, 5) && int(n.n, 1, 9), '订单服装数据异常'));
      for (const f of ['coins', 'gems', 'xp']) assert(int(o[f], 0, 10000), '订单奖励异常');
    });
    assert(s.contest && Array.isArray(s.contest.outfit) && s.contest.outfit.length === 3 && s.contest.outfit.every((k, c) => validItemKey(k) && Number(k[0]) === c && s.discovered.includes(k)), '搭配数据异常');
    assert(int(s.contest.best, 0, 300) && Array.isArray(s.contest.claimed) && s.contest.claimed.every(i => int(i, 0, 2)) && new Set(s.contest.claimed).size === s.contest.claimed.length, '赛事记录异常');
    if (s.contest.result !== null) assert(s.contest.result && int(s.contest.result.total, 0, 300) && Array.isArray(s.contest.result.judges) && s.contest.result.judges.length === 3 && s.contest.result.judges.every(n => int(n, 0, 100)), '评委数据异常');
    assert(s.daily && /^\d{4}-\d{2}-\d{2}$/.test(s.daily.date), '每日数据异常');
    for (const f of ['energyBuys', 'ad', 'refresh', 'contestAttempts']) assert(int(s.daily[f], 0, f === 'ad' ? 5 : f === 'contestAttempts' ? 3 : 20), '每日次数异常');
    assert(typeof s.daily.gift === 'boolean' && s.daily.purchased && Object.values(s.daily.purchased).every(v => v === true), '每日购买数据异常');
    s.tutorial = Boolean(s.tutorial);
    return s;
  }
  class Game {
    constructor(state, options = {}) {
      this.now = options.now || Date.now;
      this.random = options.random || Math.random;
      this.state = state ? validate(state) : fresh(this.now());
      this.listeners = [];
      this.prepare();
    }
    subscribe(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(x => x !== fn); }; }
    emit() { this.state.savedAt = this.now(); this.listeners.forEach(fn => fn(this.state)); }
    prepare() {
      const s = this.state, now = this.now();
      let changed = false;
      if (s.daily.date !== dateKey(now)) { s.daily = daily(now); changed = true; }
      if (s.energyAt > now || s.energy === s.energyMax) s.energyAt = now;
      else {
        const points = Math.floor((now - s.energyAt) / REGEN);
        if (points > 0) {
          s.energy = Math.min(s.energyMax, s.energy + points);
          s.energyAt = s.energy === s.energyMax ? now : s.energyAt + points * REGEN;
          changed = true;
        }
      }
      return changed;
    }
    tick() { if (this.prepare()) this.emit(); }
    perform(fn) {
      this.prepare();
      const before = clone(this.state);
      try { const result = fn(this.state); validate(this.state); this.emit(); return result; }
      catch (e) { this.state = before; throw e; }
    }
    spend(s, currency, amount) { assert(s[currency] >= amount, ({ coins: '金币不足，去工作台完成几个订单吧', gems: '钻石不足，可以先领取图鉴奖励', fragments: '图鉴碎片不足，重复发现服装可以获得碎片' }[currency])); s[currency] -= amount; }
    energy(s, amount) { assert(s.energy >= amount, '体力不足，去商店补充或等待自然恢复'); if (s.energy === s.energyMax) s.energyAt = this.now(); s.energy -= amount; }
    addEnergy(s, amount) { assert(s.energy < s.energyMax, '体力已经满了，先去制作服装吧'); const before = s.energy; s.energy = Math.min(s.energyMax, s.energy + amount); if (s.energy === s.energyMax) s.energyAt = this.now(); return s.energy - before; }
    xp(s, amount) {
      s.xp += amount;
      while (s.level < 40 && s.xp >= xpNeed(s.level)) { s.xp -= xpNeed(s.level); s.level++; s.energyMax = capEnergy(s.level); s.energy = s.energyMax; s.energyAt = this.now(); }
      if (s.level === 40) s.xp = Math.min(s.xp, xpNeed(40) - 1);
    }
    discover(s, c, t, duplicate = true) { const k = key(c, t); if (!s.discovered.includes(k)) { s.discovered.push(k); return true; } if (duplicate) s.fragments++; return false; }
    count(c, t) { return this.state.board.reduce((a, i) => a + (i && i.c === c && i.t === t ? i.n : 0), 0); }
    canDeliver(order) {
      const needs = {};
      order.needs.forEach(n => { needs[key(n.c, n.t)] = (needs[key(n.c, n.t)] || 0) + n.n; });
      return Object.entries(needs).every(([k, n]) => this.count(...k.split(':').map(Number)) >= n);
    }
    generate(c) {
      return this.perform(s => {
        assert(Number.isInteger(c) && CHAINS[c], '生成器不存在');
        assert(s.level >= CHAINS[c].level, `该生成器需要 LV${CHAINS[c].level}`);
        const empty = s.board.findIndex(x => !x);
        assert(empty >= 0, '工作台满啦，先归位、合并或交付订单');
        this.energy(s, CHAINS[c].cost);
        const t = this.random() < 0.40 ? 1 : 0, n = this.random() < 0.25 ? 2 : 1;
        s.board[empty] = { c, t, n };
        const isNew = this.discover(s, c, t);
        return { index: empty, item: clone(s.board[empty]), isNew };
      });
    }
    move(from, to) {
      return this.perform(s => {
        assert(Number.isInteger(from) && Number.isInteger(to) && from >= 0 && from < 36 && to >= 0 && to < 36 && from !== to, '请选择另一个格子');
        const a = s.board[from], b = s.board[to];
        assert(a, '这个格子是空的');
        if (!b) { s.board[to] = a; s.board[from] = null; return { type: 'move' }; }
        assert(a.c === b.c && a.t === b.t, '只有同款同阶服装可以叠在一起');
        if (a.t === 5) {
          const amount = Math.min(a.n, STACK - b.n);
          assert(amount > 0, '这一摞已经满了'); b.n += amount; a.n -= amount;
          if (a.n === 0) s.board[from] = null;
          return { type: 'stack' };
        }
        const total = a.n + b.n;
        if (total < STACK) { b.n = total; s.board[from] = null; return { type: 'stack' }; }
        s.board[to] = { c: a.c, t: a.t + 1, n: 1 };
        s.board[from] = total > STACK ? { c: a.c, t: a.t, n: total - STACK } : null;
        s.merges++;
        const isNew = this.discover(s, a.c, a.t + 1);
        return { type: 'merge', item: clone(s.board[to]), isNew };
      });
    }
    sort() {
      return this.perform(s => { const items = s.board.filter(Boolean).sort((a, b) => a.c - b.c || a.t - b.t); s.board = items.concat(Array(36 - items.length).fill(null)); });
    }
    newOrder(s) {
      const eligible = CHAINS.map((ch, c) => s.level >= ch.level ? c : -1).filter(c => c >= 0);
      const c = eligible[Math.floor(this.random() * eligible.length)];
      const max = Math.max(1, ...s.discovered.filter(k => Number(k[0]) === c).map(k => Number(k[2])));
      const t = Math.min(3, Math.floor(this.random() * (max + 1)));
      return { id: s.nextOrderId++, guest: ['莉莉', '苏珊', '马克', '艾米', '姑妈'][Math.floor(this.random() * 5)], needs: [{ c, t, n: t <= 1 ? 1 + Math.floor(this.random() * 3) : 1 }], coins: (90 + t * 70) * (c === 2 ? 1.5 : 1), gems: t >= 2 ? 2 : 0, xp: 30 + t * 10, created: this.now() };
    }
    deliver(id) {
      return this.perform(s => {
        const i = s.orders.findIndex(o => o.id === id);
        assert(i >= 0, '订单已交付');
        const o = s.orders[i]; assert(this.canDeliver(o), '还缺少订单所需的服装');
        o.needs.forEach(need => {
          let remaining = need.n;
          s.board.forEach((item, index) => { if (remaining > 0 && item && item.c === need.c && item.t === need.t) { const take = Math.min(remaining, item.n); item.n -= take; remaining -= take; if (!item.n) s.board[index] = null; } });
        });
        s.coins += o.coins; s.gems += o.gems; this.xp(s, o.xp); s.ordersDone++;
        s.orders[i] = this.newOrder(s);
        return clone(o);
      });
    }
    gift() { return this.perform(s => { assert(!s.daily.gift, '今天的心意已经收下啦'); s.daily.gift = true; s.coins += 120; s.fragments += 3; return { coins: 120, fragments: 3 }; }); }
    energyPrice() { return this.state.daily.energyBuys === 0 ? 0 : 10 * Math.pow(2, Math.min(5, this.state.daily.energyBuys - 1)); }
    buyEnergy() { return this.perform(s => { assert(s.daily.energyBuys < 20, '今天的体力补给次数已用完'); const price = this.energyPrice(); assert(s.energy < s.energyMax, '体力已满，无需购买'); this.spend(s, 'gems', price); const amount = this.addEnergy(s, 50); s.daily.energyBuys++; return { price, amount }; }); }
    adEnergy() { return this.perform(s => { assert(s.daily.ad < 5, '今天的模拟广告补给已用完'); const amount = this.addEnergy(s, 15); s.daily.ad++; return amount; }); }
    offers() { const seed = Number(this.state.daily.date.replace(/-/g, '')) + this.state.daily.refresh * 3; return Array.from({ length: 6 }, (_, i) => { const c = i % 3, t = (seed + Math.floor(i / 3) + c) % 4; return { c, t, id: `${this.state.daily.refresh}:${c}:${t}`, price: 80 + t * t * 85 + c * 25 }; }); }
    refreshShop() { return this.perform(s => { assert(s.daily.refresh < 20, '今日换新次数已用完'); this.spend(s, 'gems', 10); s.daily.refresh++; }); }
    buyItem(c, t, offerId) {
      return this.perform(s => {
        assert(Number.isInteger(c) && Number.isInteger(t) && CHAINS[c] && t >= 0 && t <= 5, '服装不存在');
        let price = 80 + t * t * 85 + c * 25;
        if (offerId !== undefined) { const offer = this.offers().find(x => x.id === offerId && x.c === c && x.t === t); assert(offer, '商品已换新'); assert(!s.daily.purchased[offerId], '这件今日精选已经售罄'); price = offer.price; }
        const empty = s.board.findIndex(x => !x); assert(empty >= 0, '工作台满了，请先腾出一个格子');
        this.spend(s, 'coins', price); s.board[empty] = { c, t, n: 1 };
        const isNew = this.discover(s, c, t);
        if (offerId !== undefined) s.daily.purchased[offerId] = true;
        return { price, isNew, index: empty };
      });
    }
    claimItem(c, t) { return this.perform(s => { const k = key(c, t); assert(s.discovered.includes(k), '先发现这件服装吧'); assert(!s.claimed.includes(k), '发现奖励已经领取'); s.claimed.push(k); s.gems += t + 1; return t + 1; }); }
    fragmentDiscover(c, t) { return this.perform(s => { assert(Number.isInteger(c) && Number.isInteger(t) && CHAINS[c] && t >= 0 && t < 6, '服装不存在'); const k = key(c, t); assert(!s.discovered.includes(k), '已经发现这件服装'); assert(t === 0 || s.discovered.includes(key(c, t - 1)), '先点亮上一阶服装，再解锁下一阶'); const price = 8 * (t + 1); this.spend(s, 'fragments', price); s.discovered.push(k); return price; }); }
    claimChain(c) { return this.perform(s => { assert(Number.isInteger(c) && CHAINS[c], '系列不存在'); assert(CHAINS[c].names.every((_, t) => s.discovered.includes(key(c, t))), '收集齐这一系列的 6 件服装再来吧'); assert(!s.chainClaims.includes(c), '系列奖励已经领取'); s.chainClaims.push(c); s.gems += 15; return 15; }); }
    unlockFloor(f) {
      return this.perform(s => {
        assert(Number.isInteger(f) && FLOORS[f], '楼层不存在');
        assert(!s.floors.includes(f), '这个楼层已开放'); assert(f === 0 || s.floors.includes(f - 1), '先开放下方楼层');
        assert(s.level >= FLOORS[f].level, `达到 LV${FLOORS[f].level} 后开放`);
        this.spend(s, 'coins', FLOORS[f].cost); s.floors.push(f); this.xp(s, 100);
        return f;
      });
    }
    buyDecoration(theme, zone) { return this.perform(s => { assert(THEMES[theme] && ['橱窗', '货架', '休息区'].includes(zone), '装饰方案不存在'); const k = `${theme}:${zone}`; assert(!s.ownedDecor.includes(k), '已拥有这套设计，可直接应用'); this.spend(s, 'coins', 240); s.ownedDecor.push(k); return k; }); }
    decorate(f, zone, theme) { return this.perform(s => { assert(s.floors.includes(f), '先开放这个楼层'); assert(s.ownedDecor.includes(`${theme}:${zone}`), '先在商店解锁这套装饰'); s.decorations[`${f}:${zone}`] = theme; return theme; }); }
    taskReady() {
      const s = this.state, task = TASKS[s.task]; if (!task) return false;
      if (task.orders) return s.ordersDone >= task.orders;
      if (task.contest) return s.contestEntries >= task.contest;
      if (task.unlock && s.floors.includes(task.floor)) return true;
      if (task.floor !== undefined && s.level < FLOORS[task.floor].level) return false;
      return s.coins >= (task.cost || 0);
    }
    finishTask() {
      return this.perform(s => {
        const task = TASKS[s.task]; assert(task, '这段故事已经完成'); assert(this.taskReady(), '还没有达成任务条件');
        if (!(task.unlock && s.floors.includes(task.floor))) this.spend(s, 'coins', task.cost || 0);
        if (task.unlock && !s.floors.includes(task.floor)) s.floors.push(task.floor);
        if (task.zone) { s.decorations[`${task.floor}:${task.zone}`] = task.theme; if (!s.ownedDecor.includes(`${task.theme}:${task.zone}`)) s.ownedDecor.push(`${task.theme}:${task.zone}`); }
        this.xp(s, task.xp); s.gems += task.gems || 0; s.task++;
        return clone(task);
      });
    }
    outfit(c, k) { return this.perform(s => { assert(validItemKey(k) && Number(k[0]) === c && s.discovered.includes(k), '只可搭配已发现的服饰'); s.contest.outfit[c] = k; }); }
    itemScore(k) { const [c, t] = k.split(':').map(Number); return Math.min(100, 35 + t * 11 + (CONTEST.tags.includes(CHAINS[c].tags[t]) ? 20 : 0)); }
    score(outfit = this.state.contest.outfit) {
      const points = outfit.map(k => this.itemScore(k));
      const match = outfit.filter(k => { const [c, t] = k.split(':').map(Number); return CONTEST.tags.includes(CHAINS[c].tags[t]); }).length;
      const judges = [Math.min(100, Math.round(points.reduce((a, b) => a + b, 0) / 3)), Math.min(100, Math.round(points[0] * 0.5 + points[1] * 0.25 + points[2] * 0.25)), Math.min(100, 40 + match * 12 + Math.round(points.reduce((a, b) => a + b, 0) / 15))];
      return { judges, total: judges.reduce((a, b) => a + b, 0), match };
    }
    autoOutfit() { return this.perform(s => { s.contest.outfit = CHAINS.map((_, c) => s.discovered.filter(k => Number(k[0]) === c).sort((a, b) => this.itemScore(b) - this.itemScore(a))[0]); return this.score(); }); }
    enterContest() { return this.perform(s => { assert(s.daily.contestAttempts < 3, '今日 3 次评比已完成，明日再来吧'); this.energy(s, 5); const result = this.score(); s.contest.result = result; s.contest.best = Math.max(s.contest.best, result.total); s.daily.contestAttempts++; s.contestEntries++; return result; }); }
    claimContest(i) { return this.perform(s => { assert(Number.isInteger(i) && CONTEST.thresholds[i], '奖励不存在'); assert(s.contest.best >= CONTEST.thresholds[i], '再提升一点搭配分数，就可以领取'); assert(!s.contest.claimed.includes(i), '这个里程碑已经领取'); const r = CONTEST.rewards[i]; s.coins += r.coins; s.gems += r.gems; s.fragments += r.fragments; s.contest.claimed.push(i); return clone(r); }); }
    completeTutorial() { return this.perform(s => { s.tutorial = true; }); }
    previewAdvanced() { return this.perform(s => { s.level = Math.max(32, s.level); s.xp = 0; s.energyMax = capEnergy(32); s.energy = s.energyMax; s.energyAt = this.now(); s.coins += 7000; return true; }); }
    reset() { this.state = fresh(this.now()); this.emit(); }
    import(data) { const clean = validate(data); this.state = clean; this.prepare(); this.emit(); }
  }
  return { Game, RuleError, fresh, validate, CHAINS, FLOORS, TASKS, THEMES, CONTEST, key, capEnergy, xpNeed, REGEN, VERSION, allKeys };
});
