"""Build a complete offline web trial; audit every file inside the signed APK."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
files = ['fashion-studio-mobile-trial-v52.html', 'fashion-studio-mobile-trial-v52.css',
         'fashion-studio-mobile-trial-v52-runtime.js', 'fashion-studio-mobile-trial-v52-manifest.json']
readme = '''时尚街区 V52 完整试玩包

1. 将整个压缩包解压到同一文件夹，保持 assets 文件夹、HTML、CSS 和 JS 的相对位置。
2. 双击“fashion-studio-mobile-trial-v52.html”试玩。不要只复制 HTML 到手机。
3. 安卓演示请安装单独提供的 FashionStudio-V52-1080x1920.apk，资源已全部内置，可离线运行。
4. V51 保留；V52 使用独立存档，首次从旧版本迁移，旧材料与衣橱保留，新工坊使用独立的订单和生产库存。
5. 浏览器通常需要首次点击才允许播放声音；点击开始后游戏 BGM 正常接管。
'''
archive = root / 'artifacts/FashionStudio-V52-MobileWeb.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for file in files:
        z.write(root / file, file)
    runtime_manifest = json.loads((root / files[-1]).read_text(encoding='utf-8'))
    for entry in runtime_manifest['assets']:
        file = root / 'assets' / entry['name']
        z.write(file, file.relative_to(root).as_posix())
    z.writestr('试玩说明.txt', readme)

manifest = json.loads((root / files[-1]).read_text(encoding='utf-8'))
apk = root / 'artifacts/FashionStudio-V52-1080x1920.apk'
with zipfile.ZipFile(apk) as z:
    assert all('\\' not in entry.orig_filename for entry in z.infolist()), 'Noncanonical APK paths'
    for asset in manifest['assets']:
        data = z.read('assets/assets/' + asset['name'])
        assert len(data) == asset['size'], asset['name']
        assert hashlib.sha256(data).hexdigest() == asset['sha256'], asset['name']
    assert z.read('assets/index.html') == (root / files[0]).read_bytes()
    for file in files[1:]:
        assert z.read('assets/' + file) == (root / file).read_bytes(), file
    # Test the actual signed APK's web files, not merely the build staging copy.
    audit = root / 'pack-test/v52-signed-apk'
    for name in z.namelist():
        if name.startswith('assets/') and not name.endswith('/'):
            target = audit / name[len('assets/'):]
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(z.read(name))

for file in [apk, archive]:
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    file.with_suffix(file.suffix + '.sha256').write_text(digest + '  ' + file.name + '\n', encoding='utf-8')
    print(file, file.stat().st_size, digest)
print('Verified', len(manifest['assets']), 'packaged assets byte-for-byte; extracted signed APK for browser regression.')
