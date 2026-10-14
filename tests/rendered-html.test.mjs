import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the AI有客 prototype entry", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AI有客 APP 全量交互原型<\/title>/i);
  assert.match(html, /<iframe[^>]+src="\/prototype\.html"/i);
  assert.match(html, /title="AI有客 APP 全量交互原型"/i);
});

test("ships the complete interaction catalog in the standalone prototype", async () => {
  const prototype = await readFile(
    new URL("../public/prototype.html", import.meta.url),
    "utf8",
  );
  const screenDefinitions = [
    ...prototype.matchAll(/^      ([A-Za-z][A-Za-z0-9]*):\(\)=>/gm),
  ].map((match) => match[1]);

  assert.equal(new Set(screenDefinitions).size, 84);
  for (const requiredScreen of [
    "login",
    "onboardingCity",
    "onboarding",
    "communities",
    "buildings",
    "customers",
    "expiredDetail",
    "chat",
    "messages",
    "systemMessages",
    "profileAuditRejected",
    "coinPlatformGiftMessage",
    "coinDeductMessage",
    "wallet",
    "waiverRecords",
    "coinGuide",
    "me",
    "profileView",
    "profileEdit",
    "notifications",
    "settings",
    "personalInfoList",
    "thirdPartyList",
    "accountCancellation",
    "cityApplySubmitted",
    "systemStateHub",
    "permissionCamera",
    "permissionPhotos",
    "permissionSavePhotos",
    "permissionMicrophone",
    "permissionLocation",
    "permissionNotifications",
    "offlineState",
    "weakNetwork",
    "serverError",
    "sessionExpired",
    "uploadFailed",
    "storageFull",
    "skeletonCustomers",
    "skeletonChat",
    "skeletonDetail",
    "pushPreview",
  ]) {
    assert.match(prototype, new RegExp(`^      ${requiredScreen}:\\(\\)=>`, "m"));
  }
  assert.match(prototype, /待首次回复/);
  assert.match(prototype, /待反馈/);
  assert.match(prototype, /有客币消息/);
  assert.match(prototype, /永久有效/);
  assert.match(prototype, /输入用户微信名、用户需求及备注查询/);
  assert.match(prototype, /发送成功，消息已送达群聊/);
  assert.match(prototype, /本条消息包含手机号等敏感联系方式/);
  assert.match(prototype, /资料审核通知/);
  assert.match(prototype, /有客币助手/);
  assert.match(prototype, /customer-avatars-v1\.png/);
  assert.match(prototype, /property-scenes-v1\.png/);
  assert.match(prototype, /365-logo-generated-v2\.png/);
  assert.match(prototype, /选择主营区属/);
  assert.match(prototype, /data-sheet='experience'/);
  assert.match(prototype, /data-sheet='sales'/);
  assert.match(prototype, /淘房公众号二维码图片占位/);
  assert.match(prototype, /企微客服助手二维码图片占位/);
  assert.match(prototype, /开启获客之旅/);
  assert.match(prototype, /60s后重新获取/);
  assert.match(prototype, /安家顾问入驻认证/);
  assert.doesNotMatch(prototype, /我已阅读并同意.*安家顾问入驻协议/);
  assert.match(prototype, /修改资料并重新提交/);
  assert.match(prototype, /coin-glass/);
  assert.match(prototype, /coin-glass compact/);
  assert.match(prototype, /入驻赠送/);
  assert.match(prototype, /平台赠送/);
  assert.match(prototype, /购买线索/);
  assert.doesNotMatch(prototype, /群线索购买/);
  assert.match(prototype, /发送语音/);
  assert.match(prototype, /转文字/);
  assert.match(prototype, /线索激活免扣/);
  assert.match(prototype, /平台免扣/);
  assert.match(prototype, /不变动有客币余额，也不计入有客币流水/);
  assert.match(prototype, /说明内容由平台后台配置/);
  assert.match(prototype, /real-avatar a2 profile-photo/);
  assert.match(prototype, /西安 · 曲江旗舰店/);
  assert.match(prototype, /data-profile-submit/);
  assert.match(prototype, /提交审核成功/);
  assert.match(prototype, /资料正在审核中，审核完成后可再次修改/);
  assert.match(prototype, /手机系统通知/);
  assert.match(prototype, /应用内横幅通知/);
  assert.match(prototype, /data-enable-system-notification/);
  assert.match(prototype, /保留重要通知/);
  assert.match(prototype, /个人信息收集清单/);
  assert.match(prototype, /第三方信息共享清单/);
  assert.match(prototype, /账号注销/);
  assert.match(prototype, /运营将在B端开放平台删除当前小B角色/);
  assert.match(prototype, /data-show-global-message/);
  assert.match(prototype, /模拟新消息/);
  assert.match(prototype, /周末可以看房吗？我想再看看曲江附近的三室/);
  assert.match(prototype, /data-open-global-message/);
  assert.match(prototype, /data-show-upgrade/);
  assert.match(prototype, /发现新版本/);
  assert.match(prototype, /V3\.1\.0/);
  assert.match(prototype, /立即更新/);
  assert.match(prototype, /稍后提醒/);
  assert.match(prototype, /即将前往应用市场更新/);
  assert.match(prototype, /权限、异常与加载/);
  assert.match(prototype, /Push消息/);
  assert.match(prototype, /class='lock-screen'/);
  assert.match(prototype, /您有新的线索待跟进/);
  assert.match(prototype, /林小姐发来3条新消息/);
  assert.match(prototype, /你有5条客户新消息未回复/);
  assert.match(prototype, /data-go='leadDetail' aria-label='打开新线索详情'/);
  assert.match(prototype, /data-go='chat' aria-label='打开林小姐的群聊'/);
  assert.match(prototype, /data-go='messages' aria-label='打开未读客户消息列表'/);
  assert.match(prototype, /class='validity-chip'>长期有效/);
  assert.match(prototype, /pages\.systemStateHub=\(\)=>systemStateHubWithoutHero\(\)\.replace/);
  assert.match(prototype, /正在服务经纪人（运营代发）/);
  assert.match(prototype, /实际扣减50有客币/);
  assert.match(prototype, /data-mini-program='365-taofang'/);
  assert.match(prototype, /data-mini-program='365-taofang'/);
  assert.match(prototype, /class='real-avatar a2 sm chat-customer-avatar'/);
  assert.match(prototype, /失效前最后成功版本/);
  assert.match(prototype, /icon\('lightbulb',18\).*当前跟进建议/);
  assert.match(prototype, /textPreview\('当前跟进建议',followAdviceFullText\(advice\),2\)/);
  assert.match(prototype, /textPreview\('历史对话总结',historySummaryData\(mode\),3\)/);
  assert.match(prototype, /chatSummaryCard\('群聊'/);
  assert.match(prototype, /chatSummaryCard\('私聊'/);
  assert.match(prototype, /--preview-lines:3/);
  assert.match(prototype, /-webkit-line-clamp:var\(--preview-lines,3\)/);
  assert.match(prototype, /data-full-text-key/);
  assert.match(prototype, /full-text-content/);
  const plainTextPageSource = prototype.slice(
    prototype.indexOf("function plainTextPage"),
    prototype.indexOf("function summarySheetMarkup"),
  );
  assert.doesNotMatch(plainTextPageSource, /<button\b/);
  assert.match(prototype, /function visibleHistoryMessages/);
  assert.match(prototype, /RETURN_VISIT/);
  assert.match(prototype, /confirmedRevisitReply/);
  assert.match(prototype, /同一群再次生成线索并由上一轮同一小B承接/);
  for (const msgType of [
    11041, 11042, 11043, 11044, 11045, 11046, 11047, 11048, 11049,
    11050, 11051, 11060, 11066, 11068, 11123, 11124, 11187, 11195,
  ]) {
    assert.match(prototype, new RegExp(`zhouReceived\\(${msgType}|zhouSystem\\(${msgType}`));
  }
  assert.match(prototype, /class='voice-entry'/);
  assert.match(prototype, /data-permission='microphone' data-permission-after='voiceRecord'/);
  assert.match(prototype, /data-permission='camera'/);
  assert.match(prototype, /data-permission='photos'/);
  assert.match(prototype, /data-permission='location'/);
  assert.match(prototype, /permissionSavePhotos/);
  assert.match(prototype, /断网状态/);
  assert.match(prototype, /弱网与超时/);
  assert.match(prototype, /服务异常/);
  assert.match(prototype, /登录失效/);
  assert.match(prototype, /上传失败/);
  assert.match(prototype, /存储空间不足/);
  assert.match(prototype, /客户列表骨架屏/);
  assert.match(prototype, /群聊骨架屏/);
  assert.match(prototype, /详情骨架屏/);
  assert.match(prototype, /暂无关联门店，可只选择公司/);
  assert.match(prototype, /首次通过APP登录/);
  assert.match(prototype, /data-supplement-submit/);
  assert.match(prototype, /customer-insights/);
  assert.match(prototype, /已到访/);
  assert.match(prototype, /已加微信/);
  assert.match(prototype, /已成交/);
  assert.match(prototype, /detail-allocation/);
  assert.match(prototype, /data-feedback-save/);
  assert.match(prototype, /\[房源卡片\]/);
  assert.match(prototype, /\[图片\]/);
  assert.match(prototype, /分配当日 00:00 至线索分配前的可见消息/);
  assert.match(prototype, /生成来源 · 群聊/);
  assert.match(prototype, /生成来源 · 私聊转群/);
  assert.match(prototype, /客户档案/);
  assert.match(prototype, /历史对话总结/);
  assert.match(prototype, /档案生成中\.\.\./);
  assert.match(prototype, /点击立即回复查看聊天详情/);
  assert.match(prototype, /summary-source-tag/);
  assert.match(prototype, /群成员（4）/);
  assert.match(prototype, /data-selection-submit/);
  assert.match(prototype, /data-flow-filter='income'/);
  assert.match(prototype, /data-flow-filter='expense'/);
  assert.match(prototype, /class="status-signal"/);
  assert.match(prototype, /class="status-battery"/);
  assert.match(prototype, /single-upload/);
  assert.doesNotMatch(prototype, /客户画像/);
  assert.doesNotMatch(prototype, /群消息总结/);
  assert.doesNotMatch(prototype, /安家认证通知/);
  assert.match(prototype, /@林悦/);
  assert.match(prototype, /quoted-block/);
  assert.match(prototype, /林小姐购房沟通群/);
  assert.match(prototype, /创建时间=分配时间/);
  assert.match(prototype, /打开相机拍摄/);
  assert.match(prototype, /保存至手机相册/);
  assert.match(prototype, /delete pages\.historyLoading/);
  assert.match(prototype, /delete pages\.cardPreview/);
  assert.match(prototype, /data-send-house/);
  assert.match(prototype, /data-send-project/);
  assert.match(prototype, /输入房源名称搜索/);
  assert.match(prototype, /输入楼盘名称搜索/);
  assert.match(prototype, /house-filter-tabs/);
  assert.match(prototype, /房源已发送/);
  assert.match(prototype, /楼盘已发送/);
  assert.match(prototype, /data-go='waiverRecords'/);
  assert.match(prototype, /data-go='settings' aria-label='设置'/);
  assert.match(prototype, /管理已有城市身份或入驻新城市/);
  assert.match(prototype, /返回切换账号页面/);
  assert.match(prototype, /收到其他客户的新消息时在页面顶部展示横幅提醒/);
  assert.match(prototype, /class="navgroup-title"/);
  assert.match(prototype, /data-toggle-group/);
  assert.match(prototype, /const collapsedGroups=new Set\(\)/);
  assert.match(
    prototype,
    /<div class="toolbar-actions"><div class="toolbar-row">[\s\S]*?新用户流程[\s\S]*?老用户流程[\s\S]*?进入主页面[\s\S]*?<\/div><div class="toolbar-row">[\s\S]*?模拟新消息[\s\S]*?模拟版本升级[\s\S]*?Push消息[\s\S]*?<\/div><\/div>/,
  );
  assert.doesNotMatch(prototype, /手机号仅用于识别您的城市小B身份/);
  assert.doesNotMatch(prototype, /查看驳回示例/);
  assert.doesNotMatch(prototype, /重新提交后预览/);
  assert.doesNotMatch(prototype, /提交后仅作为本次入驻资料的一部分/);
  assert.doesNotMatch(prototype, /本期仅支持文字、图片、房源、楼盘、位置/);
  assert.doesNotMatch(prototype, /西安钱包/);
  assert.doesNotMatch(prototype, /本期无有效期/);
  assert.doesNotMatch(prototype, /累计充值/);
  assert.doesNotMatch(prototype, /APP不提供有客币购买和支付入口/);
  assert.doesNotMatch(prototype, /充值到账/);
  assert.doesNotMatch(prototype, /历史重复免扣/);
  assert.doesNotMatch(prototype, /手动免费/);
  assert.doesNotMatch(prototype, /data-go=['"]profileReview['"]/);
  assert.doesNotMatch(prototype, /当前城市：西安/);
  assert.doesNotMatch(prototype, /新线索Push/);
  assert.doesNotMatch(prototype, /客户消息Push/);
  assert.doesNotMatch(prototype, /\bconst top\s*=/);
  assert.match(prototype, /\bconst topbar\s*=/);
  assert.match(prototype, /data-back aria-label="返回"/);
  assert.match(prototype, /\.rail\{background:#fffaf7/);
});

test("detects text overflow from an unclamped measurement clone", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");
  const start = prototype.indexOf("function hasRenderedTextOverflow");
  const end = prototype.indexOf("function refreshReadAllButtons", start);
  const hasRenderedTextOverflow = vm.runInNewContext(`(${prototype.slice(start, end).trim()})`);
  const createPreview = fullHeight => {
    const probe = {
      scrollHeight: fullHeight,
      style: {},
      removeAttribute() {},
      remove() {},
    };
    const parent = { appendChild() {} };
    return {
      clientHeight: 60,
      scrollHeight: 60,
      offsetWidth: 260,
      parentElement: parent,
      cloneNode: () => probe,
      getBoundingClientRect: () => ({ width: 260 }),
    };
  };
  assert.equal(hasRenderedTextOverflow(createPreview(94)), true);
  assert.equal(hasRenderedTextOverflow(createPreview(60)), false);
});

test("schedules overflow refresh without passing the animation timestamp as the root", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");
  assert.match(prototype, /function scheduleReadAllRefresh\(\)\{requestAnimationFrame\(\(\)=>refreshReadAllButtons\(\)\)\}/);
  assert.doesNotMatch(prototype, /requestAnimationFrame\(refreshReadAllButtons\)/);
});

test("uses different entities to demonstrate overflow and fitting states", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");
  const adviceStart = prototype.indexOf("function followAdviceData");
  const adviceEnd = prototype.indexOf("function followAdviceFullText", adviceStart);
  const followAdviceData = vm.runInNewContext(`(${prototype.slice(adviceStart, adviceEnd).trim()})`);
  assert.ok(followAdviceData("active").summary.length > 80);
  assert.ok(followAdviceData("permanent").summary.length < 30);
  assert.deepEqual(Array.from(followAdviceData("permanent").items), []);
  assert.match(prototype, /mode==='permanent'\?'客户在私聊中已明确四室改善需求/);
  assert.match(prototype, /mode==='expired'\?'私聊中已确认总价和三室需求。':'私聊中已确认预算约300万及周末看房计划。'/);
});

test("uses a bottom sheet for all expanded summaries and shared chat message renderers", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");
  assert.match(prototype, /function summarySheetMarkup\(entry\)/);
  assert.match(prototype, /if\(entry\)\{openSummarySheet\(entry\);return\}/);
  assert.match(prototype, /entry\.title==='当前跟进建议'\?'advice'/);
  assert.match(prototype, /entry\.title==='历史对话总结'\?'history'/);
  assert.match(prototype, /class='summary-sheet-body'/);
  assert.match(prototype, /function quoteMessage\(author,quoted,text\)/);
  assert.match(prototype, /function voiceMessage\(\{duration=12,transcript='',sent=false,transcribed=false\}=\{\}\)/);
  assert.match(prototype, /function chatComposer\(expired=false\)/);
  assert.doesNotMatch(prototype, /<button id='sendMsg'>发送<\/button>/);
  assert.doesNotMatch(prototype, /语音播放示例/);
  assert.match(prototype, /\.api-received-row \.message-body\{max-width:78%\}/);
  assert.match(prototype, /\.chat-summary-stack\{display:grid;width:calc\(100% - 24px\);gap:8px;margin:13px auto 18px\}/);
  assert.match(prototype, /const title=isPrivate\?'当前会话消息总结':'来源会话消息总结'/);
  assert.match(prototype, /textPreview\(title,text,3\)/);
  const chatCardSource=prototype.match(/function chatSummaryCard[^\n]+/)[0];
  assert.doesNotMatch(chatCardSource,/summary-source-tag/);
  assert.doesNotMatch(prototype, /<b>\$\{label\}总结<\/b>/);
  assert.doesNotMatch(prototype, /周先生会话：已按企微消息列表接口/);
  assert.match(prototype, /return screen\(`<div class='chat-content'>\$\{chatSummaryStack\('permanent'\)\}/);
});

test("renders complete property cards for both chats and a full forwarded-record detail", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");

  for (const field of ["3室2厅1卫", "118㎡", "曲江观唐", "298万", "25,254元/㎡"]) {
    assert.match(prototype, new RegExp(field));
  }
  for (const field of ["物业类型：", "区域：", "售卖状态：", "价格："]) {
    assert.match(prototype, new RegExp(field));
  }
  for (const field of ["区属：", "板块：", "建成年份："]) {
    assert.match(prototype, new RegExp(field));
  }

  assert.match(prototype, /houseCard\('365','曲江观唐三室两厅，近地铁'/);
  assert.match(prototype, /function houseCard[\s\S]*?class='picker-card property-card/);
  assert.match(prototype, /function pickerHouseV4[\s\S]*?return houseCard\(source,title,layout,area,community,price,unit,photo,true\)/);
  assert.match(prototype, /\.project-card \.parsed-price,\.community-card \.parsed-price\{[^}]*font-size:12px[^}]*white-space:nowrap/);
  assert.match(prototype, /projectCard\('华润悦府','住宅','曲江新区','在售'/);
  assert.match(prototype, /communityCard\('万科东方传奇','雁塔区','曲江二期','2017年'/);
  assert.match(prototype, /zhouStructuredMini\('曲江观唐四室改善房'[\s\S]*?houseCard\('365','曲江观唐四室改善房'/);
  assert.match(prototype, /zhouStructuredMini\('曲江观唐'[\s\S]*?projectCard\('曲江观唐'/);
  assert.match(prototype, /zhouStructuredMini\('万科东方传奇'[\s\S]*?communityCard\('万科东方传奇'/);

  assert.match(prototype, /data-go='forwardedChatRecord'/);
  assert.match(prototype, /<b>转发的聊天记录<\/b><span>6条 ›<\/span>/);
  assert.match(prototype, /function forwardedChatRecordPage\(\)/);
  assert.match(prototype, /来自“曲江改善置业交流群”的6条聊天记录/);
  assert.match(prototype, /pages\.forwardedChatRecord=\(\)=>forwardedChatRecordPage\(\)/);
});

test("hides revisit conversations only for the same group and same assignee reentry", async () => {
  const prototype = await readFile(new URL("../public/prototype.html", import.meta.url), "utf8");
  const start = prototype.indexOf("function visibleHistoryMessages");
  const end = prototype.indexOf("let followAdviceMode", start);
  const visibleHistoryMessages = vm.runInNewContext(`(${prototype.slice(start, end).trim()})`);
  const messages = [
    { id: "old-normal", sentAt: "2026-08-27 10:18" },
    { id: "agent-revisit", sentAt: "2026-09-03 08:18", agentTags: ["RETURN_VISIT"] },
    { id: "customer-reply", sentAt: "2026-09-03 08:24", confirmedRevisitReply: true },
    { id: "current-normal", sentAt: "2026-09-03 09:15" },
  ];
  const base = {
    currentLeadId: "new-lead",
    previousLeadId: "old-lead",
    groupId: "same-group",
    previousGroupId: "same-group",
    assigneeId: "same-broker",
    previousAssigneeId: "same-broker",
    assignmentDayStart: "2026-09-03 00:00",
  };
  assert.deepEqual(
    Array.from(visibleHistoryMessages(messages, base), item => item.id),
    ["old-normal", "current-normal"],
  );
  assert.deepEqual(
    Array.from(visibleHistoryMessages(messages, { ...base, assigneeId: "different-broker" }), item => item.id),
    ["agent-revisit", "customer-reply", "current-normal"],
  );
});

test("server-renders the independent lead management entry", async () => {
  const response = await render("/lead-management");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>线索管理后台交互原型<\/title>/i);
  assert.match(html, /<iframe[^>]+src="\/lead-management\.html"/i);
  assert.match(html, /title="线索管理后台交互原型"/i);
});

test("ships the standalone lead management workspace", async () => {
  const leadManagement = await readFile(
    new URL("../public/lead-management.html", import.meta.url),
    "utf8",
  );

  for (const requiredContent of [
    "aria-label=\"\u7cfb统模块\"",
    "title=\"线索管理\"",
    "会话列表",
    "群列表",
    "城市",
    "分销中介",
    "群类型",
    "待运营分配",
    "近3天分配待判客",
    "id:'136481',agent:'李永康'",
    "id:'139205',status:'wait'",
    "leadLabel",
    "点击查看群聊消息",
    "selection-count",
    "群档案",
    "群详情",
    "群成员",
    "群聊总结",
    "workspace-tabs",
    "customer-avatars-v2.png",
    "group-avatar",
    "流转记录",
    "反馈记录",
    "判客记录",
    "是否带访",
    "是否加微信",
    "是否成交",
    "平台判客",
    "继续跟进",
    "约带看成功/带看",
    "无效或终止",
    "群线索分配",
    "确认分配",
  ]) {
    assert.match(leadManagement, new RegExp(requiredContent));
  }

  for (const removedContent of [
    "自定义分组",
    "filter-chip",
    "class=\"unread\"",
    "type-tag",
    "conflict-dot",
    "会话线索（",
    "data-show-customer",
    "点击圈选框查看线索详情",
    "客户 788ID",
    "线索备注：",
    "快捷话术",
  ]) {
    assert.doesNotMatch(leadManagement, new RegExp(removedContent));
  }
});
