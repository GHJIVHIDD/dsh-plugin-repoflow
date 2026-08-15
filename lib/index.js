/**
 * Host loader entry for the deployment-level Git plugin.
 *
 * Provides:
 *  - /git-api/config      GET/POST  global GitHub account configuration
 *  - /git-api/test        POST      test the saved/entered GitHub credentials
 *  - /git-api/status      GET       inspect a local repository (branch/status/log/remotes)
 *  - /git-api/init        POST      initialize a local Git repository
 *  - /git-api/create      POST      create a GitHub repository and push the local repo
 *  - /git-api/commit      POST      stage all changes and create a commit
 *  - /git-api/push        POST      push the current branch to its remote
 *
 * The client half registers a "Git" settings section after model/plugin/agent
 * preset, using the same visual language as the built-in settings pages.
 */

import { execFile } from 'node:child_process'
import { promises as fs, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, isAbsolute } from 'node:path'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)
const CONFIG_DIR = joinSafe(homedir(), '.dsh', 'git')
const CONFIG_FILE = joinSafe(CONFIG_DIR, 'config.json')
const MAX_BODY = 1024 * 1024

function joinSafe(...parts) {
  return join(...parts)
}

// ---------- config persistence ----------
const DEFAULT_CONFIG = {
  github: {
    username: '',
    email: '',
    token: '',
    host: 'github.com',
    visibility: 'private',
  },
}

function loadConfig() {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.github && typeof parsed.github === 'object') {
      return {
        github: Object.assign({}, DEFAULT_CONFIG.github, parsed.github),
      }
    }
  } catch (e) { /* missing or invalid: use default */ }
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}

async function saveConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
  try { await fs.chmod(CONFIG_FILE, 0o600) } catch (e) { /* best effort */ }
  return config
}

function maskToken(token) {
  if (!token) return ''
  if (token.length <= 8) return '••••••••'
  return '••••••••' + token.slice(-4)
}

function publicConfig(config) {
  const g = config.github || DEFAULT_CONFIG.github
  return {
    github: {
      username: g.username || '',
      email: g.email || '',
      host: g.host || 'github.com',
      visibility: g.visibility || 'private',
      hasToken: !!(g.token && g.token.length > 0),
      tokenPreview: g.token ? maskToken(g.token) : '',
    },
  }
}

// ---------- helpers ----------
function queryOf(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

function readBody(req) {
  return new Promise((resolvePromise) => {
    let body = ''
    let done = false
    req.on('data', (chunk) => {
      if (done) return
      body += String(chunk)
      if (body.length > MAX_BODY) {
        done = true
        req.destroy()
        resolvePromise({})
      }
    })
    req.on('end', () => {
      if (done) return
      done = true
      try {
        resolvePromise(body ? JSON.parse(body) : {})
      } catch (e) {
        resolvePromise({})
      }
    })
    req.on('error', () => {
      if (!done) {
        done = true
        resolvePromise({})
      }
    })
  })
}

function sendJson(res, status, obj) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = status
    res.end(JSON.stringify(obj))
  } catch (e) {
    /* ignore */
  }
}

function cleanError(e) {
  return String((e && e.message) || e)
}

async function gitRun(args, opts) {
  opts = opts || {}
  try {
    const out = await execFileP('git', args, {
      cwd: opts.cwd,
      timeout: opts.timeoutMs || 120000,
      maxBuffer: 8 * 1024 * 1024,
      encoding: 'utf8',
    })
    return { ok: true, code: 0, stdout: String(out.stdout || ''), stderr: String(out.stderr || '') }
  } catch (err) {
    return {
      ok: false,
      code: typeof err.code === 'number' ? err.code : -1,
      stdout: String(err.stdout || ''),
      stderr: String(err.stderr || cleanError(err)),
    }
  }
}

function asPath(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const abs = isAbsolute(raw) ? raw : resolve(raw)
  return abs
}

// ---------- GitHub API ----------
function githubApiBase(host) {
  const h = String(host || 'github.com').trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (h === 'github.com') return 'https://api.github.com'
  return 'https://' + h + '/api/v3'
}

async function githubRequest(method, path, body, token, host, username) {
  const url = githubApiBase(host) + path
  const headers = {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': username || 'dsh-git-plugin',
    'Content-Type': 'application/json',
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch (e) { data = null }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || ('HTTP ' + res.status)
    throw new Error(msg)
  }
  return data
}

