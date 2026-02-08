# Refactoring Plan: everything-claude-code -> everything-codex

## Context

当前项目 `everything-claude-code` 是 Claude Code CLI 的全功能配置工具包（41K+ stars），包含 13 个 agents、31 个 commands、29 个 skills、lifecycle hooks、rules 等。目标是将其完全重构为适配 **OpenAI Codex CLI** 的同定位项目 `everything-codex`，充分利用 Codex 原生能力，放弃 Claude Code 支持。

**核心决策**：
- 不采用实验性 MCP subagent（不稳定）
- 13 个 agents 降级为 skills（role-switching prompt 模式）
- **充分利用 Codex 原生 rules 体系**：AGENTS.md 层级指令 + Starlark execution policies 双轨制
- **分阶段迁移**：先 MVP 关键路径验证，再逐步扩大迁移面

### 迁移策略：分阶段 + 强门禁

**MVP Gate（必须先完成，阻断后续所有阶段）**：
1. AGENTS.md 分层加载可验证 — 全局 + 项目级正确加载
2. rules/execpolicy 生效可验证 — 高危命令被正确拦截
3. `codex --check-config` 与 profile 启动可验证 — config.toml 无报错
4. skills 可发现且关键命令可触发 — `/plan`、`/code-review`、`/tdd`

**阶段划分**：
| 阶段 | 范围 | Gate 条件 | 依赖 |
|------|------|-----------|------|
| **Stage 0: 基础设施** | Phase 1（AGENTS.md + rules + config） | MVP Gate 全部通过 | 无 |
| **Stage 1: 核心 Skills** | Phase 2 中的 4 个关键 agent-skills：`plan`、`code-review`、`tdd`、`security-review` | 端到端 smoke test 通过 | Stage 0 |
| **Stage 2: 剩余 Agent-Skills** | Phase 2 剩余 9 个 + Phase 3 commands | Skill 发现 + 触发测试 | Stage 1 |
| **Stage 3: Pattern Skills** | Phase 4（29 个现有 skills 迁移） | frontmatter 验证 + 无 Claude Code 引用 | Stage 1 |
| **Stage 4: 安装与发布** | Phase 7 安装脚本 + Phase 8 文档 | 安装/卸载/回滚端到端测试 | Stage 2 + 3 |

每个阶段完成后执行对应 gate 检查，失败则修复后重新验证，不得跳过。

### Codex Rules 体系总结

Codex 有两个互补的规则系统：

**1. AGENTS.md — 行为指令（Markdown）**
- 用途：编码规范、工作流、安全准则等行为性指导
- 发现机制：层级自动发现（`~/.codex/AGENTS.md` -> git root -> 子目录），近覆盖远
- 文件名回退：`AGENTS.override.md` > `AGENTS.md` > `TEAM_GUIDE.md` > `.agents.md`
- 加载方式：启动时自动扫描，无需配置
- **关键能力**：不同目录可以有不同的 AGENTS.md，实现分层规则覆盖

**2. Execution Policy Rules — 命令控制（Starlark）**
- 用途：控制哪些 shell 命令可以执行
- 文件：`~/.codex/rules/*.rules`、项目级 `.codex/rules/*.rules`
- 语法：`prefix_rule(pattern, decision, justification)`
- 决策类型：`allow`、`prompt`、`forbidden`
- TUI 集成：审批命令时自动写入 `default.rules`

---

## Phase 1: 项目基础设施重构

### 1.1 项目重命名和清理

- 项目名 `everything-claude-code` -> `everything-codex`
- 删除 `.claude-plugin/`（Codex 无 plugin marketplace）
- 删除 `.opencode/`（不再需要）
- 删除 `hooks/hooks.json`（功能分散到 rules + AGENTS.md）
- 删除 `contexts/`（迁移到 config profiles）
- `agents/` 和 `commands/` 内容合并进 `skills/`，原目录删除
- 更新 `README.md`、`CONTRIBUTING.md`、`LICENSE`、`llms.txt`

### 1.2 AGENTS.md 层级架构设计（核心重构）

**设计原则**：利用 Codex 的层级 AGENTS.md 发现机制，将指令按作用域分层，而非全部塞进一个文件。

#### 全局层：`AGENTS.md`（根级）

精简的全局指令，只包含普适性内容：

| 章节 | 来源 | 内容概述 |
|------|------|---------|
| 项目概述 | 新编写 | everything-codex 是什么、如何使用 |
| 通用编码规范 | `rules/common/coding-style.md` | 命名、格式化、代码组织的通用原则 |
| Git 工作流 | `rules/common/git-workflow.md` | commit 格式、PR 流程、分支策略 |
| 安全准则 | `rules/common/security.md` | OWASP Top 10、密钥管理、输入验证 |
| Skill 使用指引 | `rules/common/agents.md`（改写） | 可用 skills 列表及触发场景 |
| 工具使用后行为 | 新编写 | 编辑后格式化/检查的文字提醒（替代 PostToolUse hooks） |

