'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
const core=read('v51-core-results.json'),mobile=read('v51-apk-mobile-results.json'),reg=read('v51-results.json');
for(const r of [core,mobile,reg])assert.equal(r.pass,true,'Every final suite must pass before delivery');
assert.equal(core.checks.length,16);assert.equal(mobile.checks.length,8);assert.ok(reg.checks.length>=14);
const apk='FashionStudio-V51-1080x1920.apk',zip='FashionStudio-V51-MobileWeb.zip';
const size=f=>(fs.statSync(path.join(root,'artifacts',f)).size/1024/1024).toFixed(2),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'artifacts',f))).digest('hex');
const total=core.checks.length+mobile.checks.length+reg.checks.length;
const text=`# 时尚街区 V51 工作台改版与自测报告

验收日期：2026-11-03。保留 V50 原文件、安装包与旧存档键，V51 单独输出。

## 实现结果

- 女装样衣、鞋履样衣、配饰样衣统一改为女装材料、鞋履材料、配饰材料；三个材料箱放入6×6棋盘，移除棋盘外原有三按钮。
- 点击材料箱消耗体力，在最近空格生成材料；同系列同阶的两件材料拖动合成升阶，最高6阶。支持点选合成、不同材料拖动换位、材料箱换位。
- 新增出料、升阶和点击反馈。锁定、体力不足、满盘、最高阶、回收均有反馈；失败操作不扣体力、不丢材料。
- 目标、里程碑、棋盘与工具采用正常布局；根据顶部货币栏、底部导航和可用高度计算正方形棋盘。生产重绘时保留棋盘尺寸，消除瞬间跳动。
- 在目标手机尺寸中，棋盘内三类材料箱与下方工具均位于第一屏。1080×1920的导航与设计画布采用一致缩放。
- 研发、制衣订单、草图、交付、永久衣橱和商场业务仍使用真实原有数据；当前订单决定材料生产阶数上限。
- 首轮合成奖励仍为3、6、10次，之后每10次循环奖励；显示下一轮进度和累计次数，目标数量不显示溢出分子。

## 存档处理

V51 保存到「fashion.loop.mobile.v51」。首次没有V51进度时读取「fashion.loop.mobile.v6」，不改写旧键。旧版堆叠材料逐件保留，33个材料位之外进入暂存区，可逐件取出或直接用于研发。

两件升阶属于新规则，经济效率与旧版不同，独立存档用于避免回退时混用规则。满盘旧存档测试324件材料全部保留，其中33件留在棋盘、291件进入暂存。

## 自测结果

三套最终测试合计 **${total}组通过**：核心逻辑${core.checks.length}组，最终签名APK解包文件的触控流程${mobile.checks.length}组，启动/签到/资源与九页面回归${reg.checks.length}组。

| 范围 | 实际检查结果 |
| --- | --- |
| 320×568、360×640、390×844、430×932、1080×1920 | 正方形棋盘、36格、3材料箱、工具与导航无重叠；名称不出格；无横向溢出；不用滚动找生产器 |
| 真实触控事件模拟 | 点击只生产一次，拖动只合成一次；材料箱拖动不扣体力；拖出棋盘不丢失材料；点选合成可用 |
| 关键玩法闭环 | 合成T2材料→研发版型→进入订单→选款→粉色配色→辅助草图→挑选成衣→交付；成衣加入永久衣橱与经营业务 |
| 边界 | 满盘、体力不足、锁定反馈、交换、最高阶、排序、回收确认、暂存提取、重开持久化通过 |
| 旧存档 | 满盘拆分数量守恒、迁移幂等、直接消耗暂存研发、不覆盖V50存档通过 |
| 核心稳定性 | 240次混合生产、移动、整理操作后逐次校验数据与材料箱保留格 |
| 启动与登录 | Logo及圆形加载、延迟脚本/样式、关键文件缺失恢复、视频读取通过 |
| 签到与页面资源 | 签到关闭、补签、跨月、重复奖励保护；经营、工作台、订单、背包、穿搭日记、个人信息、社区、家装、排行榜图片与背景加载通过 |
| 最终APK | v1/v2/v3签名通过；187个内置资源大小与SHA-256逐一一致；182张图片解码通过；ZIP路径规范化；解包后的页面再次完成五尺寸触控流程 |

**测试方式与限制：以上为Chromium触控模拟、HTTP/离线文件运行、Android编译签名和最终APK解包回归。未进行Android真机安装测试，设备GPU/WebView差异、系统权限及真机音频行为尚未验收。** 九页面回归主要覆盖资源与页面入口，完整触控业务闭环覆盖工作台、研发和订单，不代表每个周边系统所有玩法组合均已穷尽。

## 交付

- APK：${apk}，${size(apk)} MiB；versionName 0.51，versionCode 53。
- 完整离线网页版：${zip}，${size(zip)} MiB；须完整解压，保持 assets、HTML、CSS、JS 相对位置。
- 独立网页入口：D:/garden/fashion-studio/fashion-studio-mobile-trial-v51.html。
- 测试明细：tests/v51-core-results.json、tests/v51-mobile-results.json、tests/v51-apk-mobile-results.json、tests/v51-results.json。
- 最终包触控截图：tests/v51-apk-screenshots/；九页面及启动截图：tests/v51-screenshots/。
- 实施规范：design/V51-棋盘生产与手机适配规范.md；打包继续遵循design/V50-资源与弹窗验收规范.md。

APK SHA-256：${sha(apk)}

ZIP SHA-256：${sha(zip)}
`;
fs.writeFileSync(path.join(root,'artifacts/V51-工作台改版与自测报告.md'),text,'utf8');
console.log('Wrote verified V51 report:',total,'checks passed.');
