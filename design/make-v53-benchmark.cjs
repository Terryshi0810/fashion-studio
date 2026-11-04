'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, data) => fs.writeFileSync(path.join(root, file), data, 'utf8');
const needs = (...rows) => rows.map(([chain, level, quantity = 1]) => ({
  itemId: `${chain}_${String(level).padStart(2, '0')}`,
  quantity,
}));

const plan = readJson('design/v52-fashion-merge-plan.json');
plan.version = 'V53-appstore-benchmark-1';
plan.status = 'implemented_independent_v53';
plan.date = '2026-11-04';
plan.title = '时尚街区：App Store 新手 1–10 级对照版订单驱动服装二合工坊';
plan.migration = {
  ...plan.migration,
  branch: 'V53-benchmark, keep V52 and V51 unchanged',
  saveKey: 'fashion.loop.mobile.v53',
  oldKey: 'fashion.loop.mobile.v52',
  preserveBackup: true,
};

// The first ten orders deliberately advance one player level at a time. This
// is a local acceptance route for the requested 1–10 range; it is not claimed
// to be the original game's hidden reward table.
plan.tutorial = [
  {
    id: 'intro_01', customer: '小悠', needs: needs(['top', 3]),
    text: '面试可以紧张，白T不能皱。',
    grant: [{ kind: 'energy', amount: 10 }],
    index: 1, minimumPlayerLevel: 1, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 15,
    producerPrerequisites: [], grantDeduplicationKey: 'tutorial_1',
  },
  {
    id: 'intro_02', customer: '阿澈', needs: needs(['top', 4]),
    text: '第一次见买手，我想穿得像有备而来。',
    grant: [{ kind: 'producer_part', family: 'tailoring', level: 3, amount: 2 }],
    index: 2, minimumPlayerLevel: 1, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 15,
    producerPrerequisites: [], grantDeduplicationKey: 'tutorial_2',
  },
  {
    id: 'intro_03', customer: '林夕', needs: needs(['pants', 3]),
    text: '老板让我气场两米，我先从裤子开始。',
    grant: [{ kind: 'energy', amount: 15 }],
    index: 3, minimumPlayerLevel: 1, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 45,
    producerPrerequisites: [{ id: 'tailoring', minLevel: 5 }],
    grantDeduplicationKey: 'tutorial_3',
  },
  {
    id: 'intro_04', customer: '小悠', needs: needs(['top', 3], ['pants', 3]),
    text: '上衣和裤子都齐了，勇气我自己搭。',
    grant: [{ kind: 'producer', family: 'styling', level: 4, amount: 1 }],
    index: 4, minimumPlayerLevel: 3, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 65,
    producerPrerequisites: [], grantDeduplicationKey: 'unlock_styling',
  },
  {
    id: 'intro_05', customer: '米娅', needs: needs(['hair', 3]),
    text: '开店可以熬夜，发型不能替我承认。',
    grant: [{ kind: 'energy', amount: 10 }],
    index: 5, minimumPlayerLevel: 4, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 90,
    producerPrerequisites: [{ id: 'styling', minLevel: 4 }],
    grantDeduplicationKey: 'tutorial_5',
  },
  {
    id: 'intro_06', customer: '林夕', needs: needs(['hair', 4], ['top', 4]),
    text: '今天见前搭档，状态必须像已经翻篇。',
    grant: [{ kind: 'producer_part', family: 'styling', level: 3, amount: 2 }],
    index: 6, minimumPlayerLevel: 5, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 120,
    producerPrerequisites: [{ id: 'styling', minLevel: 4 }],
    grantDeduplicationKey: 'tutorial_6',
  },
  {
    id: 'intro_07', customer: '阿澈', needs: needs(['hat', 3]),
    text: '买手说我没记忆点，这顶帽子应该有。',
    grant: [{ kind: 'energy', amount: 15 }],
    index: 7, minimumPlayerLevel: 6, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 150,
    producerPrerequisites: [{ id: 'styling', minLevel: 5 }],
    grantDeduplicationKey: 'tutorial_7',
  },
  {
    id: 'intro_08', customer: '小悠', needs: needs(['shoes', 3]),
    text: '走进新街区之前，先把脚下这一步走稳。',
    grant: [{ kind: 'producer_part', family: 'footwear', level: 3, amount: 2 }],
    index: 8, minimumPlayerLevel: 7, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 180,
    producerPrerequisites: [{ id: 'footwear', minLevel: 4 }],
    grantDeduplicationKey: 'unlock_footwear_parts',
  },
  {
    id: 'intro_09', customer: '买手许薇', needs: needs(['gloves', 3]),
    text: '细节决定买手会不会把订单翻到下一页。',
    grant: [{ kind: 'energy', amount: 20 }],
    index: 9, minimumPlayerLevel: 8, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'tutorial', xp: 220,
    producerPrerequisites: [{ id: 'footwear', minLevel: 5 }],
    grantDeduplicationKey: 'tutorial_9',
  },
  {
    id: 'intro_10', customer: '买手许薇',
    needs: needs(['bag', 3], ['shoes', 4], ['hat', 3]),
    text: '别给我讲品牌故事，让你的第一套街区造型自己说。',
    story: true,
    grant: [{ kind: 'chapter_flag', flag: 'first_collection', amount: 1 }],
    index: 10, minimumPlayerLevel: 9, autoGenerate: false,
    completion: 'all_items_atomic', rewardProfile: 'story', xp: 260,
    producerPrerequisites: [
      { id: 'leather', minLevel: 4 },
      { id: 'footwear', minLevel: 5 },
      { id: 'styling', minLevel: 5 },
    ],
    grantDeduplicationKey: 'tutorial_10',
  },
];