**不在根级 AGENTS.md 中的内容**（下沉到语言特定层或 skills）：
- 测试方法论（下沉到语言特定 AGENTS.md）
- 设计模式（下沉到语言特定 AGENTS.md 或 skills）
- 性能优化（下沉到 skills）

#### 语言特定层：`<lang>/AGENTS.md`

利用层级发现，为每种语言创建子目录 AGENTS.md。当用户在对应语言目录下工作时，自动加载语言特定规则：

**`golang/AGENTS.md`**
- 来源：`rules/golang/coding-style.md` + `testing.md` + `patterns.md` + `security.md` + `hooks.md`
- 内容：gofmt/goimports 要求、错误处理包装、table-driven tests、race detection、接口设计原则

**`python/AGENTS.md`**
- 来源：`rules/python/coding-style.md` + `testing.md` + `patterns.md` + `security.md` + `hooks.md`
- 内容：PEP 8、type hints、pytest、虚拟环境、安全扫描

**`typescript/AGENTS.md`**
- 来源：`rules/typescript/coding-style.md` + `testing.md` + `patterns.md` + `security.md` + `hooks.md`
- 内容：strict TypeScript、ESLint、Prettier、Jest/Vitest、React 模式

#### 安装后的用户侧结构

```
~/.codex/
├── AGENTS.md              # 全局通用规则（精简）
├── golang/
│   └── AGENTS.md          # Go 特定规则（自动层级发现）
├── python/
│   └── AGENTS.md          # Python 特定规则
└── typescript/
    └── AGENTS.md          # TypeScript 特定规则
```

当用户在 Go 项目中工作时，Codex 自动加载 `~/.codex/AGENTS.md`（全局）+ 项目级 `AGENTS.md`（如有）。语言特定规则通过 skills 按需加载（见 Phase 4）。

**注意**：Codex 的 AGENTS.md 层级发现基于工作目录路径，不是按语言检测。因此语言特定的 AGENTS.md 只在用户处于对应子目录时自动生效。对于项目级使用，更实际的方案是：

- **全局 AGENTS.md**：通用规则
- **项目 AGENTS.md**：用户根据项目语言从模板中选择内容
- **语言特定规则 skills**：按需加载，作为 AGENTS.md 的补充

#### 语言规则加载兜底机制

为解决路径不匹配导致语言规则失效的问题，采用三层兜底策略：

1. **全局 AGENTS.md 中嵌入语言检测提示**：在全局 AGENTS.md 末尾添加指令，提示 agent 根据当前文件扩展名主动加载对应语言 skill（如检测到 `.go` 文件时建议 `/golang-rules`）
2. **`/configure-codex` 安装时按项目语言生成**：安装脚本检测项目主语言（通过 `go.mod`、`pyproject.toml`、`package.json` 等标志文件），自动将对应语言规则合并进项目级 AGENTS.md
3. **语言 skills 作为最终兜底**：即使 AGENTS.md 未加载语言规则，用户仍可手动 `/golang-rules` 等触发加载

### 1.3 Execution Policy Rules（Starlark）

将安全类 hooks 转换为 Starlark 执行策略，建立系统性危险命令矩阵，覆盖直接命令、复合命令、管道、子 shell、分号链等绕过路径。

#### 高危命令矩阵

| 类别 | 命令模式 | 决策 | 绕过风险 |
|------|---------|------|---------|
| 文件删除 | `rm -rf`, `rm -r` | forbidden | 管道 `\| xargs rm`、子 shell `$(rm ...)` |
| Git 破坏 | `git push --force`, `git reset --hard`, `git clean -f` | forbidden | `--force-with-lease` 应 prompt |
| Git 推送 | `git push` | prompt | — |
| 长进程 | `npm run dev`, `pnpm dev`, `yarn dev` | prompt | `npx` 包装 |
| 权限提升 | `sudo`, `su` | forbidden | 管道 `\| sudo` |
| 网络工具 | `curl \| bash`, `wget -O- \| sh` | forbidden | 变体：`curl \| sh`, `wget \| bash` |
| 数据库破坏 | `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` | forbidden | 通过 `psql -c` 或 `mysql -e` 执行 |

#### 反绕过验证要求

安装后必须通过以下测试场景（见 Verification Plan）：
1. 直接命令：`rm -rf /tmp/test` → forbidden
2. 分号链：`echo hello; rm -rf /tmp/test` → forbidden
3. 管道：`find . | xargs rm -rf` → forbidden
4. 子 shell：`bash -c "rm -rf /tmp/test"` → prompt（子 shell 内命令需审批）
5. 复合命令：`git add . && git push --force` → forbidden（匹配最严格规则）

Starlark `prefix_rule` 基于命令前缀匹配，对管道和子 shell 的拦截能力有限。对于超出 prefix_rule 能力的绕过场景，在 AGENTS.md 中补充文字约束作为防御层。

