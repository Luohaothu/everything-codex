# Everything Codex

面向 Codex 的工程模板仓库，提供可复用的规划、实现、评审与验证流程。

## 仓库提供能力
- `AGENTS.md`：仓库级执行规则。
- `.codex/config.toml`：Codex 默认运行配置。
- `.codex/skills/`：可复用技能。
- `workflows/`：标准化工作流文档。
- `scripts/ci/`：保证 Codex-only 结构的校验脚本。

## 快速开始
1. 安装 Codex CLI：

```bash
npm i -g @openai/codex
```

2. 克隆仓库并进入目录。
3. 交互式启动：

```bash
codex
```

4. 非交互执行示例：

```bash
codex exec "请按 workflows/plan.md 输出一个新增 feature flag 的实施计划。"
```

## 日常工作流
1. 使用 `workflows/plan.md` 做规划。
2. 使用 `workflows/tdd.md` 做实现。
3. 使用 `workflows/code-review.md` 做评审。
4. 使用 `workflows/verify.md` 做最终验收。

## 目录结构
```text
.
├── AGENTS.md
├── .codex/
│   ├── config.toml
│   └── skills/
├── workflows/
├── prompts/
├── scripts/ci/
├── tests/
└── docs/migration/
```

## 验证命令
```bash
npm run validate
npm run test
npm run lint
```

## 迁移说明
本仓库已明确移除 Claude/OpenCode 资产。

迁移文档：`docs/migration/from-claude-opencode.md`

## 许可证
MIT（`LICENSE`）。