async function testGitHub(config) {
  const token = config.github.token
  if (!token) throw new Error('尚未保存 GitHub Token')
  const data = await githubRequest('GET', '/user', null, token, config.github.host, config.github.username)
  return {
    ok: true,
    login: data.login || config.github.username || '',
    name: data.name || '',
    htmlUrl: data.html_url || '',
  }
}

async function listGitHubRepos(config) {
  const token = config.github.token
  if (!token) throw new Error('尚未保存 GitHub Token')
  const data = await githubRequest('GET', '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member', null, token, config.github.host, config.github.username)
  if (!Array.isArray(data)) return []
  return data.map((r) => ({
    name: r.name || '',
    fullName: r.full_name || '',
    private: !!r.private,
    description: r.description || '',
    htmlUrl: r.html_url || '',
    cloneUrl: r.clone_url || '',
    defaultBranch: r.default_branch || 'main',
    updatedAt: r.updated_at || '',
  }))
}

// ---------- repository status ----------
function parseBranchStatus(line) {
  const branchLine = String(line || '').replace(/^## /, '')
  const branch = branchLine.split('...')[0] || ''
  const aheadMatch = branchLine.match(/ahead (\d+)/)
  const behindMatch = branchLine.match(/behind (\d+)/)
  return {
    branch,
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0,
  }
}

function parsePorcelain(text) {
  const lines = String(text || '').split('\n').filter((l) => l.length > 0)
  if (lines.length === 0) return { branch: '', ahead: 0, behind: 0, files: [], staged: 0, unstaged: 0, untracked: 0, conflicts: 0 }
  const head = parseBranchStatus(lines[0])
  const files = lines.slice(1).map((l) => ({
    code: l.slice(0, 2),
    path: l.slice(3),
  }))
  const staged = files.filter((f) => f.code[0] !== ' ' && f.code[0] !== '?').length
  const unstaged = files.filter((f) => f.code[1] !== ' ' && f.code[1] !== '?').length
  const untracked = files.filter((f) => f.code.startsWith('??')).length
  const conflicts = files.filter((f) => f.code[0] === 'U' || f.code[1] === 'U' || f.code === 'AA' || f.code === 'DD').length
  return Object.assign({ files }, head, { staged, unstaged, untracked, conflicts })
}

function parseLog(text) {
  return String(text || '').split('\n').filter((l) => l.trim().length > 0).map((line) => {
    const sp = line.indexOf(' ')
    return {
      hash: sp >= 0 ? line.slice(0, sp) : line,
      message: sp >= 0 ? line.slice(sp + 1) : '',
    }
  })
}

async function listBranches(path) {
  const r = await gitRun(['branch', '--format', '%(refname:short)%09%(HEAD)'], { cwd: path })
  if (!r.ok) return []
  const branches = []
  for (const line of String(r.stdout || '').split('\n')) {
    const t = line.trim()
    if (!t) continue
    const idx = t.indexOf('\t')
    const name = idx >= 0 ? t.slice(0, idx) : t
    const isHead = idx >= 0 ? t.slice(idx + 1).trim() === '*' : false
    branches.push({ name, current: isHead })
  }
  return branches
}

async function checkoutBranch(path, branch, create) {
  const name = String(branch || '').trim()
  if (!name) return { ok: false, error: '缺少分支名' }
  if (create) {
    const r = await gitRun(['checkout', '-b', name], { cwd: path })
    if (!r.ok) return { ok: false, error: '创建/切换分支失败: ' + (r.stderr || r.stdout) }
    return { ok: true, branch: name, created: true, switched: true }
  }
  const r = await gitRun(['checkout', name], { cwd: path })
  if (!r.ok) return { ok: false, error: '切换分支失败: ' + (r.stderr || r.stdout) }
  return { ok: true, branch: name, created: false, switched: true }
}

async function logGraph(path, limit) {
  const n = Math.max(1, Math.min(100, Number(limit) || 30))
  const r = await gitRun(['log', '--graph', '--oneline', '--decorate', '--all', '-n', String(n)], { cwd: path })
  if (!r.ok) return []
  return String(r.stdout || '').split('\n').filter((l) => l.trim().length > 0)
}

async function repoStatus(pathValue) {
  const path = asPath(pathValue)
  if (!path) return { ok: false, error: '缺少仓库路径' }
  let st
  try {
    st = await fs.stat(path)
  } catch (e) {
    return { ok: false, error: '路径不存在或不可访问' }
  }
  if (!st.isDirectory()) return { ok: false, error: '路径不是文件夹' }

  const inTree = await gitRun(['rev-parse', '--is-inside-work-tree'], { cwd: path })
  if (!inTree.ok || String(inTree.stdout || '').trim() !== 'true') {
    return { ok: true, isRepo: false, path }
  }

  const rootRes = await gitRun(['rev-parse', '--show-toplevel'], { cwd: path })
  const root = rootRes.ok ? String(rootRes.stdout || '').trim() : path

  const statusRes = await gitRun(['status', '--porcelain=v1', '-b'], { cwd: path })
  const parsed = parsePorcelain(statusRes.ok ? statusRes.stdout : '')

  const branch = parsed.branch || ''
  const logRes = await gitRun(['log', '--oneline', '--decorate', '-12'], { cwd: path })
  const commits = logRes.ok ? parseLog(logRes.stdout) : []

  const remoteRes = await gitRun(['remote', '-v'], { cwd: path })
  const remotes = []
  if (remoteRes.ok) {
    const seen = new Set()
    for (const line of String(remoteRes.stdout || '').split('\n')) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 2) {
        const key = parts[0] + '|' + parts[1]
        if (!seen.has(key)) {
          seen.add(key)
          remotes.push({ name: parts[0], url: parts[1] })
        }
      }
    }
  }

  const userRes = await gitRun(['config', 'user.name'], { cwd: path })
  const emailRes = await gitRun(['config', 'user.email'], { cwd: path })

  return {
    ok: true,
    isRepo: true,
    path,
    root,
    branch,
    ahead: parsed.ahead,
    behind: parsed.behind,
    files: parsed.files,
    staged: parsed.staged,
    unstaged: parsed.unstaged,
    untracked: parsed.untracked,
    conflicts: parsed.conflicts,
    commits,
    graph: await logGraph(path, 30),
    branches: await listBranches(path),
    remotes,
    userName: userRes.ok ? String(userRes.stdout || '').trim() : '',
    userEmail: emailRes.ok ? String(emailRes.stdout || '').trim() : '',
  }
}

