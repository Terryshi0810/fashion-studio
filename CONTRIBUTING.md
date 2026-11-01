# 协同开发说明

## 分支

- `main`：可发布版本，只通过 Pull Request 合并。
- `develop`：日常集成分支。
- `feature/*`：功能开发，例如 `feature/player-save`。
- `fix/*`：问题修复，例如 `fix/mobile-layout`。

## 本地运行

```powershell
node server.js
node --test tests/core.test.js
node build-standalone.js
```

## 开发流程

1. 从最新 `develop` 创建功能分支。
2. 每个任务先建立或认领一个 Issue。
3. 完成后运行测试并提交 Pull Request 到 `develop`。
4. 至少一名成员审核通过后合并。
5. 发布时将 `develop` 合并到 `main`，并创建版本标签。

## 提交格式

```text
feat: add ...
fix: fix ...
art: update ...
docs: update ...
test: add ...
refactor: simplify ...
```