**`rules/safety.rules`**
```starlark
# 阻止在非 tmux 中直接运行 dev server
prefix_rule(
    pattern=["npm", "run", "dev"],
    decision="prompt",
    justification="Consider running in tmux for long-running dev servers"
)
prefix_rule(
    pattern=["pnpm", "dev"],
    decision="prompt",
    justification="Consider running in tmux"
)
prefix_rule(
    pattern=["yarn", "dev"],
    decision="prompt",
    justification="Consider running in tmux"
)

# 权限提升
prefix_rule(
    pattern=["sudo"],
    decision="forbidden",
    justification="Privilege escalation not allowed"
)
prefix_rule(
    pattern=["su"],
    decision="forbidden",
    justification="User switching not allowed"
)
```

**`rules/git-safety.rules`**
```starlark
# Git push 前要求确认
prefix_rule(
    pattern=["git", "push"],
    decision="prompt",
    justification="Review changes before pushing to remote"
)
# 禁止 force push
prefix_rule(
    pattern=["git", "push", "--force"],
    decision="forbidden",
    justification="Force push is dangerous and can lose work"
)
# 禁止 hard reset
prefix_rule(
    pattern=["git", "reset", "--hard"],
    decision="forbidden",
    justification="Hard reset discards uncommitted changes"
)
# 禁止 force clean
prefix_rule(
    pattern=["git", "clean", "-f"],
    decision="forbidden",
    justification="Force clean permanently deletes untracked files"
)
```

**`rules/file-hygiene.rules`**
```starlark
# 阻止 rm -rf
prefix_rule(
    pattern=["rm", "-rf"],
    decision="forbidden",
    justification="Recursive force delete is too dangerous"
)
prefix_rule(
    pattern=["rm", "-r"],
    decision="prompt",
    justification="Recursive delete requires confirmation"
)
```

### 1.4 创建 config.toml

**来源**：`mcp-configs/mcp-servers.json` + `contexts/`

**Schema 兼容性措施**：
- `scripts/ci/check-config-schema.js`：对比当前 config.toml 与 Codex CLI 支持的字段列表，对未知字段发出警告
- config.toml 中仅使用 Codex 官方文档明确记载的字段，避免使用 undocumented 行为
- 在 config.toml 头部注释中标注对应的 Codex CLI 最低版本要求

```toml
# 最低 Codex CLI 版本: 0.98.0
model = "o4-mini"
sandbox = "network"

# MCP 服务器（从 mcp-servers.json 转换）
[mcp.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
[mcp.github.env]
GITHUB_PERSONAL_ACCESS_TOKEN = "${GITHUB_PAT}"
# ... 其他 14 个 MCP 配置

# Config Profiles（替代 contexts/）
[profiles.dev]
# codex -p dev：开发模式，代码优先

[profiles.review]
# codex -p review：审查模式，安全优先

[profiles.research]
# codex -p research：研究模式，分析优先
```

### 1.5 创建 requirements.toml

遵循最小权限原则，开箱即用时采用受限沙箱与按需审批。

```toml
# 最低 Codex CLI 版本: 0.98.0

[security]
no_secrets_in_code = true
require_parameterized_queries = true

[approval]
# 默认安全基线：高风险操作均需审批
network_access = "prompt"
file_delete = "prompt"
shell_execute = "prompt"           # 任意 shell 命令默认需审批
external_service_call = "prompt"   # 调用外部服务需审批
```

**默认 profile 安全原则**：
- 默认 sandbox 模式为 `network`（允许网络但受限）
- 所有 `forbidden` 规则在任何 profile 下均不可覆盖
- `prompt` 规则可由用户在 TUI 中逐条审批并记录到 `default.rules`

---

## Phase 2: Agent -> Skill 转换（13 个 agents）

**策略**：每个 agent 转为 skill，用 role-switching prompt 设置行为约束。

### SKILL.md 模板

```markdown
---
name: <skill-name>
description: <one-line description>
---

# <Role Name> Mode

**BEHAVIORAL CONSTRAINTS:**
- [替代原 tools 限制]

## Your Role
[原 agent 专业内容]
```

### 映射表