// ---------- git operations ----------
async function ensureGitUser(cwd, config) {
  const g = config.github || {}
  if (g.email) await gitRun(['config', 'user.email', g.email], { cwd })
  if (g.username) await gitRun(['config', 'user.name', g.username], { cwd })
}

async function currentBranch(cwd) {
  const r = await gitRun(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })
  if (r.ok) {
    const b = String(r.stdout || '').trim()
    if (b && b !== 'HEAD') return b
  }
  return 'main'
}

async function initRepository(pathValue, config, branch) {
  const path = asPath(pathValue)
  if (!path) return { ok: false, error: '缺少仓库路径' }
  await fs.mkdir(path, { recursive: true })
  const branchName = String(branch || 'main').trim() || 'main'
  const init = await gitRun(['init', '-b', branchName], { cwd: path })
  if (!init.ok) {
    // Older git may not support -b
    const basic = await gitRun(['init'], { cwd: path })
    if (!basic.ok) return { ok: false, error: 'git init 失败: ' + basic.stderr }
    await gitRun(['symbolic-ref', 'HEAD', 'refs/heads/' + branchName], { cwd: path })
  }
  await ensureGitUser(path, config)
  return { ok: true, path, branch: branchName }
}

async function commitAll(pathValue, message, config) {
  const path = asPath(pathValue)
  if (!path) return { ok: false, error: '缺少仓库路径' }
  const msg = String(message || '').trim() || 'Update from DSH'
  await ensureGitUser(path, config)
  const add = await gitRun(['add', '-A'], { cwd: path })
  if (!add.ok) return { ok: false, error: 'git add 失败: ' + add.stderr }
  const status = await gitRun(['status', '--porcelain'], { cwd: path })
  const changes = String(status.stdout || '').trim()
  if (!changes) {
    return { ok: true, empty: true, message: '没有需要提交的更改' }
  }
  const commit = await gitRun(['commit', '-m', msg], { cwd: path })
  if (!commit.ok) return { ok: false, error: 'git commit 失败: ' + commit.stderr }
  return { ok: true, empty: false, message: msg }
}

