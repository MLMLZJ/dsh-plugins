/**
 * Host half of the relay-balance bundle.
 *
 * Aggregates two unrelated balance sources for the Web page:
 *
 * - The official DeepSeek account, through `ctx.deepseekAccount` (profile and
 *   recharge/bonus wallets), so the page never talks to the platform directly.
 * - One or more third-party OpenAI-compatible relay sites, each handled by the
 *   provider adapters in `providers.js`.
 *
 * Loopback-only routes expose a snapshot, accept site edits, and force a
 * refresh. Relay secrets are written with 0600 permissions under
 * `$DSH_HOME/relay-balance/sites.json` and are never returned to the page: the
 * snapshot carries booleans such as `hasApiKey`, never the values themselves.
 *
 * Multiple sites are stored together; `activeId` picks the one the card leads
 * with. A single-site `credential.json` from older versions is migrated on first
 * load and left on disk untouched.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { createDetectorCache, normalizeBase, numberOrUndefined } from './providers.js'

export const name = 'dsh-relay-balance'
export const inject = ['webServer', 'credentials']

const DEFAULTS = {
  apiBaseUrl: '',
  quotaPerUnit: 500000,
  refreshMs: 60000,
  timeoutMs: 15000,
}

/** Editable per-site fields. `id` is assigned by the Host and never accepted from the page. */
const SITE_FIELDS = [
  'name',
  'apiBaseUrl',
  'apiKey',
  'cookie',
  'accessToken',
  'userId',
  'quotaPerUnit',
  'currency',
  'lowBalanceThreshold',
]

/** Legacy single-site credential fields, used only when migrating. */
const LEGACY_FIELDS = ['apiBaseUrl', 'apiKey', 'cookie', 'accessToken', 'userId', 'quotaPerUnit', 'currency']

const MAX_BODY_BYTES = 16 * 1024
const PLUGIN_VERSION = '3.8.0'
const STORE_VERSION = 2

function stateRoot() {
  const home = process.env.DSH_HOME && process.env.DSH_HOME.trim() !== ''
    ? process.env.DSH_HOME
    : join(homedir(), '.dsh')
  return join(home, 'relay-balance')
}

function baseUrlOf(value) {
  return normalizeBase(value)
}

