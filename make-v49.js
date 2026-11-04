const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const write = (name, value) => fs.writeFileSync(path.join(root, name), value, 'utf8');

const sourceHtml = read('fashion-studio-mobile-trial-v48.html');
const sourceRuntime = read('fashion-studio-mobile-trial-v48-runtime.js');

const referenceSource = 'C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-bf0ca07c-8001-471e-b40f-5972c8f10eee.png';
const referenceTarget = path.join(root, 'assets', 'signin-reference.png');
if (!fs.existsSync(referenceSource)) throw new Error(`签到参考图不存在：${referenceSource}`);
fs.copyFileSync(referenceSource, referenceTarget);

const referenceSkin = String.raw`
/* V0.49: pink bow monthly sign-in skin, based on the supplied reference image. */
#modal.signin-dialog{
  width:min(calc(100vw - 24px),460px)!important;
  max-width:none!important;
  height:min(calc((100vw - 24px) * 1.333333),calc(100dvh - 28px))!important;
  max-height:calc(100dvh - 28px)!important;
  min-height:0!important;
  padding:0!important;
  border:0!important;
  border-radius:18px!important;
  overflow:hidden!important;
  background:#33263b url('assets/signin-reference.png') center/100% 100% no-repeat!important;
  box-shadow:0 18px 55px #39253f99!important;
  color:#8b4f5a!important;
}
#modal.signin-dialog::backdrop{background:#2a2036bb!important;backdrop-filter:blur(4px)!important}
#modal.signin-dialog>.modal-top{display:none!important}
#modal.signin-dialog .signin-panel{position:relative!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;background:transparent!important;color:transparent!important;font-size:0!important;overflow:hidden!important}
#modal.signin-dialog .signin-panel>*{position:absolute!important;box-sizing:border-box!important;pointer-events:none!important;opacity:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;color:transparent!important}

/* Preserve the recommendation/sign-in tabs as transparent touch zones so the previous feature remains usable. */
#modal.signin-dialog .signin-activity-tabs{display:grid!important;grid-template-columns:repeat(2,1fr)!important;left:4%!important;top:2%!important;width:38%!important;height:5%!important;z-index:30!important;pointer-events:auto!important}
#modal.signin-dialog .signin-activity-tabs button{pointer-events:auto!important;width:100%!important;height:100%!important;opacity:0!important}

/* Calendar cells remain real buttons over the artwork. The reference image supplies the visible calendar. */
#modal.signin-dialog .signin-calendar{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:2px!important;left:12.2%!important;top:41.6%!important;width:75.6%!important;height:27.5%!important;z-index:20!important;pointer-events:auto!important;opacity:.01!important}
#modal.signin-dialog .signin-calendar .signin-day-pad{display:block!important;min-height:0!important;pointer-events:none!important}
#modal.signin-dialog .signin-calendar .signin-day{display:block!important;min-width:0!important;min-height:0!important;width:100%!important;height:100%!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;color:transparent!important;opacity:1!important;pointer-events:auto!important}
#modal.signin-dialog .signin-calendar .signin-day>*{pointer-events:none!important;opacity:0!important}
#modal.signin-dialog .signin-calendar .signin-day.is-selected{outline:3px solid #f0679b!important;outline-offset:1px!important;background:#fff0f44c!important}

/* Bottom action zones line up with the visible button, history card and close button in the reference. */
#modal.signin-dialog .signin-claim-dock{left:16%!important;top:68.7%!important;width:68%!important;height:9.5%!important;z-index:25!important;pointer-events:auto!important;opacity:.01!important}
#modal.signin-dialog .signin-claim-button{display:block!important;width:100%!important;height:72%!important;min-height:0!important;border:0!important;background:transparent!important;color:transparent!important;pointer-events:auto!important}
#modal.signin-dialog .signin-history{left:7%!important;top:79.7%!important;width:86%!important;height:11.5%!important;z-index:25!important;pointer-events:auto!important;opacity:.01!important}
#modal.signin-dialog .signin-history *{pointer-events:auto!important}
#modal.signin-dialog .signin-close{right:1.3%!important;top:88.2%!important;width:13%!important;height:10%!important;min-height:0!important;z-index:40!important;pointer-events:auto!important;opacity:.01!important;font-size:0!important}

/* Keep the hidden semantic/status blocks from changing the artwork geometry. */
#modal.signin-dialog .signin-hero,
#modal.signin-dialog .signin-milestones,
#modal.signin-dialog .signin-calendar-title,
#modal.signin-dialog .signin-weekdays,
#modal.signin-dialog .signin-makeup{pointer-events:none!important}

@media(max-width:360px){
  #modal.signin-dialog{width:calc(100vw - 16px)!important;height:min(calc((100vw - 16px) * 1.333333),calc(100dvh - 16px))!important;max-height:calc(100dvh - 16px)!important}
}
`;

const versionedHtml = sourceHtml
  .replaceAll('fashion-studio-mobile-trial-v48-runtime.js', 'fashion-studio-mobile-trial-v49-runtime.js')
  .replaceAll('V0.48', 'V0.49');
const styleEnd = versionedHtml.lastIndexOf('</style>');
if (styleEnd < 0) throw new Error('找不到样式结束标签');
const html = versionedHtml.slice(0, styleEnd) + '\n' + referenceSkin + '\n' + versionedHtml.slice(styleEnd);

write('fashion-studio-mobile-trial-v49.html', html);
write('fashion-studio-mobile-trial-v49-runtime.js', sourceRuntime.replaceAll('fashion-studio-mobile-trial-v48', 'fashion-studio-mobile-trial-v49'));

console.log(JSON.stringify({
  html: path.join(root, 'fashion-studio-mobile-trial-v49.html'),
  runtime: path.join(root, 'fashion-studio-mobile-trial-v49-runtime.js'),
  reference: referenceTarget
}, null, 2));
