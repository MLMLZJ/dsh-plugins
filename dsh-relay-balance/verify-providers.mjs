/**
 * Ad-hoc verification for the provider adapters against live sites.
 *
 *   node verify-providers.mjs <apiBaseUrl> <apiKey> [accessToken] [cookie]
 *
 * Only reads data. Prints the normalised result the plugin would use.
 */
import { detectProvider, ADAPTERS } from './providers.js'

const [base, key, accessToken = '', cookie = ''] = process.argv.slice(2)
if (!base || !key) {
  console.error('usage: node verify-providers.mjs <apiBaseUrl> <apiKey> [accessToken] [cookie]')
  process.exit(2)
}

const mask = (value) => (value ? `${value.slice(0, 6)}…(${value.length})` : '(none)')

console.log(`adapters : ${ADAPTERS.map((a) => a.id).join(', ')}`)
console.log(`base     : ${base}`)
console.log(`apiKey   : ${mask(key)}`)
console.log(`token    : ${mask(accessToken)}`)
console.log(`cookie   : ${mask(cookie)}\n`)

const started = Date.now()
const detected = await detectProvider({
  apiBaseUrl: base,
  apiKey: key,
  cookie,
  accessToken,
  userId: '',
  quotaPerUnit: 500000,
  timeoutMs: 15000,
})

console.log(`elapsed  : ${Date.now() - started}ms`)
console.log(`adapter  : ${detected.adapter ? `${detected.adapter.id} (${detected.adapter.label})` : 'NONE (no adapter matched)'}`)
console.log(`errors   : ${detected.errors.length}`)
for (const error of detected.errors) console.log(`  - ${error.code}: ${error.message}`)
console.log('\nresult:')
console.log(JSON.stringify(detected.result, null, 2))
