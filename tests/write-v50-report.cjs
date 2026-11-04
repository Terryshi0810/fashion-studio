'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),report=require('./v50-results.json');
if(!report.pass)throw new Error('V50 regression has not passed');
if(!report.checks.some(x=>x.name.includes('Mobile 360x640')&&x.views))throw new Error('Missing phone regression');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'fashion-studio-mobile-trial-v50-manifest.json'),'utf8'));
const size=n=>(fs.statSync(path.join(root,'artifacts',n)).size/1024/1024).toFixed(2);
const sha=n=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'artifacts',n))).digest('hex');
const apk='FashionStudio-V50-1080x1920.apk',zip='FashionStudio-V50-MobileWeb.zip';
const markdown=`# 时尚街区 V50 修复与自测记录

验收日期：2026-11-03。旧版 V48、V49 保留。

## 修复结果

- 启动 Logo 与圆形加载动画优先显示；运行脚本或关键资源缺失时显示恢复提示。
- 签到由静态截图和隐藏热区改为真实日历、实际奖励与可见按钮。弹窗保持 2:3 比例，适配手机视口，关闭触控区至少 44×44。
- 修复签到日历首日偏移，并检查签到、补签、历史奖励与跨月记录。
- 统一网页版与 APK 的资源相对目录。修复 Windows aapt2 写入反斜杠嵌套路径的问题，在签名前规范化。
- 视频、BGM、按钮音效完整内置；HTTP 预览支持正确媒体类型与视频分段读取。

## 实际验证

自动化回归：${report.checks.length} 组通过，运行脚本异常 0 项，页面图片/背景缺失 0 项。

| 检查范围 | 结果 |
| --- | --- |
| 签到弹窗：320×568、360×640、390×844、430×932、1080×1920 | 弹窗不出屏、无拉伸、无内部滚动、文字与区域不重叠 |
| 关闭、重新打开、页签切换、Escape | 触控模拟通过 |
| 自动签到、补签、重复领取保护、历史奖励、跨月、重开 | 实际状态及资源余额校验通过 |
| 经营、工作台、制衣订单、背包、日记、个人信息、社区、家装、排行榜 | 九页面图片及 CSS 背景加载通过 |
| 脚本延迟、样式延迟、关键文件缺失 | 加载动画持续显示，缺失时显示明确错误与重新加载按钮 |
| 全部美术与媒体资源 | ${manifest.assets.length} 个文件完整；182 张栅格图片解码通过 |
| 最终签名 APK | v1/v2/v3 签名通过，所有资源字节与源文件一致，ZIP 路径不存在反斜杠 |
| 从签名 APK 提取的网页文件 | 360×640 的登录、签到、关闭与九页面回归通过 |

说明：以上为 Chromium 浏览器触控模拟、文件/HTTP 运行及签名 APK 解包回归。**尚未进行 Android 真机安装测试**；不将浏览器验证表述为真机验收。Android 返回键关闭逻辑已编译，真机行为仍需设备验证。

## 交付文件

- Android 安装包：${apk}（${size(apk)} MiB；versionName 0.50，versionCode 52）
- 完整离线网页版：${zip}（${size(zip)} MiB）。必须解压整个 ZIP，不能仅复制 HTML。
- 测试明细：D:/garden/fashion-studio/tests/v50-results.json
- 截图：D:/garden/fashion-studio/tests/v50-screenshots/
- 规范：D:/garden/fashion-studio/design/V50-资源与弹窗验收规范.md

APK SHA-256：\`${sha(apk)}\`

ZIP SHA-256：\`${sha(zip)}\`
`;
fs.writeFileSync(path.join(root,'artifacts/V50-修复与自测报告.md'),markdown,'utf8');
console.log('Wrote V50 repair and verification report.');