async function pushWithToken(path, branch, remoteName, config) {
  const g = config.github || {}
  const token = g.token
  if (!token) return { ok: false, error: '尚未保存 GitHub Token，无法推送' }
  const remote = remoteName || 'origin'
  const auth = Buffer.from('x-access-token:' + token).toString('base64')
  const r = await gitRun([
    '-c', 'credential.helper=',
    '-c', 'http.extraheader=AUTHORIZATION: basic ' + auth,
    'push', '-u', remote, branch,
  ], { cwd: path, timeoutMs: 300000 })
  if (!r.ok) return { ok: false, error: 'git push 失败: ' + (r.stderr || r.stdout).slice(0, 500) }
  return { ok: true }
}

async function createGitHubRepository(pathValue, body, config) {
  const path = asPath(pathValue)
  if (!path) return { ok: false, error: '缺少仓库路径' }
  const g = config.github || {}
  const token = g.token
  if (!token) throw new Error('尚未保存 GitHub Token，请先在账号配置中保存')
  if (!g.username) throw new Error('尚未保存 GitHub 用户名')

  const name = String(body.name || '').trim() || (path.split('/').filter(Boolean).pop() || 'repo')
  const description = String(body.description || '').trim() || ''
  const visibility = body.private === true || String(body.visibility || g.visibility || 'private') === 'private' ? 'private' : 'public'

  // 1. Ensure local repo exists
  const inTree = await gitRun(['rev-parse', '--is-inside-work-tree'], { cwd: path })
  let branch = 'main'
  if (!inTree.ok || String(inTree.stdout || '').trim() !== 'true') {
    const initRes = await initRepository(path, config, body.branch || 'main')
    if (!initRes.ok) return initRes
    branch = initRes.branch || 'main'
  } else {
    branch = await currentBranch(path)
  }

  // 2. Create GitHub repo (idempotent if already exists)
  let created = false
  try {
    await githubRequest('POST', '/user/repos', {
      name,
      description,
      private: visibility === 'private',
      auto_init: false,
      has_issues: true,
      has_wiki: true,
    }, token, g.host, g.username)
    created = true
  } catch (e) {
    const msg = String((e && e.message) || e)
    if (!/already exists|name already exists/i.test(msg)) throw e
  }

  // 3. Set clean remote URL
  const hostClean = String(g.host || 'github.com').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const cleanUrl = 'https://' + hostClean + '/' + g.username + '/' + name + '.git'
  await gitRun(['remote', 'remove', 'origin'], { cwd: path }).catch(() => {})
  await gitRun(['remote', 'add', 'origin', cleanUrl], { cwd: path })

  // 4. Ensure there is at least one commit before pushing
  const hasCommit = await gitRun(['rev-parse', 'HEAD'], { cwd: path })
  if (!hasCommit.ok) {
    const st = await gitRun(['status', '--porcelain'], { cwd: path })
    if (String(st.stdout || '').trim()) {
      const c = await commitAll(path, 'Initial commit', config)
      if (!c.ok) return c
    } else {
      const initial = await gitRun(['commit', '--allow-empty', '-m', 'Initial commit'], { cwd: path })
      if (!initial.ok) return { ok: false, error: '创建初始提交失败: ' + initial.stderr }
    }
  } else {
    const st = await gitRun(['status', '--porcelain'], { cwd: path })
    if (String(st.stdout || '').trim()) {
      const c = await commitAll(path, 'Initial commit', config)
      if (!c.ok) return c
    }
  }

  // 5. Push
  const pushRes = await pushWithToken(path, branch, 'origin', config)
  if (!pushRes.ok) return pushRes

  return {
    ok: true,
    created,
    name,
    url: cleanUrl,
    branch,
  }
}

