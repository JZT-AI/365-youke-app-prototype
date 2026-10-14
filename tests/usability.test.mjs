import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/prototype.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
// This VM harness exercises the pre-existing state layer without a browser DOM.
// The subsequent UGC DOM/gesture layer is exercised by output/ugc-requirements/verify.cjs.
const layer=script.slice(script.indexOf('// Usability layer:'),script.indexOf('// UGC interactions:'));
function harness(){
  const callbacks=[],listeners=[],inputs={};
  const element={querySelector:()=>null,querySelectorAll:()=>[],scrollTop:0,scrollHeight:100,innerHTML:''};
  const ctx=vm.createContext({console,Set,Date,NodeFilter:{SHOW_TEXT:4},current:'customers',pages:{settings:()=>"<div class='my-menu'></div>",customers:()=>'',wechat:()=>"<button class='primary' data-submit-onboarding>提交审核</button>"},groups:[{name:'客户与群聊',items:[]}],meta:{},screenEl:element,hasOtherCityAccount:true,cityEntryFromSettings:false,customerCardsV4:()=>'',insightV4:()=>'',leadDetailWithFollowAdvice:()=>'',menuRow:(i,title,d,route)=>`<button data-go='${route}'>${title}</button>`,
    document:{createElement:()=>({}),head:{appendChild(){}},getElementById:id=>inputs[id]||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners.push(fn),createTreeWalker:()=>({nextNode:()=>null})},
    setTimeout:fn=>callbacks.push(fn),screen:(body,title)=>`<header>${title}</header>${body}`,escapePlainText:s=>String(s).replaceAll('<','&lt;'),icon:()=>'',chatSummaryStack:()=>'',chatComposer:()=>'',voiceMessage:()=>'<b>语音</b>',closeSheet(){},openSheet(){},showToast(text){ctx.toast=text},sheet:{querySelector:()=>null,classList:{add(){}},innerHTML:''},
    tradeTypes:['二手房','新房分销','租赁','公寓','商业','法拍'],go(id){ctx.current=id;ctx.screenEl.innerHTML=ctx.pages[id]?.()||'';}});
  vm.runInContext(layer,ctx);
  return {ctx,inputs,callbacks,run:s=>vm.runInContext(s,ctx),click:(selectors)=>listeners[0]({target:{closest:s=>selectors[s]||null},preventDefault(){},stopImmediatePropagation(){}})};
}
test('complete inline application remains valid JavaScript',()=>{new vm.Script(script)});
test('secondary trades allow three, block fourth and allow reselection after removing one',()=>{const h=harness();h.run("selectTrade('租赁',true);selectTrade('公寓',true)");assert.equal(h.run('tradeSelection.secondary.length'),3);assert.match(h.run('tradeScopeSummary()'),/新房住宅、租赁住宅、公寓/);h.run("selectTrade('商业',true)");assert.equal(h.run('tradeSelection.secondary.length'),3);assert.equal(h.ctx.toast,'副营最多选择3个');h.run("selectTrade('公寓',true);selectTrade('商业',true)");assert.equal(h.run('tradeSelection.secondary.length'),3);assert.equal(h.run('tradeSelection.secondary.includes(\"商业\")'),true);assert.match(h.run('pages.trade()'),/最多选择3个/);assert.equal(h.run('tradeSelection.main.length'),1);});
test('trade scope translates residential types, retains other names and follows selection',()=>{const h=harness();for(const [a,b] of [['二手房','二手住宅'],['新房分销','新房住宅'],['租赁','租赁住宅'],['公寓','公寓'],['商业','商业'],['法拍','法拍']])assert.equal(h.run(`tradeScopeName('${a}')`),b);h.run("go('supplement');go('trade');selectTrade('租赁');selectTrade('公寓',true)");assert.match(h.run('tradeScopeSummary()'),/主要承接：租赁住宅/);assert.match(h.run('tradeScopeSummary()'),/也可承接：新房住宅、公寓/);assert.equal(h.run('tradeReturn'),'supplement');assert.doesNotMatch(h.run('pages.trade()'),/学区|别墅/);assert.ok(h.run('pages.trade()').indexOf('你的承接范围')<h.run('pages.trade()').indexOf('data-trade-confirm'));});
test('main trades require exactly one and switching clears duplicate secondary selection',()=>{const h=harness();h.run("selectTrade('公寓');selectTrade('商业');selectTrade('商业')");assert.equal(h.run('tradeSelection.main.length'),1);assert.equal(h.run('tradeSelection.main[0]'),'商业');h.run("selectTrade('新房分销')");assert.equal(h.run('tradeSelection.secondary.length'),0);h.run("selectTrade('新房分销',true)");assert.equal(h.ctx.toast,'主营与副营不可重复');assert.match(h.run('pages.trade()'),/必须选择1个/);});
test('customer context survives sending and group details use the same customer',()=>{
  const h=harness();h.run("go('zhouChat');queueLocalMessage({text:'周六看房'});");
  assert.equal(h.ctx.current,'zhouChat');assert.equal(h.run('localMessages.zhou.length'),1);assert.equal(h.run('localMessages.lin.length'),0);
  assert.match(h.run('pages.groupInfo()'),/周先生购房沟通群/);
  assert.equal(h.run('localMessages.zhou[0].status'),'sending');h.callbacks.shift()();assert.equal(h.run('localMessages.zhou[0].status'),'sent');
});
test('new feedback starts empty; existing feedback is customer-specific',()=>{
 const h=harness();assert.doesNotMatch(h.run('pages.feedback()'),/class='on'/);
 h.run("go('permanentDetail');go('feedback')");assert.equal((h.run('pages.feedback()').match(/class='on'/g)||[]).length,3);
 assert.match(h.run('pages.feedback()'),/周先生/);assert.match(h.run('pages.feedback()'),/成交确认/);
});
test('revisit window includes all replies within ten minutes, otherwise only first reply',()=>{
 const h=harness();const start='2026-09-03T08:00:00';
 const messages=[{id:1,sender:'customer',sentAt:'2026-09-03T08:04:00'},{id:2,sender:'customer',sentAt:'2026-09-03T08:10:00'},{id:3,sender:'customer',sentAt:'2026-09-03T08:10:01'}];
 assert.deepEqual([...h.run(`revisitReplyIds(${JSON.stringify(messages)},'${start}')`)],[1,2]);
 assert.deepEqual([...h.run(`revisitReplyIds(${JSON.stringify(messages.slice(2))},'${start}')`)],[3]);
 assert.doesNotMatch(h.run('pages.reentryChat()'),/预算仍控制/);assert.match(h.run('pages.reentryLateChat()'),/预算仍控制/);
 assert.doesNotMatch(h.run('pages.reentryLateChat()'),/周末可以再看看/);
});
test('contact moderation covers phone, landline, WeChat, QQ and email without flagging generic words',()=>{
 const h=harness();for(const value of ['13800138000','138 0013 8000','010-88886666','微信：zhou_demo88','QQ：12345678','demo@example.com','妈的'])assert.equal(h.run(`hasDemoRisk(${JSON.stringify(value)})`),true,value);
 assert.equal(h.run("hasDemoRisk('电话联系时间和小区垃圾分类')"),false);
 assert.doesNotMatch(h.run("redactRiskText('周先生 微信：zhou_demo88')"),/zhou_demo88/);
});
test('failure retry preserves the origin customer and changes the same message state',()=>{
 const h=harness();h.run("go('zhouChat');nextFailure='offlineState';queueLocalMessage({text:'请确认时间'});");h.callbacks.shift()();
 assert.equal(h.run('localMessages.zhou[0].status'),'failed');h.run("openRecovery('offlineState',1);recoverTask(true)");
 assert.equal(h.ctx.current,'zhouChat');assert.equal(h.run('localMessages.zhou.length'),1);h.callbacks.shift()();assert.equal(h.run('localMessages.zhou[0].status'),'sent');
});
test('expired customer cannot send; session recovery returns to the original feedback task',()=>{
 const h=harness();h.run("go('expired');queueLocalMessage({text:'不可发送'})");assert.equal(h.run('localMessages.wang.length'),0);
 h.run("go('permanentDetail');go('feedback');openRecovery('sessionExpired');recoverTask(true)");assert.equal(h.ctx.current,'feedback');assert.equal(h.run('activeCustomer'),'zhou');assert.equal(h.run('feedbackReturn'),'permanentDetail');
});
test('feedback validates and stores only the selected customer, returning to the source',()=>{
 const h=harness();h.inputs.feedbackError={textContent:''};h.run("go('leadDetail');go('feedback')");
 h.click({'[data-local-feedback-save]':{}});assert.match(h.inputs.feedbackError.textContent,/必填/);
 h.ctx.document.querySelector=selector=>selector.startsWith('[data-feedback-field')?({textContent:selector.includes('visit')?'是':'否'}):null;
 h.inputs.feedbackNote={value:'已确认周六看房'};h.click({'[data-local-feedback-save]':{}});
 assert.equal(h.run('savedFeedback.lin.note'),'已确认周六看房');assert.equal(h.run('savedFeedback.lin.visit'),'是');
 assert.equal(h.run('savedFeedback.zhou.deal'),'是');assert.equal(h.ctx.current,'leadDetail');
});
test('old and new leads keep independent feedback and unread while group resolves latest',()=>{
 const h=harness();assert.equal(h.run("latestRound('linOld')"),'lin');
 assert.equal(h.run('savedFeedback.lin'),undefined);assert.equal(h.run('savedFeedback.linOld.visit'),'是');
 h.run("go('linOldChat')");assert.equal(h.run('roundUnread.linOld'),0);assert.equal(h.run('roundUnread.lin'),3);
 assert.equal((h.run('pages.messages()').match(/data-group-id='group-lin'/g)||[]).length,1);
 assert.match(h.run('customerCardsV4()'),/linOldDetail/);assert.match(h.run('pages.linOldChat()'),/data-go='leadDetail'/);
});
test('feedback uses the original unfilled record style and masking uses exactly three stars',()=>{
 const h=harness();const feedback=h.run('feedbackMarkup(savedFeedback.zhou)');assert.match(feedback,/feedback-record/);assert.match(feedback,/已到访/);assert.doesNotMatch(feedback,/demo-feedback|background/);
 assert.equal(h.run("redactRiskText('周先生 微信：zhou_demo88')"),'周先生 ***');
 assert.equal(h.run("redactRiskText('13800138000')"),'***');
});
test('single-city account settings retain new-city entry and selection checks per-city completeness',()=>{
 const h=harness();h.ctx.hasOtherCityAccount=false;assert.match(h.run('pages.settings()'),/citySwitch/);assert.match(h.run('pages.citySwitch()'),/入驻新城市/);assert.doesNotMatch(h.run('pages.citySwitch()'),/合肥/);
});
test('supplemented existing city opens working customer and business pages instead of placeholders',()=>{
 const h=harness();h.run("go('identity');chooseCity('hefei')");assert.equal(h.ctx.current,'supplement');h.run("cityDemo.hefei.complete=true;go('customers')");assert.equal(h.ctx.current,'customers');assert.match(h.run('pages.messages()'),/林小姐/);assert.match(h.run('pages.feedback()'),/跟进/);assert.equal(h.run("renderCityDemo(()=>'<div>西安 · 曲江旗舰店</div>')"),'<div>合肥 · 滨湖万科店</div>');h.run("chooseCity('hefei')");assert.equal(h.ctx.current,'customers');assert.doesNotMatch(script,/合肥 · 暂无客户|该城市暂无对应业务数据/);
});
test('both city lists include pending and rejected applications without activating them',()=>{
 const h=harness();for(const page of ['identity','citySwitch']){assert.match(h.run(`pages.${page}()`),/审核中/);assert.match(h.run(`pages.${page}()`),/审核失败/)}
 h.run("go('identity');chooseCity('nanjing')");assert.equal(h.ctx.current,'cityAuditPending');assert.equal(h.run('selectedCity'),'xian');assert.match(h.run('pages.cityAuditPending()'),/南京/);
});
test('audit city rows share enter action and status stays after store; detail has no extra return CTA',()=>{
 const h=harness();const rows=h.run('cityRows()');assert.match(rows,/<p>鼓楼门店 · 审核中<\/p>/);assert.match(rows,/<p>园区门店 · 审核失败<\/p>/);assert.equal((rows.match(/class='muted'>进入 ›/g)||[]).length,4);assert.doesNotMatch(rows,/class='tag/);
 for(const failed of [true,false])assert.doesNotMatch(h.run(`cityAuditPage(${failed})`),/返回选择所在城市|返回切换账号|class='secondary'/);
});
test('rejected city resubmission preserves the original city-list return destination',()=>{
 for(const origin of ['identity','citySwitch']){const h=harness();h.run(`go('${origin}');chooseCity('suzhou')`);assert.equal(h.ctx.current,'cityAuditRejected');h.run("go('realname');go('wechat');submitCityReaudit()");assert.equal(h.ctx.current,'cityAuditPending');assert.equal(h.run('cityDemo.suzhou.status'),'pending');assert.match(h.run('pages.cityAuditPending()'),/苏州/);h.run('returnFromCityAudit()');assert.equal(h.ctx.current,origin);assert.equal(h.run('cityAuditKey'),null)}
});
test('binding hint is exact and shown only before WeChat identity is linked',()=>{
 const h=harness();assert.match(h.run('pages.wechat()'),/提示：提交前需授权微信，用于核验公众号关注和企微客服好友状态，请使用关注及添加客服的同一微信账号授权。/);
 h.run("setBindingCase('ready')");assert.doesNotMatch(h.run('pages.wechat()'),/wechat-binding-hint/);
});
test('WeChat authorization resumes validation and submits once without a second click',()=>{
 const h=harness();h.run("go('wechat');submitOnboarding();submitOnboarding()");assert.equal(h.ctx.current,'wechatAuthorization');assert.equal(h.callbacks.length,0);
 h.run('finishWechatAuthorization(true);submitOnboarding()');assert.equal(h.ctx.current,'wechat');assert.equal(h.run('bindingDemo.phase'),'checking');assert.equal(h.callbacks.length,1);
 h.callbacks.shift()();assert.equal(h.run('bindingDemo.phase'),'submitting');h.callbacks.shift()();assert.equal(h.ctx.current,'submitted');assert.equal(h.run('bindingDemo.submissions'),1);
});
test('relationship gates distinguish each missing prerequisite and allow retry',()=>{
 for(const [scenario,copy] of [['noFollow','请先关注淘房公众号'],['noFriend','请先添加企微客服好友'],['neither','请先关注淘房公众号并添加企微客服好友']]){
  const h=harness();h.run(`setBindingCase('${scenario}');submitOnboarding()`);if(scenario==='neither')h.run('finishWechatAuthorization(true)');h.callbacks.shift()();assert.equal(h.ctx.toast,copy);assert.equal(h.ctx.current,'wechat');assert.equal(h.run('bindingDemo.submissions'),0);
  assert.doesNotMatch(h.run('pages.wechat()'),/wechat-binding-hint/);h.run('bindingDemo.followed=true;bindingDemo.friend=true;submitOnboarding()');h.callbacks.shift()();h.callbacks.shift()();assert.equal(h.ctx.current,'submitted');
 }
});
test('authorization cancellation, auth failure and check failure retain the binding page',()=>{
 const h=harness();h.run("go('wechat');submitOnboarding();finishWechatAuthorization(false)");assert.equal(h.ctx.current,'wechat');assert.equal(h.ctx.toast,'微信授权已取消，请授权后提交');assert.equal(h.run('bindingDemo.unionid'),null);
 h.run("setBindingCase('authFailed');submitOnboarding();finishWechatAuthorization(true)");assert.equal(h.ctx.toast,'微信授权未完成，请重试');assert.equal(h.run('bindingDemo.unionid'),null);
 h.run("setBindingCase('checkFailed');submitOnboarding()");h.callbacks.shift()();assert.equal(h.ctx.toast,'暂时无法核验关注和好友状态，请稍后重试');assert.equal(h.run('bindingDemo.submissions'),0);
});
test('gated city reaudit keeps the original return route and navigation invalidates in-flight checks',()=>{
 const h=harness();h.run("go('citySwitch');chooseCity('suzhou');go('realname');setBindingCase('noFollow');submitOnboarding()");h.callbacks.shift()();assert.equal(h.run('cityDemo.suzhou.status'),'rejected');
 h.run('bindingDemo.followed=true;submitOnboarding()');h.callbacks.shift()();h.callbacks.shift()();assert.equal(h.ctx.current,'cityAuditPending');h.run('returnFromCityAudit()');assert.equal(h.ctx.current,'citySwitch');
 h.run("setBindingCase('ready');submitOnboarding();go('customers')");h.callbacks.shift()();assert.equal(h.ctx.current,'customers');assert.equal(h.run('bindingDemo.submissions'),1);
});
