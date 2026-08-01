# 增量 Server Action 构建 — AI 快速指南

> 本文档是给 AI 的快速上下文指南，用于 E2E 测试出问题时快速定位和修复。

## 一、改了什么

将后端 Server Action 构建从 **webpack 全量打包**（所有 action 打成一个 `PROJ_xxx.js`）改为 **esbuild 增量单文件编译**（每个 action 独立编译为 `.js` 文件 + `_common.js` 共享依赖包）。

### 核心变更

| 维度 | 旧方案 | 新方案 |
|------|--------|--------|
| 编译工具 | webpack + ts-loader | esbuild |
| 产物结构 | 单个 `PROJ_xxx.js` (大 bundle) | 多个独立 `.js` + `_common.js` + `PROJ_xxx.js` (入口) |
| 入口文件 | 静态 import (bundled-entry.ts + registry.ts) | 动态 require (生成的 PROJ_xxx.js) |
| 构建模式 | 全量 | 支持单文件增量 `--file`、全量 `--all`、重建公共包 `--rebuild-common` |

### 产物目录结构

```
server-action-generated/
├── _common.js                          # 公共依赖 bundle (prisma, BaseActionFun, action_utils, serializer, PrismaClient)
├── PROJ_xxx.js                         # 入口文件 (动态 require 各 action, 导出 { path, router })
├── src.backend.actions.Register.js     # 单独编译的 action (文件名编码源路径, 旧格式)
├── app.backend.register.Register.actions.js  # 单独编译的 action (新共置格式)
├── src.frontend.actions.UserLogin.js
├── .entry-gen.lock                     # 入口文件生成锁
└── ...
```

## 二、修改的文件清单

### TypeScript 侧 (demo 项目 / 模板项目)

| 文件 | 作用 | 说明 |
|------|------|------|
| `scripts/build-server/action-compiler.ts` | **新增** 单文件编译器 | `compileAction()` + `commonRedirectPlugin` esbuild 插件 |
| `scripts/build-server/common-bundle.ts` | **新增** 公共依赖包构建器 | `buildCommonBundle()` 生成 `_common.js` |
| `scripts/build-server/entry-generator.ts` | **新增** 入口文件生成器 | `generateEntry()` 扫描 action 文件生成 `PROJ_xxx.js`，带文件锁 |
| `scripts/build-server/index.ts` | **新增** CLI 入口 / 构建编排器 | 解析 `--file`/`--all`/`--rebuild-common` 参数，协调构建流程 |
| `package.json` | **修改** `build:server` 脚本 | 改为 `ts-node scripts/build-server/index.ts` |
| `temp/src/worker.ts` | **修改** `clearRequireCache` 函数 | 排除 `_common.js` 缓存，保证全局单例 |

### Python 侧 (zaki_webcreator 项目)

| 文件 | 作用 | 说明 |
|------|------|------|
| `modify/tools/modify_code_repair_tools.py` | **修改** `repair_pipeline_test` | 在 Act→Verify 之间插入增量编译步骤 (step 3.5) |
| `modify/tools/modify_code_repair_tools.py` | **新增** `extract_action_file_from_test_path()` | 从测试路径推导 action 源文件路径 |
| `web_creator.py` | **修改** `create_auth_context_impl` | 写入 `action_utils.ts` 后触发 `--rebuild-common` |
| `code_check_server/code_check_client.py` | **新增** 4 个函数 | `_strip_ansi`, `_parse_esbuild_json_result`, `_parse_esbuild_errors`, `_parse_esbuild_errors_map` |

## 三、关键组件详解

### 1. CommonRedirectPlugin (action-compiler.ts)

esbuild 插件，将 action 文件中的公共依赖 import 重写为 `require('./_common').xxx`：

```
@/tools/prisma(-proxy)?     → require('./_common').prisma
@/@base/BaseActionFun       → require('./_common').BaseActionFun
@/{platform}/action_utils   → require('./_common').{platform}Auth
@/utils/serializer          → require('./_common').serializer
prisma-generated/client     → require('./_common').PrismaClient
```

非公共依赖的 `@/` 路径由插件内部解析为 `src/` 目录（不用 esbuild 的 alias，因为 alias 优先级高于 plugin 会导致公共依赖拦截失败）。

### 2. Common_Bundle (common-bundle.ts)

生成临时 `_common_entry.ts` → esbuild bundle → 输出 `_common.js` → 删除临时文件。

关键点：
- `action_utils` 用 try-catch require fallback（可能尚未生成）
- `prisma-generated/client` 如果不存在会被 stub 插件替换为空对象
- `external: ['express', 'jose', 'superjson']`

### 3. Entry_Generator (entry-generator.ts)

扫描 `server-action-generated/` 下的 `.js` 文件（排除 `_common.js`、`PROJ_*.js`、`.lock`），生成 `PROJ_xxx.js`。

