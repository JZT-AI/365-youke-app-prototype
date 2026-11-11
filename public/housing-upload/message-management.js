// 消息管理原型。运营场景及消息样例使用演示数据。
(() => {
  const categories = [
    ['客户跟进提醒', 'users', 'blue'], ['房源维护通知', 'home', 'green'],
    ['有客币提醒', 'coin', 'amber'], ['审核通知', 'shield', 'purple'], ['平台公告', 'bell', 'blue'],
  ];
  const [followUp, housing, coin, audit, announcement] = categories.map(([name]) => name);
  const coinLedgerRoute = '/wallet/records';
  const walletRoute = '/wallet';
  const appRouteScreens = new Map([[walletRoute,'wallet'],[coinLedgerRoute,'coinFlow']]);
  const rows = [
    {id:'housing-upload', category:housing, title:'房源上传完成', body:'你上传的 2 套房源已处理完成，可前往房源管理查看。', app:'housingMine', action:'查看房源管理'},
    {id:'city-event', category:announcement, title:'西安经纪人业务交流会开放报名', body:'11月20日，我们邀请城市服务团队分享客户跟进经验。活动地点为西安曲江会议中心，报名截至11月18日 18:00。', image:'event', path:'pages/events/detail?id=xa-20261120', action:'查看活动并报名'},
    {id:'audit-in', category:audit, title:'入驻审核通过', body:'你的西安入驻资料已通过审核，可以开始承接服务。', app:'messageAuditResult', auditType:'新身份入驻'},
    {id:'bonus', category:announcement, title:'完成3笔指定业务，可获100有客币', body:'11月10日至25日，在365有客完成3笔符合活动规则的客户带看，可获100有客币。有效业务认定条件见活动详情。', path:'pages/events/detail?id=showing-bonus', action:'查看活动规则'},
    {id:'recharge', category:coin, title:'首次充值满99元，加赠50有客币', body:'截至11月30日，首次单笔充值满99元可额外获得50有客币。赠币的使用范围和有效期详见活动规则。', appRoute:walletRoute},
    {id:'coin-join', category:coin, title:'有客币-入驻赠送', body:'入驻赠送100有客币已到账。', appRoute:coinLedgerRoute},
    {id:'renew', category:announcement, title:'承接服务续期活动：续3个月赠权益', body:'11月10日至30日，续购3个月承接服务可额外获得一次业务辅导权益。适用套餐见活动详情。', path:'pages/events/detail?id=renewal-nov', action:'查看续期活动'},
    {id:'audit-in-reject', category:audit, title:'入驻审核未通过', body:'从业资格证图片不清晰，请更新后重新提交。', app:'messageAuditResult', auditType:'新身份入驻', failureReason:'从业资格证图片不清晰。'},
    {id:'contest', category:announcement, title:'邀请你参加西安经纪人带看竞赛', body:'本次竞赛按有效带看量排名，前10名可获奖励。请于11月22日前报名，比赛将于11月25日开始。', path:'pages/events/detail?id=xa-contest', action:'查看竞赛详情'},
    {id:'audit-profile', category:audit, title:'资料修改审核通过', body:'你提交的新资料已通过审核并生效。', app:'messageAuditResult', auditType:'资料修改'},
    {id:'coin-platform', category:coin, title:'有客币-平台赠送', body:'平台赠送的50有客币已到账。', appRoute:coinLedgerRoute},
    {id:'audit-profile-reject', category:audit, title:'资料修改审核未通过', body:'证件照片信息不完整，请补充清晰照片后重新提交。', app:'messageAuditResult', auditType:'资料修改', failureReason:'证件照片信息不完整。'},
    {id:'coin-debit', category:coin, title:'有客币-购买线索扣减', body:'购买线索扣减50有客币，扣减后余额为1,260有客币。', appRoute:coinLedgerRoute},
  ].map((row, index) => {
    const day = String(10 - Math.floor(index / 3)).padStart(2, '0');
    const time = ['10:20','09:45','09:10'][index % 3];
    return {...row,time:'2026-11-'+day+' '+time};
  });
  let category = '';
  let city = selectedCity;
  let selectedId = '';
  let readObserver;
  const bodyLimit = 120;
  let listScroll = 0;
  let categoryScroll = 0;
  let notificationHintDismissed = false;
  let read = new Set();
  try { read = new Set(JSON.parse(localStorage.getItem('youke-message-demo-read') || '[]')); } catch {}
  const safe = escapePlainText;
  const markRead = id => {
    read.add(id);
    try { localStorage.setItem('youke-message-demo-read', JSON.stringify([...read])); } catch {}
  };
  const getRows = () => {
    if (selectedCity !== 'xian') return [];
    const uploads = window.YoukeHousingNoticeDemo?.rows() || [];
    return [...uploads.map(item => ({...item,category:housing})), ...rows].sort((a,b)=>b.time.localeCompare(a.time)||a.id.localeCompare(b.id));
  };
  window.YoukeMessageBadge = () => {
    const count = getRows().filter(row=>!read.has(row.id)).length;
    return count > 99 ? '99+' : count;
  };
  const displayTime = time => time.replace(/^\d{4}-(\d{2})-(\d{2}) (\d{2}:\d{2}).*$/, (_, month, day, clock)=>Number(month)+'月'+Number(day)+'日 '+clock);
  const active = () => getRows().find(row => row.id === selectedId);
  const cover = row => row.image ? '<img class="youke-notice-cover" src="message-event-cover.svg" alt="西安经纪人业务交流会活动海报">' : '';
  const bodyText = body => {
    const chars = Array.from(body.trim());
    return chars.length > bodyLimit ? chars.slice(0,bodyLimit-1).join('')+'…' : body.trim();
  };
  const card = row => {
    const hasDestination = row.appRoute || row.path || row.uploadId || row.app || row.url;
    const unread = !read.has(row.id);
    return `<div class="youke-notice-item">
      <time class="youke-notice-time">${safe(displayTime(row.time))}</time>
      <article class="youke-notice-card" data-notice-id="${safe(row.id)}"${unread?' data-notice-unread':''}>
        <div class="youke-notice-content">
          <h3>${safe(row.title)}${unread?'<i class="youke-card-unread" aria-label="未读"></i>':''}</h3>
          ${cover(row)}
          <p class="youke-notice-body">${safe(bodyText(row.body))}</p>
        </div>
        ${hasDestination ? `<button type="button" class="youke-notice-action" data-notice-destination="${safe(row.id)}">查看详情${icon('chevron',16)}</button>` : ''}
      </article>
    </div>`;
  };
  function observeReadCards() {
    readObserver?.disconnect();
    if (current !== 'messageCategory') return;
    readObserver = new IntersectionObserver((entries,observer) => {
      if (current!=='messageCategory'||observer!==readObserver) return;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < .5) continue;
        markRead(entry.target.dataset.noticeId);
        entry.target.removeAttribute('data-notice-unread');
        entry.target.querySelector('.youke-card-unread')?.remove();
        if (!getRows().some(row=>row.category===category&&!read.has(row.id))) {
          screenEl.querySelector('[data-message-shortcut][aria-pressed="true"] .youke-shortcut-unread')?.remove();
        }
        observer.unobserve(entry.target);
      }
    },{root:screenEl,threshold:.5});
    screenEl.querySelectorAll('[data-notice-unread]').forEach(card=>readObserver.observe(card));
  }
  const baseCustomerMessages = pages.messages;
  const demoConversationTimes = {lin:'2026-11-10 10:30',zhou:'2026-11-10 09:30',wang:'2026-11-07 08:27'};
  const messageClock = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'});
  function conversationRows(template) {
    return Array.from(template.content.querySelectorAll('.swipe-conversation'), entry => {
      const key = entry.dataset.customer;
      const latest = localMessages[key]?.at(-1);
      const time = latest?.createdAt ? messageClock.format(latest.createdAt) : demoConversationTimes[key] || '';
      const timeElement = entry.querySelector('time');
      if (timeElement && time) timeElement.textContent = displayTime(time);
      return {time, html:entry.outerHTML};
    });
  }
  function categoryRows(messages) {
    return categories.map(([name,symbol,tone]) => {
      const visible = messages.filter(row=>row.category===name);
      const latest = visible[0];
      const unread = visible.some(row=>!read.has(row.id));
      return {
        name,time:latest?.time||'',
        html:`<button type="button" class="youke-category-row" data-notice-category="${safe(name)}">
          <span class="youke-category-icon ${tone}" aria-hidden="true">${icon(symbol,21)}</span>
          <span class="youke-category-copy"><strong>${safe(name)}</strong><small>${safe(latest?.title||'暂无消息')}</small></span>
          ${latest?`<time>${safe(displayTime(latest.time))}</time>`:''}
          ${unread?'<i class="youke-category-unread" aria-label="有未读站内信"></i>':''}
        </button>`
      };
    });
  }
  const shortcuts = [
    ['会话','','message','blue'], ['有客币',coin,'coin','amber'],
    ['房源',housing,'home','green'], ['审核',audit,'shield','purple'],
  ];
  function messageShortcuts(activeCategory, messages) {
    return `<nav class="youke-message-shortcuts" aria-label="消息分类">${shortcuts.map(([label,name,symbol,tone])=>{
      const unread = name && messages.some(row=>row.category===name&&!read.has(row.id));
      return `<button type="button" data-message-shortcut="${safe(name)}" aria-pressed="${name===activeCategory}">
        <span class="youke-category-icon ${tone}" aria-hidden="true">${icon(symbol,21)}</span>
        <span>${label}</span>${unread?'<i class="youke-shortcut-unread" aria-label="有未读站内信"></i>':''}
      </button>`;
    }).join('')}</nav>`;
  }
  function notificationHint() {
    if (systemNotificationEnabled || notificationHintDismissed) return '';
    return `<aside class="youke-notification-hint" aria-label="消息通知权限提示">
      <button type="button" class="youke-hint-close" data-dismiss-notification-hint aria-label="关闭提示">${icon('close',17)}</button>
      <button type="button" class="youke-hint-open" data-go="messageNotificationSettings" aria-label="开启消息通知">
        <span>打开消息通知，重要消息不错过</span><strong>${icon('bell',13)}开启</strong>
      </button>
    </aside>`;
  }
  pages.messageNotificationSettings = () => screen(`<div class="content youke-system-settings">
    <div class="card"><b>365有客App</b><p>系统设置演示</p>
    <button type="button" role="switch" aria-label="允许通知" aria-checked="${systemNotificationEnabled}" data-toggle-system-notification>
      <span>允许通知</span><span class="switch ${systemNotificationEnabled?'on':''}" aria-hidden="true"></span>
    </button></div>
  </div>`,'通知设置');
  pages.messageManagement = () => {
    const template = document.createElement('template');
    template.innerHTML = baseCustomerMessages();
    const conversations = selectedCity==='xian' ? conversationRows(template) : [];
    const messages = getRows();
    const summaries = categoryRows(messages);
    const pinned = summaries.find(row=>row.name===announcement);
    const followUpSummary = summaries.find(row=>row.name===followUp);
    const byTime = conversations.sort((a,b)=>b.time.localeCompare(a.time));
    const rows = [pinned,followUpSummary,...byTime];
    const blocked = selectedCity==='xian' ? template.content.querySelector('.blocked-entry') : null;
    return screen(`${messageShortcuts('',messages)}<div class="youke-mixed-list" aria-label="消息列表">${rows.map(row=>row.html).join('')}${blocked?.outerHTML||''}</div>${notificationHint()}`,'消息',{back:false,bottom:'messageManagement'});
  };
  pages.messages = pages.messageManagement;
  pages.messageCategory = () => {
    const allMessages = getRows();
    const messages = allMessages.filter(row=>row.category===category);
    const isShortcut = shortcuts.some(([,name])=>name===category);
    return screen(`${isShortcut?messageShortcuts(category,allMessages):''}<div class="youke-inbox youke-category-inbox">
      <div class="youke-inbox-list">
      ${messages.length ? messages.map(card).join('') : '<div class="youke-inbox-empty">暂无消息</div>'}
      </div>
    </div>${isShortcut?notificationHint():''}`,isShortcut?'消息':safe(category||'站内信'),
      isShortcut?{back:false,bottom:'messageManagement'}:{});
  };
  pages.messageAuditResult = () => {
    const row = active();
    if (!row?.auditType) return screen('<div class="youke-inbox-empty">暂无法查看审核结果</div>','审核结果');
    const rejected = Boolean(row.failureReason);
    return noticeDetail(safe(row.title),safe(row.body),safe(row.auditType),safe(row.time),
      rejected ? 'rejected' : 'success',false,safe(row.failureReason || ''),
      rejected ? '审核未通过说明' : '审核通过说明');
  };
  pages.messageMiniProgram = () => {
    const row = active();
    return screen(`<div class="youke-mini-demo"><span>小程序页面演示</span><h2>365获客宝</h2><p>${safe(row?.title||'')}</p><code>${safe(row?.path||'')}</code></div>`,'365获客宝');
  };
  meta.messageManagement = ['消息管理','会话和三类通知入口',['最近一条消息','未读提示'],'点击顶部图标切换列表。'];
  meta.messageMiniProgram = ['365获客宝','小程序跳转示例',['指定页面路径'],'原型模拟打开小程序目标页。'];
  meta.messages = meta.messageManagement;
  meta.messageNotificationSettings = ['通知设置','手机系统通知开关演示',['允许通知'],'返回消息页后按系统权限更新提示。'];
  meta.messageCategory = ['站内信分类','查看该分类的站内信',['图文消息','按时间倒序'],'展示本分类已收到的站内信。'];
  const group = groups.find(item => item.name === '消息中心');
  if (group) {
    group.name = '消息管理';
    group.items = [['messageManagement','消息管理'],...group.items.filter(item=>item[0]!=='messages')];
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-dismiss-notification-hint]')) {
      notificationHintDismissed = true;
      screenEl.querySelector('.youke-notification-hint')?.remove();
      return;
    }
    if (event.target.closest('[data-toggle-system-notification]')) {
      setSystemNotificationEnabled(!systemNotificationEnabled);
      go('messageNotificationSettings',false);
      return;
    }
    const shortcut = event.target.closest('[data-message-shortcut]');
    if (shortcut) {
      const next = shortcut.dataset.messageShortcut;
      if (shortcut.getAttribute('aria-pressed')==='true') return;
      if (!next) {
        if (['messageManagement','messages'].includes(historyStack.at(-1))) back();
        else go('messageManagement',false);
        return;
      }
      category = next;
      categoryScroll = 0;
      go('messageCategory',current!=='messageCategory');
      return;
    }
    const filter = event.target.closest('[data-notice-category]');
    if (filter) { category = filter.dataset.noticeCategory; categoryScroll = 0; go('messageCategory'); return; }
    const target = event.target.closest('[data-notice-destination]');
    if (!target) return;
    selectedId = target.dataset.noticeDestination;
    const row = active();
    if (!row) { showToast('该消息暂不可查看'); return; }
    if (row.appRoute) {
      const screenId = appRouteScreens.get(row.appRoute);
      if (screenId) go(screenId);
      else showToast('目标页面暂不可打开');
    } else if (row.path) go('messageMiniProgram');
    else if (row.uploadId) window.YoukeHousingNoticeDemo?.open(row.uploadId);
    else if (row.app) go(row.app);
    else if (row.url) window.open(row.url,'_blank','noopener,noreferrer');
  });
  const baseGo = go;
  go = function(id, push = true) {
    if (city !== selectedCity) {
      city = selectedCity;
      category = '';
      listScroll = 0;
      categoryScroll = 0;
    } else if (id !== current) {
      if (current === 'messageManagement' || current === 'messages') listScroll = screenEl.scrollTop;
      if (current === 'messageCategory') categoryScroll = screenEl.scrollTop;
    }
    baseGo(id, push);
    if (id === 'messageManagement' || id === 'messages') screenEl.scrollTop = listScroll;
    if (id === 'messageCategory') screenEl.scrollTop = categoryScroll;
    observeReadCards();
  };
})();
