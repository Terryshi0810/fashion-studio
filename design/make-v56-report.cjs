'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const core=read('tests/v56-core-results.json'),ui=read('tests/v56-ui-results.json'),pack=read('tests/v56-package-results.json'),manifest=read('fashion-studio-mobile-trial-v56-manifest.json');
assert.ok(core.pass&&ui.pass&&pack.pass);
const previous={'artifacts/FashionStudio-V55-1080x1920.apk':'4d4665f481816d45b15b4fd2fbce538347ec89ad552f24293be02c63583d83dc','artifacts/FashionStudio-V55-MobileWeb.zip':'96e638a65a5fc54b18c375222d32b7df9688c4505fba403f575b9835a64185f3'};
for(const [file,digest] of Object.entries(previous))assert.equal(hash(file),digest,'V55 rollback changed');
for(const n of [1,2,3,6,7,8])assert.equal(hash('assets/workshop-NPC/npc ('+n+').png'),hash('assets/workshop-npc/npc-'+String(n).padStart(2,'0')+'.png'));
const files=['artifacts/FashionStudio-V56-1080x1920.apk','artifacts/FashionStudio-V56-MobileWeb.zip'],hashes=Object.fromEntries(files.map(f=>[f,hash(f)]));
const result={pass:true,coreChecks:core.checks.length,uiChecks:ui.checks.length,packageChecks:pack.checks.length,assetCount:manifest.assets.length,portraitCount:6,originalPortraitsUnchanged:true,v55RollbackUnchanged:true,deviceInstallTest:false,hashes};
fs.writeFileSync(path.join(root,'tests/v56-release-results.json'),JSON.stringify(result,null,2));
const md=`# V56 工坊订单 NPC 展示与验收

日期：2026-11-04。根据用户提供的订单参考图，把6张透明人物头像放入工坊订单；沿用V55奶油白、蜜桃粉与浅紫视觉。

## 展示设计

- 人物半身头像位于需求托盘上方，姓名与订单类型占独立一行，服装与交付按钮均不覆盖脸部。
- 所需服装齐备时显示绿色勾选与数量，整单齐备时显示金色交付按钮；制作中保持粉色。
- 顾客详情页同时使用人物头像与需求托盘，长内容保持正常纵向滚动。
- 手机矮屏将人物区域从66px收紧到44px，棋盘根据剩余高度重新计算，底部图谱、仓库、补给、上新操作保留在首屏。
- 顾客姓名与头像固定映射，普通订单加入顾言、陆承，使六张资源均可通过正常订单出现。未修改出料概率、奖励、解锁门槛、合成图谱及订单材料预算。

## 资源映射

| 用户图片 | 运行资源 | 顾客 |
|---|---|---|
| npc (1).png | workshop-npc/npc-01.png | 米娅、买手许薇 |
| npc (2).png | workshop-npc/npc-02.png | 小悠 |
| npc (3).png | workshop-npc/npc-03.png | 林夕 |
| npc (6).png | workshop-npc/npc-06.png | 顾言 |
| npc (7).png | workshop-npc/npc-07.png | 阿澈 |
| npc (8).png | workshop-npc/npc-08.png | 陆承 |

现有剧情中米娅与许薇均已使用，为保留订单姓名，两者暂共用1号人物图。6张原图均不改动，运行资源只是无空格文件名副本，SHA256逐一相同；其余未指定的NPC图片未接入。

## 回归检查

- ${core.checks.length}项核心检查通过：六张头像均可出现在正常订单中；生产、二合、交付、存档、解锁与新手1–10路线仍可运行。
- ${ui.checks.length}项界面/触控检查通过：320×568、360×640、360×780、390×844、430×932、1080×1920；头像面部无遮挡、姓名与需求分区、无横向溢出、底部操作同屏。
- 320px与390px下验证三件需求完整显示、绿色齐备标记、交付后奖励到账和新订单替换；六位人物重复渲染保持一致。
- V55→V56迁移保留订单、教学进度、生产器及旧存档键。V55安装包与试玩ZIP校验未发生改变。
- 修复触摸生产器后，随后的合成click落到新弹窗关闭按钮而误关闭的问题；仅消费同一次开窗手势产生的click，下一次手指按下后立即恢复交互。
- 签名APK的${manifest.assets.length}项资源逐一核对大小与SHA256，含6张NPC；v1/v2/v3签名验证通过。
- ${pack.checks.length}组最终包检查通过：390×844、430×932的APK解包页面启动、人物加载与布局；每组连续5次触摸开关弹窗。
- 七个功能入口无脚本报错或图片缺失。本轮未进行实体安卓设备安装，触控证据来自Chromium手机模拟与CDP事件。

## 交付

- [安卓APK](../artifacts/FashionStudio-V56-1080x1920.apk)
- [完整网页试玩包](../artifacts/FashionStudio-V56-MobileWeb.zip)
- [本地试玩](../fashion-studio-mobile-trial-v56.html)
- [390×844界面](../tests/v56-screenshots/390x844-work.png)
- [1080×1920界面](../tests/v56-screenshots/1080x1920-work.png)
- [三件需求与男性顾客](../tests/v56-screenshots/390-npc-ready.png)
- [参考图归档](references/v56-order-npc-reference.png)

## 文件校验

${files.map(f=>'- '+path.basename(f)+'：\x60'+hashes[f]+'\x60').join('\n')}
`;
fs.writeFileSync(path.join(root,'design/V56-工坊订单NPC展示与验收.md'),md);console.log(JSON.stringify(result,null,2));
