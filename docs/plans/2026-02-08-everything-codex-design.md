# Refactoring Plan: everything-claude-code -> everything-codex

## Context

当前项目 `everything-claude-code` 是 Claude Code CLI 的全功能配置工具包（41K+ stars），包含 13 个 agents、31 个 commands、29 个 skills、lifecycle hooks、rules 等。目标是将其完全重构为适配 **OpenAI Codex CLI** 的同定位项目 `everything-codex`，充分利用 Codex 原生能力，放弃 Claude Code 支持。

**核心决策**：
- 不采用实验性 MCP subagent（不稳定）
- 13 个 agents 降级为 skills（role-switching prompt 模式）
- **充分利用 Codex 原生 rules 体系**：AGENTS.md 层级指令 + Starlark execution policies 双轨制

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

> 当用户在 Go 项目中工作时，Codex 自动加载 `~/.codex/AGENTS.md`（全局）+ 项目级 `AGENTS.md`（如有）。语言特定规则通过 skills 按需加载（见 Phase 4）。

**注意**：Codex 的 AGENTS.md 层级发现基于工作目录路径，不是按语言检测。因此语言特定的 AGENTS.md 只在用户处于对应子目录时自动生效。对于项目级使用，更实际的方案是：

- **全局 AGENTS.md**：通用规则
- **项目 AGENTS.md**：用户根据项目语言从模板中选择内容
- **语言特定规则 skills**：按需加载，作为 AGENTS.md 的补充

### 1.3 Execution Policy Rules（Starlark）

将安全类 hooks 转换为 Starlark 执行策略：

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
```

**`rules/git-safety.rules`**
```starlark
# Git push 前要求确认
prefix_rule(
    pattern=["git", "push"],
    decision="prompt",
    justification="Review changes before pushing to remote"
)
# 禁止 force push 到 main
prefix_rule(
    pattern=["git", "push", "--force"],
    decision="forbidden",
    justification="Force push is dangerous and can lose work"
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
```

### 1.4 创建 config.toml

**来源**：`mcp-configs/mcp-servers.json` + `contexts/`

```toml
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

```toml
[security]
no_secrets_in_code = true
require_parameterized_queries = true

[approval]
network_access = "prompt"
file_delete = "prompt"
```

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

> 这些 skills 是语言特定 AGENTS.md 模板的补充——AGENTS.md 提供基础规则（自动加载），skills 提供详细的模式和惯用法（按需加载）。

---

## Phase 5: Hook 功能迁移

| 原 Hook | 类型 | 迁移到 | 机制 |
|---------|------|--------|------|
| Block dev server outside tmux | PreToolUse | `rules/safety.rules` | Starlark `prompt` |
| Tmux reminder | PreToolUse | AGENTS.md | 文字指令 |
| Git push review | PreToolUse | `rules/git-safety.rules` | Starlark `prompt` |
| Block random .md creation | PreToolUse | `rules/file-hygiene.rules` | Starlark `forbidden` |
| Suggest compact | PreToolUse | **丢弃** | Codex 无 /compact |
| Auto-format (prettier) | PostToolUse | AGENTS.md | 文字指令 |
| TypeScript check (tsc) | PostToolUse | AGENTS.md | 文字指令 |
| console.log warning | PostToolUse/Stop | AGENTS.md | 文字指令 |
| Log PR URL | PostToolUse | AGENTS.md | 文字指令 |
| Async build analysis | PostToolUse | **丢弃** | 占位符 |
| Load session context | SessionStart | **丢弃** | Codex 原生 sessions |
| Persist session state | SessionEnd | **丢弃** | Codex 原生 sessions |
| Evaluate session patterns | SessionEnd | **降级** | 手动 `/learn` |
| Pre-compact save | PreCompact | **丢弃** | Codex 无 /compact |

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

新增：`scripts/install.sh`、`scripts/uninstall.sh`

---

## Phase 7: 分发和安装

```bash
# 一键安装
curl -sSL https://raw.githubusercontent.com/<org>/everything-codex/main/scripts/install.sh | bash

# 手动
git clone https://github.com/<org>/everything-codex.git ~/.codex/.everything-codex
./scripts/install.sh --local

# 交互式
# /configure-codex 选择性启用
```

### install.sh 关键逻辑

```bash
CODEX_DIR="$HOME/.codex"

# 1. 复制根 AGENTS.md
cp AGENTS.md "$CODEX_DIR/AGENTS.md"

# 2. 复制语言特定 AGENTS.md 模板（用户可选）
mkdir -p "$CODEX_DIR/golang" "$CODEX_DIR/python" "$CODEX_DIR/typescript"
cp golang/AGENTS.md "$CODEX_DIR/golang/AGENTS.md"
cp python/AGENTS.md "$CODEX_DIR/python/AGENTS.md"
cp typescript/AGENTS.md "$CODEX_DIR/typescript/AGENTS.md"

# 3. 复制 skills
cp -r skills/* "$CODEX_DIR/skills/"

# 4. 复制 execution policy rules
mkdir -p "$CODEX_DIR/rules"
cp rules/*.rules "$CODEX_DIR/rules/"

# 5. 复制 config 模板
cp config.toml "$CODEX_DIR/config.toml.example"
cp requirements.toml "$CODEX_DIR/requirements.toml.example"
```

---

## Phase 8: 文档

- `README.md` — 重写为 Codex CLI 工具包
- `CONTRIBUTING.md` — 更新（skill 格式、AGENTS.md 规范、Starlark rules 规范）
- `docs/migration-from-claude-code.md` — 迁移指南
- `docs/agents-md-architecture.md` — 层级 AGENTS.md 架构说明
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
│   ├── install.sh
│   ├── uninstall.sh
│   ├── lib/
│   │   ├── package-manager.js
│   │   └── utils.js
│   ├── ci/
│   │   ├── validate-skills.js
│   │   └── validate-structure.js
│   ├── setup-package-manager.js
│   └── skill-create-output.js
├── examples/
│   ├── AGENTS.md
│   ├── config.toml
│   └── requirements.toml
├── docs/
│   ├── migration-from-claude-code.md
│   ├── agents-md-architecture.md
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
| 生命周期 hooks | 6 种 | 无 | **高** — 降级为 AGENTS.md 指令 + exec policies |
| 编码规则系统 | `rules/*.md` 单层 | **AGENTS.md 层级** + skills | **升级** — 层级覆盖更灵活 |
| 命令安全控制 | hooks (JS) | **Starlark rules** | **升级** — 声明式更清晰 |
| Config profiles | 无 | **原生支持** | **新增** |
| 安全约束 | 无 | **requirements.toml** | **新增** |
| Agent 模型切换 | 支持 | 不支持 | **中** |
| 自动格式化 | PostToolUse hook | AGENTS.md 指令 | **中** |
| 持续学习 | Hook 自动 | 手动 `/learn` | **低** |

---

## Verification Plan

1. **AGENTS.md 层级测试**：验证全局 + 语言 AGENTS.md 正确加载
2. **Execution policy 测试**：`codex execpolicy check --rules rules/safety.rules`
3. **Skill 发现测试**：启动 `codex`，验证 `/` menu 显示所有 skills
4. **Profile 测试**：`codex -p dev`、`codex -p review`
5. **核心 skill 端到端**：`/plan`、`/code-review`、`/tdd`、`/orchestrate`
6. **安装脚本测试**：干净环境 `install.sh`
7. **Config 验证**：`codex --check-config`
8. **结构验证**：`scripts/ci/validate-structure.js`
