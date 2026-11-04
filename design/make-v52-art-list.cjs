'use strict';
// Produce art handoff documents from the approved design data; never edit the game or APK.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const plan = JSON.parse(fs.readFileSync(path.join(root, 'v52-fashion-merge-plan.json'), 'utf8'));
const demoChains = new Set(['top', 'pants', 'hair', 'hat']);
const demoProducers = new Set(['tailoring', 'styling']);
const tutorialMax = {};
for (const order of plan.tutorial) for (const need of order.needs) {
  const item = plan.chains.flatMap(c => c.items).find(i => i.id === need.itemId);
  assert(item, need.itemId);
  tutorialMax[item.chainId] = Math.max(tutorialMax[item.chainId] || 0, item.level);
}
const producerConcepts = {
  tailoring: ['针线工具', '裁缝工具组', '缝纫机核心', '基础缝纫台', '带裤装裁剪台的缝纫台', '双工位裁缝台', '电动设计裁缝台', '品牌定制裁缝台', '典藏工坊裁缝台'],
  styling: ['发梳工具', '造型工具组', '造型镜台核心', '基础假发造型台', '带帽架的造型台', '双镜造型台', '专业美发造型台', '秀场造型台', '典藏造型工作站'],
  footwear: ['制鞋工具', '鞋楦工具组', '制鞋机核心', '基础制鞋台', '带手套针织架的制鞋台', '皮革制鞋台', '专业礼鞋制作台', '秀场制鞋台', '典藏制鞋工作站'],
  leather: ['皮具工具', '皮革缝制工具组', '皮具机核心', '基础皮具台', '带胸针饰件盘的皮具台', '双工位皮具台', '品牌配饰工作台', '秀场皮具工作台', '典藏皮具工作站'],
  jewelry: ['珠宝钳', '珠宝工具组', '珠宝镶嵌台核心', '基础项链制作台', '带耳饰架的珠宝台', '双工位珠宝台', '宝石镶嵌珠宝台', '秀场珠宝制作台', '典藏珠宝工作站'],
  couture: ['高定针线', '高定裁剪工具组', '高定人台核心', '基础高定台', '立裁高定台', '带手持造型架的高定台', '刺绣高定台', '秀场高定工作台', '典藏高定工作站'],
  precision: ['精工镊子', '精工工具组', '精密加工台核心', '基础眼镜制作台', '带戒托夹具的精工台', '双工位精工台', '宝石精修工作台', '秀场精工工作台', '典藏精工工作站']
};
const itemAssets = plan.chains.flatMap(c => c.items.map(i => ({
  assetId: `merge_${i.id}`, itemId: i.id, category: c.name, chainId: c.id,
  level: i.level, name: i.name, stage: plan.stages.find(s => s.id === i.stageId).name,
  filename: `merge_${i.id}.png`, masterSize: [512, 512], deliverySize: [256, 256],
  transparent: true, demoRecommended: demoChains.has(c.id) && i.level <= 5,
  tutorialMinimum: i.level <= (tutorialMax[c.id] || 0), status: 'pending_art_review',
  wearableAsset: false
})));
const producerAssets = plan.producers.flatMap(p => plan.producerLevels.map(l => ({
  assetId: `generator_${p.id}_g${String(l.level).padStart(2, '0')}`,
  producerId: p.id, producerName: p.name, level: l.level,
  suggestedAppearance: producerConcepts[p.id][l.level - 1],
  function: l.level < 4 ? '升级部件，不生产' : l.level < p.secondaryAt ? '仅主链生产' : '主副链生产',
  filename: `generator_${p.id}_g${String(l.level).padStart(2, '0')}.png`,
  masterSize: [512, 512], deliverySize: [256, 256], transparent: true,
  demoRecommended: demoProducers.has(p.id) && l.level <= 5, status: 'to_author'
})));
assert.equal(plan.chains.length, 14);
assert.equal(itemAssets.length, 140);
assert.equal(producerAssets.length, 63);
assert.equal(itemAssets.filter(a => a.demoRecommended).length, 20);
assert.equal(itemAssets.filter(a => a.tutorialMinimum).length, 16);
assert.equal(producerAssets.filter(a => a.demoRecommended).length, 10);
assert.equal(new Set([...itemAssets, ...producerAssets].map(a => a.assetId)).size, 203);
for (const p of plan.producers) assert.equal(producerConcepts[p.id].length, 9);

