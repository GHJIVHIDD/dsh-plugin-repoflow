window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-plugin-git",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		// ── styles (settings-page visual language) ─────────────────────────────
		const CSS = `
.gitSection{max-width:760px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:14px}
.gitTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}
.gitIntro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}
.gitCard{border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-1);padding:16px 18px;display:flex;flex-direction:column;gap:12px}
.gitCardHead{display:flex;align-items:center;gap:10px;min-width:0}
.gitCardTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;line-height:22px;min-width:0;flex:1}
.gitCardHint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.gitGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.gitField{display:flex;flex-direction:column;gap:5px;min-width:0}
.gitFieldFull{grid-column:1 / -1}
.gitLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px;font-weight:500}
.gitInput,.gitSelect{box-sizing:border-box;width:100%;height:34px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;outline:none;transition:border-color .15s ease,box-shadow .15s ease}
.gitInput:focus,.gitSelect:focus{border-color:var(--dsw-alias-brand-primary,#6e8cff);box-shadow:0 0 0 3px rgba(110,140,255,.15)}
.gitInput::placeholder{color:var(--dsw-alias-label-tertiary)}
.gitTokenRow{display:flex;gap:8px;align-items:center}
.gitTokenInput{flex:1 1 auto}
.gitTokenPreview{color:var(--dsw-alias-label-tertiary);font-size:12px;white-space:nowrap;flex:none}
.gitActions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gitBtn{box-sizing:border-box;height:30px;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:transparent;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 12px;font-size:12px;line-height:18px;transition:background .15s ease,border-color .15s ease,color .15s ease}
.gitBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
.gitBtn:disabled{opacity:.45;cursor:default}
.gitBtnPrimary{background:var(--dsw-alias-brand-primary,#4c6fff);border-color:var(--dsw-alias-brand-primary,#4c6fff);color:#fff}
.gitBtnPrimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-strong,#3b5de7);border-color:var(--dsw-alias-brand-primary-strong,#3b5de7)}
.gitBtnDanger{color:var(--dsw-alias-state-error-primary);border-color:transparent}
.gitBtnDanger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
.gitMessage{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;word-break:break-word}
.gitError{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;word-break:break-word}
.gitSuccess{color:var(--dsw-alias-state-success-primary,#30a46c);font-size:12px;line-height:18px;word-break:break-word}
.gitMuted{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.gitStatusRow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gitBadge{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;background:var(--dsw-alias-bg-layer-2);white-space:nowrap}
.gitBadgePrimary{color:var(--dsw-alias-brand-primary,#4c6fff);border-color:rgba(76,111,255,.35);background:rgba(76,111,255,.08)}
.gitStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.gitStat{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:8px 10px;background:var(--dsw-alias-bg-layer-2);min-width:0}
.gitStatLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.gitStatValue{color:var(--dsw-alias-label-primary);font-size:16px;font-weight:600;line-height:22px;font-variant-numeric:tabular-nums}
.gitCommitList{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none}
.gitCommitRow{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;min-width:0}
.gitCommitRow:hover{background:var(--dsw-alias-bg-layer-2)}
.gitCommitDot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary,#4c6fff);flex:none}
.gitCommitHash{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace,Menlo,Consolas,monospace);font-size:11px;flex:none}
.gitCommitMsg{color:var(--dsw-alias-label-primary);font-size:12.5px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.gitFileList{display:flex;flex-direction:column;gap:3px;max-height:180px;overflow-y:auto;padding-right:4px}
.gitFileRow{display:flex;align-items:center;gap:8px;font-family:var(--ds-font-family-code,ui-monospace,Menlo,Consolas,monospace);font-size:11.5px;line-height:18px;color:var(--dsw-alias-label-secondary);min-width:0}
.gitFileCode{flex:none;width:22px;color:var(--dsw-alias-label-tertiary)}
.gitFilePath{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gitEmpty{border:1px dashed var(--dsw-alias-border-l3);color:var(--dsw-alias-label-tertiary);text-align:center;border-radius:12px;padding:22px 12px;font-size:13px;line-height:20px}
.gitPathRow{display:flex;gap:8px}
.gitPathInput{flex:1 1 auto}
.gitNote{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.gitBranchList{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none}
.gitBranchRow{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;min-width:0}
.gitBranchRow:hover{background:var(--dsw-alias-bg-layer-2)}
.gitBranchName{color:var(--dsw-alias-label-primary);font-size:12.5px;line-height:18px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.gitBranchCurrent{color:var(--dsw-alias-brand-primary,#4c6fff);font-size:11px;border:1px solid rgba(76,111,255,.35);background:rgba(76,111,255,.08);border-radius:999px;padding:0 7px;line-height:16px;flex:none}
.gitBranchActions{display:flex;gap:4px;flex:none}
.gitGraphWrap{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);padding:10px 12px;max-height:260px;overflow:auto}
.gitGraph{margin:0;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace,Menlo,Consolas,monospace);font-size:11.5px;line-height:18px;white-space:pre;min-width:0}
.gitSectionTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:600;line-height:16px;margin:12px 0 6px;letter-spacing:.04em}
.gitRepoList{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;max-height:240px;overflow-y:auto;padding-right:4px}
.gitRepoRow{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:10px;min-width:0}
.gitRepoInfo{flex:1 1 auto;min-width:0}
.gitRepoName{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gitRepoMeta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gitRepoBadge{flex:none;font-size:10.5px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:0 7px;line-height:16px}
@media (max-width:640px){.gitGrid{grid-template-columns:1fr}.gitStats{grid-template-columns:repeat(2,1fr)}}
`;

		// ── helpers ────────────────────────────────────────────────────────────
		function api(path, params, body) {
			let url = "/git-api/" + path;
			if (params) {
				const keys = Object.keys(params);
				if (keys.length > 0) {
					url += "?" + keys.map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
				}
			}
			return fetch(url, {
				method: body !== undefined ? "POST" : "GET",
				headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
				body: body !== undefined ? JSON.stringify(body) : undefined,
				cache: "no-store",
			})
				.then((r) => r.json().catch(() => ({ ok: false, error: "HTTP " + r.status })))
				.then((j) => {
					if (!j || j.ok === false) throw new Error((j && j.error) || "请求失败");
					return j;
				});
		}

		const safe = (p) => p.catch((e) => ({ ok: false, error: String((e && e.message) || e) }));

		function Field(props) {
			return React.createElement("label", { className: "gitField" + (props.full ? " gitFieldFull" : "") },
				React.createElement("span", { className: "gitLabel" }, props.label),
				props.children,
				props.hint ? React.createElement("span", { className: "gitNote" }, props.hint) : null
			);
		}

		function GitSection(_props) {
			const [config, setConfig] = React.useState(null);
			const [form, setForm] = React.useState({ username: "", email: "", token: "", host: "github.com", visibility: "private" });
			const [path, setPath] = React.useState("");
			const [repo, setRepo] = React.useState(null);
			const [repoError, setRepoError] = React.useState("");
			const [busy, setBusy] = React.useState("");
			const [message, setMessage] = React.useState("");
			const [testInfo, setTestInfo] = React.useState(null);
			const [commitMsg, setCommitMsg] = React.useState("Update from DSH");
			const [repoName, setRepoName] = React.useState("");
			const [repoDesc, setRepoDesc] = React.useState("");
			const [newBranch, setNewBranch] = React.useState("");
			const [repos, setRepos] = React.useState(null);
			const [reposError, setReposError] = React.useState("");

			const loadConfig = React.useCallback(async () => {
				try {
					const r = await api("config");
					setConfig(r.config);
					const g = r.config.github || {};
					setForm((prev) => ({
						username: g.username || "",
						email: g.email || "",
						token: prev.token || "",
						host: g.host || "github.com",
						visibility: g.visibility || "private",
					}));
				} catch (e) {
					setMessage("读取配置失败: " + (e && e.message ? e.message : String(e)));
				}
			}, []);

			React.useEffect(() => { loadConfig(); }, [loadConfig]);

			const loadRepos = React.useCallback(async () => {
				setReposError("");
				try {
					const r = await api("repos");
					setRepos(r.repos || []);
				} catch (e) {
					setRepos(null);
					setReposError((e && e.message) || String(e));
				}
			}, []);

			React.useEffect(() => {
				if (config && config.github && config.github.hasToken) loadRepos();
			}, [config, loadRepos]);

			const loadRepo = React.useCallback(async (p) => {
				const target = p !== undefined ? p : path;
				if (!target || !String(target).trim()) {
					setRepo(null);
					setRepoError("");
					return;
				}
				setBusy("status");
				setRepoError("");
				try {
					const r = await api("status", { path: target });
					setRepo(r);
					if (r.isRepo && !repoName) setRepoName(r.root.split("/").filter(Boolean).pop() || "");
				} catch (e) {
					setRepo(null);
					setRepoError((e && e.message) || String(e));
				}
				setBusy("");
			}, [path, repoName]);

			const saveConfig = async () => {
				setBusy("save");
				setMessage("");
				setTestInfo(null);
				try {
					const r = await api("config", null, form);
					setConfig(r.config);
					setMessage("GitHub 配置已保存");
					if (r.config.github.hasToken) loadRepos();
				} catch (e) {
					setMessage("保存失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const testConnection = async () => {
				setBusy("test");
				setMessage("");
				setTestInfo(null);
				try {
					const r = await api("test", null, form);
					setTestInfo(r);
					setMessage("连接成功");
					loadRepos();
				} catch (e) {
					setMessage("连接失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const initRepo = async () => {
				setBusy("init");
				setMessage("");
				try {
					const r = await api("init", null, { path, branch: "main" });
					setMessage("已初始化仓库: " + r.path);
					await loadRepo(path);
				} catch (e) {
					setMessage("初始化失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const createRepo = async () => {
				setBusy("create");
				setMessage("");
				try {
					const r = await api("create", null, {
						path,
						name: repoName,
						description: repoDesc,
						visibility: form.visibility,
					});
					setMessage("已创建并推送 GitHub 仓库: " + r.url);
					await loadRepo(path);
				} catch (e) {
					setMessage("创建/推送失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const commit = async () => {
				setBusy("commit");
				setMessage("");
				try {
					const r = await api("commit", null, { path, message: commitMsg });
					setMessage(r.empty ? r.message : "已提交: " + commitMsg);
					await loadRepo(path);
				} catch (e) {
					setMessage("提交失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const push = async () => {
				setBusy("push");
				setMessage("");
				try {
					await api("push", null, { path });
					setMessage("推送成功");
					await loadRepo(path);
				} catch (e) {
					setMessage("推送失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const switchBranch = async (branch) => {
				setBusy("checkout");
				setMessage("");
				try {
					await api("checkout", null, { path, branch, create: false });
					setMessage("已切换到分支 " + branch);
					await loadRepo(path);
				} catch (e) {
					setMessage("切换分支失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const createBranch = async () => {
				const name = newBranch.trim();
				if (!name) {
					setMessage("请输入新分支名");
					return;
				}
				setBusy("checkout");
				setMessage("");
				try {
					await api("checkout", null, { path, branch: name, create: true });
					setMessage("已创建并切换到分支 " + name);
					setNewBranch("");
					await loadRepo(path);
				} catch (e) {
					setMessage("创建分支失败: " + (e && e.message ? e.message : String(e)));
				}
				setBusy("");
			};

			const onPathChange = (v) => {
				setPath(v);
				setRepo(null);
				setRepoError("");
				setRepoName("");
				setRepoDesc("");
				setNewBranch("");
			};

			const hasToken = !!(config && config.github && config.github.hasToken);

			const children = [
				React.createElement("h2", { className: "gitTitle", key: "title" }, "Git"),
				React.createElement("p", { className: "gitIntro", key: "intro" },
					"全局 Git 与 GitHub 配置。可保存账号信息，对本地仓库进行初始化、创建远程仓库、提交与推送。"),
				message ? React.createElement("p", { className: message.indexOf("失败") >= 0 || message.indexOf("错误") >= 0 ? "gitError" : "gitSuccess", key: "msg" }, message) : null,

				// ── Account card ──────────────────────────────────────────────
				React.createElement("div", { className: "gitCard", key: "account" },
					React.createElement("div", { className: "gitCardHead" },
						React.createElement("span", { className: "gitCardTitle" }, "GitHub 账号"),
						React.createElement("span", { className: "gitBadge" + (hasToken ? " gitBadgePrimary" : "") }, hasToken ? "已保存" : "未配置")),
					React.createElement("div", { className: "gitGrid" },
						React.createElement(Field, { label: "用户名", key: "username" },
							React.createElement("input", { className: "gitInput", value: form.username, placeholder: "GitHub 用户名", onChange: (e) => setForm(Object.assign({}, form, { username: e.target.value })) })),
						React.createElement(Field, { label: "邮箱", key: "email" },
							React.createElement("input", { className: "gitInput", type: "email", value: form.email, placeholder: "user@example.com", onChange: (e) => setForm(Object.assign({}, form, { email: e.target.value })) })),
						React.createElement(Field, { label: "Token", full: true, key: "token", hint: hasToken && !form.token ? "已保存 Token（" + config.github.tokenPreview + "），留空则保持原值。" : "使用具有 repo 权限的 Personal Access Token。" },
							React.createElement("div", { className: "gitTokenRow" },
								React.createElement("input", { className: "gitInput gitTokenInput", type: "password", value: form.token, placeholder: hasToken ? "••••••••" + (config.github.tokenPreview || "").slice(-4) : "ghp_...", onChange: (e) => setForm(Object.assign({}, form, { token: e.target.value })) }),
								hasToken && !form.token ? React.createElement("span", { className: "gitTokenPreview" }, config.github.tokenPreview) : null)),
						React.createElement(Field, { label: "Host", key: "host" },
							React.createElement("input", { className: "gitInput", value: form.host, placeholder: "github.com", onChange: (e) => setForm(Object.assign({}, form, { host: e.target.value })) })),
						React.createElement(Field, { label: "默认可见性", key: "visibility" },
							React.createElement("select", { className: "gitSelect", value: form.visibility, onChange: (e) => setForm(Object.assign({}, form, { visibility: e.target.value })) },
								React.createElement("option", { value: "private" }, "Private 私有"),
								React.createElement("option", { value: "public" }, "Public 公开")))),
					React.createElement("div", { className: "gitActions" },
						React.createElement("button", { type: "button", className: "gitBtn gitBtnPrimary", disabled: busy !== "", onClick: saveConfig }, busy === "save" ? "保存中…" : "保存配置"),
						React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: testConnection }, busy === "test" ? "测试中…" : "测试连接"),
						testInfo ? React.createElement("span", { className: "gitSuccess", key: "test" }, "已连接 " + (testInfo.login || "") + (testInfo.name ? " · " + testInfo.name : "")) : null)
				),

				// ── GitHub repositories card ──────────────────────────────────
				(hasToken || repos || reposError)
					? React.createElement("div", { className: "gitCard", key: "ghrepos" },
						React.createElement("div", { className: "gitCardHead" },
							React.createElement("span", { className: "gitCardTitle" }, "GitHub 仓库"),
							React.createElement("span", { className: "gitBadge" + (repos && repos.length ? " gitBadgePrimary" : "") }, repos ? repos.length + " 个" : "…")),
						reposError
							? React.createElement("p", { className: "gitError", key: "err" }, reposError)
							: repos === null
								? React.createElement("p", { className: "gitMuted", key: "loading" }, "正在加载仓库列表…")
								: repos.length === 0
									? React.createElement("div", { className: "gitEmpty", key: "empty" }, "暂无 GitHub 仓库")
									: React.createElement("ul", { className: "gitRepoList", key: "list" },
										repos.map((r) => React.createElement("li", { className: "gitRepoRow", key: r.fullName || r.name },
											React.createElement("div", { className: "gitRepoInfo" },
												React.createElement("div", { className: "gitRepoName" }, r.fullName || r.name),
												React.createElement("div", { className: "gitRepoMeta" }, (r.description || "No description") + " · " + (r.defaultBranch || "main"))),
											React.createElement("span", { className: "gitRepoBadge" }, r.private ? "私有" : "公开")))))
					: null,

				// ── Repository card ───────────────────────────────────────────
				React.createElement("div", { className: "gitCard", key: "repo" },
					React.createElement("div", { className: "gitCardHead" },
						React.createElement("span", { className: "gitCardTitle" }, "本地仓库"),
						React.createElement("span", { className: "gitBadge" }, repo && repo.isRepo ? "Git 仓库" : "未初始化")),
					React.createElement("div", { className: "gitPathRow" },
						React.createElement("input", { className: "gitInput gitPathInput", value: path, placeholder: "/path/to/repository", onChange: (e) => onPathChange(e.target.value) }),
						React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: () => loadRepo() }, "检测")),
					React.createElement("div", { className: "gitGrid", key: "createFields" },
						React.createElement(Field, { label: "仓库名称（创建时）", key: "name" },
							React.createElement("input", { className: "gitInput", value: repoName, placeholder: "默认取文件夹名", onChange: (e) => setRepoName(e.target.value) })),
						React.createElement(Field, { label: "描述（可选）", key: "desc" },
							React.createElement("input", { className: "gitInput", value: repoDesc, placeholder: "Repository description", onChange: (e) => setRepoDesc(e.target.value) }))),
					repoError ? React.createElement("p", { className: "gitError", key: "repoError" }, repoError) : null,
					!repo || !repo.isRepo
						? React.createElement("div", { className: "gitEmpty", key: "empty" },
							React.createElement("div", null, "输入本地文件夹路径后，可初始化仓库或直接创建 GitHub 仓库并推送。"),
							React.createElement("div", { className: "gitActions", style: { justifyContent: "center", marginTop: 10 } },
								React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "" || !path, onClick: initRepo }, busy === "init" ? "初始化中…" : "初始化仓库"),
								React.createElement("button", { type: "button", className: "gitBtn gitBtnPrimary", disabled: busy !== "" || !path, onClick: createRepo }, busy === "create" ? "创建中…" : "创建 GitHub 仓库并推送")))
						: React.createElement("div", { className: "gitRepoBody", key: "body" },
							React.createElement("div", { className: "gitStatusRow" },
								React.createElement("span", { className: "gitBadge gitBadgePrimary" }, "⭑ " + (repo.branch || "main")),
								React.createElement("span", { className: "gitBadge" }, "ahead " + repo.ahead),
								React.createElement("span", { className: "gitBadge" }, "behind " + repo.behind),
								repo.remotes && repo.remotes[0] ? React.createElement("span", { className: "gitBadge", title: repo.remotes[0].url }, repo.remotes[0].name) : null,
								React.createElement("span", { className: "gitMuted", style: { marginLeft: "auto" } }, repo.root || repo.path)),
							React.createElement("div", { className: "gitStats" },
								React.createElement("div", { className: "gitStat", key: "staged" }, React.createElement("div", { className: "gitStatLabel" }, "已暂存"), React.createElement("div", { className: "gitStatValue" }, repo.staged)),
								React.createElement("div", { className: "gitStat", key: "unstaged" }, React.createElement("div", { className: "gitStatLabel" }, "未暂存"), React.createElement("div", { className: "gitStatValue" }, repo.unstaged)),
								React.createElement("div", { className: "gitStat", key: "untracked" }, React.createElement("div", { className: "gitStatLabel" }, "未跟踪"), React.createElement("div", { className: "gitStatValue" }, repo.untracked)),
								React.createElement("div", { className: "gitStat", key: "conflicts" }, React.createElement("div", { className: "gitStatLabel" }, "冲突"), React.createElement("div", { className: "gitStatValue" }, repo.conflicts))),
							React.createElement("div", { key: "branches" },
								React.createElement("div", { className: "gitSectionTitle" }, "分支"),
								React.createElement("ul", { className: "gitBranchList" },
									(repo.branches || []).map((b) => React.createElement("li", { className: "gitBranchRow", key: b.name },
										React.createElement("span", { className: "gitBranchName" }, b.name),
										b.current
											? React.createElement("span", { className: "gitBranchCurrent" }, "当前")
											: React.createElement("span", { className: "gitBranchActions" },
												React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: () => switchBranch(b.name) }, "切换"))))),
								React.createElement("div", { className: "gitActions", style: { marginTop: 6 } },
									React.createElement("input", { className: "gitInput", style: { width: 180, height: 30 }, value: newBranch, placeholder: "新分支名", onChange: (e) => setNewBranch(e.target.value) }),
									React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: createBranch }, busy === "checkout" ? "处理中…" : "创建并切换"))),
							React.createElement("div", { className: "gitActions" },
								React.createElement("input", { className: "gitInput", style: { width: 220, height: 30 }, value: commitMsg, placeholder: "提交信息", onChange: (e) => setCommitMsg(e.target.value) }),
								React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: commit }, busy === "commit" ? "提交中…" : "提交"),
								React.createElement("button", { type: "button", className: "gitBtn gitBtnPrimary", disabled: busy !== "", onClick: push }, busy === "push" ? "推送中…" : "推送"),
								React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "", onClick: () => loadRepo() }, "刷新")),
							repo.commits && repo.commits.length > 0
								? React.createElement("div", { key: "commits" },
									React.createElement("div", { className: "gitCardHint", style: { marginBottom: 6 } }, "最近提交"),
									React.createElement("ul", { className: "gitCommitList" },
										repo.commits.map((c) => React.createElement("li", { className: "gitCommitRow", key: c.hash },
											React.createElement("span", { className: "gitCommitDot" }),
											React.createElement("span", { className: "gitCommitHash" }, c.hash),
											React.createElement("span", { className: "gitCommitMsg" }, c.message)))))
								: null,
							repo.graph && repo.graph.length > 0
								? React.createElement("div", { key: "graph" },
									React.createElement("div", { className: "gitSectionTitle" }, "提交分支图"),
									React.createElement("div", { className: "gitGraphWrap" },
										React.createElement("pre", { className: "gitGraph" }, repo.graph.join("\n"))))
								: null,
							repo.files && repo.files.length > 0
								? React.createElement("div", { key: "files" },
									React.createElement("div", { className: "gitCardHint", style: { marginBottom: 6 } }, "变更文件"),
									React.createElement("div", { className: "gitFileList" },
										repo.files.map((f, idx) => React.createElement("div", { className: "gitFileRow", key: idx },
											React.createElement("span", { className: "gitFileCode" }, f.code),
											React.createElement("span", { className: "gitFilePath" }, f.path)))))
								: null,
							React.createElement("div", { className: "gitActions", style: { marginTop: 4 } },
								React.createElement("button", { type: "button", className: "gitBtn", disabled: busy !== "" || !path, onClick: createRepo }, busy === "create" ? "创建中…" : "创建 GitHub 仓库并推送")))
				)
			];

			return React.createElement("div", { className: "gitSection" }, ...children);
		}

		// ── plugin entry ────────────────────────────────────────────────────────
		const inject = ["slots"];

		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === undefined) return;
			const style = document.createElement("style");
			style.dataset.plugin = "@deepseek-ai/dsh-plugin-git";
			style.dataset.pluginCss = "@deepseek-ai/dsh-plugin-git/styles";
			style.textContent = CSS;
			ctx.effect(() => {
				document.head.appendChild(style);
				return () => {
					style.remove();
				};
			}, "git: styles");
			slots.inject("settings.section", () => slots.register(
				{ name: "settings.section", id: "git", order: 40, label: () => "Git" },
				GitSection
			));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