关键点：
- moduleName 格式：旧格式 `src.{platform}.actions.{PageName}`，新格式 `app.{platform}.{page_name}.{PageName}.actions`（从文件名还原，括号已移除）
- RPC 路由逻辑完整保留（POST `/`、序列化、auth、错误处理）
- 导出 `{ path: '/rpc/PROJ_xxx', router }`
- 使用 `proper-lockfile` 文件锁，超时 10 秒

### 4. Build_Orchestrator (index.ts)

CLI 入口，三种模式：

```bash
# 全量构建
pnpm run build:server

# 增量编译单文件（旧格式）
pnpm run build:server -- --file src/backend/actions/Register.ts

# 增量编译单文件（新共置格式）
pnpm run build:server -- --file app/(backend)/register/Register.actions.ts

# 重建 _common.js (action_utils.ts 变更后)
pnpm run build:server -- --rebuild-common
```

输出 JSON 到 stdout：
```json
{
  "success": true,
  "compiled": ["src.backend.actions.Register.js"],
  "failed": [{"file": "xxx.ts", "errors": ["..."]}],
  "duration": 123,
  "commonRebuilt": false
}
```

### 5. clearRequireCache (temp/src/worker.ts)

Worker 热更新时清除 require.cache，但**排除 `_common.js`**，保证 AsyncLocalStorage 和 Prisma Client 全局单例。

### 6. repair_pipeline_test 增量编译步骤

在修复循环的 Act (step 3) 和 Verify (step 4) 之间插入 step 3.5：

```python
# 3.5 增量编译 — 修改后重新编译 action 文件
action_file = extract_action_file_from_test_path(test_file_path)
# 测试路径: src/{platform}/__tests__/{PageName}.pipeline.test.ts
# → action:  src/{platform}/actions/{PageName}.ts
build_cmd = f"pnpm run build:server -- --file {action_file}"
# 编译失败时解析 JSON 结果，将编译错误反馈给下一轮修复
```

### 7. create_auth_context_impl 重建触发

`web_creator.py` 写入 `action_utils.ts` 后执行：
```python
subprocess.run("pnpm run build:server -- --rebuild-common", shell=True, cwd=demo_project_path)
```

## 四、业务侧无感的保证

1. **actionName 格式不变**: 旧格式 `src.backend.actions.Register.someFunction`，新格式 `app.backend.register.Register.actions.someFunction`
2. **导出接口不变**: `{ path: '/rpc/PROJ_xxx', router }`
3. **Worker 加载逻辑不变**: 还是 `require(PROJ_xxx.js)`
4. **RPC 路由逻辑完整保留**: POST `/`、序列化/反序列化、auth、X-Auth-Role 响应头、错误处理
5. **部署替换兼容**: `after_confirm.py` 递归处理目录，多文件产物天然兼容

## 五、常见问题排查

### 问题：RPC 调用 404

可能原因：
- `PROJ_xxx.js` 入口文件没有包含该 action → 检查 `server-action-generated/` 下是否有对应的 `.js` 文件
- action 文件名编码错误 → 检查 `encodeOutputFilename` 逻辑：`src/backend/actions/Register.ts` → `src.backend.actions.Register.js`（旧格式），`app/(backend)/register/Register.actions.ts` → `app.backend.register.Register.actions.js`（新格式，括号被移除）
- 入口文件生成失败 → 检查 `.entry-gen.lock` 是否残留

### 问题：公共依赖报错 (prisma/BaseActionFun/action_utils 等)

可能原因：
- `_common.js` 未构建 → 运行 `pnpm run build:server` 全量构建
- `action_utils.ts` 新生成后 `_common.js` 未重建 → 运行 `pnpm run build:server -- --rebuild-common`
- CommonRedirectPlugin 没有拦截到某个 import 路径 → 检查 `COMMON_PATTERNS` 是否覆盖

### 问题：Worker 热更新后 AsyncLocalStorage/Prisma 多实例

可能原因：
- `clearRequireCache` 没有排除 `_common.js` → 检查 `temp/src/worker.ts` 中的排除逻辑
- `_common.js` 被意外删除后重新 require 了新实例

### 问题：Pipeline 修复后测试仍然失败

可能原因：
- 增量编译步骤 (step 3.5) 编译失败但被静默忽略 → 检查日志中的 `增量编译失败` 警告
- `extract_action_file_from_test_path` 没有匹配到测试路径 → 检查测试文件路径格式是否为 `src/{platform}/__tests__/{PageName}.pipeline.test.ts`（旧格式）或 `app/({platform})/{page_name}/{PageName}.pipeline.test.ts`（新格式）

### 问题：编译错误解析为空

可能原因：
- Python 侧 `_parse_esbuild_errors` JSON 解析和正则 fallback 都失败 → 检查 Build_Orchestrator 的 stdout 输出格式
- ANSI 转义码干扰 → `_strip_ansi` 应该在解析前清除

## 六、测试命令

```bash
# TypeScript 属性测试 (54 tests, 8 files)
cd data/input/demo/aigcode-demo
npx vitest run scripts/build-server/__tests__/

# Python 属性测试 (9 tests)
python -m pytest code_check_server/tests/test_esbuild_parser_property.py -v
```

