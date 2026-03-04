# BitK Client — Agent 协作指南

## 项目开发

本项目使用 `/pma` 三阶段工作流：

1. **调查阶段** — 追踪调用链，搜索相关代码，阅读 changelog
2. **方案阶段** — 输出现状、方案、风险、工作量，等待审批
3. **实施阶段** — 审批后实施，验证，记录变更

## 任务管理

- 任务清单: `docs/task/index.md`
- 方案索引: `docs/plan/index.md`
- 认领规则: 先更新 index `[ ] -> [-]`，再设 detail `owner`，然后才开始实施

## Agent 角色

| Agent | 用途 |
|-------|------|
| planner | 实施方案规划 |
| architect | 系统设计 |
| tdd-guide | 测试驱动开发 |
| code-reviewer | 代码审查 |
| security-reviewer | 安全分析 |
| build-error-resolver | 修复构建错误 |