| 原 Agent | 新 Skill | 合并的 Command | 行为约束 |
|----------|----------|---------------|---------|
| `planner` | `skills/plan/SKILL.md` | `commands/plan.md` | 只读：不修改文件 |
| `code-reviewer` | `skills/code-review/SKILL.md` | `commands/code-review.md` | 只读：分析不修改 |
| `security-reviewer` | `skills/security-review/SKILL.md` | + `skills/security-review/` | 只读：安全审计 |
| `tdd-guide` | `skills/tdd/SKILL.md` | + `commands/tdd.md` + `skills/tdd-workflow/` | 可写：写测试和实现 |
| `architect` | `skills/architect/SKILL.md` | — | 只读：设计分析 |
| `build-error-resolver` | `skills/build-fix/SKILL.md` | `commands/build-fix.md` | 可写：修复构建 |
| `database-reviewer` | `skills/database-review/SKILL.md` | — | 只读 |
| `doc-updater` | `skills/doc-updater/SKILL.md` | + `update-docs` + `update-codemaps` | 可写：更新文档 |
| `e2e-runner` | `skills/e2e/SKILL.md` | `commands/e2e.md` | 可写：生成运行测试 |
| `go-build-resolver` | `skills/go-build-fix/SKILL.md` | `commands/go-build.md` | 可写 |
| `go-reviewer` | `skills/go-review/SKILL.md` | `commands/go-review.md` | 只读 |
| `python-reviewer` | `skills/python-review/SKILL.md` | `commands/python-review.md` | 只读 |
| `refactor-cleaner` | `skills/refactor-clean/SKILL.md` | `commands/refactor-clean.md` | 可写 |

### 内容改写要点

1. 移除 Claude Code 引用（"Task tool"、"Read tool" -> 通用术语）
2. YAML frontmatter：`tools`/`model` 字段移除，改为 `name`/`description`
3. 工具约束文字化：`tools: ["Read", "Grep", "Glob"]` -> "CONSTRAINT: Do NOT modify files"
4. 保留核心专业知识（审查清单、TDD 流程、安全检查项等）

---

## Phase 3: Command -> Skill 转换（剩余 18 个 commands）

### 需要重写

| 原 Command | 新 Skill | 改写要点 |
|------------|----------|---------|
| `orchestrate` | `skills/orchestrate/SKILL.md` | 多 agent 链 -> 顺序式 skill 指引 |
| `sessions` | `skills/sessions/SKILL.md` | 适配 Codex 原生 session logs |
| `multi-plan/execute/workflow` | 各自 skill | 标记高级/可选 |

### 直接转换（13 个）

`eval`、`verify`、`checkpoint`、`learn`、`test-coverage`、`go-test`、`evolve`、`instinct-status`、`instinct-export`、`instinct-import`、`skill-create`、`setup-pm`、`pm2`

### `orchestrate` 重写

```markdown
## Full Feature Workflow（顺序式）

### Phase 1: /plan → 分析需求，输出计划，等待确认
### Phase 2: /tdd → 写测试、实现代码
### Phase 3: /code-review → 审查代码质量
### Phase 4: /security-review → 安全审计

每阶段结束输出摘要和交接信息。
```

---

## Phase 4: 现有 Skills 迁移（29 个）

### 直接迁移（20 个）

确保 frontmatter 含 `name`/`description`，移除 Claude Code 引用：

`golang-patterns`, `golang-testing`, `python-patterns`, `python-testing`, `backend-patterns`, `frontend-patterns`, `coding-standards`, `django-patterns`, `django-security`, `django-tdd`, `springboot-patterns`, `springboot-security`, `springboot-tdd`, `java-coding-standards`, `jpa-patterns`, `postgres-patterns`, `clickhouse-io`, `iterative-retrieval`, `project-guidelines-example`, `continuous-learning`

### 合并到 agent-skills（4 个）

| 原 Skill | 合并目标 |
|----------|---------|
| `eval-harness` | `skills/eval/SKILL.md` |
| `verification-loop` | `skills/verify/SKILL.md` |
| `tdd-workflow` | `skills/tdd/SKILL.md` |
| `security-review` | `skills/security-review/SKILL.md` |

### 需要改写（5 个）

| Skill | 原因 |
|-------|------|
| `continuous-learning-v2` | 移除 hook 依赖，改手动调用 |
| `strategic-compact` | Codex 无 /compact，改手动建议 |
| `configure-ecc` | 重命名 `configure-codex`，路径改 `~/.codex/` |
| `eval-harness` | 移除 Claude Code 特有引用 |
| `django-verification` / `springboot-verification` | 检查并移除 Claude Code 引用 |

### 新增语言规则 Skills（3 个）

这些 skills 将语言特定的 rules 打包为按需加载的知识：

| Skill | 来源 | 用途 |
|-------|------|------|
| `skills/golang-rules/SKILL.md` | `rules/golang/*.md` (5 files) | Go 编码风格 + 测试 + 模式 + 安全 |
| `skills/python-rules/SKILL.md` | `rules/python/*.md` (5 files) | Python 同上 |
| `skills/typescript-rules/SKILL.md` | `rules/typescript/*.md` (5 files) | TypeScript 同上 |

这些 skills 是语言特定 AGENTS.md 模板的补充——AGENTS.md 提供基础规则（自动加载），skills 提供详细的模式和惯用法（按需加载）。

---

## Phase 5: Hook 功能迁移

Hook 迁移采用"Starlark rules 强制执行 + AGENTS.md 文字指令 + CI 脚本兜底"三层保障策略，为每类迁移明确替代机制和可观测性手段。

