window.__ModuleLoader__.load({
  id: 'dsh-relay-balance',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const zh = {
      nav: '中转用量',
      title: '用量与余额',
      hint: '用量来自中转的 OpenAI 兼容计费接口；中转余额需要该站点的登录态（/api/user/self）；官方余额通过 DSH 账号服务读取。凭证只保存在本机 Host 侧，浏览器拿不到明文。',
      overview: '总览',
      floatingSection: '悬浮卡片',
      credentialSection: '连接凭证',
      usage: '已用金额',
      balance: '剩余额度',
      used: '已用',
      todaySpent: '今日实付',
      totalSpent: '累计实付',
      recharged: '累计充值',
      todayRequests: '今日请求',
      updated: '最近刷新',
      never: '尚未刷新',
      refresh: '刷新',
      save: '保存并刷新',
      saving: '保存中…',
      saved: '已保存并刷新',
      failed: '失败',
      credential: '凭证',
      apiBaseUrl: '中转站地址',
      apiBaseUrlHint: '例如 https://relay.example.com，不要带结尾斜杠',
      needBase: '还没有填写中转站地址',
      apiKey: 'API Key（用量）',
      apiKeyHint: '留空则使用 DSH 里已配置的 DEEPSEEK_CLASH_API_KEY',
      cookie: '站点 Cookie（余额）',
      cookieHint: '登录该站后按 F12 → Application → Cookies 复制 session 的值',
      accessToken: '面板令牌（一般不需要）',
      accessTokenHint: '卡扣AI / sub2api 站点只需上面的 API Key，不需要任何登录令牌；此栏仅 new-api 站点读取余额时使用',
      userId: '用户 ID（可选）',
      userIdHint: '站点要求 new-api-user 头时填写',
      quotaPerUnit: '每 1 个货币单位的配额',
      quotaPerUnitHint: 'new-api 默认 500000；按你的站点配置修改',
      currency: '货币符号（可选）',
      currencyHint: '填 CNY 显示 ¥，填 USD 显示 $，留空则只显示数字',
      configured: '已配置',
      notConfigured: '未配置',
      needSession: '还没有填写站点登录态，余额无法读取',
      needKey: '还没有可用的 API Key，读不到用量',
      idle: '等待凭证',
      status: '状态',
      official: '官方',
      relay: '中转',
      officialBalance: '官方余额',
      relayBalance: '中转余额',
      officialSignedOut: '未登录 DeepSeek 账号',
      officialSignedOutHint: '在 设置 → 账号 登录后可读取官方余额',
      bonus: '赠送',
      cardShow: '显示悬浮卡片',
      cardHint: '卡片可拖动，位置和折叠状态会被记住；也可以随时在这里关闭或重新打开',
      cardDragHint: '拖动标题栏移动',
      close: '关闭',
      collapse: '折叠',
      expand: '展开',
      live: '已同步',
      partial: '部分数据',
      noSessionShort: '无登录态',
      loading: '加载中',
      signedIn: '已登录',
      runtime: '运行环境',
      provider: '站点类型',
      providerUnknown: '未识别',
      test: '测试连接',
      detected: '已识别',
      notDetected: '未识别该站点',
      account: '账号',
      neededFields: '需要填写',
      optionalFields: '可选填写',
      readable: '可读取',
      partialHint: '站点已识别，但还缺少上面「可选填写」里的凭证，余额可能读不到',
      'field.apiBaseUrl': '站点地址',
      'field.apiKey': 'API Key',
      'field.cookie': 'Cookie',
      'field.accessToken': '访问令牌',
      'field.userId': '用户 ID',
      'field.quotaPerUnit': '配额换算单位',
      'field.currency': '货币',
      blurYes: '毛玻璃可用',
      blurNo: '不支持模糊',
      refractYes: '折射',
      refractNo: '无折射',
    }

    const en = {
      nav: 'Relay usage',
      title: 'Usage & balance',
      hint: 'Usage comes from the relay\'s OpenAI-compatible billing endpoint; the relay balance needs that site\'s login session (/api/user/self); the official balance is read through the DSH account service. Credentials stay on the local Host and never reach the page.',
      overview: 'Overview',
      floatingSection: 'Floating card',
      credentialSection: 'Connection',
      usage: 'Spent',
      balance: 'Remaining',
      used: 'Used',
      todaySpent: 'Today',
      totalSpent: 'Total spent',
      recharged: 'Recharged',
      todayRequests: 'Requests today',
      updated: 'Updated',
      never: 'Not yet',
      refresh: 'Refresh',
      save: 'Save and refresh',
      saving: 'Saving…',
      saved: 'Saved and refreshed',
      failed: 'Failed',
      credential: 'Credentials',
      apiBaseUrl: 'Relay address',
      apiBaseUrlHint: 'For example https://relay.example.com, without a trailing slash',
      needBase: 'No relay address configured yet',
      apiKey: 'API key (usage)',
      apiKeyHint: 'Leave empty to use the DEEPSEEK_CLASH_API_KEY already configured in DSH',
      cookie: 'Site cookie (balance)',
      cookieHint: 'Sign in to the site, then copy the session cookie value from DevTools → Application → Cookies',
      accessToken: 'Panel token (rarely needed)',
      accessTokenHint: 'kakouai / sub2api sites only need the API key above and no login token at all; this field is for new-api sites that read balance via a session token',
      userId: 'User id (optional)',
      userIdHint: 'Fill it when the site needs the new-api-user header',
      quotaPerUnit: 'Quota units per currency unit',
      quotaPerUnitHint: 'new-api defaults to 500000; change it to match your site',
      currency: 'Currency (optional)',
      currencyHint: 'CNY renders ¥, USD renders $; leave empty to show bare numbers',
      configured: 'set',
      notConfigured: 'not set',
      needSession: 'No site session yet, so the balance cannot be read',
      needKey: 'No API key yet, so usage cannot be read',
      idle: 'Waiting for credentials',
      status: 'Status',
      official: 'Official',
      relay: 'Relay',
      officialBalance: 'Official balance',
      relayBalance: 'Relay balance',
      officialSignedOut: 'Not signed in to DeepSeek',
      officialSignedOutHint: 'Sign in from Settings → Account to read the official balance',
      bonus: 'Bonus',
      cardShow: 'Show floating card',
      cardHint: 'The card is draggable and remembers its position and collapsed state; turn it off or back on here at any time',
      cardDragHint: 'Drag the title bar to move',
      close: 'Close',
      collapse: 'Collapse',
      expand: 'Expand',
      live: 'Synced',
      partial: 'Partial',
      noSessionShort: 'No session',
      loading: 'Loading',
      signedIn: 'Signed in',
      runtime: 'Runtime',
      provider: 'Site type',
      providerUnknown: 'not recognised',
      test: 'Test connection',
      detected: 'Detected',
      notDetected: 'Site not recognised',
      account: 'Account',
      neededFields: 'Required',
      optionalFields: 'Optional',
      readable: 'Readable',
      partialHint: 'The site was recognised, but the optional credentials above are still missing, so the balance may not load',
      'field.apiBaseUrl': 'site address',
      'field.apiKey': 'API key',
      'field.cookie': 'Cookie',
      'field.accessToken': 'Access token',
      'field.userId': 'User ID',
      'field.quotaPerUnit': 'Quota per unit',
      'field.currency': 'Currency',
      blurYes: 'blur supported',
      blurNo: 'no blur',
      refractYes: 'refraction',
      refractNo: 'no refraction',
    }

    const CSS = `
.rb-card{position:fixed;z-index:60;width:196px;pointer-events:auto;border-radius:15px;border:0;background:linear-gradient(155deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,.05) 40%,rgba(255,255,255,0) 62%),rgba(22,28,38,.04);box-shadow:inset 0 0 18px rgba(255,255,255,.06),0 0 0 .5px rgba(0,0,0,.09),0 1px 1px rgba(0,0,0,.05),0 14px 30px -14px rgba(0,0,0,.26),0 38px 68px -32px rgba(0,0,0,.20);color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;overflow:hidden;animation:rb-in .24s cubic-bezier(.22,1,.36,1);transition:box-shadow .2s ease}
.rb-card::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;padding:1px;pointer-events:none;z-index:3;background:linear-gradient(155deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.42) 18%,rgba(255,255,255,.10) 42%,rgba(255,255,255,.04) 62%,rgba(255,255,255,.34) 86%,rgba(255,255,255,.62) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}
body[data-ds-dark-theme] .rb-card{background:linear-gradient(155deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.03) 42%,rgba(255,255,255,0) 64%),rgba(255,255,255,.04);box-shadow:inset 0 0 18px rgba(255,255,255,.04),0 0 0 .5px rgba(0,0,0,.35),0 1px 1px rgba(0,0,0,.2),0 14px 30px -14px rgba(0,0,0,.5),0 38px 68px -32px rgba(0,0,0,.4)}
body[data-ds-dark-theme] .rb-card::before{background:linear-gradient(155deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.20) 18%,rgba(255,255,255,.05) 44%,rgba(255,255,255,.03) 62%,rgba(255,255,255,.16) 86%,rgba(255,255,255,.30) 100%)}
.rb-card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;opacity:.035;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");background-size:140px 140px}
body[data-ds-dark-theme] .rb-card::after{opacity:.055;mix-blend-mode:soft-light}
@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.rb-card{-webkit-backdrop-filter:blur(60px) saturate(2);backdrop-filter:blur(60px) saturate(2)}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.rb-card{background:rgba(246,247,249,.94);box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 14px 30px -14px rgba(0,0,0,.26)}body[data-ds-dark-theme] .rb-card{background:rgba(32,34,39,.94)}}
.rb-card--dragging{box-shadow:0 1px 1px rgba(0,0,0,.04),0 16px 32px -16px rgba(0,0,0,.36),0 36px 72px -32px rgba(0,0,0,.26)}
.rb-head{position:relative;z-index:2;display:flex;align-items:center;gap:5px;padding:6px 5px 2px 8px;cursor:grab;user-select:none;touch-action:none}
.rb-head:active{cursor:grabbing}
.rb-grip{display:grid;place-items:center;color:var(--dsw-alias-label-secondary);opacity:0;transition:opacity .18s ease}
.rb-head:hover .rb-grip{opacity:.4}
.rb-title{font-weight:600;font-size:11.5px;letter-spacing:.2px;white-space:nowrap}
.rb-collapsed-amount{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary);margin-left:1px}
.rb-flex{flex:1}
.rb-card-actions{display:flex;gap:1px;opacity:0;transition:opacity .18s ease}
.rb-card:hover .rb-card-actions,.rb-card:focus-within .rb-card-actions{opacity:1}
.rb-icon{width:17px;height:17px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);display:grid;place-items:center;cursor:pointer;padding:0;transition:background .15s,color .15s}
.rb-icon:hover{background:rgba(127,127,127,.14);color:var(--dsw-alias-label-primary)}
.rb-icon:active{transform:scale(.94)}
.rb-icon:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.rb-body{position:relative;z-index:1;padding:0 9px 8px;display:flex;flex-direction:column;gap:4px}
.rb-tabs{display:flex;align-items:center;gap:9px;position:relative;z-index:1}
.rb-tab{position:relative;border:0;background:transparent;padding:0 0 3px;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10px;letter-spacing:.24px;cursor:pointer;transition:color .15s ease}
.rb-tab:hover{color:var(--dsw-alias-label-primary)}
.rb-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:3px}
.rb-tab[data-active="true"]{color:var(--dsw-alias-label-primary);font-weight:600}
.rb-tab[data-active="true"]::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:2px;background:var(--dsw-alias-brand-primary)}
.rb-updated{margin-left:auto;font-size:9.5px;letter-spacing:.1px;color:var(--dsw-alias-label-secondary);opacity:.85}
.rb-amount{display:flex;align-items:baseline;gap:4px;position:relative;z-index:1}
.rb-cur{font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.rb-num{font-size:30px;line-height:34px;font-weight:600;letter-spacing:-1px}
.rb-num--sm{font-size:17px;line-height:22px;letter-spacing:-.15px}
.rb-caption{font-size:9.5px;letter-spacing:.25px;color:var(--dsw-alias-label-secondary);margin-left:4px}
.rb-rows{position:relative;z-index:1;display:flex;flex-direction:column;gap:2px;padding-top:5px;border-top:.5px solid var(--dsw-alias-border-l1)}
.rb-kv{display:flex;justify-content:space-between;gap:6px;font-size:9.5px;color:var(--dsw-alias-label-secondary)}
.rb-kv b{font-weight:500;color:var(--dsw-alias-label-primary)}
.rb-alert{position:relative;z-index:1;display:flex;gap:5px;align-items:flex-start;font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary)}
.rb-alert::before{content:"";width:4.5px;height:4.5px;border-radius:50%;margin-top:4.5px;flex:none;background:var(--dsw-alias-state-warn-primary)}
.rb-alert[data-kind="error"]{color:var(--dsw-alias-state-error-primary)}
.rb-alert[data-kind="error"]::before{background:var(--dsw-alias-state-error-primary)}
.rb-foot{position:relative;z-index:1;display:flex;align-items:center;gap:4px;padding-top:5px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:9.5px;letter-spacing:.2px;color:var(--dsw-alias-label-secondary)}
.rb-dot{width:4.5px;height:4.5px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:none}
.rb-dot[data-state="ok"]{background:var(--dsw-alias-state-success-primary)}
.rb-dot[data-state="partial"]{background:var(--dsw-alias-state-warn-primary)}
.rb-dot[data-state="error"]{background:var(--dsw-alias-state-error-primary)}
.rb-dot[data-state="loading"]{background:var(--dsw-alias-label-secondary);animation:rb-pulse 1.2s ease-in-out infinite}
.rb-foot .rb-icon{opacity:0;transition:opacity .18s ease,background .15s,color .15s}
.rb-card:hover .rb-foot .rb-icon,.rb-card:focus-within .rb-foot .rb-icon{opacity:1}
.rb-page{display:flex;flex-direction:column;gap:22px;padding:4px 0 16px;max-width:720px;font-size:13px;line-height:22px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.rb-lead{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:21px;max-width:600px;letter-spacing:.1px}
.rb-section{display:flex;flex-direction:column;gap:10px}
.rb-headline{font-size:11px;font-weight:600;letter-spacing:.14em;color:var(--dsw-alias-label-secondary);opacity:.9}
.rb-hero{display:grid;grid-template-columns:1fr 1px 1fr;align-items:stretch;border-top:.5px solid var(--dsw-alias-border-l1);border-bottom:.5px solid var(--dsw-alias-border-l1);padding:13px 0}
.rb-hero-cell{display:flex;flex-direction:column;gap:3px;padding:0 2px}
.rb-hero-cell:last-child{padding-left:20px}
.rb-hero-cell:first-child{padding-right:20px}
.rb-hero-sep{background:var(--dsw-alias-border-l1);opacity:.8}
.rb-hero-label{font-size:11px;letter-spacing:.3px;color:var(--dsw-alias-label-secondary)}
.rb-hero-value{font-size:31px;line-height:38px;font-weight:600;letter-spacing:-.9px}
.rb-hero-note{font-size:11px;letter-spacing:.2px;color:var(--dsw-alias-label-secondary);min-height:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rb-list{display:flex;flex-direction:column}
.rb-item{display:flex;justify-content:space-between;align-items:center;gap:20px;min-height:38px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.rb-item:last-child{border-bottom:0}
.rb-item-k{color:var(--dsw-alias-label-secondary);flex:none;letter-spacing:.1px}
.rb-item-v{text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:64%;letter-spacing:.1px}
.rb-tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--dsw-alias-label-secondary);letter-spacing:.2px}
.rb-tag::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:none}
.rb-tag[data-tone="ok"]::before{background:var(--dsw-alias-state-success-primary)}
.rb-tag[data-tone="warn"]::before{background:var(--dsw-alias-state-warn-primary)}
.rb-form{display:flex;flex-direction:column;gap:16px;border-top:.5px solid var(--dsw-alias-border-l1);padding-top:16px}
.rb-field{display:flex;flex-direction:column;gap:6px}
.rb-field-label{font-size:12px;font-weight:500;letter-spacing:.15px}
.rb-input{box-sizing:border-box;width:100%;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;letter-spacing:.1px;transition:background .15s,border-color .15s,box-shadow .15s}
.rb-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.6}
.rb-input:hover{border-color:var(--dsw-alias-label-secondary)}
.rb-input:focus{outline:0;background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(59,130,246,.14);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.rb-hint{margin:0;font-size:11px;line-height:17px;letter-spacing:.1px;color:var(--dsw-alias-label-secondary)}
.rb-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;opacity:1}
.rb-probe{margin-top:12px;padding:11px 13px;border-radius:10px;background:rgba(127,127,127,.07);border:1px solid rgba(127,127,127,.13);display:flex;flex-direction:column;gap:6px}
.rb-probe-head{display:flex;align-items:center;gap:7px;font-size:12px;line-height:17px}
.rb-probe-row{font-size:11px;line-height:17px;letter-spacing:.1px;color:var(--dsw-alias-label-secondary)}
.rb-probe-muted{opacity:.72}
.rb-probe-error{color:#d9534f}
.rb-btn{height:34px;padding:0 18px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;letter-spacing:.3px;cursor:pointer;transition:background .15s,border-color .15s,transform .06s,filter .15s}
.rb-btn:hover{background:rgba(127,127,127,.10)}
.rb-btn:active{transform:translateY(1px)}
.rb-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.rb-btn:disabled{opacity:.5;cursor:default;transform:none}
.rb-btn--primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.rb-btn--primary:hover{filter:brightness(1.06);background:var(--dsw-alias-brand-primary)}
.rb-switch{position:relative;width:36px;height:20px;padding:0;border-radius:999px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;transition:background .18s ease,border-color .18s ease;flex:none}
.rb-switch[data-on="true"]{background:var(--dsw-alias-brand-primary);border-color:transparent}
.rb-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.rb-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.22);transition:transform .18s cubic-bezier(.22,1,.36,1)}
.rb-switch[data-on="true"] .rb-knob{transform:translateX(16px)}
@keyframes rb-in{from{opacity:0;transform:translateY(6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes rb-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@media (hover:none){.rb-grip{opacity:.4}.rb-card-actions,.rb-foot .rb-icon{opacity:1}}
@media (prefers-reduced-motion:reduce){.rb-card,.rb-dot{animation:none}.rb-icon,.rb-btn,.rb-switch,.rb-knob,.rb-tab{transition:none}}
`

    function injectStyles() {
      if (typeof document === 'undefined') return () => {}
      // A stale tag from an earlier install must never shadow the current sheet.
      const stale = document.querySelectorAll('style[data-dsh-relay-balance]')
      for (let index = 0; index < stale.length; index += 1) stale[index].remove()
      const element = document.createElement('style')
      element.setAttribute('data-dsh-relay-balance', MODULE_VERSION)
      element.textContent = CSS
      document.head.appendChild(element)
      return () => {
        element.remove()
      }
    }


    // --- Apple-style liquid glass (SVG displacement refraction) -------------
    // Technique: a canvas displacement map (R = horizontal ramp, B = vertical
    // ramp, neutralised inside a blurred inset rounded rect) drives
    // feDisplacementMap through three staggered scales; the interior stays
    // neutral so only an edge band refracts. Ported from
    // github.com/deepika-builds/liquid-glass (MIT) per aave.com/design.
    const GLASS_NS = 'http://www.w3.org/2000/svg'
    const GLASS_KEEP = [
      '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
    ]
    let glassSeq = 0

    function glassSupported() {
      try {
        if (typeof document === 'undefined' || typeof window === 'undefined') return false
        const agent = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
        if (/Firefox/.test(agent)) return false
        if (/Safari/.test(agent) && !/Chrome|Chromium|Edg/.test(agent)) return false
        if (!window.CSS || typeof window.CSS.supports !== 'function') return false
        if (!window.CSS.supports('backdrop-filter', 'url(#rb-glass)')) return false
        const probe = document.createElement('canvas')
        probe.width = 4
        probe.height = 4
        probe.getContext('2d').getImageData(0, 0, 1, 1)
        return true
      } catch {
        return false
      }
    }

    function glassMapUrl(width, height, radius, border, mapBlur) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) return ''
      const horizontal = context.createLinearGradient(0, 0, width, 0)
      horizontal.addColorStop(0, 'rgb(0,0,0)')
      horizontal.addColorStop(1, 'rgb(255,0,0)')
      context.fillStyle = horizontal
      context.fillRect(0, 0, width, height)
      const vertical = context.createLinearGradient(0, 0, 0, height)
      vertical.addColorStop(0, 'rgb(0,0,0)')
      vertical.addColorStop(1, 'rgb(0,0,255)')
      context.globalCompositeOperation = 'difference'
      context.fillStyle = vertical
      context.fillRect(0, 0, width, height)
      context.globalCompositeOperation = 'source-over'
      const inset = border * Math.min(width, height)
      context.filter = `blur(${mapBlur}px)`
      context.fillStyle = 'rgba(128,128,128,0.93)'
      context.beginPath()
      const corner = Math.max(radius - inset, 2)
      if (typeof context.roundRect === 'function') {
        context.roundRect(inset, inset, width - inset * 2, height - inset * 2, corner)
      } else {
        context.rect(inset, inset, width - inset * 2, height - inset * 2)
      }
      context.fill()
      context.filter = 'none'
      return canvas.toDataURL()
    }

    function buildGlassFilter(id, scales) {
      const svg = document.createElementNS(GLASS_NS, 'svg')
      svg.setAttribute('width', '0')
      svg.setAttribute('height', '0')
      svg.setAttribute('aria-hidden', 'true')
      svg.style.position = 'absolute'
      svg.style.left = '-9999px'
      const defs = document.createElementNS(GLASS_NS, 'defs')
      svg.appendChild(defs)
      const filter = document.createElementNS(GLASS_NS, 'filter')
      filter.setAttribute('id', id)
      filter.setAttribute('x', '0')
      filter.setAttribute('y', '0')
      filter.setAttribute('width', '100%')
      filter.setAttribute('height', '100%')
      // Load-bearing: linearRGB would remap the neutral gray and inject a
      // constant phantom displacement.
      filter.setAttribute('color-interpolation-filters', 'sRGB')
      const image = document.createElementNS(GLASS_NS, 'feImage')
      image.setAttribute('x', '0')
      image.setAttribute('y', '0')
      image.setAttribute('result', 'map')
      image.setAttribute('preserveAspectRatio', 'none')
      filter.appendChild(image)
      const channels = []
      for (let index = 0; index < 3; index += 1) {
        const displacement = document.createElementNS(GLASS_NS, 'feDisplacementMap')
        displacement.setAttribute('in', 'SourceGraphic')
        displacement.setAttribute('in2', 'map')
        displacement.setAttribute('scale', String(scales[index]))
        displacement.setAttribute('xChannelSelector', 'R')
        displacement.setAttribute('yChannelSelector', 'B')
        displacement.setAttribute('result', `rb-d${index}`)
        filter.appendChild(displacement)
        const isolate = document.createElementNS(GLASS_NS, 'feColorMatrix')
        isolate.setAttribute('in', `rb-d${index}`)
        isolate.setAttribute('type', 'matrix')
        isolate.setAttribute('values', GLASS_KEEP[index])
        isolate.setAttribute('result', `rb-c${index}`)
        filter.appendChild(isolate)
        channels.push(`rb-c${index}`)
      }
      const blendA = document.createElementNS(GLASS_NS, 'feBlend')
      blendA.setAttribute('in', channels[0])
      blendA.setAttribute('in2', channels[1])
      blendA.setAttribute('mode', 'screen')
      blendA.setAttribute('result', 'rb-c01')
      filter.appendChild(blendA)
      const blendB = document.createElementNS(GLASS_NS, 'feBlend')
      blendB.setAttribute('in', 'rb-c01')
      blendB.setAttribute('in2', channels[2])
      blendB.setAttribute('mode', 'screen')
      filter.appendChild(blendB)
      defs.appendChild(filter)
      document.body.appendChild(svg)
      return { svg, image }
    }

    function mountLiquidGlass(element) {
      if (!glassSupported()) return () => {}
      glassSeq += 1
      const id = `rb-glass-${glassSeq}`
      const { svg, image } = buildGlassFilter(id, [-112, -106, -100])
      const refresh = () => {
        const width = Math.round(element.offsetWidth)
        const height = Math.round(element.offsetHeight)
        if (!width || !height) return
        const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 15
        const url = glassMapUrl(width, height, radius, 0.07, 12)
        if (!url) return
        image.setAttribute('href', url)
        image.setAttribute('width', String(width))
        image.setAttribute('height', String(height))
      }
      refresh()
      const stack = `url(#${id}) blur(16px) saturate(1.8)`
      element.style.setProperty('backdrop-filter', stack)
      element.style.setProperty('-webkit-backdrop-filter', stack)
      let timer = null
      const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(refresh, 120)
      }) : null
      if (observer) observer.observe(element)
      return () => {
        if (observer) observer.disconnect()
        clearTimeout(timer)
        svg.remove()
        element.style.removeProperty('backdrop-filter')
        element.style.removeProperty('-webkit-backdrop-filter')
      }
    }

    const icon = (children) => h('svg', {
      width: 14,
      height: 14,
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
    }, children)

    const ChevronDown = () => icon(h('path', { d: 'M4 6l4 4 4-4' }))
    const ChevronUp = () => icon(h('path', { d: 'M4 10l4-4 4 4' }))
    const CloseIcon = () => icon([h('path', { key: 'a', d: 'M4.7 4.7l6.6 6.6' }), h('path', { key: 'b', d: 'M11.3 4.7l-6.6 6.6' })])
    const RefreshIcon = () => icon([
      h('path', { key: 'a', d: 'M13 8a5 5 0 1 1-1.5-3.55' }),
      h('path', { key: 'b', d: 'M13.2 3v3.2H10' }),
    ])
    const GripIcon = () => h('svg', {
      width: 7,
      height: 10,
      viewBox: '0 0 8 12',
      fill: 'currentColor',
      'aria-hidden': 'true',
    }, [
      h('circle', { key: '1', cx: 2, cy: 2, r: 1.1 }),
      h('circle', { key: '2', cx: 6, cy: 2, r: 1.1 }),
      h('circle', { key: '3', cx: 2, cy: 6, r: 1.1 }),
      h('circle', { key: '4', cx: 6, cy: 6, r: 1.1 }),
      h('circle', { key: '5', cx: 2, cy: 10, r: 1.1 }),
      h('circle', { key: '6', cx: 6, cy: 10, r: 1.1 }),
    ])

    const MODULE_VERSION = '3.6.0'
    const CARD_KEY = 'dsh.relay-balance.card.v1'

    function blurSupport() {
      try {
        const css = window.CSS
        if (!css || typeof css.supports !== 'function') return false
        return css.supports('backdrop-filter', 'blur(1px)') || css.supports('-webkit-backdrop-filter', 'blur(1px)')
      } catch {
        return false
      }
    }

    function readCard() {
      try {
        const parsed = JSON.parse(localStorage.getItem(CARD_KEY) || '{}')
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    }

    const cardStore = (() => {
      const stored = readCard()
      return {
        visible: stored.visible !== false,
        tab: stored.tab === 'official' ? 'official' : 'relay',
        collapsed: stored.collapsed === true,
        position: stored.position && typeof stored.position.left === 'number' && typeof stored.position.top === 'number'
          ? { left: stored.position.left, top: stored.position.top }
          : null,
      }
    })()
    const cardListeners = new Set()

    function updateCard(patch) {
      Object.assign(cardStore, patch)
      try {
        localStorage.setItem(CARD_KEY, JSON.stringify(cardStore))
      } catch {
        /* private mode: keep the in-memory value */
      }
      for (const listener of cardListeners) listener()
    }

    function useCard() {
      const [value, setValue] = React.useState({ ...cardStore })
      React.useEffect(() => {
        const listener = () => setValue({ ...cardStore })
        cardListeners.add(listener)
        return () => {
          cardListeners.delete(listener)
        }
      }, [])
      return value
    }

    async function request(path, init) {
      const options = Object.assign({}, init || {})
      options.headers = Object.assign({ accept: 'application/json' }, options.headers || {})
      const response = await fetch(path, options)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload && payload.error && payload.error.message
          ? payload.error.message
          : `HTTP ${response.status}`
        throw new Error(message)
      }
      return payload
    }

    // Compact form for the card: two decimals once past 1, four below. Never
    // rounds a non-zero amount down to "0.0000" though — a balance that reads as
    // zero when it is not is worse than an ugly number.
    function formatAmount(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      const magnitude = Math.abs(value)
      if (magnitude >= 1) return value.toFixed(2)
      if (magnitude === 0) return '0.0000'
      for (let digits = 4; digits <= 12; digits += 1) {
        const text = value.toFixed(digits)
        if (Number(text) !== 0) return text
      }
      return value.toExponential(2)
    }

    /** Exact value, for tooltips and the settings detail page. */
    function formatPrecise(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      if (value === 0) return '0'
      // String() keeps every digit the API returned without adding float noise.
      return String(value)
    }

    function formatWalletAmount(text) {
      if (typeof text !== 'string' || text.trim() === '') return '—'
      const value = Number(text)
      if (!Number.isFinite(value)) return text
      return formatAmount(value)
    }

    function currencySign(currency) {
      if (currency === 'CNY') return '¥'
      if (currency === 'USD') return '$'
      return typeof currency === 'string' && currency.trim() !== '' ? `${currency.trim()} ` : ''
    }

    function formatTime(value) {
      if (typeof value !== 'number' || value <= 0) return null
      return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    function officialSummary(official) {
      const empty = { state: 'loading', text: '—', exact: null, sign: '', detail: null }
      if (!official) return empty
      if (official.state !== 'ok') return { state: official.state, text: '—', exact: null, sign: '', detail: null }
      const all = official.wallets || []
      const nonZero = all.filter((wallet) => Number(wallet.balance) !== 0)
      const list = nonZero.length > 0 ? nonZero : all
      if (list.length === 0) return { state: 'ok', text: '0.00', exact: null, sign: '', detail: null }
      const single = list.length === 1
      const text = single
        ? formatWalletAmount(list[0].balance)
        : list.map((wallet) => `${currencySign(wallet.currency)}${formatWalletAmount(wallet.balance)}`).join(' + ')
      const bonus = (official.bonusWallets || []).filter((wallet) => Number(wallet.balance) > 0)
      // Exact figures for hover tooltips; `text` stays compact for the layout.
      const exact = single
        ? `${currencySign(list[0].currency)}${formatPrecise(Number(list[0].balance))}`
        : list.map((wallet) => `${currencySign(wallet.currency)}${formatPrecise(Number(wallet.balance))}`).join(' + ')
      return {
        state: 'ok',
        text,
        exact,
        sign: single ? currencySign(list[0].currency) : '',
        detail: bonus.length > 0
          ? bonus.map((wallet) => `${currencySign(wallet.currency)}${formatWalletAmount(wallet.balance)}`).join(' + ')
          : null,
      }
    }

    function statusInfo(snapshot, t) {
      const status = snapshot && snapshot.status
      if (!status || status === 'loading') return { tone: 'loading', text: t('loading') }
      if (status === 'ok') return { tone: 'ok', text: t('live') }
      if (status === 'partial') {
        if (snapshot.missing && snapshot.missing.apiBaseUrl) return { tone: 'partial', text: t('needBase') }
        if (snapshot.missing && snapshot.missing.session) return { tone: 'partial', text: t('noSessionShort') }
        if (snapshot.missing && snapshot.missing.apiKey) return { tone: 'partial', text: t('needKey') }
        if (snapshot.error && snapshot.error.message) return { tone: 'partial', text: snapshot.error.message }
        return { tone: 'partial', text: t('partial') }
      }
      if (status === 'idle') return { tone: 'idle', text: (snapshot.missing && snapshot.missing.apiBaseUrl) ? t('needBase') : t('idle') }
      if (status === 'error') return { tone: 'error', text: (snapshot.error && snapshot.error.message) || t('failed') }
      return { tone: 'idle', text: String(status) }
    }

    function RelayBalanceCard(props) {
      const fallback = (key) => key
      const t = typeof props.t === 'function' ? props.t : fallback
      const card = useCard()
      const [snapshot, setSnapshot] = React.useState({ status: 'loading' })
      const [position, setPosition] = React.useState(card.position)
      const [dragging, setDragging] = React.useState(false)
      const cardRef = React.useRef(null)
      const dragRef = React.useRef(null)

      const load = React.useCallback(async () => {
        try {
          setSnapshot(await request('/relay-balance/state'))
        } catch (error) {
          setSnapshot({ status: 'error', error: { message: String((error && error.message) || error) } })
        }
      }, [])

      React.useEffect(() => {
        load()
        const timer = setInterval(load, 60000)
        return () => clearInterval(timer)
      }, [load])

      const clamp = React.useCallback((next) => {
        const width = cardRef.current ? cardRef.current.offsetWidth : 196
        const height = cardRef.current ? cardRef.current.offsetHeight : 130
        const maxLeft = Math.max(8, window.innerWidth - width - 8)
        const maxTop = Math.max(8, window.innerHeight - height - 8)
        return {
          left: Math.min(Math.max(8, next.left), maxLeft),
          top: Math.min(Math.max(8, next.top), maxTop),
        }
      }, [])

      const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) return
        const rect = cardRef.current ? cardRef.current.getBoundingClientRect() : { left: 0, top: 0 }
        dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* pointer capture is best effort */
        }
        setDragging(true)
      }

      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (!drag) return
        setPosition(clamp({ left: event.clientX - drag.dx, top: event.clientY - drag.dy }))
      }

      const onPointerUp = () => {
        if (!dragRef.current) return
        dragRef.current = null
        setDragging(false)
        setPosition((current) => {
          if (current) updateCard({ position: current })
          return current
        })
      }

      React.useEffect(() => {
        const element = cardRef.current
        if (!element || !card.visible) return undefined
        return mountLiquidGlass(element)
      }, [card.visible])

      if (!card.visible) return null

      const initial = position || clamp({
        left: window.innerWidth - 218,
        top: Math.max(88, Math.round(window.innerHeight * 0.16)),
      })
      const sign = currencySign(snapshot.currency || '')
      const tab = card.tab === 'official' ? 'official' : 'relay'
      const official = officialSummary(snapshot.official)
      const usage = snapshot.usage
      const relayBalance = snapshot.balance
      const updated = formatTime(snapshot.updatedAt)
      const status = statusInfo(snapshot, t)
      const relayError = snapshot.error && snapshot.error.message ? snapshot.error.message : null

      const relayAmount = relayBalance
        ? `${sign}${formatAmount(relayBalance.remaining)}`
        : usage ? `${sign}${formatAmount(usage.amount)}` : '—'
      const amountText = tab === 'official' ? official.text : relayAmount
      const amountSign = tab === 'official' ? official.sign : sign
      const amountLabel = tab === 'official'
        ? t('officialBalance')
        : relayBalance ? t('balance') : t('usage')
      const long = amountText.length > 9

      // Precise value for the hover tooltip: the compact form above rounds for
      // layout, but the exact figure should always be one hover away.
      const precise = (value) => (value === null || value === undefined ? '' : `${sign}${formatPrecise(value)}`)
      const amountTitle = tab === 'official'
        ? amountText
        : relayBalance && relayBalance.remaining !== null
          ? precise(relayBalance.remaining)
          : usage ? precise(usage.amount) : ''

      const stats = snapshot.stats

      const rows = (tab === 'official'
        ? [
          official.detail
            ? h('div', { className: 'rb-kv', key: 'bonus' },
              h('span', null, t('bonus')),
              h('b', null, official.detail))
            : null,
          h('div', { className: 'rb-kv', key: 'state' },
            h('span', null, t('status')),
            h('b', null, official.state === 'ok' ? t('signedIn') : official.state === 'signed-out' ? t('officialSignedOut') : t('failed'))),
        ]
        : stats
          ? [
            stats.today !== null
              ? h('div', { className: 'rb-kv', key: 'today' },
                h('span', null, t('todaySpent')),
                h('b', { title: precise(stats.today) }, `${sign}${formatAmount(stats.today)}`))
              : null,
            stats.total !== null
              ? h('div', { className: 'rb-kv', key: 'total' },
                h('span', null, t('totalSpent')),
                h('b', { title: precise(stats.total) }, `${sign}${formatAmount(stats.total)}`))
              : null,
            stats.recharged !== null && stats.recharged > 0
              ? h('div', { className: 'rb-kv', key: 'recharged' },
                h('span', null, t('recharged')),
                h('b', { title: precise(stats.recharged) }, `${sign}${formatAmount(stats.recharged)}`))
              : null,
            stats.todayRequests !== null && stats.todayRequests > 0
              ? h('div', { className: 'rb-kv', key: 'todayReq' },
                h('span', null, t('todayRequests')),
                h('b', null, String(stats.todayRequests)))
              : null,
          ].filter(Boolean)
          : [
            relayBalance && relayBalance.used !== null
              ? h('div', { className: 'rb-kv', key: 'used' },
                h('span', null, t('used')),
                h('b', { title: precise(relayBalance.used) }, `${sign}${formatAmount(relayBalance.used)}`))
              : null,
            usage
              ? h('div', { className: 'rb-kv', key: 'usage' },
                h('span', null, t('usage')),
                h('b', { title: precise(usage.amount) }, `${sign}${formatAmount(usage.amount)}`))
              : null,
          ]).filter(Boolean)

      const alerts = []
      if (tab === 'relay') {
        if (snapshot.missing && snapshot.missing.apiBaseUrl) {
          alerts.push(h('div', { className: 'rb-alert', key: 'base' }, t('needBase')))
        } else if (snapshot.missing && snapshot.missing.session && !relayBalance) {
          alerts.push(h('div', { className: 'rb-alert', key: 'session' }, t('needSession')))
        }
        if (relayError) alerts.push(h('div', { className: 'rb-alert', key: 'err', 'data-kind': 'error' }, relayError))
      } else if (official.state === 'signed-out') {
        alerts.push(h('div', { className: 'rb-alert', key: 'signedout' }, t('officialSignedOutHint')))
      } else if (official.state === 'error') {
        alerts.push(h('div', { className: 'rb-alert', key: 'offerr', 'data-kind': 'error' }, t('failed')))
      }

      const body = card.collapsed ? null : h('div', { className: 'rb-body' },
        h('div', { className: 'rb-tabs' },
          h('button', {
            type: 'button',
            className: 'rb-tab',
            'data-active': tab === 'official' ? 'true' : 'false',
            onPointerDown: (event) => event.stopPropagation(),
            onClick: () => updateCard({ tab: 'official' }),
          }, t('official')),
          h('button', {
            type: 'button',
            className: 'rb-tab',
            'data-active': tab === 'relay' ? 'true' : 'false',
            onPointerDown: (event) => event.stopPropagation(),
            onClick: () => updateCard({ tab: 'relay' }),
          }, t('relay')),
          h('span', { className: 'rb-updated' }, updated || t('never'))),
        h('div', { className: 'rb-amount', title: amountTitle || undefined },
          amountSign ? h('span', { className: 'rb-cur' }, amountSign) : null,
          h('span', { className: `rb-num${long ? ' rb-num--sm' : ''}` }, amountText),
          h('span', { className: 'rb-caption' }, amountLabel)),
        rows.length > 0 ? h('div', { className: 'rb-rows' }, ...rows) : null,
        ...alerts,
        h('div', { className: 'rb-foot' },
          h('span', { className: 'rb-dot', 'data-state': status.tone }),
          h('span', null, status.text),
          h('span', { className: 'rb-flex' }),
          h('button', {
            type: 'button',
            className: 'rb-icon',
            title: t('refresh'),
            'aria-label': t('refresh'),
            onPointerDown: (event) => event.stopPropagation(),
            onClick: load,
          }, h(RefreshIcon))))

      const header = h('div', {
        className: 'rb-head',
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        title: t('cardDragHint'),
      },
        h('span', { className: 'rb-grip' }, h(GripIcon)),
        h('span', { className: 'rb-title' }, t('title')),
        card.collapsed ? h('span', { className: 'rb-collapsed-amount' }, `${amountSign}${amountText}`) : null,
        h('span', { className: 'rb-flex' }),
        h('div', { className: 'rb-card-actions' },
          h('button', {
            type: 'button',
            className: 'rb-icon',
            title: card.collapsed ? t('expand') : t('collapse'),
            'aria-label': card.collapsed ? t('expand') : t('collapse'),
            onPointerDown: (event) => event.stopPropagation(),
            onClick: () => updateCard({ collapsed: !card.collapsed }),
          }, card.collapsed ? h(ChevronDown) : h(ChevronUp)),
          h('button', {
            type: 'button',
            className: 'rb-icon',
            title: t('close'),
            'aria-label': t('close'),
            onPointerDown: (event) => event.stopPropagation(),
            onClick: () => updateCard({ visible: false }),
          }, h(CloseIcon))))

      return h('div', {
        ref: cardRef,
        className: `rb-card${dragging ? ' rb-card--dragging' : ''}`,
        style: { left: `${initial.left}px`, top: `${initial.top}px` },
        'data-relay-balance-card': true,
      }, header, body)
    }

    function RelayBalanceSection(props) {
      const fallback = (key) => key
      const t = typeof props.t === 'function' ? props.t : fallback
      const card = useCard()
      const [snapshot, setSnapshot] = React.useState({ status: 'loading', updatedAt: null })
      const [form, setForm] = React.useState({ apiBaseUrl: '', apiKey: '', cookie: '', accessToken: '', userId: '', quotaPerUnit: '', currency: '' })
      const [busy, setBusy] = React.useState(false)
      const [notice, setNotice] = React.useState('')
      // Result of the last explicit "test connection", or null before the first run.
      const [probe, setProbe] = React.useState(null)

      const load = React.useCallback(async () => {
        try {
          setSnapshot(await request('/relay-balance/state'))
        } catch (error) {
          setSnapshot({ status: 'error', updatedAt: null, error: { message: String((error && error.message) || error) } })
        }
      }, [])

      React.useEffect(() => {
        load()
        const timer = setInterval(load, 60000)
        return () => clearInterval(timer)
      }, [load])

      const quotaPerUnit = snapshot.credential ? snapshot.credential.quotaPerUnit : undefined
      const savedBase = snapshot.credential ? snapshot.credential.apiBaseUrl : ''
      React.useEffect(() => {
        if (!quotaPerUnit && !savedBase) return
        setForm((current) => {
          const next = { ...current }
          if (next.quotaPerUnit === '' && quotaPerUnit) next.quotaPerUnit = String(quotaPerUnit)
          if (next.apiBaseUrl === '' && savedBase) next.apiBaseUrl = String(savedBase)
          return next
        })
      }, [quotaPerUnit, savedBase])

      const update = (field) => (event) => {
        const value = event.target.value
        setForm((current) => ({ ...current, [field]: value }))
      }

      const save = async () => {
        setBusy(true)
        setNotice('')
        try {
          const body = {}
          for (const field of ['apiBaseUrl', 'apiKey', 'cookie', 'accessToken', 'userId', 'quotaPerUnit', 'currency']) {
            const value = form[field].trim()
            if (value !== '') body[field] = value
          }
          if (Object.keys(body).length > 0) {
            await request('/relay-balance/credential', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            })
          }
          const next = await request('/relay-balance/refresh', { method: 'POST' })
          setSnapshot(next)
          setForm({
            apiBaseUrl: next.credential && next.credential.apiBaseUrl ? String(next.credential.apiBaseUrl) : '',
            apiKey: '',
            cookie: '',
            accessToken: '',
            userId: '',
            quotaPerUnit: next.credential && next.credential.quotaPerUnit ? String(next.credential.quotaPerUnit) : '',
            currency: next.credential && next.credential.currency ? String(next.credential.currency) : '',
          })
          setNotice(t('saved'))
        } catch (error) {
          setNotice(`${t('failed')}: ${String((error && error.message) || error)}`)
        } finally {
          setBusy(false)
        }
      }

      const refresh = async () => {
        setBusy(true)
        setNotice('')
        try {
          setSnapshot(await request('/relay-balance/refresh', { method: 'POST' }))
        } catch (error) {
          setNotice(`${t('failed')}: ${String((error && error.message) || error)}`)
        } finally {
          setBusy(false)
        }
      }

      // Saves what is typed, then re-probes the site from scratch and reports
      // which credential fields it actually reads.
      const test = async () => {
        setBusy(true)
        setNotice('')
        try {
          const body = {}
          for (const field of ['apiBaseUrl', 'apiKey', 'cookie', 'accessToken', 'userId', 'quotaPerUnit', 'currency']) {
            const value = form[field].trim()
            if (value !== '') body[field] = value
          }
          if (Object.keys(body).length > 0) {
            await request('/relay-balance/credential', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            })
          }
          const result = await request('/relay-balance/test', { method: 'POST' })
          setProbe(result)
          setNotice('')
          load()
        } catch (error) {
          setProbe({ status: 'error', errors: [{ code: 'TEST_FAILED', message: String((error && error.message) || error) }] })
        } finally {
          setBusy(false)
        }
      }

      const credential = snapshot.credential || {}
      const sign = currencySign(snapshot.currency || '')
      const usage = snapshot.usage
      const balance = snapshot.balance
      const updated = formatTime(snapshot.updatedAt)
      const status = statusInfo(snapshot, t)
      const official = officialSummary(snapshot.official)

      const field = (key, label, hint, options) => h('div', { className: 'rb-field', key },
        h('label', { className: 'rb-field-label' }, label),
        h('input', {
          className: 'rb-input',
          type: (options && options.secret) ? 'password' : 'text',
          value: form[key],
          placeholder: (options && options.placeholder) || '',
          onChange: update(key),
          spellCheck: false,
          autoComplete: 'off',
          'aria-label': label,
        }),
        hint ? h('p', { className: 'rb-hint' }, hint) : null)

      const tag = (text, tone) => h('span', { className: 'rb-tag', 'data-tone': tone || 'muted' }, text)

      const heroCell = (label, value, note, exact) => h('div', { className: 'rb-hero-cell' },
        h('span', { className: 'rb-hero-label' }, label),
        h('span', { className: 'rb-hero-value', title: exact || undefined }, value),
        h('span', { className: 'rb-hero-note' }, note))

      return h('div', { className: 'rb-page' },
        h('p', { className: 'rb-lead' }, t('hint')),

        h('section', { className: 'rb-section' },
          h('div', { className: 'rb-headline' }, t('overview')),
          h('div', { className: 'rb-hero' },
            heroCell(t('officialBalance'), `${official.sign}${official.text}`,
              official.state === 'ok'
                ? (official.detail ? `${t('bonus')} ${official.detail}` : t('signedIn'))
                : t('officialSignedOut'),
              official.exact),
            h('div', { className: 'rb-hero-sep' }),
            heroCell(t('relayBalance'), balance ? `${sign}${formatAmount(balance.remaining)}` : '—',
              usage ? `${t('used')} ${sign}${formatAmount(usage.amount)}` : t('needSession'),
              balance && balance.remaining !== null ? `${sign}${formatPrecise(balance.remaining)}` : '')),
          h('div', { className: 'rb-list' },
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('usage')),
              h('span', {
                className: 'rb-item-v',
                title: usage ? `${sign}${formatPrecise(usage.amount)}` : undefined,
              }, usage ? `${sign}${formatAmount(usage.amount)}` : '—')),
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('updated')),
              h('span', { className: 'rb-item-v' }, updated || t('never'))),
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('status')),
              h('span', { className: 'rb-item-v', style: { display: 'inline-flex', alignItems: 'center', gap: '7px' } },
                h('span', { className: 'rb-dot', 'data-state': status.tone }),
                status.text)),
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('provider')),
              h('span', { className: 'rb-item-v' },
                snapshot.providerLabel
                  ? tag(snapshot.providerLabel, 'ok')
                  : tag(snapshot.provider ? snapshot.provider : t('providerUnknown'),
                    snapshot.status === 'ok' || snapshot.status === 'partial' ? 'muted' : 'warn'),
                snapshot.account ? ' ' : null,
                snapshot.account ? tag(snapshot.account, 'muted') : null)),
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('runtime')),
              h('span', { className: 'rb-item-v' },
                tag(`v${MODULE_VERSION}`, 'muted'),
                '  ',
                tag(blurSupport() ? t('blurYes') : t('blurNo'), blurSupport() ? 'ok' : 'warn'),
                ' ',
                tag(glassSupported() ? t('refractYes') : t('refractNo'), glassSupported() ? 'ok' : 'muted'))),
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('credential')),
              h('span', { className: 'rb-item-v' },
                tag(`${t('apiKey')} · ${credential.hasApiKey ? t('configured') : t('notConfigured')}`, credential.hasApiKey ? 'ok' : 'warn'),
                '  ',
                tag(`${t('cookie')} · ${credential.hasCookie || credential.hasAccessToken ? t('configured') : t('notConfigured')}`,
                  credential.hasCookie || credential.hasAccessToken ? 'ok' : 'warn'))))),

        h('section', { className: 'rb-section' },
          h('div', { className: 'rb-headline' }, t('floatingSection')),
          h('div', { className: 'rb-list' },
            h('div', { className: 'rb-item' },
              h('span', { className: 'rb-item-k' }, t('cardShow')),
              h('button', {
                type: 'button',
                className: 'rb-switch',
                'data-on': card.visible ? 'true' : 'false',
                'aria-pressed': card.visible ? 'true' : 'false',
                'aria-label': t('cardShow'),
                onClick: () => updateCard({ visible: !card.visible }),
              }, h('span', { className: 'rb-knob' })))),
          h('p', { className: 'rb-hint' }, t('cardHint'))),

        h('section', { className: 'rb-section' },
          h('div', { className: 'rb-headline' }, t('credentialSection')),
          h('div', { className: 'rb-form' },
            field('apiBaseUrl', t('apiBaseUrl'), t('apiBaseUrlHint'), { placeholder: 'https://relay.example.com' }),
            field('apiKey', t('apiKey'), t('apiKeyHint'), { secret: true }),
            field('cookie', t('cookie'), t('cookieHint'), { secret: true }),
            field('accessToken', t('accessToken'), t('accessTokenHint'), { secret: true }),
            field('userId', t('userId'), t('userIdHint')),
            field('quotaPerUnit', t('quotaPerUnit'), t('quotaPerUnitHint')),
            field('currency', t('currency'), t('currencyHint'), { placeholder: 'CNY / USD' })),
          h('div', { className: 'rb-actions' },
            h('button', {
              type: 'button',
              className: 'rb-btn rb-btn--primary',
              onClick: save,
              disabled: busy,
            }, busy ? t('saving') : t('save')),
            h('button', { type: 'button', className: 'rb-btn', onClick: test, disabled: busy }, t('test')),
            h('button', { type: 'button', className: 'rb-btn', onClick: refresh, disabled: busy }, t('refresh')),
            notice ? h('span', { className: 'rb-hint' }, notice) : null)),
          probe ? h('div', { className: 'rb-probe' },
            h('div', { className: 'rb-probe-head' },
              h('span', { className: 'rb-dot', 'data-state': probe.providerLabel ? 'ok' : 'error' }),
              h('b', null, probe.providerLabel
                ? `${t('detected')}: ${probe.providerLabel}`
                : t('notDetected'))),
            probe.account ? h('div', { className: 'rb-probe-row' }, `${t('account')}: ${probe.account}`) : null,
            // Which fields this site reads, so the form stops being guesswork.
            probe.uses && probe.uses.length > 0
              ? h('div', { className: 'rb-probe-row' },
                `${t('neededFields')}: ${probe.uses.map((key) => t(`field.${key}`) || key).join('、')}`)
              : null,
            probe.optional && probe.optional.length > 0
              ? h('div', { className: 'rb-probe-row rb-probe-muted' },
                `${t('optionalFields')}: ${probe.optional.map((key) => t(`field.${key}`) || key).join('、')}`)
              : null,
            probe.providerLabel
              ? h('div', { className: 'rb-probe-row rb-probe-muted' },
                `${t('readable')}: ${[
                  probe.hasBalance ? t('balance') : null,
                  probe.hasUsage ? t('usage') : null,
                ].filter(Boolean).join(' + ') || '—'}`)
              : null,
            (probe.errors || []).length > 0
              ? h('div', { className: 'rb-probe-row rb-probe-error' }, probe.errors[0].message)
              : null,
            probe.providerLabel && probe.status !== 'ok'
              ? h('div', { className: 'rb-probe-row rb-probe-muted' }, t('partialHint'))
              : null) : null)
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => injectStyles(), 'relay-balance: styles')
        ctx.effect(() => ctx.locale.register('relay.balance', { en, zh }), 'relay-balance: dictionaries')
        const t = ctx.locale.bind('relay.balance')
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'relay-balance',
          order: 16,
          label: () => t('nav'),
          inject: () => ({ t }),
        }, RelayBalanceSection))
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'relay-balance-card',
          order: 120,
          inject: () => ({ t }),
        }, RelayBalanceCard))
      },
    }
  },
})
