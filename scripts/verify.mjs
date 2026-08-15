/**
 * Offline verification for @deepseek-ai/dsh-plugin-git (no dsh server needed).
 *
 * Checks:
 *   1. syntax-check both halves
 *   2. load host ESM and verify apply/inject
 *   3. run apply() with a mocked ctx and assert all /git-api/* routes register
 *   4. simulate the browser: run the client bundle factory inside a vm sandbox
 *      and assert apply/inject exports
 *
 * Usage: node scripts/verify.mjs   (from the package root)
 * Exit code 0 = pass, 1 = fail.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fail = (msg) => { console.error('✗ ' + msg); process.exitCode = 1 }
const pass = (msg) => console.log('✓ ' + msg)

// 1. syntax check
for (const f of ['lib/index.js', 'lib/client.js', 'scripts/verify.mjs']) {
  const r = spawnSync(process.execPath, ['--check', join(root, f)], { encoding: 'utf8' })
  if (r.status !== 0) fail('syntax ' + f + ': ' + (r.stderr || r.stdout).slice(0, 400))
  else pass('syntax OK: ' + f)
}

// 2. host ESM exports
try {
  const m = await import(join(root, 'lib/index.js'))
  if (typeof m.apply !== 'function') fail('lib/index.js must export apply()')
  if (!Array.isArray(m.inject) || !m.inject.includes('webServer') || !m.inject.includes('tools')) {
    fail('lib/index.js inject must include webServer and tools')
  }
  pass('host exports: apply() + inject ' + JSON.stringify(m.inject))
} catch (e) {
  fail('host load: ' + String((e && e.message) || e))
}

// 3. apply() with mocked ctx
const registeredRoutes = []
const registeredTools = []
const effects = []
const ctx = {
  get(name) {
    if (name === 'webServer') return { register: (r) => { registeredRoutes.push(r); return () => {} } }
    if (name === 'tools') return { register: (t) => { registeredTools.push(t); return () => {} } }
    return undefined
  },
  effect(fn, label) { effects.push({ fn, label }) },
  on() {},
}
try {
  const m = await import(join(root, 'lib/index.js'))
  m.apply(ctx)
  for (const e of effects) { const d = e.fn(); if (typeof d === 'function') d() }
  const routePaths = registeredRoutes.map((r) => r.path).sort()
  const EXPECT_ROUTES = [
    '/git-api/branches',
    '/git-api/checkout',
    '/git-api/commit',
    '/git-api/config',
    '/git-api/create',
    '/git-api/init',
    '/git-api/push',
    '/git-api/repos',
    '/git-api/status',
    '/git-api/test',
  ]
  const missingRoutes = EXPECT_ROUTES.filter((p) => !routePaths.includes(p))
  if (missingRoutes.length) fail('missing routes: ' + missingRoutes.join(', '))
  else pass('host registers ' + EXPECT_ROUTES.length + ' /git-api/* routes')

  const toolNames = registeredTools.map((t) => t.name).sort()
  const EXPECT_TOOLS = ['git_branch', 'git_checkout', 'git_commit', 'git_create_repo', 'git_init', 'git_log', 'git_push', 'git_repos', 'git_status']
  const missingTools = EXPECT_TOOLS.filter((p) => !toolNames.includes(p))
  if (missingTools.length) fail('missing tools: ' + missingTools.join(', '))
  else pass('host registers ' + EXPECT_TOOLS.length + ' git_* model tools')
} catch (e) {
  fail('apply() smoke: ' + String((e && e.message) || e))
}

// 4. client bundle in a vm sandbox
try {
  const src = readFileSync(join(root, 'lib/client.js'), 'utf8')
  let loaded = null
  const sandbox = {
    window: { __ModuleLoader__: { load: (o) => { loaded = o } } },
    console,
    URLSearchParams,
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }),
    document: {
      createElement: () => ({ dataset: {}, set textContent(_v) {}, remove() {} }),
      head: { appendChild() {} },
    },
    encodeURIComponent,
    Object,
    Symbol,
    String,
    Error,
    Array,
    JSON,
    Math,
    Number,
    RegExp,
    isFinite,
    parseFloat,
    require: (name) => {
      if (name === 'react') {
        const noop = () => {}
        return {
          createElement: () => ({}),
          useState: () => [null, noop],
          useEffect: () => {},
          useCallback: (fn) => fn,
          useRef: () => ({ current: {} }),
        }
      }
      throw new Error('unknown require: ' + name)
    },
  }
  vm.createContext(sandbox)
  new vm.Script(src).runInContext(sandbox)
  if (!loaded || loaded.id !== '@deepseek-ai/dsh-plugin-git') fail('client bundle must register id @deepseek-ai/dsh-plugin-git')
  const mod = loaded.factory((n) => sandbox.require(n))
  if (typeof mod.apply !== 'function' || !Array.isArray(mod.inject) || !mod.inject.includes('slots')) {
    fail('client bundle must export apply() + inject ["slots"]')
  }
  pass('client bundle executes in browser sandbox (id + apply/inject OK)')
} catch (e) {
  fail('client bundle: ' + String((e && e.message) || e))
}

if (!process.exitCode) console.log('\nAll checks passed ✔')
