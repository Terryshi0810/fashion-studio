'use strict';
// Prompt preparation only. No image API calls, asset replacement or game changes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'v52-art-resource-manifest.json'), 'utf8'));
const outputDir = path.join(__dirname, 'v52-icon-production');
fs.mkdirSync(outputDir, { recursive: true });
const references = [
  { role:'style_reference', path:'D:/garden/fashion-studio/assets/work-bag-t3.png', purpose:'柔和描边、淡紫皮革、金属高光；不复制白底、卡框或文字' },
  { role:'style_reference', path:'D:/garden/fashion-studio/assets/work-necklace-t4.png', purpose:'粉色宝石、香槟金与精致但简明的体积表现' },
  { role:'style_reference', path:'D:/garden/fashion-studio/assets/work-hairclip-t5.png', purpose:'淡蓝淡紫层次和圆润高光；低阶物品减少装饰' },
  { role:'style_reference', path:'D:/garden/fashion-studio/assets/workbench-shine-background.png', purpose:'游戏工坊整体色调；不复制场景、文字、按钮或格子' }
];
const shared = `Use case: stylized-concept
Asset type: an individual production-ready fashion merge-game inventory icon for 时尚街区.
Style references: the existing bag, necklace, hairclip and workbench images are visual style references only, not edit targets. Match their soft hand-painted 2.5D volume, clean warm rose-brown or muted lavender contour, restrained creamy highlights, rounded details, and friendly fashion-game finish. Keep useful object details legible at a 40px display size.
Palette: blush pink, muted lilac, cream and occasional champagne-gold accents, while preserving the subject's actual material colors. White cotton stays white and denim stays blue. Early-tier raw materials and daily clothing remain simple; do not cover everything in bows, gemstones or gold trim.
Composition: one complete, centered object or one coherent component group, square canvas, consistent soft upper-left lighting. Keep the silhouette inside approximately the central 76% of the canvas, with clear safe margins. Use a stable visual center across each chain. Clothing is presented without a human body. A simple faceless wig display head is permitted only for wig items that require it.
Background: genuinely transparent outside the object; preserve soft alpha edges. No painted checkerboard, solid backdrop, inventory tile, frame, label, letters, numbers, watermark, UI, ground plane, scenery or extra props. Shadows may be subtle and object-local, never a rectangular panel. Never crop straps, hair tips or tool handles.
Deliverable specification: one standalone raster asset. Preserve the original generated image; export a 512x512 RGBA master and a 256x256 RGBA delivery PNG using the exact resource filename. No text or level badges baked into the image.`;
const subjects = {
  hair_01:'A small neatly tied bundle of chestnut hair fibers, clearly loose hair material rather than a complete hairstyle. A simple narrow blush binding holds the bundle; no head or face.',
  hair_02:'An unfinished wig base: a small neutral mesh cap with short sparse chestnut fibers being attached. It must look visibly incomplete and clearly differ from both a loose hair bundle and a finished bob.',
  hair_03:'A finished chestnut chin-length short bob with clean rounded ends and a simple side part. Show the wig on a minimal matte faceless cream display head; no neck jewelry, costume or expression.',
  hair_04:'A finished smooth chestnut shoulder-length hairstyle with an open forehead and gently inward-curved ends. Use the same minimal faceless wig display head and view as the short-bob icon; the longer silhouette must be obvious.',
  hair_05:'A finished chestnut medium-length wig with a clearly visible airy, separated fringe across the forehead and softly curved side locks. Same faceless display head and view; the light bangs distinguish it from the open-forehead level-4 hairstyle.',
  top_01:'One compact roll of ivory cotton cloth with a visible spiral fabric edge and a short folded tail. It is raw cotton material, no garment, tools or letters.',
  top_02:'A coherent compact group of ivory bodice and short-sleeve fabric cut pieces, visibly not sewn together, with a few restrained stitch-guide dashes made as seams rather than text.',
  top_03:'A simple pure-white short-sleeve crew-neck cotton T-shirt, full garment visible with gentle dimensional folds. Absolutely no graphic, logo, trim, bow or jewelry. No body, hanger or mannequin.',
  top_04:'A white cotton short-sleeve shirt with clear muted coral horizontal stripes and a crew neckline. Same garment view and scale as the basic white T-shirt. No letters, jewelry, bows, hanger or human body.',
  top_05:'A pale blush chiffon button-front blouse with a small collar, airy long sleeves and subtle soft folds. A light translucent fabric impression but a clearly visible silhouette. No skirt, body, necklace or decorative gem.',
  pants_01:'A small roll of blue denim fabric with visible blue outer weave and a lighter reverse edge; raw material rather than a finished pair of trousers. No scissors or text.',
  pants_02:'A compact group of blue denim trouser-pattern pieces: two recognizable leg panels and a waistband strip, not sewn together. Clear pieces and simple seams, no written pattern labels.',
  pants_03:'A finished pair of casual mid-blue denim shorts with two visible pockets, simple rolled hems and a waistband. Full isolated garment, no body, belt accessory or shoes.',
  pants_04:'A finished pair of straight-leg dark navy trousers with a simple waistband, pockets and clean long leg shape. Full isolated garment and no body or shoes; distinctly straight rather than wide leg.',
  pants_05:'A finished pair of indigo high-waisted wide-leg jeans with clear broad legs and a few visible denim seams. Full isolated garment. Distinguish the wide silhouette from the previous straight-leg trousers.',
  hat_01:'A coherent small group of soft pale-lilac fabric pieces intended for a hat, including a curved crown cut piece and a small band. Raw material only, not a finished hat; no tools or text.',
  hat_02:'An unfinished cream fabric hat base with a simple rounded dome, a visible raw seam and an incomplete brim. Clearly a hat blank, with no ribbon, flower, logo or jewelry.',
  hat_03:'A finished soft blush-pink rib-knit beanie with a folded cuff and a clean rounded crown. Clear knit volume without dense texture. No head, face, logo, fur or extra ornaments.',
  hat_04:'A finished muted-lilac beret with a soft slanted crown, short top stem and a narrow fitted band. Show a slight elevated front angle, no head, face, logo or large bow.',
  hat_05:'A finished cream formal hat with a medium brim and a clearly visible elegant blush ribbon tied around the crown. Entire brim visible; no face, mannequin, flowers or gems.',
  generator_tailoring_g01:'The level-1 tailoring upgrade component: one small ivory-and-blush thread spool paired with a clearly recognizable sewing needle. It is a compact component icon, not a complete machine.',
  generator_tailoring_g02:'The level-2 tailoring component set: a coherent group of small pink-handled sewing scissors, a thread spool and a rolled measuring tape. Keep only these functional items. No table or complete machine.',
  generator_tailoring_g03:'The level-3 sewing-machine core: a compact blush-and-cream mechanical sewing-machine body assembly with a visible incomplete side, ready for installation. No complete worktable; distinguish its component state from the functional level-4 device.',
  generator_tailoring_g04:'The functional level-4 tailoring producer: a compact cream-and-blush sewing machine on a small light-wood work surface, with a clearly visible needle arm and thread spool. A single coherent device; gentle front three-quarter view. No numbers, text, badges or clothing character.',
  generator_tailoring_g05:'The functional level-5 tailoring producer: keep the exact same cream-and-blush sewing-machine design and view as level 4, adding a compact attached trouser-cutting side board with a recognizable blue trouser pattern. Slightly upgraded silhouette; all parts fit within the same icon safe area.',
  generator_styling_g01:'The level-1 styling upgrade component: one softly rounded blush-and-cream hairbrush with clearly readable bristles. No mirror, head or complete table.',
  generator_styling_g02:'The level-2 styling component set: a coherent small group comprising a blush hairbrush, a lilac comb and two simple hair clips. No head, mirror, text or table.',
  generator_styling_g03:'The level-3 styling-table core: a small oval cream-and-champagne-gold mirror frame mounted on an incomplete short support with a visible connector. No full worktable; mirror reflection is only a pale soft gradient without a scene or face.',
  generator_styling_g04:'The functional level-4 styling producer: a compact cream-and-blush dressing table with an oval mirror and one faceless cream wig stand showing a simple chestnut wig, plus a small brush. Gentle front three-quarter view. No human character, text, level badge or scene.',
  generator_styling_g05:'The functional level-5 styling producer: keep the same compact oval-mirror styling table and wig stand as level 4, adding a clear attached side hat stand holding a simple lilac hat. Show the second output family through this structural addition. Same view, lighting, safe margins and relative table design.'
};
const jobs = [
  ...source.itemAssets.filter(a => a.demoRecommended).map(a => ({...a, promptKey:a.itemId, group:'items'})),
  ...source.producerAssets.filter(a => a.demoRecommended).map(a => ({...a, promptKey:a.assetId, name:a.suggestedAppearance, group:'generators'}))
].map(a => {
  assert(subjects[a.promptKey], `Missing subject: ${a.promptKey}`);
  return {
    assetId:a.assetId, name:a.name, group:a.group, level:a.level, filename:a.filename,
    status:'prompt_prepared_image_not_generated',
    output:{master:`masters/${a.group}/${a.filename}`,delivery:`delivery/${a.group}/${a.filename}`},
    references, prompt:`${shared}\nSubject: ${subjects[a.promptKey]}\nResource identity (metadata only, never render as text): ${a.name}, ${a.assetId}.`
  };
});
assert.equal(jobs.length,30);
assert.equal(new Set(jobs.map(j=>j.assetId)).size,30);
const sampleIds=['merge_top_03','merge_pants_05','merge_hair_03','generator_tailoring_g04'];
assert(sampleIds.every(id=>jobs.some(j=>j.assetId===id)));
fs.writeFileSync(path.join(outputDir,'first-30-icon-prompts.json'),JSON.stringify({
  date:'2026-11-03',scope:'首轮Demo：20物品＋10生产器及部件',
  imageGenerationStatus:'not_started_no_builtin_image_tool',sampleIds,jobs
},null,2)+'\n','utf8');
let md=`# V52 首轮30张图标制作规格与提示词\n\n当前状态：已核对现有美术并准备提示词，**尚未生成新图片**。当前会话没有内置图像生成工具，等待确认是否采用图片生成API；本文件不会调用API、修改游戏或覆盖现有素材。\n\n## 风格锁定\n\n粉紫、奶油白、香槟金为整体方向；柔和玫瑰棕／淡紫描边、手绘2.5D体积、上左方柔光、圆润高光。白T保持纯白、丹宁保持牛仔蓝，避免所有低阶物品都加宝石或染粉。现有工作台图标中的白底、卡框、文字均不复制。\n\n参考：work-bag-t3.png、work-necklace-t4.png、work-hairclip-t5.png及workbench-shine-background.png。它们是风格参考，不是待覆盖的原文件。\n\n## 交付与验收\n\n- 每个资源独立成图；保留原始生成文件，交付512×512 RGBA母版及256×256 RGBA透明PNG。\n- 同链统一视觉中心、视角、光向和落地位置；主体约占画布中央76%，给发梢、工具、帽檐保留安全边。\n- 不含文字、等级、数量、边框、UI或背景场景；透明区必须是真实alpha，不能绘制棋盘格冒充透明。\n- 40px缩略图检查轮廓和相邻等级区别；分别在浅色、深色底上检查白边、透明边与裁切。\n- 512母版、256交付与资源ID一致；只使用表格内的精确文件名。\n- 首批是合成图标，不是角色可穿戴部件。本批不改V51资源、存档和APK。\n\n## 建议先看的4张样图\n\n纯白T（布料）、阔腿牛仔裤（版型）、清爽短发（发型）、基础缝纫台（设备）可覆盖首轮主要风格差异。样图尚未生成；对应ID已经标在提示词JSON中。\n\n## 首轮精确任务\n\n| 资源ID | 名称 | 文件名 |\n| --- | --- | --- |\n`;
for(const j of jobs)md+=`| ${j.assetId} | ${j.name} | ${j.filename} |\n`;
md+='\n## 共用生成提示词\n\n```text\n'+shared+'\n```\n\n## 各资源主题提示词\n\n';
for(const j of jobs)md+=`### ${j.assetId}：${j.name}\n\n${subjects[j.promptKey || (j.assetId.startsWith('merge_')?j.assetId.slice(6):j.assetId)]}\n\n`;
fs.writeFileSync(path.join(outputDir,'首轮30张图标制作规格.md'),md,'utf8');
console.log(JSON.stringify({prepared:jobs.length,generated:0,referenceCount:references.length,outputDir},null,2));