const manifest = {
  title: '时尚街区 V52 美术资源制作清单', date: '2026-11-03', sourceVersion: plan.version,
  scope: 'art_planning_only_not_assets_or_game_integration',
  counts: { itemIcons: 140, producerIcons: 63, coreIcons: 203,
    demoItemIcons: 20, demoProducerIcons: 10, demoCoreIcons: 30,
    fixedTutorialOnlyItemMinimum: 16, fixedTutorialOnlyCoreMinimum: 26 },
  countBoundary: 'Counts cover merge items and producers only. UI, tools, rewards, portraits, blockers, effects and wearable layers are listed separately in the Markdown handoff.',
  sourceDataUnchanged: true, itemAssets, producerAssets
};
fs.writeFileSync(path.join(root, 'v52-art-resource-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

let md = `# 时尚街区 V52 美术资源制作清单

日期：2026-11-03。适用范围：十四条服装合成图谱、七类生产器、直接交付的工坊订单。当前为制作规划；尚未生成这些美术或接入游戏。本清单不修改V51和已有APK。

## 一、先确认制作量

| 资源 | 完整版范围 | 首轮可玩Demo范围 | 计数说明 |
| --- | --- | --- | --- |
| 合成物品图标 | 14条链，共140张 | 上衣、裤子、头发、帽子各L1–L5，共20张 | 每节点独立画面；棋盘、订单、背包、图谱共用同一图片 |
| 生产器及部件图标 | 7类各G1–G9，共63张 | 裁缝台、造型台各G1–G5，共10张 | G1–G3为部件；G4起可生产 |
| 基础图标小计 | **203张** | **30张** | 不包括下方任何界面、人物、工具、特效或穿戴资源 |
| 界面组件 | 1套，见第四节 | 先做核心棋盘、订单、选中信息、仓库与领奖组件 | 底板复用、按状态组合，不按每屏重画 |
| 棋盘阻挡物 | 建议3种外观 | 先做1种 | 用同一张图重复占格，不是每格画一张 |
| 工具图标 | 4种 | 可在第二批补齐 | 见第五节；体力礼盒若首轮展示则提前制作 |
| 通用奖励图标 | 6种基础语义 | 优先复用现有同义图标 | 金币、经验、体力、升级部件箱、章节礼盒、服装解锁 |
| 顾客头像 | 首轮5位；后续随剧情增加 | 小悠、阿澈、林夕、米娅、买手许薇各1张 | 先核对现有角色；不要求首轮画整套立绘 |
| 交互与特效 | 建议10组 | 其中7组核心反馈先做 | 可由程序或粒子实现；不能与静态图标张数相加 |
| 真正可穿戴服装 | 按奖励套装及独立部位另算 | 优先接入1套已有拆分套装 | **140张图标不等于140个可穿部件** |

仅跑固定前八单时，物品最低是上衣5张＋裤子4张＋头发4张＋帽子3张＝16张，加两台生产器G1–G5的10张，总计26张。**建议按30张制作**，才能覆盖第一章四条链L5以内的动态订单；26张不能当成完整首章的交付范围。首轮发布时，订单、可合成最高级及生产器升级必须与已发布美术范围一致，避免产生无图标节点。

## 二、十四条物品图谱：140张

下表等级与名称以现有V52配置为准。每个节点的精确名称、ID、建议文件名见文末附录A，不另行创造或合并节点。

| 品类 | 等级 | 数量 | 来源生产器 | 首轮Demo | 文件名范围 |
| --- | --- | ---: | --- | --- | --- |
`;
for (const c of plan.chains) {
  md += `| ${c.name} | L1–L${c.maxLevel} | ${c.maxLevel} | ${plan.producers.find(p => p.id === c.producerId).name} | ${demoChains.has(c.id) ? 'L1–L5，5张' : '后续批次'} | merge_${c.id}_01.png ～ merge_${c.id}_${String(c.maxLevel).padStart(2, '0')}.png |\n`;
}
md += `
表现方向：L1–L2突出材料和胚体，L3–L5日常成品，L6–L8工艺与材质升级，L9–L11秀场轮廓，L12以上高定典藏。短链到自身最高级结束。相邻等级通过轮廓、结构、材质共同区分，不能只换颜色或描边。

品类边界：饰品只放胸针、发夹、腰饰、肩饰等，耳坠、项链、戒指独立成链。小件如戒指、耳坠在图标里允许放大展示；同一链统一展示角度。图标中的头发可配无表情展示头模，不使用整张角色立绘冒充发型图标。

## 三、七类生产器：63张

| 生产器 | 图标数 | 主链／副链 | 美术辨识重点 |
| --- | ---: | --- | --- |
| 裁缝台 | 9 | 上衣／裤子 | 缝纫机、线轴、裤装裁剪台 |
| 造型台 | 9 | 头发／帽子 | 假发头模、造型镜、帽架 |
| 制鞋台 | 9 | 鞋子／手套 | 鞋楦、皮料、手套针织架 |
| 皮具配饰台 | 9 | 包包／饰品 | 包袋、皮革缝制、胸针饰件盘 |
| 珠宝台 | 9 | 项链／耳坠 | 珠宝钳、项链展示架、耳饰架 |
| 高定台 | 9 | 连衣裙／手持 | 立裁人台、礼服布料、手持造型架 |
| 精工台 | 9 | 眼镜／戒指 | 镜架、精密工具、戒托夹具 |

G1–G3的部件形态需明显不同于完整设备；G4是可工作的基础台；G5–G9逐步增加设备结构与材质。大部分生产器G5开放副链，**高定台在G6才开放手持**，对应等级应出现明确的新部件。等级数字、充能闪电、冷却遮罩、进度和倒计时由程序叠加，不把它们画进生产器图片。

附录B给出63项外观建议。这些是美术造型建议，不修改生产器配置名称或数值。

## 四、界面与棋盘资源

整体沿用柔和粉紫、奶油白、少量香槟金、圆润且有体积感的时尚换装手游风格。保留本项目人物与服装设计，制作可复用组件。

| 组件 | 范围与交付 | 优先级 | 备注 |
| --- | --- | --- | --- |
| 工坊背景 | 1张竖屏背景；先评估现有workbench-shine-background.png | 首轮 | 去掉妨碍识别棋盘的高对比装饰；不要烘焙按钮或文字 |
| 棋盘外框 | 1套可拉伸底板及内边距标注 | 首轮 | 支持7列×9行；63格由程序排布 |
| 开放格底 | 1套可重复格底 | 首轮 | 选中、合法合成、不可放置提示优先程序描边 |
| 阻挡物 | 建议封存纸箱、覆布材料箱、封条货箱共3种；先做1种 | 首轮／补充 | 共用格底；锁、清理条件和数字程序叠加 |
| 常规订单卡 | 1套底板、头像槽、1–3个需求槽、奖励区、交付按钮布局 | 首轮 | 短中长单共用组件，完成与未齐备用程序切状态 |
| 剧情目标卡 | 1套，与常规卡有明确区分 | 首轮 | 首轮用轻量目标卡；详细剧情面板后续扩充 |
| 选中物品信息条 | 1套图标区、名称区、来源／回收操作区 | 首轮 | 不把长说明堆到棋盘格中 |
| 生产器详情 | 共用弹窗底板＋产出预览、充能、升级信息布局 | 首轮 | 与物品详情共享底板；内容超高时内滚动 |
| 生产仓库 | 1套仓库格底、锁格、容量与召回布局 | 首轮 | 初始8格；物品仍用同一节点图标 |
| 领奖弹窗 | 1套奖励承载区、确认按钮、关闭布局 | 首轮 | 奖励名称、数量和图标由配置读取 |
| 通用按钮／弹窗 | 主次按钮底板、弹窗底板、页签底板各一套 | 首轮 | 现有合适组件可复用；明确九宫格拉伸区 |
| 功能小图标 | 图谱、生产仓库、回收、来源定位、刷新，共5种语义 | 首轮 | 有可用图标则复用；不要与物品图标混用 |
| 货币与导航 | 复用现有顶部货币、底部导航资产，重新标注安全区 | 首轮 | 顶部和底部有固定保留高度，不盖住棋盘末行 |
| 图谱发现 | 1套发现提示及图谱页布局；品类入口共用该链代表节点 | 补充 | 14个分类不额外重复画14件物品 |
| 工具及加速 | 1套工具栏、1×／2×／4×分段按钮布局 | 补充 | 数字、次数、禁用态由程序实现 |
| 剧情对话与选择 | 1套姓名／对白框、2–3项选项、选择结果提示布局 | 经营剧情批次 | 优先复用已有人物立绘和通用弹窗 |
| 店铺上新展示 | 1套新品展示卡／完成提示 | 经营剧情批次 | 场景继续使用已有商城资产，服装读取实际绑定资源 |

手机交付版式：1080×1920完整稿至少给出“普通操作、可交付订单、选中生产器、仓库弹窗”四种状态，并补390×844和360×640逻辑尺寸排版稿。顺序为顶部货币→横滑订单→棋盘→选中信息／工具→导航。用可变布局和字体重排适配，不把整屏1080截图直接拉伸。短屏压缩说明并保留末行可操作，不能依靠滚动才能看到主要棋盘和交付入口。弹窗内容多时明确内滚动范围、关闭按钮和底部操作区。

## 五、工具与奖励图标

| 类型 | 资源 | 数量 | 建议命名 | 处理 |
| --- | --- | ---: | --- | --- |
| 工具 | 拆分剪刀 | 1 | tool_scissors.png | 能看出拆分用途，区别服装生产零件 |
| 工具 | 灵感升级卡 | 1 | tool_upgrade_card.png | 卡片＋上升意向，区别经验 |
| 工具 | 充能沙漏 | 1 | tool_hourglass.png | 沙漏为主体，区别体力 |
| 工具 | 体力礼盒 | 1 | tool_energy_box.png | 有闪电标识的礼盒；初期若展示礼盒则提前制作 |
| 奖励 | 金币、经验、体力 | 3 | reward_coin.png / reward_xp.png / reward_energy.png | 优先复用现有同义图标 |
| 奖励 | 生产器部件箱 | 1 | reward_generator_box.png | 只表示未展开箱；指定G级部件直接使用对应生产器图 |
| 奖励 | 章节礼盒 | 1 | reward_chapter_box.png | 与体力礼盒区别轮廓 |
| 奖励 | 服装解锁标识 | 1 | reward_wardrobe_unlock.png | 只作角标；具体服装仍用准确服装图 |

共4种工具图标＋6种通用奖励语义；这些不计入203张。数量、倒计时和消耗数字程序叠加。已有资产可复用时，只补缺项，不重复绘制。

## 六、人物、剧情与真正换装部件

首轮顾客头像5张：小悠、阿澈、林夕、米娅、买手许薇。建议512×512母版、256×256透明交付，头部构图保持一致；先核对已有角色是否对应。后续重要角色可增加“普通、惊讶、质疑、得意”表情，首轮不将20张表情列为必做。剧情立绘以现有资源复用为先，新增角色按章节单独排期。

换装资源单独建单，建议先接1套现有已拆分造型作为章节奖励，再扩新套装。每个真实部位须与基础角色采用相同画布、姿势、缩放、锚点与透明区域，单独输出前后遮挡层；不能自动裁紧导致穿戴错位。

| 部位 | 需要的分层约束 |
| --- | --- |
| 头发 | 前发、后发；帽子兼容或隐藏规则 |
| 上衣／裤子／连衣裙 | 对齐躯干和四肢；明确裙装与上下装互斥；衣袖前后关系 |
| 鞋子／手套 | 对齐脚与手；必要时左右分层 |
| 帽子／饰品 | 对齐头顶、胸口、腰部或肩部，不能共用错误锚点 |
| 包包／手持 | 对齐手位及身体遮挡；必要时包带与包体分开 |
| 耳坠／项链／眼镜／戒指 | 耳、颈、鼻梁、手指固定定位；小件按角色显示尺寸检查 |

每件穿戴资源需要“节点ID→衣橱部件ID→图片→锚点→层级→冲突规则”的映射。当前图谱的wardrobeUnlockId尚未绑定，所以不能把140节点报价直接当作140件可穿服装报价。若要制作全部节点的穿戴版本，需另立专项资源清单。

## 七、交互与特效：建议10组

| 组 | 表现 | 交付方式 | 批次 |
| --- | --- | --- | --- |
| 1 | 点击按钮／生产器轻压回弹 | 程序缩放曲线，不改变布局位置 | 首轮 |
| 2 | 生产器出料，物品飞入最近空格 | 程序路径＋轻量拖尾／亮点 | 首轮 |
| 3 | 拖动跟手、可合成目标描边、非法落点返回 | 程序状态与轮廓，保留手指偏移 | 首轮 |
| 4 | 两件合并、升级弹出、等级闪光 | 共用1套小粒子／光晕，按阶段调色 | 首轮 |
| 5 | 交付物品飞向订单、订单完成收起 | 节点图标＋程序路径 | 首轮 |
| 6 | 金币／经验／体力奖励到账 | 共用奖励图标与粒子路径 | 首轮 |
| 7 | 生产器解锁与升级 | 共用揭幕／轮廓闪光，不重绘63套动画 | 首轮 |
| 8 | 清理障碍，露出新格 | 纸屑／尘点＋缩放淡出 | 补充 |
| 9 | 首次发现图谱 | 共用发现卡＋稀疏星光 | 补充 |
| 10 | 服装解锁／店铺上新完成 | 共用亮相光效；绑定真实服装资源 | 经营剧情批次 |

透明气泡副本建议程序绘制，复用物品图标，不制作140张带气泡副本。特效如需贴图，可交256或512透明纹理及可复用粒子说明；不预设一定需要逐帧序列。效果不得遮住需求数量、挡住下一次拖动或让整个棋盘位移。

## 八、现有素材复用候选

本轮已核对以下文件或目录存在；尚未逐图确认风格、透明边、等级映射和穿戴坐标，具体能减多少张需要审图后确定。

| 已有素材 | 可能复用 | 需要处理 |
| --- | --- | --- |
| assets/workbench-shine-background.png | 工坊背景 | 核对棋盘上方留白及手机裁切 |
| assets/work-bag-t1..6.png | 包包链部分节点 | 按新名称、轮廓和等级逐一匹配 |
| assets/work-necklace-t1..6.png | 项链链部分节点 | 同上，不直接按旧等级平移 |
| assets/work-earrings-t1..6.png | 耳坠链部分节点 | 同上，避免不同名称共用同一画面 |
| assets/work-hairclip-t1..6.png | 饰品中的发夹节点 | 仅与实际造型匹配的节点可用 |
| assets/work-lipstick-t1..6.png、work-perfume-t1..6.png | 既有商店／装饰用途 | 口红和香水不在新十四图谱内，不能充当服装材料 |
| D:/garden/fuzhuang/服装2 | 18张已拆分服装PNG及角色换装分层.psd | 包含粉毛披肩、金色层叠、西装、银裙；先核对角色对位及遮挡；可作穿戴奖励候选 |
| D:/garden/商场经营元素 | 商场空场景、解锁展柜1–8、箱子等 | 经营场景继续复用，合成改版无需全部重画 |
| 既有启动视频、BGM、点击音效、签到与货币资产 | 原有通用表现 | 继续保留；本次不因图谱改造要求重做 |

旧工作台共36张图标，**不能据此直接从203减36**。复用数量由新节点实际匹配结果决定；目前203是覆盖所有基础节点的需求数量，不是203张全部必须从零绘制。

## 九、命名、交付与验收

- 合成图标：merge_分类ID_两位等级.png，例如merge_top_03.png对应“基础白T”。生产器：generator_家族ID_g两位等级.png，例如generator_tailoring_g05.png。
- 图标建议512×512母版，交付256×256透明PNG，保留PSD等分层源文件。构图在同链内统一，主体保留安全边，不把文字、数量、等级、阴影数字画进图片。
- 合成图标在40px左右显示尺寸检查轮廓区分度；图标、订单文案、来源提示共用同一节点ID。品质优先通过造型表达，避免只依赖颜色。
- 背景以1080×1920设计；另给可裁切安全区。界面按组件切图，九宫格标明不可拉伸边角、内容内边距；文字用真实排版，不烘在整屏图内。
- 可穿资源采用基础角色完整画布，输出部位、层级、锚点、遮挡和冲突表；透明边缘无白边，跨套混穿检查露底、穿帮和头发遮挡。
- 交付文件夹建议：items/、generators/、ui/、tools/、portraits/、effects/、wardrobe/、source/；PNG按项目ID命名，另附资源对照表。
- 发布前逐项检查资源可读、文件名大小写一致、节点无缺图、APK离线可加载。UI检查四种交互状态及多种手机尺寸；本清单的结构核对不等于已完成手机运行验收。

## 十、制作顺序

1. **首轮可玩验证**：30张核心图标＋必要棋盘／订单组件＋1种阻挡物＋5位头像核对／补绘＋7组核心反馈；工具和通用货币优先复用。
2. **完整合成系统**：补齐其余173张核心图标，完善四工具、仓库、图谱、加速、障碍清理。实际发布可按生产器章节拆批，不用等待全画完。
3. **经营与剧情包装**：奖励套装的真实可穿层、剧情表情／立绘、店铺上新展示；原有商场场景沿用。

以下两份附录是精确基础图标清单；机器可读版本见v52-art-resource-manifest.json。状态为待制作／待复用审图，不代表资源已生成。

## 附录A：140张物品图标逐项清单

`;
for (const c of plan.chains) {
  md += `### ${c.name}（${c.maxLevel}张）\n\n| 节点ID | 等级 | 名称 | 文件名 | 制作批次 |\n| --- | --- | --- | --- | --- |\n`;
  for (const a of itemAssets.filter(a => a.chainId === c.id)) md += `| ${a.itemId} | L${a.level} | ${a.name} | ${a.filename} | ${a.demoRecommended ? '首轮Demo' : '后续章节'} |\n`;
  md += '\n';
}
md += '## 附录B：63张生产器／部件图标逐项清单\n\n造型名称为本清单的美术建议；程序以生产器ID与G等级识别。\n\n';
for (const p of plan.producers) {
  md += `### ${p.name}（9张）\n\n| 等级 | 外观建议 | 功能阶段 | 文件名 | 制作批次 |\n| --- | --- | --- | --- | --- |\n`;
  for (const a of producerAssets.filter(a => a.producerId === p.id)) md += `| G${a.level} | ${a.suggestedAppearance} | ${a.function} | ${a.filename} | ${a.demoRecommended ? '首轮Demo' : '后续章节'} |\n`;
  md += '\n';
}
fs.writeFileSync(path.join(root, 'V52-美术资源制作清单.md'), md, 'utf8');
console.log(JSON.stringify({result:'art_handoff_generated',counts:manifest.counts,sourcePlanUnchanged:true,gameUnchanged:true},null,2));