plan.growth = {
  ...plan.growth,
  tutorial: '十份固定委托对应新手 1–10 级，每份交付后进入下一阶段；数值为本分支验收配置，不冒充原作内部奖励。',
};
plan.orderRules = {
  ...plan.orderRules,
  benchmarkLevelRange: [1, 10],
  tutorialSequential: true,
};
plan.benchmark = {
  target: '浪漫餐厅 / Gossip Harbor 类订单驱动合成经营体验',
  primaryStore: 'Apple App Store（美国区公开版本）',
  primaryVersion: '4.11.0',
  alternateListing: { store: 'Apple App Store（中国区）', version: '3.98.0', note: '地区版本号不同，行为基准仍需同一地区实测。' },
  playerLevelRange: [1, 10],
  acceptanceMode: 'public-behavior-aligned-plus-local-playable-route',
  publicBehaviorChecks: [
    '生产器持续出料',
    '相同物品二合升级',
    '顾客订单直接消耗合成产物并发放经营奖励',
    '能量限制与生产恢复',
    '修复/经营推进与人物剧情联动',
  ],
  localRouteChecks: [
    '新档从设计师 1 级开始',
    '十份教学委托顺序推进到 10 级',
    '1–10 级内逐步开放裁缝、造型、制鞋、皮具四组生产器',
    '订单需求只引用已开放且可生产的图谱节点',
    '订单交付为原子结算，重复点击不会重复领奖',
  ],
  notPubliclyVerifiable: [
    '原作完整掉落概率与保底规则',
    '原作每级订单刷新表、隐藏奖励和精确经验曲线',
    '逐帧粒子、音效时长与内部冷却实现',
  ],
  verdict: '当前 V53 可按公开行为完成可玩闭环；内部数值和逐帧表现仍需用户提供同版本 1–10 级录屏或存档后逐项校准。',
};

write('design/v53-appstore-benchmark.json', JSON.stringify(plan, null, 2) + '\n');

const rows = [
  ['基准版本', '美国区 App Store 公开版本 4.11.0；中国区公开版本号单列记录为 3.98.0', '版本锚点已写入配置；地区差异需在同一地区验收'],
  ['新手范围', '玩家等级 1–10', 'V53 十份固定教学委托逐步推进至 10 级'],
  ['初始循环', '顾客需求 → 生产器出料 → 同款二合 → 交付', '已实现并纳入核心测试'],
  ['能量与恢复', '有能量限制，生产器持续恢复', '行为一致；精确上限/恢复秒数未从公开资料核实'],
  ['订单与经营', '顾客订单驱动经营推进与剧情', '已实现；V53 第 10 单作为买手剧情节点'],
  ['图谱与品类', '服装材料/成品分链管理', '14 条图谱、203 项资源归档完成'],
  ['掉落概率', '原作内部表未公开', 'V53 使用项目标定值，报告中明确标记为待原作实测'],
  ['逐帧手感', '公开页面无法证明逐帧一致', '已做触控与合成反馈检查；不能宣称像素级 1:1'],
];
let md = `# 时尚街区 V53：App Store 新手 1–10 级对照验收表\n\n`;
md += `基准日期：2026-11-04。V51、V52 保留；V53 使用独立存档键 \`fashion.loop.mobile.v53\`。\n\n`;
md += `用户确认以 App Store 最新版本、新手 1–10 级作为验收范围。由于公开商店页不提供完整内部数值，本表把公开可确认行为和本地可玩路线分开记录。\n\n`;
md += `| 项目 | 对照口径 | V53 状态 |\n|---|---|---|\n`;
for (const [a, b, c] of rows) md += `| ${a} | ${b} | ${c} |\n`;
md += `\n## 新手 1–10 级固定路线\n\n`;
md += `| 订单 | 解锁门槛 | 服装需求 | 交付后节点 |\n|---:|---:|---|---|\n`;
for (const t of plan.tutorial) {
  const need = t.needs.map(n => `${n.itemId} × ${n.quantity}`).join('、');
  const grant = t.grant.map(g => g.kind === 'producer_part' ? `${g.family} G${g.level}×${g.amount}` : g.kind === 'producer' ? `${g.family} G${g.level}` : g.kind === 'chapter_flag' ? `剧情标记 ${g.flag}` : `${g.kind} +${g.amount}`).join('；');
  md += `| ${t.index} | Lv${t.minimumPlayerLevel} | ${need} | ${grant || '进入下一份委托'} |\n`;
}
md += `\n## 验收结论\n\n`;
md += `- 已达到：订单驱动的服装二合工坊闭环、1–10 级可玩路线、移动端布局与资源归档。\n`;
md += `- 未声称：原作内部掉落概率、订单刷新表、精确奖励值和逐帧特效 1:1。\n`;
md += `- 需要进一步做原作数值校准时，请以同一 App Store 地区、同一版本、同一新手存档录屏逐项对照。\n`;
write('design/V53-AppStore新手1-10级对照验收表.md', md);

console.log('Generated V53 benchmark plan and acceptance table.');