| 原 Hook | 类型 | 迁移到 | 机制 | 可观测性替代 |
|---------|------|--------|------|-------------|
| Block dev server outside tmux | PreToolUse | `rules/safety.rules` | Starlark `prompt` | exec policy 审批日志 |
| Tmux reminder | PreToolUse | AGENTS.md | 文字指令 | — |
| Git push review | PreToolUse | `rules/git-safety.rules` | Starlark `prompt` | exec policy 审批日志 |
| Block random .md creation | PreToolUse | `rules/file-hygiene.rules` | Starlark `forbidden` | exec policy 拦截日志 |
| Suggest compact | PreToolUse | **丢弃** | Codex 无 /compact | — |
| Auto-format (prettier) | PostToolUse | AGENTS.md + CI 脚本 | 文字指令 + `scripts/ci/check-format.sh` | CI 格式化检查报告 |
| TypeScript check (tsc) | PostToolUse | AGENTS.md + CI 脚本 | 文字指令 + `scripts/ci/check-types.sh` | CI 类型检查报告 |
| console.log warning | PostToolUse/Stop | AGENTS.md + CI 脚本 | 文字指令 + `scripts/ci/check-console-log.sh` | CI lint 报告 |
| Log PR URL | PostToolUse | AGENTS.md | 文字指令 | — |
| Async build analysis | PostToolUse | CI 脚本 | `scripts/ci/build-analysis.sh` | CI 构建分析报告 |
| Load session context | SessionStart | **丢弃** | Codex 原生 sessions | Codex session logs |
| Persist session state | SessionEnd | **丢弃** | Codex 原生 sessions | Codex session logs |
| Evaluate session patterns | SessionEnd | **降级** | 手动 `/learn` | `/learn` 输出记录 |
| Pre-compact save | PreCompact | **丢弃** | Codex 无 /compact | — |

### 补充 CI 脚本

为弥补 PostToolUse hooks 丢失后的强制执行能力，新增以下 CI 校验脚本（放入 `scripts/ci/`），确保即使 AGENTS.md 文字指令被忽略，CI 层仍能捕获问题：

| 脚本 | 用途 | 触发时机 |
|------|------|---------|
| `check-format.sh` | 检查代码格式（prettier/gofmt/black） | PR CI pipeline |
| `check-types.sh` | TypeScript 类型检查 | PR CI pipeline |
| `check-console-log.sh` | 检测残留的 console.log/print 调试语句 | PR CI pipeline |
| `build-analysis.sh` | 构建状态分析与报告 | PR CI pipeline |

---

## Phase 6: Scripts 迁移

| 原脚本 | 处理 |
|--------|------|
| `scripts/hooks/*.js` (6) | **丢弃** |
| `scripts/lib/session-manager.js` | **丢弃** |
| `scripts/lib/session-aliases.js` | **丢弃** |
| `scripts/lib/package-manager.js` | **保留** |
| `scripts/lib/utils.js` | **保留** |
| `scripts/setup-package-manager.js` | **保留** |
| `scripts/skill-create-output.js` | **保留** |
| `scripts/ci/validate-*.js` (5) | **改写**：验证 Codex 结构 |

新增：
- `scripts/install.sh`、`scripts/uninstall.sh`
- `scripts/ci/check-format.sh`、`scripts/ci/check-types.sh`、`scripts/ci/check-console-log.sh`、`scripts/ci/build-analysis.sh`

---

## Phase 7: 分发和安装

### 安装方式

```bash
# 推荐方式：先下载再执行（可审查脚本内容）
curl -sSL https://raw.githubusercontent.com/<org>/everything-codex/main/scripts/install.sh -o /tmp/install-codex.sh
# 校验 checksum
curl -sSL https://raw.githubusercontent.com/<org>/everything-codex/main/scripts/install.sh.sha256 -o /tmp/install-codex.sh.sha256
(cd /tmp && shasum -a 256 -c install-codex.sh.sha256)
bash /tmp/install-codex.sh

# 手动方式
git clone https://github.com/<org>/everything-codex.git ~/.codex/.everything-codex
cd ~/.codex/.everything-codex && ./scripts/install.sh --local

# 交互式（安装后在 Codex 内运行）
# /configure-codex 选择性启用

# 卸载 / 回滚
~/.codex/.everything-codex/scripts/uninstall.sh
# 或从备份恢复
~/.codex/.everything-codex/scripts/install.sh --rollback
```

### 供应链安全

每次 release 同步发布：
- `install.sh.sha256` — 安装脚本的 SHA-256 校验文件
- `CHECKSUMS.sha256` — 所有发布文件的校验和
- 脚本内嵌版本号，执行时验证与 release tag 一致

### install.sh 关键逻辑

