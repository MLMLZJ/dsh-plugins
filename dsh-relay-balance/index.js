/**
 * Host half of the relay-balance bundle.
 *
 * Aggregates two unrelated balance sources for the Web page:
 *
 * - The official DeepSeek account, through `ctx.deepseekAccount` (profile and
 *   recharge/bonus wallets), so the page never talks to the platform directly.
 * - A third-party OpenAI-compatible relay:
 *     GET /v1/dashboard/billing/usage  - usage in cents of the site currency
 *     GET /api/user/self               - new-api user record (quota/used_quota)
 *
 * Loopback-only routes expose a snapshot, accept a credential update, and force
 * a refresh. Relay secrets are written with 0600 permissions under
 * `$DSH_HOME/relay-balance/credential.json` and are never returned to the page.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { detectProvider, normalizeBase, numberOrUndefined } from './providers.js'

export const name = 'dsh-relay-balance'
export const inject = ['webServer', 'credentials']

const DEFAULTS = {
  apiBaseUrl: '',
  quotaPerUnit: 500000,
  refreshMs: 60000,
  timeoutMs: 15000,
}

const CREDENTIAL_FIELDS = ['apiBaseUrl', 'apiKey', 'cookie', 'accessToken', 'userId', 'quotaPerUnit', 'currency']
const MAX_BODY_BYTES = 16 * 1024
const PLUGIN_VERSION = '3.5.1'

function stateRoot() {
  const home = process.env.DSH_HOME && process.env.DSH_HOME.trim() !== ''
    ? process.env.DSH_HOME
    : join(homedir(), '.dsh')
  return join(home, 'relay-balance')
}

function baseUrlOf(value) {
  return normalizeBase(value)
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

export function apply(ctx, config = {}) {
  const settings = { ...DEFAULTS, ...(config || {}) }
  const root = stateRoot()
  const credentialPath = join(root, 'credential.json')

  let credential = {}

  /** Relay origin: the value saved in Settings beats the plugin Config. */
  function relayBase() {
    return baseUrlOf(credential.apiBaseUrl) || baseUrlOf(settings.apiBaseUrl)
  }
  let snapshot = { status: 'loading', updatedAt: null }
  let refreshedAt = 0
  let inFlight = null
  let disposed = false
  let resolvedKeyCache = { value: '', at: 0 }

  async function loadCredential() {
    credential = await readJsonFile(credentialPath)
  }

  /** The usage key: an explicit one, the ambient env var, else the DSH credential route. */
  async function apiKeyOf() {
    const stored = typeof credential.apiKey === 'string' ? credential.apiKey.trim() : ''
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

  /**
   * Ask the provider adapters what this site is and how much money is left.
   * Returns the normalised result, or a reason why every adapter declined.
   */
  async function fetchRelay() {
    const timeoutMs = settings.timeoutMs
    const quotaPerUnit = numberOrUndefined(credential.quotaPerUnit) ?? numberOrUndefined(settings.quotaPerUnit) ?? DEFAULTS.quotaPerUnit
    const detected = await detectProvider({
      apiBaseUrl: relayBase(),
      apiKey: await apiKeyOf(),
      cookie: typeof credential.cookie === 'string' ? credential.cookie.trim() : '',
      accessToken: typeof credential.accessToken === 'string' ? credential.accessToken.trim() : '',
      userId: typeof credential.userId === 'string' ? credential.userId.trim() : '',
      quotaPerUnit,
      timeoutMs,
    })
    return detected
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

  async function credentialView() {
    return {
      apiBaseUrl: relayBase(),
      hasApiKey: (await apiKeyOf()) !== '',
      hasStoredApiKey: typeof credential.apiKey === 'string' && credential.apiKey.trim() !== '',
      hasCookie: typeof credential.cookie === 'string' && credential.cookie.trim() !== '',
      hasAccessToken: typeof credential.accessToken === 'string' && credential.accessToken.trim() !== '',
      userId: typeof credential.userId === 'string' ? credential.userId : '',
      currency: typeof credential.currency === 'string' ? credential.currency : '',
      quotaPerUnit: numberOrUndefined(credential.quotaPerUnit) ?? numberOrUndefined(settings.quotaPerUnit) ?? DEFAULTS.quotaPerUnit,
    }
  }

  async function refresh() {
    if (inFlight) return inFlight
    const base = relayBase()
    inFlight = (async () => {
      const errors = []
      let usage = null
      let balance = null
      let provider = 'new-api'
      let stats = null
      let detectedCurrency = ''
      let accountName = null
      if (base === '') {
        const officialOnly = await fetchOfficial()
        refreshedAt = Date.now()
        snapshot = {
          status: 'idle',
          missing: { apiBaseUrl: true, apiKey: true, session: true },
          currency: typeof credential.currency === 'string' ? credential.currency : (typeof settings.currency === 'string' ? settings.currency : ''),
          official: officialOnly,
          apiBaseUrl: '',
          usage: null,
          balance: null,
          credential: await credentialView(),
          updatedAt: refreshedAt,
          error: null,
          errors,
        }
        return snapshot
      }
      // Hand the site to the provider adapters: they probe in order of specificity
      // and the first one that recognises it wins. A provider that reports an
      // explicit error (bad key, missing balance credential) stops the probe run.
      const detected = await fetchRelay().catch((error) => ({
        adapter: null,
        result: null,
        errors: [{ code: 'PROBE_FAILED', message: String((error && error.message) || error) }],
      }))
      if (detected.result) {
        provider = detected.result.provider
        usage = detected.result.usage
        balance = detected.result.balance
        stats = detected.result.stats
        detectedCurrency = detected.result.currency || ''
        accountName = detected.result.account || null
      }
      for (const error of detected.errors || []) errors.push(error)
      const official = await fetchOfficial()

      refreshedAt = Date.now()
      const anyError = errors.length > 0
      const anyValue = Boolean(usage || balance)
      const hasKey = (await apiKeyOf()) !== ''
      const hasPanelCredential = Boolean(credential.cookie || credential.accessToken)
      const missing = {
        apiKey: !hasKey,
        session: provider === 'new-api' && balance === null && !hasPanelCredential,
      }
      snapshot = {
        status: detected.adapter
          ? (anyError || missing.apiKey || missing.session ? 'partial' : 'ok')
          : anyError ? 'error' : 'idle',
        missing,
        provider,
        providerLabel: detected.adapter ? detected.adapter.label : null,
        account: accountName,
        stats,
        // Priority: an explicit user override, then whatever the adapter detected,
        // then the plugin-level default. Keeping the adapter value here means a
        // site that reports its own unit (sub2api `unit`, new-api `balance_unit`)
        // renders the right symbol without any configuration.
        currency: typeof credential.currency === 'string' && credential.currency !== ''
          ? credential.currency
          : (detectedCurrency !== ''
            ? detectedCurrency
            : (typeof settings.currency === 'string' ? settings.currency : '')),
        official,
        apiBaseUrl: base,
        usage,
        balance,
        credential: await credentialView(),
        updatedAt: refreshedAt,
        error: errors[0] || null,
        errors,
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
    return { ...snapshot, credential: await credentialView() }
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

    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/relay-balance/credential',
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
          const next = { ...credential }
          for (const field of CREDENTIAL_FIELDS) {
            if (!Object.prototype.hasOwnProperty.call(body, field)) continue
            const value = body[field]
            if (value === null) {
              delete next[field]
              continue
            }
            let text = String(value).trim()
            if (text.toLowerCase().startsWith('cookie:')) text = text.slice(7).trim()
            if (field === 'cookie' && text !== '' && !text.includes('=')) text = `session=${text}`
            if (field === 'apiBaseUrl' && text !== '' && !/^https?:\/\//i.test(text)) {
              throw new Error('BASE_URL_INVALID')
            }
            if (text === '') delete next[field]
            else next[field] = text
          }
          credential = next
          await mkdir(root, { recursive: true, mode: 0o700 })
          await writeJsonFile(credentialPath, credential)
          refreshedAt = 0
          reply(res, 200, { saved: true, credential: await credentialView() })
        } catch (error) {
          const code = String((error && error.message) || error)
          const message = code === 'BODY_NOT_JSON' ? '请求体不是 JSON'
            : code === 'BASE_URL_INVALID' ? '中转站地址需以 http:// 或 https:// 开头'
            : code
          reply(res, 400, { error: { code, message } })
        }
      },
    }), 'relay-balance: credential route')

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
          reply(res, 200, await refresh())
        } catch (error) {
          reply(res, 500, { error: { code: 'REFRESH_FAILED', message: String((error && error.message) || error) } })
        }
      },
    }), 'relay-balance: refresh route')

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
    loadCredential()
      .then(() => refresh())
      .catch(() => {})
    return () => {
      disposed = true
    }
  }, 'relay-balance: initial read')
}
