/**
 * Relay provider adapters.
 *
 * Third-party relays expose wildly different APIs for "how much money is left".
 * Rather than branching on a brand name, each adapter here declares the probe it
 * answers and the normalised shape it produces; `detectProvider` runs them in
 * order and the first one that recognises the site wins.
 *
 * Every adapter returns the same normalised object, so the Host and the page stay
 * brand-agnostic:
 *
 *   {
 *     provider: 'sub2api' | 'new-api' | 'one-api' | 'openrouter' | 'generic',
 *     currency: 'USD' | 'CNY' | '',      // '' means "unknown, show bare numbers"
 *     balance: { remaining, used, listUsed, quota, usedQuota, perUnit },
 *     usage:   { cents, amount } | null,
 *     stats:   { today, todayRequests, total, totalRequests, listTotal, listToday, rpm, model } | null,
 *   }
 *
 * `remaining`/`used`/`total` are already in currency units. `quota`/`usedQuota`
 * stay as raw site units so a caller can show them when the site is quota-based.
 */

/** Coerce a value into a finite number, or undefined. */
export function numberOrUndefined(value) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const text = String(value).trim()
  if (text === '') return undefined
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function objectOrNull(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

/** Strip trailing slashes; the adapters build `${base}/path`. */
export function normalizeBase(value) {
  return String(value == null ? '' : value).trim().replace(/\/+$/, '')
}

/**
 * The site may be given as an OpenAI SDK base URL (`https://x/v1`) or as a bare
 * origin (`https://x`). Adapters want the origin, so peel a known suffix off.
 */
export function originOf(value) {
  const base = normalizeBase(value)
  return base.replace(/\/(v1|api\/v1)$/i, '')
}

const SUFFIX = {
  bearer: (key) => (key ? { authorization: `Bearer ${key}` } : {}),
  apiKey: (key) => (key ? { 'x-api-key': key } : {}),
  both: (key) => (key ? { authorization: `Bearer ${key}`, 'x-api-key': key } : {}),
}

async function requestJson(url, { headers, timeoutMs, method = 'GET', body }) {
  const init = {
    method,
    headers: { accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  }
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const response = await fetch(url, init)
  const text = await response.text().catch(() => '')
  let payload = null
  if (text.trim() !== '') {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }
  return { ok: response.ok, status: response.status, payload }
}

/* ────────────────────────────────────────────────────────────────────────────
 * sub2api (kakouai, and clones built on Wei-Shaw/sub2api)
 *
 *   GET /v1/usage  with the API key
 *   -> { remaining, balance, unit, isValid, mode, planName,
 *        usage: { today: {...}, total: {...}, rpm, tpm },
 *        daily_usage: [...], model_stats: [...] }
 *
 * Authenticated by the API key alone: no cookie, no JWT, never touches the
 * user's browser session. This is the richest adapter, so it goes first.
 * ──────────────────────────────────────────────────────────────────────────── */
export const sub2api = {
  id: 'sub2api',
  label: 'sub2api (kakouai 等)',
  needsKey: true,
  async detect({ base, apiKey, timeoutMs }) {
    if (!apiKey) return null
    const result = await requestJson(`${base}/v1/usage`, {
      headers: SUFFIX.bearer(apiKey),
      timeoutMs,
    }).catch(() => null)
    if (!result || !result.ok) return null
    const data = objectOrNull(result.payload?.data) ?? objectOrNull(result.payload)
    if (!data) return null
    const remaining = numberOrUndefined(data.remaining ?? data.balance)
    if (remaining === undefined) return null

    const gu = objectOrNull(data.usage)
    const today = objectOrNull(gu?.today)
    const total = objectOrNull(gu?.total)
    const listTotal = total ? numberOrUndefined(total.cost) : undefined
    const actualTotal = total ? numberOrUndefined(total.actual_cost) : undefined
    const listToday = today ? numberOrUndefined(today.cost) : undefined
    const actualToday = today ? numberOrUndefined(today.actual_cost) : undefined
    const models = Array.isArray(data.model_stats) ? data.model_stats : []

    return {
      provider: 'sub2api',
      currency: typeof data.unit === 'string' && data.unit.trim() !== '' ? data.unit.trim().toUpperCase() : 'USD',
      balance: {
        remaining,
        used: actualTotal === undefined ? null : actualTotal,
        listUsed: listTotal === undefined ? null : listTotal,
        quota: null,
        usedQuota: null,
        perUnit: 1,
      },
      usage: actualTotal === undefined ? null : { cents: actualTotal * 100, amount: actualTotal },
      stats: {
        today: actualToday ?? null,
        todayRequests: today ? (numberOrUndefined(today.requests) ?? null) : null,
        total: actualTotal ?? null,
        totalRequests: total ? (numberOrUndefined(total.requests) ?? null) : null,
        listTotal: listTotal ?? null,
        listToday: listToday ?? null,
        rpm: gu ? (numberOrUndefined(gu.rpm) ?? null) : null,
        model: models.length > 0 && typeof models[0]?.model === 'string' ? models[0].model : null,
      },
    }
  },
}

/* ────────────────────────────────────────────────────────────────────────────
 * OpenRouter-style key endpoint
 *
 *   GET /api/v1/key  with the API key
 *   -> { data: { label, usage, limit, limit_remaining, is_free_tier } }
 *
 * `limit: null` means an unlimited key, where only `usage` is meaningful.
 * ──────────────────────────────────────────────────────────────────────────── */
export const openrouter = {
  id: 'openrouter',
  label: 'OpenRouter',
  needsKey: true,
  async detect({ base, apiKey, timeoutMs }) {
    if (!apiKey) return null
    const result = await requestJson(`${base}/api/v1/key`, {
      headers: SUFFIX.bearer(apiKey),
      timeoutMs,
    }).catch(() => null)
    if (!result || !result.ok) return null
    const data = objectOrNull(result.payload?.data)
    if (!data) return null
    const usage = numberOrUndefined(data.usage)
    const limit = numberOrUndefined(data.limit)
    const remaining = numberOrUndefined(data.limit_remaining)
    if (usage === undefined && remaining === undefined) return null

    return {
      provider: 'openrouter',
      currency: 'USD',
      balance: {
        remaining: remaining ?? (limit !== undefined && usage !== undefined ? limit - usage : null),
        used: usage ?? null,
        listUsed: usage ?? null,
        quota: limit ?? null,
        usedQuota: usage ?? null,
        perUnit: 1,
      },
      usage: usage === undefined ? null : { cents: usage * 100, amount: usage },
      stats: null,
    }
  },
}

/* ────────────────────────────────────────────────────────────────────────────
 * new-api / one-api / veloera / done-hub and the many forks
 *
 *   GET /v1/dashboard/billing/usage   with the API key -> { total_usage } in cents
 *   GET /api/user/self                with a cookie or panel token -> { data: { quota, used_quota } }
 *   GET /v1/dashboard/billing/subscription -> { hard_limit_usd }  (some forks only)
 *
 * The usage endpoint is cent-based and nearly universal across this family, so it
 * doubles as the detection probe. Balance needs a panel credential, which is why
 * `quotaPerUnit` only applies here.
 * ──────────────────────────────────────────────────────────────────────────── */
export const newApi = {
  id: 'new-api',
  label: 'new-api / one-api 系列',
  needsKey: true,
  async detect({ base, apiKey, cookie, accessToken, userId, quotaPerUnit, timeoutMs }) {
    let usageAmount = null
    let usageState = 'absent'

    if (apiKey) {
      const usage = await requestJson(`${base}/v1/dashboard/billing/usage`, {
        headers: SUFFIX.bearer(apiKey),
        timeoutMs,
      }).catch(() => null)
      if (usage && usage.ok) {
        const total = numberOrUndefined(usage.payload?.total_usage)
        if (total !== undefined) {
          // new-api reports cents of the site currency.
          usageAmount = total / 100
          usageState = 'ok'
        }
      } else if (usage && (usage.status === 401 || usage.status === 403)) {
        usageState = 'unauthorized'
      }
    }

    let remaining = null
    let quota = null
    let usedQuota = null
    let siteBalance = null
    let siteUnit = ''
    let displayName = null
    let balanceState = 'absent'
    const headers = {}
    if (cookie) headers.cookie = cookie
    else if (accessToken) headers.authorization = `Bearer ${accessToken}`
    if (userId) headers['new-api-user'] = userId
    if (cookie || accessToken) {
      const self = await requestJson(`${base}/api/user/self`, { headers, timeoutMs }).catch(() => null)
      if (self && self.ok && self.payload?.success === true) {
        const data = objectOrNull(self.payload.data)
        if (data) {
          quota = numberOrUndefined(data.quota)
          usedQuota = numberOrUndefined(data.used_quota)
          if (typeof data.username === 'string' && data.username.trim() !== '') {
            displayName = data.username.trim()
          }
          // Newer forks pre-compute the balance and its unit; trust those over
          // dividing quota by a quotaPerUnit that may not match the site.
          siteBalance = numberOrUndefined(data.balance)
          if (typeof data.balance_unit === 'string') siteUnit = data.balance_unit.trim()

          if (siteBalance !== undefined) {
            remaining = siteBalance
            balanceState = 'ok'
          } else if (quota !== undefined) {
            remaining = quota / quotaPerUnit
            balanceState = 'ok'
          }
        }
      } else if (self && (self.status === 401 || self.status === 403)) {
        balanceState = 'unauthorized'
      }
    }

    // Nothing recognisable: not this family.
    if (usageState === 'absent' && balanceState === 'absent') return null
    if (usageState === 'unauthorized' && balanceState !== 'ok') {
      return { error: { code: 'KEY_UNAUTHORIZED', message: 'API Key 被拒绝：可能已失效、被禁用，或不是该站点的 Key' } }
    }

    // `balance_unit` is a symbol such as "$" or "¥"; map the common ones onto an
    // ISO code so the page and the currency override stay consistent.
    const UNIT_TO_ISO = { $: 'USD', 'US$': 'USD', '¥': 'CNY', '￥': 'CNY', '€': 'EUR', '£': 'GBP' }

    return {
      provider: 'new-api',
      currency: UNIT_TO_ISO[siteUnit] ?? '',
      account: displayName,
      balance: {
        remaining,
        used: usageAmount,
        listUsed: usageAmount,
        quota,
        usedQuota,
        perUnit: quotaPerUnit,
        reported: siteBalance !== null,
      },
      usage: usageAmount === null ? null : { cents: usageAmount * 100, amount: usageAmount },
      stats: null,
      partial: balanceState !== 'ok' && remaining === null,
    }
  },
}

/* ────────────────────────────────────────────────────────────────────────────
 * Generic fallback: anything that answers an OpenAI-compatible /v1/models.
 *
 * It proves the address and key work, so the card can stop claiming the site is
 * unconfigured, but it carries no money information.
 * ──────────────────────────────────────────────────────────────────────────── */
export const generic = {
  id: 'generic',
  label: 'OpenAI 兼容站点',
  needsKey: true,
  async detect({ base, apiKey, timeoutMs }) {
    if (!apiKey) return null
    const result = await requestJson(`${base}/v1/models`, {
      headers: SUFFIX.both(apiKey),
      timeoutMs,
    }).catch(() => null)
    if (!result) return null
    // A reachable endpoint answers 200, or 401 for a key the site does not accept.
    if (result.ok) return { provider: 'generic', currency: '', balance: null, usage: null, stats: null }
    if (result.status === 401 || result.status === 403) {
      return { provider: 'generic', currency: '', balance: null, usage: null, stats: null, unauthorized: true }
    }
    return null
  },
}

/** Probe order: richest and most specific first, widest fallback last. */
export const ADAPTERS = [sub2api, openrouter, newApi, generic]

/**
 * Run every adapter until one recognises the site.
 *
 * Returns `{ adapter, result }` for the winner, `{ adapter: null, result: null }`
 * when the site is unreachable, and surfaces the first adapter error so the page
 * can say *why* nothing matched.
 */
export async function detectProvider(options) {
  const base = originOf(options.apiBaseUrl)
  if (base === '') return { adapter: null, result: null, errors: [] }

  const errors = []
  let unauthorized = null
  let reachable = false

  for (const adapter of ADAPTERS) {
    let result = null
    try {
      result = await adapter.detect({ ...options, base })
    } catch (error) {
      errors.push({ code: `${adapter.id.toUpperCase()}_PROBE`, message: String(error?.message ?? error) })
      continue
    }
    if (!result) continue
    if (result.error) {
      errors.push(result.error)
      continue
    }
    reachable = true
    if (result.unauthorized) {
      unauthorized = unauthorized ?? adapter
      continue
    }
    return { adapter, result, errors }
  }

  if (unauthorized) {
    errors.push({ code: 'KEY_UNAUTHORIZED', message: 'API Key 被拒绝：可能已失效、被禁用，或不是该站点的 Key' })
  }
  return { adapter: null, result: null, errors, reachable }
}
