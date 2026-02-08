# 评审报告：everything-codex 设计方案

- 评审对象：`docs/plans/2026-02-08-everything-codex-design.md`
- 评审日期：2026-02-08
- 评审方式：并行子代理分工评审（技术可行性 / 安全与运维 / 官方文档基线）+ 主代理综合结论

## 1. 结论摘要

该方案方向正确，且与 Codex 生态主路径（AGENTS.md 分层指令、Rules、安全审批、Worktrees、Review）总体一致；但当前版本属于“**可行但高风险**”状态。

可行性风险主要集中在三点：

1. 将原 hooks 能力大量降级为“提示性文本约束”，缺少可强制执行与可观测替代机制。
2. 安装与发布链路缺少供应链安全、备份与回滚设计，容易破坏现有用户 `~/.codex` 环境。
3. 迁移范围过大（agents/commands/skills 与配置体系同时大改），缺少分阶段 gate，失败面过宽。

建议先做最小可行迁移（MVP），以“关键路径可验证”为先，再逐步扩大迁移面。

## 2. 分级问题清单（按严重程度）

## Critical

1. 安装供应链风险：使用 `curl | bash` 但无签名或 hash 校验，存在远端脚本篡改风险。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:347`
2. 全局规则覆写风险：安装脚本直接复制到 `~/.codex/AGENTS.md`，会覆盖用户已有全局策略，无合并、备份和恢复机制。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:361`
3. 缺少失败回滚机制：未定义安装中断、升级失败、配置冲突时的自动回滚路径。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:359`

## High

1. 关键能力“软约束化”：把 hook 逻辑迁移到 AGENTS.md 文本后，强制性显著下降，执行一致性不可靠。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:307`
2. 执行策略覆盖不足：Starlark policy 仅覆盖少量高危命令，缺少系统性危险命令矩阵与反绕过验证。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:103`
3. 迁移跨度过大且同批落地：13 agents + 18 commands + 29 skills 并行重构，易引入语义漂移和回归。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:189`
4. 验证计划缺少发布门禁：列了检查项，但没有“必须通过才能发布”的自动化阻断条件。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:523`

## Medium

1. 语言规则生效依赖路径结构：语言专用 AGENTS.md 仅在特定路径命中时生效，实际项目目录不匹配会导致规则失效。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:66`
2. MCP 与 config schema 兼容性风险：迁移到 `config.toml` 后，若字段或行为变动，安装后可能不可用。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:148`
3. 丢弃 session/build 相关 hooks 但未补可观测性替代，运维定位能力下降。  
   方案位置：`docs/plans/2026-02-08-everything-codex-design.md:320`

## 3. 与 Codex 最佳实践适配性评估（基于最新官方文档）

## 已对齐项

1. 采用 AGENTS.md 分层指令体系，方向符合官方 instruction chain。
2. 采用 rules/exec policy 管控命令执行，方向符合 CLI 安全治理模型。
3. 采用 skills 作为能力模块，符合 Codex 文档建议。
4. 强调并行执行与工作隔离，符合 worktree/cloud thread 的协作模式。

## 未对齐或对齐不足项

1. 最小权限默认值不足：官方建议从受限沙箱与按需审批起步；方案未明确默认 profile 的强约束基线。
2. 安全模型缺“技术边界 + 审批边界”联动细则：官方是 sandbox + approval 双层，方案更多停留在文本指令与部分 rules。
3. 联网控制策略不足：官方强调云端联网默认受限与 allowlist 约束；方案中未形成完整的域名、方法、凭证边界。
4. 证据化验证闭环不足：官方强调 review、日志与测试证据；方案缺少 CI gate 与失败阻断规则。

## 4. 建议的修订方案（可直接纳入原设计）

## P0（必须先做）

1. 迁移分期：先落地 MVP gate，仅覆盖 4 条关键路径。
2. 关键路径 gate：
   - AGENTS.md 分层加载可验证。
   - rules/execpolicy 生效可验证。
   - `codex --check-config` 与 profile 启动可验证。
   - skills 可发现且关键命令可触发。
3. 安装安全：
   - 禁止默认 `curl | bash` 直接执行。
   - 发布校验文件（checksum/signature）并在脚本内验证。
   - 安装前自动备份 `~/.codex`，失败自动回滚。
4. 全局配置保护：
   - 不直接覆盖 `~/.codex/AGENTS.md`。
   - 提供 merge 策略（append/include/interactive）与 dry-run。

## P1（应在首个稳定版前完成）

1. 建立高危命令矩阵与反绕过测试（复合命令、管道、子 shell、分号链）。
2. 为被移除 hooks 建立替代机制（CI 校验脚本、显式命令、审计日志）。
3. 增加 schema 兼容层检查：检测 config 字段变化并给出迁移提示。
4. 发布门禁化：将验证计划转为自动化 job，失败阻断发布。

## P2（可迭代优化）

1. 语言规则加载兜底：提供项目级合并器，避免路径不命中导致规则失效。
2. 构建“能力降级说明”：明确哪些 Claude 特性不再支持以及替代路径。
3. 补充运维手册：故障排查、回滚手册、版本升级 playbook。

## 5. 建议的验收标准（Definition of Done）

1. 安装可逆：任意失败点都可在 1 步回滚到安装前状态。
2. 规则可证：至少 10 个高危命令场景的 policy 决策与预期一致。
3. 迁移可用：核心技能与命令在 clean env 和已有 `~/.codex` env 均可运行。
4. 审核可追溯：每次发布包含 `check-config`、smoke test、review 证据。
5. 默认安全：默认 profile 不允许无审批高风险操作。

## 6. 外部文档基线（用于本次评审）

- Codex Changelog（最新可见更新至 2026-02-05）  
  https://developers.openai.com/codex/changelog
- Codex CLI 仓库（最新 release 0.98.0，2026-02-05）  
  https://github.com/openai/codex
- Codex 文档目录（AGENTS、Rules、Worktrees、Config、Review、MCP）  
  https://developers.openai.com/codex
- AGENTS 文档  
  https://developers.openai.com/codex/agents
- Rules 文档  
  https://developers.openai.com/codex/rules
- Worktrees 文档  
  https://developers.openai.com/codex/worktrees
- Config Reference  
  https://developers.openai.com/codex/config-reference
- Agent Internet Access  
  https://developers.openai.com/codex/cloud/internet-access
- Security  
  https://developers.openai.com/codex/security
- CLI Features / Slash Commands / Review  
  https://developers.openai.com/codex/cli/features  
  https://developers.openai.com/codex/cli/slash-commands  
  https://developers.openai.com/codex/app/review
- GA 公告（2025-10-06）  
  https://openai.com/index/codex-now-generally-available/

## 7. 最终判断

若按当前设计“一次性大迁移”，风险偏高，不建议直接推进到全面替换。  
建议改为“**分阶段迁移 + 强门禁验证 + 安全可回滚安装**”策略，在 P0 完成并稳定后再执行全量迁移。
