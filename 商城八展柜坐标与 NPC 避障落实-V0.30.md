# 商城八展柜坐标与 NPC 避障落实说明

> 版本：V0.30

## 已完成

- 使用用户提供的《商城夹层背景图》作为商城底图；
- 接入解锁顺序 1～8 的 8 个展柜资源；
- 通过独立坐标、比例和层级参数叠加展柜，不把展柜烘焙进底图；
- 展柜 2 的棋盘格背景已处理为透明；
- 未解锁箱子只显示当前下一阶段占位；展台解锁后对应箱子从 DOM 中删除，剩余箱子保持后层；
- 商城解锁容量调整为 4→8→12→16→22→30→36→43→50；
- NPC 路线改为经过底部通道、中央通道和右侧通道，避开已解锁展柜；
- NPC 落点和员工岗位点同步调整；
- 展柜上落点仍支持短按和拖动场景。

## 资源文件

```text
D:\garden\fashion-studio\mobile-loop\assets\mall-floor-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-1-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-2-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-3-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-4-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-5-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-6-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-7-v30.webp
D:\garden\fashion-studio\mobile-loop\assets\mall-unlock-8-v30.webp
```

## 验收

- 核心与商城测试：65项通过；
- V0.30 浏览器测试：12项通过；
- 8 个展柜：通过；
- NPC 避障路线：通过；
- 展柜拖动：通过；
- 工作台 320～1080 视口：通过；
- 页面脚本错误：0；
- 尚未进行实体手机硬件测试。