function textOf(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/** A short, human-readable label derived from the address, used until the user renames it. */
function defaultSiteName(base) {
  try {
    return new URL(base).hostname.replace(/^(www|api)\./i, '')
  } catch {
    return base || '中转站'
  }
}

function newSiteId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function isLoopback(req) {
  const address = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : ''
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

async function readJsonFile(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return {}
  }
}

async function writeJsonFile(path, value) {
  const temporary = `${path}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await rename(temporary, path)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('BODY_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (text === '') {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(text)
        resolve(parsed && typeof parsed === 'object' ? parsed : {})
      } catch {
        reject(new Error('BODY_NOT_JSON'))
      }
    })
    req.on('error', reject)
  })
}

function reply(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** Apply the normalisation every incoming credential value gets, whatever the route. */
function cleanField(field, raw) {
  let text = String(raw).trim()
  if (text.toLowerCase().startsWith('cookie:')) text = text.slice(7).trim()
  if (field === 'cookie' && text !== '' && !text.includes('=')) text = `session=${text}`
  if (field === 'apiBaseUrl' && text !== '' && !/^https?:\/\//i.test(text)) {
    throw new Error('BASE_URL_INVALID')
  }
  if ((field === 'quotaPerUnit' || field === 'lowBalanceThreshold') && text !== '') {
    const parsed = Number(text)
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error('NUMBER_INVALID')
  }
  return text
}

/** Merge incoming fields into a site, treating an empty string as "remove". */
function applySiteFields(site, body) {
  const next = { ...site }
  for (const field of SITE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue
    const raw = body[field]
    if (raw === null) {
      delete next[field]
      continue
    }
    const text = cleanField(field, raw)
    if (text === '') delete next[field]
    else next[field] = text
  }
  if (!textOf(next.name)) {
    const base = baseUrlOf(next.apiBaseUrl)
    if (base !== '') next.name = defaultSiteName(base)
  }
  return next
}

export function apply(ctx, config = {}) {
  const settings = { ...DEFAULTS, ...(config || {}) }
  const root = stateRoot()
  const storePath = join(root, 'sites.json')
  const legacyPath = join(root, 'credential.json')

  let store = { version: STORE_VERSION, activeId: '', sites: [] }
  // One detector per site: the memoised adapter is a property of that site, and
  // sharing a single cache would make two sites evict each other every refresh.
  const detectors = new Map()
  let snapshot = { status: 'loading', updatedAt: null, sites: [], official: null }
  let refreshedAt = 0
  let inFlight = null
  let disposed = false
  let resolvedKeyCache = { value: '', at: 0 }

  function detectorFor(siteId) {
    let detector = detectors.get(siteId)
    if (!detector) {
      detector = createDetectorCache()
      detectors.set(siteId, detector)
    }
    return detector
  }

  function siteById(id) {
    return store.sites.find((site) => site.id === id) || null
  }

  function activeSite() {
    return siteById(store.activeId) || store.sites[0] || null
  }

  async function saveStore() {
    await mkdir(root, { recursive: true, mode: 0o700 })
    await writeJsonFile(storePath, store)
  }

  /**
   * Load sites.json, or migrate a v1 credential.json into a single site.
   * The legacy file is never rewritten or deleted, so a bad migration can always
   * be undone by hand.
   */
  async function loadStore() {
    const saved = await readJsonFile(storePath)
    if (Array.isArray(saved.sites) && saved.sites.length > 0) {
      const sites = saved.sites
        .filter((site) => site && typeof site === 'object')
        .map((site) => ({ ...site, id: textOf(site.id) || newSiteId() }))
      store = {
        version: STORE_VERSION,
        activeId: textOf(saved.activeId) || sites[0].id,
        sites,
      }
      if (!siteById(store.activeId)) store.activeId = sites[0].id
      return
    }

    const legacy = await readJsonFile(legacyPath)
    const base = baseUrlOf(legacy.apiBaseUrl) || baseUrlOf(settings.apiBaseUrl)
    const hasLegacy = LEGACY_FIELDS.some((field) => textOf(legacy[field]) !== '')
    if (base === '' && !hasLegacy) {
      store = { version: STORE_VERSION, activeId: '', sites: [] }
      return
    }

    const migrated = { id: newSiteId(), name: defaultSiteName(base) }
    for (const field of LEGACY_FIELDS) {
      const value = textOf(legacy[field])
      if (value !== '') migrated[field] = value
    }
    if (base !== '') migrated.apiBaseUrl = base
    store = { version: STORE_VERSION, activeId: migrated.id, sites: [migrated] }
    await saveStore()
  }

  /** The usage key: the site's own, else the ambient env var, else the DSH credential route. */
  async function apiKeyOf(site) {
    const stored = textOf(site && site.apiKey)
    if (stored !== '') return stored
    const fromEnv = process.env.DEEPSEEK_CLASH_API_KEY
    if (fromEnv && fromEnv.trim() !== '') return fromEnv.trim()
    if (Date.now() - resolvedKeyCache.at < 30000) return resolvedKeyCache.value
    let value = ''
    try {
      const resolved = typeof ctx.credentials?.resolve === 'function'
        ? await ctx.credentials.resolve('DEEPSEEK_CLASH_API_KEY')
        : undefined
      value = resolved && typeof resolved.value === 'string' ? resolved.value.trim() : ''
    } catch {
      value = ''
    }
    resolvedKeyCache = { value, at: Date.now() }
    return value
  }

  function optionsOf(site, apiKey) {
    return {
      apiBaseUrl: baseUrlOf(site.apiBaseUrl) || baseUrlOf(settings.apiBaseUrl),
      apiKey,
      cookie: textOf(site.cookie),
      accessToken: textOf(site.accessToken),
      userId: textOf(site.userId),
      quotaPerUnit: numberOrUndefined(site.quotaPerUnit)
        ?? numberOrUndefined(settings.quotaPerUnit)
        ?? DEFAULTS.quotaPerUnit,
      timeoutMs: settings.timeoutMs,
    }
  }

  /** Official DeepSeek wallets, read through the account service so the Host owns the grant. */
  async function fetchOfficial() {
    const account = typeof ctx.get === 'function' ? ctx.get('deepseekAccount') : undefined
    if (!account) return { state: 'unavailable', error: { code: 'ACCOUNT_SERVICE', message: '未安装 DeepSeek 账号服务' } }
    try {
      const view = await account.getState()
      if (!view || view.status !== 'credential-stored') return { state: 'signed-out' }
      const balance = await account.getBalance({
        version: PLUGIN_VERSION,
        locale: 'zh',
        timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
      })
      if (!balance) return { state: 'signed-out' }
      if (balance.status !== 'ready') {
        return { state: 'error', error: { code: 'OFFICIAL_BALANCE', message: '官方余额查询失败' } }
      }
      return {
        state: 'ok',
        wallets: balance.value.map((wallet) => ({ currency: wallet.currency, balance: wallet.balance })),
        bonusWallets: balance.bonusWallets.map((wallet) => ({ currency: wallet.currency, balance: wallet.balance })),
      }
    } catch (error) {
      return { state: 'error', error: { code: 'OFFICIAL_FAILED', message: String((error && error.message) || error) } }
    }
  }

  /**
   * Read one site and return the page-facing view of it.
   * Never includes a secret: only booleans describing what is configured.
   */
  async function readSite(site, { force = false } = {}) {
    const apiKey = await apiKeyOf(site)
    const base = optionsOf(site, apiKey).apiBaseUrl
    const errors = []
    let view = {
      id: site.id,
      name: textOf(site.name) || defaultSiteName(base),
      apiBaseUrl: base,
      status: 'idle',
      provider: null,
      providerLabel: null,
      account: null,
      currency: textOf(site.currency) || textOf(settings.currency) || '',
      balance: null,
      usage: null,
      stats: null,
      guidance: null,
      threshold: numberOrUndefined(site.lowBalanceThreshold) ?? 0,
      low: false,
      hasApiKey: apiKey !== '',
      hasStoredApiKey: textOf(site.apiKey) !== '',
      hasCookie: textOf(site.cookie) !== '',
      hasAccessToken: textOf(site.accessToken) !== '',
      userId: textOf(site.userId),
      quotaPerUnit: numberOrUndefined(site.quotaPerUnit)
        ?? numberOrUndefined(settings.quotaPerUnit)
        ?? DEFAULTS.quotaPerUnit,
      updatedAt: Date.now(),
      error: null,
      errors,
    }

    if (base === '') {
      view.status = 'idle'
      errors.push({ code: 'NO_BASE', message: '还没有填写站点地址' })
      view.error = errors[0]
      return view
    }

    const detected = await detectorFor(site.id).detect(optionsOf(site, apiKey), { force })
      .catch((error) => ({
        adapter: null,
        result: null,
        errors: [{ code: 'PROBE_FAILED', message: String((error && error.message) || error) }],
      }))

    for (const error of detected.errors || []) errors.push(error)

    if (detected.result) {
      view.provider = detected.result.provider
      view.providerLabel = detected.adapter ? detected.adapter.label : null
      view.account = detected.result.account || null
      view.balance = detected.result.balance
      view.usage = detected.result.usage
      view.stats = detected.result.stats
      if (detected.adapter) {
        view.guidance = {
          uses: detected.adapter.uses || [],
          optional: detected.adapter.optional || [],
        }
      }
      // Priority: the per-site override, then what the adapter detected, then the
      // plugin default. Adapters that report their own unit (sub2api `unit`,
      // new-api `balance_unit`) therefore render the right symbol unconfigured.
      if (textOf(site.currency) === '' && detected.result.currency) {
        view.currency = detected.result.currency
      }
    }

    const missingSession = view.provider === 'new-api' && view.balance === null && !view.hasCookie && !view.hasAccessToken
    view.status = detected.adapter
      ? (errors.length > 0 || !view.hasApiKey || missingSession ? 'partial' : 'ok')
      : errors.length > 0 ? 'error' : 'idle'
    view.error = errors[0] || null

    // Low-balance warning: only meaningful once a threshold and a balance exist.
    const remaining = view.balance ? numberOrUndefined(view.balance.remaining) : undefined
    view.low = Boolean(view.threshold > 0 && remaining !== undefined && remaining <= view.threshold)

    return view
  }

  async function refresh({ force = false } = {}) {
    if (inFlight) return inFlight
    inFlight = (async () => {
      const official = await fetchOfficial()
      const sites = await Promise.all(store.sites.map((site) => readSite(site, { force })))

      refreshedAt = Date.now()
      const withBalance = sites.filter((site) => site.status === 'ok')
      const status = sites.length === 0
        ? 'idle'
        : withBalance.length === sites.length ? 'ok'
          : withBalance.length > 0 ? 'partial'
            : sites.some((site) => site.status === 'partial') ? 'partial' : 'error'

      snapshot = {
        status,
        updatedAt: refreshedAt,
        activeId: activeSite() ? activeSite().id : '',
        official,
        sites,
        anyLow: sites.some((site) => site.low),
      }
      return snapshot
    })()
    try {
      return await inFlight
    } finally {
      inFlight = null
    }
  }

  async function statePayload() {
    if (Date.now() - refreshedAt > Math.max(5000, Number(settings.refreshMs) || DEFAULTS.refreshMs)) {
      await refresh()
    }
    return { ...snapshot, activeId: activeSite() ? activeSite().id : '' }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/relay-balance/state',
      handler: async (req, res) => {
        if (!isLoopback(req)) {
          reply(res, 403, { error: { code: 'FORBIDDEN', message: 'loopback only' } })
          return
        }
        if (req.method !== 'GET') {
          reply(res, 405, { error: { code: 'METHOD', message: 'GET only' } })
          return
        }
        try {
          reply(res, 200, await statePayload())
        } catch (error) {
          reply(res, 500, { error: { code: 'STATE_FAILED', message: String((error && error.message) || error) } })
        }
      },
    }), 'relay-balance: state route')

    // Site management: save (create or update), delete, activate.
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/relay-balance/site',
      handler: async (req, res) => {
        if (!isLoopback(req)) {
          reply(res, 403, { error: { code: 'FORBIDDEN', message: 'loopback only' } })
          return
        }
        if (req.method !== 'POST') {
          reply(res, 405, { error: { code: 'METHOD', message: 'POST only' } })
          return
        }
        try {
          const body = await readBody(req)
          const action = textOf(body.action) || 'save'
          const id = textOf(body.id)

          if (action === 'delete') {
            if (id === '') throw new Error('SITE_ID_REQUIRED')
            store.sites = store.sites.filter((site) => site.id !== id)
            detectors.delete(id)
            if (!siteById(store.activeId)) store.activeId = store.sites[0] ? store.sites[0].id : ''
            await saveStore()
            refreshedAt = 0
            reply(res, 200, { saved: true, deleted: id, activeId: store.activeId })
            return
          }

          if (action === 'activate') {
            if (!siteById(id)) throw new Error('SITE_NOT_FOUND')
            store.activeId = id
            await saveStore()
            reply(res, 200, { saved: true, activeId: store.activeId })
            return
          }

          // save
          if (id !== '' && !siteById(id)) throw new Error('SITE_NOT_FOUND')
          const existing = id !== '' ? siteById(id) : { id: newSiteId() }
          const next = applySiteFields(existing, body)
          if (baseUrlOf(next.apiBaseUrl) === '') throw new Error('BASE_URL_INVALID')

          if (id !== '') {
            store.sites = store.sites.map((site) => (site.id === id ? next : site))
          } else {
            store.sites = [...store.sites, next]
          }
          if (store.activeId === '' || store.activeId === id) store.activeId = next.id
          // The address or key changed, so whatever we memoised about this site is stale.
          detectorFor(next.id).invalidate()
          await saveStore()
          refreshedAt = 0
          const view = await readSite(next, { force: true })
          reply(res, 200, { saved: true, site: view, activeId: store.activeId })
          return
        } catch (error) {
          const code = String((error && error.message) || error)
          const message = code === 'BODY_NOT_JSON' ? '请求体不是 JSON'
            : code === 'BASE_URL_INVALID' ? '站点地址需以 http:// 或 https:// 开头'
              : code === 'NUMBER_INVALID' ? '数值字段必须是非负数字'
                : code === 'SITE_NOT_FOUND' ? '找不到该站点'
                  : code === 'SITE_ID_REQUIRED' ? '缺少站点 ID'
                    : code
          reply(res, 400, { error: { code, message } })
        }
      },
    }), 'relay-balance: site route')

    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/relay-balance/refresh',
      handler: async (req, res) => {
        if (!isLoopback(req)) {
          reply(res, 403, { error: { code: 'FORBIDDEN', message: 'loopback only' } })
          return
        }
        if (req.method !== 'POST') {
          reply(res, 405, { error: { code: 'METHOD', message: 'POST only' } })
          return
        }
        try {
          refreshedAt = 0
          reply(res, 200, await refresh({ force: true }))
        } catch (error) {
          reply(res, 500, { error: { code: 'REFRESH_FAILED', message: String((error && error.message) || error) } })
        }
      },
    }), 'relay-balance: refresh route')

    /**
     * Test a draft without saving it: the page sends the form as-is, or just a
     * site id to re-probe a stored one.
     */
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/relay-balance/test',
      handler: async (req, res) => {
        if (!isLoopback(req)) {
          reply(res, 403, { error: { code: 'FORBIDDEN', message: 'loopback only' } })
          return
        }
        if (req.method !== 'POST') {
          reply(res, 405, { error: { code: 'METHOD', message: 'POST only' } })
          return
        }
        try {
          const body = await readBody(req)
          const id = textOf(body.id)
          const stored = id !== '' ? siteById(id) : null
          const draft = applySiteFields(stored || { id: 'draft' }, body)
          if (baseUrlOf(draft.apiBaseUrl) === '') throw new Error('BASE_URL_INVALID')

          if (stored) detectorFor(stored.id).invalidate()
          const view = await readSite(draft, { force: true })

          reply(res, 200, {
            status: view.status,
            provider: view.provider,
            providerLabel: view.providerLabel,
            account: view.account,
            currency: view.currency,
            uses: view.guidance ? view.guidance.uses : null,
            optional: view.guidance ? view.guidance.optional : null,
            balance: view.balance,
            hasBalance: Boolean(view.balance && view.balance.remaining !== null),
            hasUsage: Boolean(view.usage),
            errors: view.errors,
            error: view.error,
          })
        } catch (error) {
          const code = String((error && error.message) || error)
          const message = code === 'BODY_NOT_JSON' ? '请求体不是 JSON'
            : code === 'BASE_URL_INVALID' ? '站点地址需以 http:// 或 https:// 开头'
              : code
          reply(res, 400, { error: { code, message } })
        }
      },
    }), 'relay-balance: test route')

    webCtx.effect(() => {
      const timer = setInterval(() => {
        if (disposed) return
        refresh().catch(() => {})
      }, Math.max(10000, Number(settings.refreshMs) || DEFAULTS.refreshMs))
      return () => clearInterval(timer)
    }, 'relay-balance: refresh timer')
  })

  ctx.effect(() => {
    disposed = false
    loadStore()
      .then(() => refresh())
      .catch(() => {})
    return () => {
      disposed = true
    }
  }, 'relay-balance: initial read')
}