## 七、数据流向（Python → CLI → 产物）

理解哪个 Python 函数在什么时机调用哪个 CLI 命令，是排查 E2E 问题的关键。

### 调用链路

```
1. 首次全量构建 (web_creator.py → create_test)
   Python: subprocess("pnpm run build:server")
   → index.ts: --all 模式
   → buildCommonBundle() → compileAction() × N → generateEntry()
   → 产物: _common.js + N 个 action.js + PROJ_xxx.js

2. action_utils.ts 生成后 (web_creator.py → create_auth_context_impl)
   Python: subprocess("pnpm run build:server -- --rebuild-common")
   → index.ts: --rebuild-common 模式
   → buildCommonBundle() → touch PROJ_xxx.js
   → 效果: _common.js 更新，Worker 检测到 PROJ_xxx.js mtime 变化触发热更新

3. Pipeline 修复循环 (modify_code_repair_tools.py → repair_pipeline_test)
   Python: strategy.execute() 修改 action 源文件
   Python: subprocess("pnpm run build:server -- --file app/(backend)/register/Register.actions.ts")
   → index.ts: --file 模式
   → (检查 _common.js 存在) → compileAction(单文件) → generateEntry()
   Python: run_pipeline_test() 验证修复

4. 代码检查 (code_check_client.py → _backend_server_build_check)
   Python: subprocess("pnpm run build:server")
   → 全量构建，解析 stdout JSON 输出
   → _parse_esbuild_errors() / _parse_esbuild_errors_map() 提取错误
```

### _common.js export key 与 action 文件 require key 的对应关系

```
_common.js 导出:                    action 文件中的 require:
─────────────────────────────────   ──────────────────────────────────
exports.prisma                  ←   require('./_common').prisma
exports.BaseActionFun           ←   require('./_common').BaseActionFun
exports.serializer              ←   require('./_common').serializer
exports.PrismaClient            ←   require('./_common').PrismaClient
exports.frontendAuth            ←   require('./_common').frontendAuth
exports.backendAuth             ←   require('./_common').backendAuth
exports.appAuth                 ←   require('./_common').appAuth
```

如果新增了公共依赖，需要同时改两个地方：
1. `common-bundle.ts` — 在 `_common_entry.ts` 模板中添加 export
2. `action-compiler.ts` — 在 `COMMON_PATTERNS` 中添加匹配规则

## 八、与旧 webpack 方案的共存关系

### 旧文件（仍然存在，暂未删除）

| 文件 | 状态 | 说明 |
|------|------|------|
| `server/bundled-entry.ts` | **仍存在** | 旧的静态 import 入口，`structure_creator.py` 初始化项目时仍会处理它 |
| `server/registry.ts` | **仍存在** | 旧的模块注册表 |
| `scripts/gen-server-registry.ts` | **仍存在** | 旧的注册表生成脚本 |
| `scripts/build-server-fast.mjs` | **仍存在** | 旧的 webpack 构建脚本 |
| `webpack.server.config.js` | **可能存在** | 旧的 webpack 配置 |

### 已替换的调用

| 调用方 | 旧行为 | 新行为 |
|--------|--------|--------|
| `package.json` `build:server` | `gen-server-registry.ts && webpack` | `ts-node scripts/build-server/index.ts` |
| `_backend_server_build_check` | 调用 `_parse_rsbuild_backend_errors` | 调用 `_parse_esbuild_errors` |
| `_backend_server_build_check_map` | 调用 `_parse_rsbuild_backend_errors_map` | 调用 `_parse_esbuild_errors_map` |

### 注意：`structure_creator.py` 仍然会处理 `bundled-entry.ts`

`v4/create/structure/structure_creator.py` 在初始化项目结构时会读取和修改 `server/bundled-entry.ts`。这个文件在新方案下不再被 `build:server` 使用，但项目初始化流程仍然依赖它。**不要删除 `server/bundled-entry.ts`**，除非同步修改 `structure_creator.py`。

### 旧 webpack 错误解析器仍保留

`_parse_rsbuild_backend_errors` 和 `_parse_rsbuild_backend_errors_map` 仍然存在于 `code_check_client.py` 中，但不再被 `_backend_server_build_check` 调用。保留它们是为了兼容性，可以在确认 E2E 稳定后清理。

## 九、esbuild 配置速查

### Action 文件编译 (action-compiler.ts)

```typescript
{
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  bundle: true,
  external: ['express'],
  plugins: [commonRedirectPlugin()],  // 处理公共依赖 + @/ alias
  // 注意：不使用 esbuild 的 alias 配置，由 plugin 统一处理
}
```

### _common.js 构建 (common-bundle.ts)

```typescript
{
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  bundle: true,
  external: ['express', 'jose', 'superjson'],
  plugins: [prismaClientStubPlugin],  // prisma-generated/client 不存在时 stub
}
```

## 十、依赖

TypeScript 侧需要的 npm 包：
- `esbuild` — 编译器
- `proper-lockfile` — 入口文件生成的文件锁
- `glob` — action 文件发现

Python 侧无新增依赖。