```bash
#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
BACKUP_DIR="$CODEX_DIR/.backup-$(date +%Y%m%d%H%M%S)"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"

# ============================================
# 0. 备份现有配置（回滚基础）
# ============================================
if [ -d "$CODEX_DIR" ]; then
    echo "Backing up existing ~/.codex to $BACKUP_DIR ..."
    mkdir -p "$BACKUP_DIR"
    for f in AGENTS.md golang/AGENTS.md python/AGENTS.md typescript/AGENTS.md; do
        if [ -f "$CODEX_DIR/$f" ]; then
            mkdir -p "$(dirname "$BACKUP_DIR/$f")"
            cp "$CODEX_DIR/$f" "$BACKUP_DIR/$f"
        fi
    done
    [ -d "$CODEX_DIR/skills" ] && cp -r "$CODEX_DIR/skills" "$BACKUP_DIR/skills"
    [ -d "$CODEX_DIR/rules" ] && cp -r "$CODEX_DIR/rules" "$BACKUP_DIR/rules"
    echo "Backup complete: $BACKUP_DIR"
fi

# ============================================
# 1. AGENTS.md — 合并而非覆盖
# ============================================
if [ -f "$CODEX_DIR/AGENTS.md" ]; then
    echo ""
    echo "Existing AGENTS.md detected. Choose merge strategy:"
    echo "  1) append  — 追加 everything-codex 规则到现有文件末尾"
    echo "  2) include — 在现有文件末尾添加 include 引用"
    echo "  3) replace — 替换为 everything-codex 版本（原文件已备份）"
    echo "  4) skip    — 跳过，不修改"
    echo "  5) dry-run — 仅显示差异，不修改"
    read -rp "选择 [1-5, default=4]: " choice
    case "${choice:-4}" in
        1) echo -e "\n# --- everything-codex rules ---\n" >> "$CODEX_DIR/AGENTS.md"
           cat AGENTS.md >> "$CODEX_DIR/AGENTS.md" ;;
        2) echo -e "\n# Include everything-codex rules\n# See: ~/.codex/.everything-codex/AGENTS.md" >> "$CODEX_DIR/AGENTS.md" ;;
        3) cp AGENTS.md "$CODEX_DIR/AGENTS.md" ;;
        4) echo "Skipped AGENTS.md" ;;
        5) diff "$CODEX_DIR/AGENTS.md" AGENTS.md || true ;;
    esac
else
    cp AGENTS.md "$CODEX_DIR/AGENTS.md"
fi

# ============================================
# 2. 语言特定 AGENTS.md（用户可选）
# ============================================
for lang in golang python typescript; do
    mkdir -p "$CODEX_DIR/$lang"
    if [ -f "$CODEX_DIR/$lang/AGENTS.md" ]; then
        echo "Existing $lang/AGENTS.md detected, skipping (use --force to overwrite)"
    else
        cp "$lang/AGENTS.md" "$CODEX_DIR/$lang/AGENTS.md"
    fi
done

# ============================================
# 3-5. Skills / Rules / Config
# ============================================
mkdir -p "$CODEX_DIR/skills" "$CODEX_DIR/rules"
cp -r skills/* "$CODEX_DIR/skills/"
cp rules/*.rules "$CODEX_DIR/rules/"
cp config.toml "$CODEX_DIR/config.toml.example"
cp requirements.toml "$CODEX_DIR/requirements.toml.example"

# ============================================
# 6. 记录安装清单（用于卸载和回滚）
# ============================================
find "$CODEX_DIR/skills" "$CODEX_DIR/rules" -type f > "$INSTALL_MANIFEST"
echo "$CODEX_DIR/config.toml.example" >> "$INSTALL_MANIFEST"
echo "$CODEX_DIR/requirements.toml.example" >> "$INSTALL_MANIFEST"
echo "Manifest written to $INSTALL_MANIFEST"

# ============================================
# 7. 安装后验证
# ============================================
echo ""
echo "Running post-install verification..."
if command -v codex &>/dev/null; then
    codex --check-config && echo "Config valid" || echo "Config check failed"
else
    echo "codex CLI not found, skipping config check"
fi
echo ""
echo "Installation complete. Backup at: $BACKUP_DIR"
echo "To rollback: $0 --rollback"
```

### uninstall.sh / rollback 逻辑

```bash
# --rollback: 从最近的备份恢复
LATEST_BACKUP=$(ls -dt "$CODEX_DIR/.backup-"* 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    cp -r "$LATEST_BACKUP"/* "$CODEX_DIR/"
    echo "Restored from $LATEST_BACKUP"
fi

# uninstall: 根据 manifest 删除安装的文件
if [ -f "$INSTALL_MANIFEST" ]; then
    while IFS= read -r file; do
        rm -f "$file"
    done < "$INSTALL_MANIFEST"
    rm -f "$INSTALL_MANIFEST"
    echo "Uninstalled everything-codex files"
fi
```

---

## Phase 8: 文档

