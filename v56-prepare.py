from pathlib import Path
import json, shutil

root = Path(__file__).resolve().parent
def read(p): return (root / p).read_text(encoding='utf-8')
def write(p, s):
    (root / p).parent.mkdir(parents=True, exist_ok=True)
    (root / p).write_text(s, encoding='utf-8')

for name in ['workshop-core.js', 'workshop-view.js', 'workshop.css', 'workshop-theme.css']:
    write('v56/' + name, read('v55/' + name))

portraits = []
for n in [1, 2, 3, 6, 7, 8]:
    dest = 'workshop-npc/npc-%02d.png' % n
    (root / 'assets/workshop-npc').mkdir(exist_ok=True)
    shutil.copyfile(root / ('assets/workshop-NPC/npc (%d).png' % n), root / 'assets' / dest)
    portraits.append(dest)
shutil.copyfile(Path('C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-48948a5a-d317-4b6e-84b1-3a838f67f570.png'), root / 'design/references/v56-order-npc-reference.png')

plan = json.loads(read('design/v55-workshop-plan.json').replace('V55', 'V56').replace('v55', 'v56'))
plan['customerPortraits'] = {
    '小悠': portraits[1], '阿澈': portraits[4], '林夕': portraits[2],
    '米娅': portraits[0], '买手许薇': portraits[0], '顾言': portraits[3], '陆承': portraits[5]
}
plan['orderCustomers'] = [
    {'name':'小悠', 'text':'我要把今天的好心情穿出来。'},
    {'name':'阿澈', 'text':'这次上新，别让我输给前同事。'},
    {'name':'林夕', 'text':'预算有限，气场不限。'},
    {'name':'米娅', 'text':'买手已经在路上，衣服还在路上。'},
    {'name':'顾言', 'text':'设计稿可以改，今天的出场不能输。'},
    {'name':'陆承', 'text':'会议可以延后，这套穿搭必须准时。'},
    {'name':'买手许薇', 'text':'先看版型，再谈品牌故事。'}
]
plan['presentation'] = {'version':'V56', 'style':'Customer bust above a cream demand tray; named portraits, item-ready checks and gold delivery state.', 'legacyPortraitAlias':'米娅与买手许薇暂共用 npc-01，保留已有剧情姓名；6张用户指定图片全部接入。'}
write('design/v56-workshop-plan.json', json.dumps(plan, ensure_ascii=False, indent=2))

s = read('v56/workshop-core.js')
start = s.index(" const people=['小悠'")
end = s.index('\n}', start)
s = s[:start] + " const people=P.orderCustomers;const person=people[a.nextOrder%people.length];\n return makeOrder(a,role,chosen.needs,person.name,person.text);" + s[end:]
write('v56/workshop-core.js', s)

s = read('make-v55.js').replace('v55', 'v56').replace('V55', 'V56').replace('V0.55', 'V0.56')
s = s.replace('localStorage.getItem("fashion.loop.mobile.v54")', 'localStorage.getItem("fashion.loop.mobile.v55")||localStorage.getItem("fashion.loop.mobile.v54")')
s = s.replace("...JSON.parse(read('design/v52-delivered-art-index.json')).entries.map(e=>e.runtimePath)", "...JSON.parse(read('design/v52-delivered-art-index.json')).entries.map(e=>e.runtimePath),...Object.values(plan.customerPortraits)")
s = s.replace("read('v56/workshop-theme.css')", "read('v56/workshop-theme.css')+'\\n'+read('v56/order-portraits.css')")
write('make-v56.js', s)
s = read('android-apk/build-apk-v55.ps1').replace('v55', 'v56').replace('V55', 'V56').replace('--version-code 57 --version-name 0.55', '--version-code 58 --version-name 0.56')
write('android-apk/build-apk-v56.ps1', s)
s = read('pack-v55.py').replace('v55', 'v56').replace('V55', 'V56')
s = s.replace('V54/V53/V52/V51 保留', 'V55/V54/V53/V52/V51 保留').replace('首次按 V54→', '首次按 V55→V54→')
write('pack-v56.py', s)
for file in ['core', 'ui']:
    s = read('tests/v55-' + file + '.cjs').replace('v55', 'v56').replace('V55', 'V56').replace('load(55)', 'load(56)').replace('8141', '8142')
    if file == 'ui':
        s = s.replace('v54', 'v55').replace('V54', 'V55')
    write('tests/v56-' + file + '.cjs', s)
print('V56 source scaffold and six canonical portrait copies prepared.')
