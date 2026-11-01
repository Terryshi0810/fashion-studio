const fs = require('fs');

const root = __dirname;
const read = name => fs.readFileSync(`${root}/${name}`, 'utf8');
const write = (name, value) => fs.writeFileSync(`${root}/${name}`, value, 'utf8');

let html = read('fashion-studio-mobile-trial-v47.html');
html = html.replaceAll('fashion-studio-mobile-trial-v47-runtime.js', 'fashion-studio-mobile-trial-v48-runtime.js');
html = html.replaceAll('V0.47', 'V0.48');
write('fashion-studio-mobile-trial-v48.html', html);

let runtime = read('fashion-studio-mobile-trial-v47-runtime.js');
runtime = runtime.replaceAll('fashion-studio-mobile-trial-v47', 'fashion-studio-mobile-trial-v48');
runtime = runtime.replace(
  'const asset=n=>globalThis.LoopAssets?.[n]||"assets/"+n',
  'const asset=n=>globalThis.LoopAssets?.[n]||(location.pathname.startsWith("/android_asset/")?n:"assets/"+n)'
);
write('fashion-studio-mobile-trial-v48-runtime.js', runtime);

let build = read('android-apk/build-apk-v47.ps1');
build = build.replaceAll('v47', 'v48');
build = build.replaceAll('V47', 'V48');
build = build.replace('$work\\assets\\assets","$work\\compiled"', '$work\\assets","$work\\compiled"');
build = build.replace("(Join-Path $project 'assets\\*') (Join-Path $work 'assets\\assets')", "(Join-Path $project 'assets\\*') (Join-Path $work 'assets')");
build = build.replace('--version-code 49 --version-name 0.49', '--version-code 50 --version-name 0.50');
build = build.replace("Get-Item $apk | Select-Object FullName,Length,LastWriteTime", "\n$assetEntries = & $jar tf $apk\nif ($assetEntries -notcontains 'assets/scene.webp' -or $assetEntries -notcontains 'assets/item-00.webp') { throw 'APK asset layout check failed: expected assets/*' }\nGet-Item $apk | Select-Object FullName,Length,LastWriteTime");
write('android-apk/build-apk-v48.ps1', build);

console.log(JSON.stringify({
  html: 'fashion-studio-mobile-trial-v48.html',
  runtime: 'fashion-studio-mobile-trial-v48-runtime.js',
  build: 'android-apk/build-apk-v48.ps1',
  assetLayout: 'assets/*'
}, null, 2));