- `README.md` — 重写为 Codex CLI 工具包
- `CONTRIBUTING.md` — 更新（skill 格式、AGENTS.md 规范、Starlark rules 规范）
- `docs/migration-from-claude-code.md` — 迁移指南
- `docs/agents-md-architecture.md` — 层级 AGENTS.md 架构说明
- `docs/capability-degradation.md` — 能力降级说明，明确哪些 Claude Code 特性不再支持及替代路径
- `docs/operations-runbook.md` — 运维手册（故障排查、回滚操作、版本升级 playbook）
- `docs/zh-CN/` — 中文翻译
- `examples/AGENTS.md`、`config.toml`、`requirements.toml`

---

## 最终目录结构

```
everything-codex/
├── AGENTS.md                          # 全局通用指令（精简）
├── golang/
│   └── AGENTS.md                      # Go 特定规则（层级发现模板）
├── python/
│   └── AGENTS.md                      # Python 特定规则
├── typescript/
│   └── AGENTS.md                      # TypeScript 特定规则
├── config.toml                        # Codex 配置（MCP + profiles）
├── requirements.toml                  # 安全约束
├── rules/                             # Starlark 执行策略
│   ├── safety.rules
│   ├── git-safety.rules
│   └── file-hygiene.rules
├── skills/                            # ~60 个 skills
│   │   # Agent-derived skills
│   ├── plan/SKILL.md
│   ├── code-review/SKILL.md
│   ├── security-review/SKILL.md
│   ├── tdd/SKILL.md
│   ├── architect/SKILL.md
│   ├── build-fix/SKILL.md
│   ├── database-review/SKILL.md
│   ├── doc-updater/SKILL.md
│   ├── e2e/SKILL.md
│   ├── go-build-fix/SKILL.md
│   ├── go-review/SKILL.md
│   ├── go-test/SKILL.md
│   ├── python-review/SKILL.md
│   ├── refactor-clean/SKILL.md
│   │   # Command-derived skills
│   ├── orchestrate/SKILL.md
│   ├── eval/SKILL.md
│   ├── verify/SKILL.md
│   ├── checkpoint/SKILL.md
│   ├── learn/SKILL.md
│   ├── test-coverage/SKILL.md
│   ├── sessions/SKILL.md
│   ├── evolve/SKILL.md
│   ├── instinct-status/SKILL.md
│   ├── instinct-export/SKILL.md
│   ├── instinct-import/SKILL.md
│   ├── skill-create/SKILL.md
│   ├── setup-pm/SKILL.md
│   ├── configure-codex/SKILL.md
│   ├── multi-plan/SKILL.md
│   ├── multi-execute/SKILL.md
│   ├── multi-workflow/SKILL.md
│   ├── pm2/SKILL.md
│   │   # Language rules skills（按需加载的详细规则）
│   ├── golang-rules/SKILL.md
│   ├── python-rules/SKILL.md
│   ├── typescript-rules/SKILL.md
│   │   # Language/framework pattern skills
│   ├── golang-patterns/SKILL.md
│   ├── golang-testing/SKILL.md
│   ├── python-patterns/SKILL.md
│   ├── python-testing/SKILL.md
│   ├── backend-patterns/SKILL.md
│   ├── frontend-patterns/SKILL.md
│   ├── coding-standards/SKILL.md
│   ├── django-patterns/SKILL.md
│   ├── django-security/SKILL.md
│   ├── django-tdd/SKILL.md
│   ├── django-verification/SKILL.md
│   ├── springboot-patterns/SKILL.md
│   ├── springboot-security/SKILL.md
│   ├── springboot-tdd/SKILL.md
│   ├── springboot-verification/SKILL.md
│   ├── java-coding-standards/SKILL.md
│   ├── jpa-patterns/SKILL.md
│   ├── postgres-patterns/SKILL.md
│   ├── clickhouse-io/SKILL.md
│   ├── continuous-learning/SKILL.md
│   ├── continuous-learning-v2/SKILL.md
│   ├── strategic-compact/SKILL.md
│   ├── iterative-retrieval/SKILL.md
│   └── project-guidelines-example/SKILL.md
├── scripts/
│   ├── install.sh                 # 安全安装（备份+合并+回滚）
│   ├── install.sh.sha256          # 安装脚本校验和
│   ├── uninstall.sh               # 基于 manifest 的干净卸载
│   ├── lib/
│   │   ├── package-manager.js
│   │   └── utils.js
│   ├── ci/
│   │   ├── validate-skills.js
│   │   ├── validate-structure.js
│   │   ├── check-config-schema.js # config.toml schema 兼容性检查
│   │   ├── check-format.sh        # 代码格式检查
│   │   ├── check-types.sh         # TypeScript 类型检查
│   │   ├── check-console-log.sh   # 调试语句检测
│   │   └── build-analysis.sh      # 构建状态分析
│   ├── setup-package-manager.js
│   └── skill-create-output.js
├── examples/
│   ├── AGENTS.md
│   ├── config.toml
│   └── requirements.toml
├── docs/
│   ├── migration-from-claude-code.md
│   ├── agents-md-architecture.md
│   ├── capability-degradation.md  # 能力降级说明
│   ├── operations-runbook.md      # 运维手册
│   └── zh-CN/
├── tests/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── llms.txt
```