// ---------- plugin entry ----------
function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (!webServer) return

  const route = (path, handler) => {
    ctx.effect(() => {
      try {
        const disposer = webServer.register({ kind: 'exact', path, handler })
        return disposer
      } catch (err) {
        const msg = String((err && err.message) || err)
        // 同一插件被 bundle 与 patch 重复加载时，路由可能已存在；跳过即可。
        if (/duplicate exact route/i.test(msg)) {
          try { console.log('[git] route already registered (skip): ' + path) } catch (e) { /* ignore */ }
          return
        }
        console.error('[git] route FAILED: ' + path + ' -> ' + msg)
      }
    }, 'git: ' + path)
  }

  // GET/POST /git-api/config (同一 exact route, 按 method 分流)
  route('/git-api/config', async (req, res) => {
    try {
      if (req.method === 'POST') {
        const body = await readBody(req)
        const current = loadConfig()
        const github = Object.assign({}, current.github, {
          username: String(body.username || body.github?.username || current.github.username || '').trim(),
          email: String(body.email || body.github?.email || current.github.email || '').trim(),
          token: String(body.token || body.github?.token || current.github.token || '').trim(),
          host: String(body.host || body.github?.host || current.github.host || 'github.com').trim(),
          visibility: String(body.visibility || body.github?.visibility || current.github.visibility || 'private').trim(),
        })
        const config = { github }
        await saveConfig(config)
        sendJson(res, 200, { ok: true, config: publicConfig(config) })
        return
      }
      sendJson(res, 200, { ok: true, config: publicConfig(loadConfig()) })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/test
  route('/git-api/test', async (req, res) => {
    try {
      const body = await readBody(req)
      const current = loadConfig()
      const github = Object.assign({}, current.github, {
        username: String(body.username || current.github.username || '').trim(),
        token: String(body.token || current.github.token || '').trim(),
        host: String(body.host || current.github.host || 'github.com').trim(),
      })
      const info = await testGitHub({ github })
      sendJson(res, 200, Object.assign({ ok: true }, info))
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // GET /git-api/repos
  route('/git-api/repos', async (req, res) => {
    try {
      sendJson(res, 200, { ok: true, repos: await listGitHubRepos(loadConfig()) })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // GET /git-api/status?path=...
  route('/git-api/status', async (req, res) => {
    try {
      const path = queryOf(req).get('path') || ''
      sendJson(res, 200, await repoStatus(path))
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/init
  route('/git-api/init', async (req, res) => {
    try {
      const body = await readBody(req)
      const config = loadConfig()
      const result = await initRepository(body.path, config, body.branch)
      sendJson(res, 200, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/create
  route('/git-api/create', async (req, res) => {
    try {
      const body = await readBody(req)
      const config = loadConfig()
      const result = await createGitHubRepository(body.path, body, config)
      sendJson(res, 200, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/commit
  route('/git-api/commit', async (req, res) => {
    try {
      const body = await readBody(req)
      const config = loadConfig()
      sendJson(res, 200, await commitAll(body.path, body.message, config))
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/push
  route('/git-api/push', async (req, res) => {
    try {
      const body = await readBody(req)
      const config = loadConfig()
      const path = asPath(body.path)
      if (!path) throw new Error('缺少仓库路径')
      const branch = body.branch || await currentBranch(path)
      const result = await pushWithToken(path, branch, body.remote || 'origin', config)
      sendJson(res, 200, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // GET /git-api/branches?path=...
  route('/git-api/branches', async (req, res) => {
    try {
      const path = queryOf(req).get('path') || ''
      const abs = asPath(path)
      if (!abs) throw new Error('缺少仓库路径')
      sendJson(res, 200, { ok: true, branches: await listBranches(abs) })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // POST /git-api/checkout
  route('/git-api/checkout', async (req, res) => {
    try {
      const body = await readBody(req)
      const path = asPath(body.path)
      if (!path) throw new Error('缺少仓库路径')
      sendJson(res, 200, await checkoutBranch(path, body.branch, body.create === true))
    } catch (err) {
      sendJson(res, 500, { ok: false, error: cleanError(err).slice(0, 300) })
    }
  })

  // ---------- 模型工具 ----------
  const tools = ctx.get('tools')
  if (tools) {
    const registerTool = (tool) => {
      ctx.effect(() => {
        try {
          const disposer = tools.register(tool)
          try { console.log('[git] tool registered: ' + tool.name) } catch (e) { /* ignore */ }
          return disposer
        } catch (err) {
          const msg = String((err && err.message) || err)
          if (/duplicate|already registered/i.test(msg)) {
            try { console.log('[git] tool already registered (skip): ' + tool.name) } catch (e) { /* ignore */ }
            return
          }
          try { console.error('[git] tool FAILED: ' + tool.name + ' -> ' + msg) } catch (e) { /* ignore */ }
        }
      }, 'git: tool ' + tool.name)
    }

    const OUT = {
      schema: { type: 'object', additionalProperties: true },
      render: (args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    }
    const pathParam = { type: 'string', description: '本地仓库或目标文件夹的绝对路径。' }

    registerTool({
      name: 'git_status',
      description: '查看本地 Git 仓库状态:当前分支、ahead/behind、暂存/未暂存/未跟踪/冲突、最近提交、分支列表、提交图、远程仓库。',
      parameters: { type: 'object', properties: { path: pathParam }, required: ['path'] },
      output: OUT,
      async execute(args) {
        return repoStatus(args && args.path)
      },
    })

    registerTool({
      name: 'git_repos',
      description: '列出当前 GitHub 账号下已有的远程仓库(包括 owner/collaborator/organization_member)。',
      parameters: { type: 'object', properties: {} },
      output: OUT,
      async execute() {
        return { ok: true, repos: await listGitHubRepos(loadConfig()) }
      },
    })

    registerTool({
      name: 'git_init',
      description: '在指定文件夹初始化 Git 仓库(默认 main 分支),并写入全局 GitHub 用户名/邮箱。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          branch: { type: 'string', description: '初始分支名, 默认 main。' },
        },
        required: ['path'],
      },
      output: OUT,
      async execute(args) {
        return initRepository(args && args.path, loadConfig(), args && args.branch)
      },
    })

    registerTool({
      name: 'git_commit',
      description: '暂存全部更改并创建一次提交。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          message: { type: 'string', description: '提交信息, 默认 "Update from DSH"。' },
        },
        required: ['path'],
      },
      output: OUT,
      async execute(args) {
        return commitAll(args && args.path, args && args.message, loadConfig())
      },
    })

    registerTool({
      name: 'git_push',
      description: '将当前分支推送到远程仓库。使用全局保存的 GitHub Token 通过 HTTPS 认证,不会把 Token 写入 remote URL。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          remote: { type: 'string', description: '远程名称, 默认 origin。' },
          branch: { type: 'string', description: '要推送的分支, 默认当前分支。' },
        },
        required: ['path'],
      },
      output: OUT,
      async execute(args) {
        const path = asPath(args && args.path)
        if (!path) throw new Error('缺少仓库路径')
        const branch = (args && args.branch) || await currentBranch(path)
        return pushWithToken(path, branch, args && args.remote, loadConfig())
      },
    })

    registerTool({
      name: 'git_create_repo',
      description: '在 GitHub 上创建远程仓库,并将本地目录初始化/关联后推送。可指定仓库名、描述、可见性。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          name: { type: 'string', description: 'GitHub 仓库名, 默认取文件夹名。' },
          description: { type: 'string', description: '仓库描述。' },
          private: { type: 'boolean', description: '是否私有仓库, 默认使用全局配置。' },
          branch: { type: 'string', description: '本地初始分支, 默认 main。' },
        },
        required: ['path'],
      },
      output: OUT,
      async execute(args) {
        return createGitHubRepository(args && args.path, args || {}, loadConfig())
      },
    })

    registerTool({
      name: 'git_branch',
      description: '列出本地 Git 仓库的全部分支,并标记当前分支。',
      parameters: { type: 'object', properties: { path: pathParam }, required: ['path'] },
      output: OUT,
      async execute(args) {
        const path = asPath(args && args.path)
        if (!path) throw new Error('缺少仓库路径')
        return { ok: true, branches: await listBranches(path) }
      },
    })

    registerTool({
      name: 'git_checkout',
      description: '切换本地分支;create=true 时创建新分支并切换过去。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          branch: { type: 'string', description: '要切换或创建的分支名。' },
          create: { type: 'boolean', description: '是否创建新分支, 默认 false。' },
        },
        required: ['path', 'branch'],
      },
      output: OUT,
      async execute(args) {
        return checkoutBranch(args && args.path, args && args.branch, args && args.create === true)
      },
    })

    registerTool({
      name: 'git_log',
      description: '查看提交历史,支持 ASCII 图形化分支图(--graph --all)。',
      parameters: {
        type: 'object',
        properties: {
          path: pathParam,
          limit: { type: 'integer', description: '显示最近多少条, 默认 30, 最大 100。' },
        },
        required: ['path'],
      },
      output: OUT,
      async execute(args) {
        const path = asPath(args && args.path)
        if (!path) throw new Error('缺少仓库路径')
        const graph = await logGraph(path, args && args.limit)
        return { ok: true, graph }
      },
    })
  }

  console.log('[git] git deployment plugin ready (/git-api/*)')
}

export { apply }
export const inject = ['webServer', 'tools']
