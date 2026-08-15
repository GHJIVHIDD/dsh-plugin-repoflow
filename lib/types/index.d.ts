/**
 * Type declarations for @dsh-community/dsh-plugin-repoflow host half.
 */

export interface GitAccountConfig {
  username: string
  email: string
  token: string
  host: string
  visibility: 'private' | 'public'
}

export interface GitGlobalConfig {
  github: GitAccountConfig
}

export interface GitStatusView {
  ok: boolean
  isRepo?: boolean
  path?: string
  root?: string
  branch?: string
  ahead?: number
  behind?: number
  staged?: number
  unstaged?: number
  untracked?: number
  conflicts?: number
  files?: Array<{ code: string; path: string }>
  commits?: Array<{ hash: string; message: string }>
  remotes?: Array<{ name: string; url: string }>
  userName?: string
  userEmail?: string
  error?: string
}

export declare function apply(ctx: any): void
export declare const inject: string[]