---

## 能力对比

| 能力 | Claude Code | Codex（重构后） | 影响 |
|------|------------|----------------|------|
| Subagent 隔离 | 完整 | 文字约束 | **高** |
| 生命周期 hooks | 6 种 | 无 | **高** — 降级为 AGENTS.md 指令 + exec policies + CI 脚本 |
| 编码规则系统 | `rules/*.md` 单层 | **AGENTS.md 层级** + skills | **升级** — 层级覆盖更灵活 |
| 命令安全控制 | hooks (JS) | **Starlark rules** | **升级** — 声明式更清晰 |
| Config profiles | 无 | **原生支持** | **新增** |
| 安全约束 | 无 | **requirements.toml** | **新增** |
| Agent 模型切换 | 支持 | 不支持 | **中** |
| 自动格式化 | PostToolUse hook | AGENTS.md 指令 + CI 脚本 | **中** |
| 持续学习 | Hook 自动 | 手动 `/learn` | **低** |

---

## Verification Plan

验证计划分为三层 gate，每层都有明确的通过/失败判定和自动化执行方式。

### Gate 0: 结构验证（CI 自动化，阻断 PR 合并）

| 检查项 | 命令 | 通过条件 |
|-------|------|---------|
| 目录结构 | `scripts/ci/validate-structure.js` | exit 0 |
| Skill frontmatter | `scripts/ci/validate-skills.js` | 所有 SKILL.md 含 `name`/`description` |
| 无 Claude Code 引用 | `grep -r "Claude Code\|Task tool\|Read tool" skills/` | 无匹配 |
| Config 语法 | `codex --check-config` | exit 0 |
| Starlark 语法 | `codex execpolicy check --rules rules/*.rules` | exit 0 |
| Schema 兼容性 | `scripts/ci/check-config-schema.js` | 无未知字段警告 |

### Gate 1: 功能验证（CI 自动化，阻断 release）

| 检查项 | 方法 | 通过条件 |
|-------|------|---------|
| AGENTS.md 层级加载 | 在 `~/.codex/` 和项目目录分别启动 codex，检查 loaded instructions | 全局 + 项目级均正确加载 |
| Execution policy 生效 | 反绕过测试矩阵（5 个场景） | 所有高危命令被正确拦截 |
| Skill 发现 | 启动 codex，`/` menu | 所有已注册 skills 可见 |
| Profile 启动 | `codex -p dev`、`codex -p review` | 无报错启动 |
| 核心 skill 端到端 | `/plan`、`/code-review`、`/tdd`、`/orchestrate` | 每个 skill 可触发并输出预期格式 |

### Gate 2: 安装验证（release 前手动 + CI）

| 检查项 | 方法 | 通过条件 |
|-------|------|---------|
| 干净环境安装 | Docker 容器中 `install.sh` | exit 0 + 验证文件到位 |
| 已有环境安装 | 预置 `~/.codex/AGENTS.md` 后安装 | 原文件不被覆盖（默认 skip） |
| 安装后 config 验证 | `codex --check-config` | exit 0 |
| 卸载完整性 | `uninstall.sh` 后检查残留 | manifest 中所有文件已删除 |
| 回滚恢复 | `install.sh --rollback` | 恢复到备份状态，diff 无差异 |
| Checksum 验证 | `shasum -a 256 -c CHECKSUMS.sha256` | 所有文件校验通过 |

### 发布门禁规则

- **PR 合并**：Gate 0 全部通过 → 允许合并
- **Release 发布**：Gate 0 + Gate 1 全部通过 → 允许创建 release tag
- **Release 资产发布**：Gate 2 全部通过 → 允许上传 release assets
- **任一 gate 失败**：自动阻断，修复后重新运行全部 gates

---

## Definition of Done（验收标准）

1. **安装可逆**：任意失败点都可在 1 步回滚到安装前状态（`install.sh --rollback`）
2. **规则可证**：高危命令矩阵中所有场景的 policy 决策与预期一致（反绕过测试通过）
3. **迁移可用**：核心 skills 和命令在 clean env 和已有 `~/.codex` env 均可运行
4. **审核可追溯**：每次发布包含 `check-config`、smoke test、review 证据（CI artifacts）
5. **默认安全**：默认 profile 不允许无审批执行高风险操作（forbidden/prompt 规则覆盖完整）
6. **无 Claude Code 残留**：代码库中无 Claude Code 特有引用（CI grep 检查通过）
7. **文档完备**：README、迁移指南、架构说明均已更新且与实际结构一致
