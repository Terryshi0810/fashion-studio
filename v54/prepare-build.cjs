'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
function once(s,a,b){if(s.split(a).length!==2)throw Error('Replacement count: '+a);return s.replace(a,b);}
let build=read('make-v53.js').replaceAll('v53','v54').replaceAll('V53','V54').replaceAll('0.53','0.54').replaceAll('design/v54-appstore-benchmark.json','design/v54-workshop-plan.json');
build=once(build,'||localStorage.getItem("fashion.loop.mobile.v51")','||localStorage.getItem("fashion.loop.mobile.v53")||localStorage.getItem("fashion.loop.mobile.v52")||localStorage.getItem("fashion.loop.mobile.v51")');
build=build.replace('V51 retained.','V53/V52/V51 retained.');
write('make-v54.js',build);
let pack=read('pack-v53.py').replaceAll('v53','v54').replaceAll('V53','V54');
pack=once(pack,'4. V51 保留；V54 使用独立存档，首次从旧版本迁移，旧材料与衣橱保留，新工坊使用独立的订单和生产库存。','4. V53/V52/V51 保留；V54 使用独立存档，首次按 V53→V52→V51 迁移。已拥有的生产器、订单、材料与衣橱保留，新增锁格挤出的物品安全进入奖励箱。');
write('pack-v54.py',pack);
write('android-apk/build-apk-v54.ps1',read('android-apk/build-apk-v53.ps1').replaceAll('v53','v54').replaceAll('V53','V54').replace('--version-code 55 --version-name 0.53','--version-code 56 --version-name 0.54'));
console.log('Prepared independent V54 builder, offline packer and APK script.');
