# elpis-demo

<p>
  <img alt="version" src="https://img.shields.io/badge/version-0.1.0-blue.svg" />
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D16-green.svg" />
  <img alt="koa" src="https://img.shields.io/badge/koa-2.7-33333d.svg" />
  <img alt="vue" src="https://img.shields.io/badge/vue-3.x-42b883.svg" />
  <img alt="webpack" src="https://img.shields.io/badge/webpack-5.x-8dd6f9.svg" />
  <img alt="gitflow" src="https://img.shields.io/badge/workflow-GitFlow-orange.svg" />
</p>

基于 [`@teribom/elpis`](https://www.npmjs.com/package/@teribom/elpis) 全栈开发框架构建的示例工程，用于演示**服务端渲染（Koa + Nunjucks）** 与 **前端工程化（Vue 3 + Webpack 5）** 一体化的中后台应用开发模式。

项目内置一个完整可运行的「商品管理」业务模块，采用 **Schema 驱动** 的方式描述表单、表格与搜索栏，开发者只需维护 JSON Schema 即可生成增删改查界面。

---

## 目录

- [特性](#特性)
- [技术栈](#技术栈)
- [架构与工作原理](#架构与工作原理)
- [目录结构](#目录结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [NPM Scripts](#npm-scripts)
- [多环境配置](#多环境配置)
- [接口清单](#接口清单)
- [Schema 驱动开发](#schema-驱动开发)
- [分支模型（GitFlow）](#分支模型gitflow)
- [提交规范](#提交规范)
- [常见问题](#常见问题)
- [License](#license)

---

## 特性

- **一体化全栈**：一个仓库同时承载 Koa 服务端与 Vue 前端，无跨仓库联调成本
- **SSR 页面外壳 + SPA 运行时**：服务端渲染 HTML 骨架并注入环境变量，前端接管后续交互
- **Schema 驱动**：表单 / 表格 / 搜索栏均由 Schema 配置生成，业务开发聚焦数据结构而非视图代码
- **约定优于配置**：`app/` 下的 controller / router / middleware / router-schema 全自动加载，无需手动注册
- **多环境隔离**：`local` / `beta` / `production` 三套配置与环境变量
- **开发态热更新**：Webpack DevServer + HMR，改动即时生效

## 技术栈

| 分层 | 技术 |
| --- | --- |
| 服务端 | Node.js、Koa 2、koa-router、koa-bodyparser、koa-static、koa-nunjucks-2 |
| 模板引擎 | Nunjucks（`.tpl`） |
| 前端 | Vue 3、Vue Router 4、Pinia、Vuex 4 |
| UI 组件库 | Element Plus、`@element-plus/icons-vue`、ECharts |
| 构建 | Webpack 5、Babel、vue-loader、Less |
| 校验 | AJV（基于 JSON Schema 的参数校验） |
| 日志 | log4js |
| 数据层 | knex、mysql（示例中以内存 Mock 数据替代） |
| 开发工具 | nodemon、webpack-dev-middleware、webpack-hot-middleware |

## 架构与工作原理

项目在开发态下由**两个独立进程**协作，理解这一点是排查问题的关键：

```
                    浏览器
                      │
        ┌─────────────┴─────────────┐
        │                           │
   ① HTML 文档                  ② JS / CSS 资源
        │                           │
┌───────▼─────────┐        ┌────────▼─────────┐
│  Koa 服务端      │        │  Webpack DevServer│
│  node server.js │        │  npm run build:dev│
│  端口 8082       │        │  端口 9002        │
└─────────────────┘        └───────────────────┘
        │                           │
   渲染 dist/entry.*.tpl       编译 app/pages/** 为 bundle
        └─────────────┬─────────────┘
                      │
            浏览器组装并渲染页面
```

1. **Koa 服务端（:8082）** — 处理路由与 API 请求，通过 Nunjucks 渲染 `app/public/dist/entry.<page>.tpl`，将 `projKey`、`env`、`options` 等运行时变量以内联 `<input>` + `<script>` 的方式注入页面。
2. **Webpack DevServer（:9002）** — 编译 `app/pages/` 下的 Vue 单文件组件，产物通过 `writeToDisk` 落盘 `.tpl` 文件，其余资源驻留内存并按 HMR 协议推送更新。

> ⚠️ **只启动 `npm run dev` 会白屏**。因为渲染出的 HTML 中，`<script>` 标签指向 `http://127.0.0.1:9002/public/dist/dev/js/*.bundle.js`，若 DevServer 未启动，脚本全部 404，`<div id="root">` 将保持为空而不会报错。详见[常见问题](#常见问题)。

生产环境（`build:prod`）则将前端产物编译至 `app/public/dist/prod/`，由 Koa 通过 `koa-static` 直接托管，单进程即可运行。

## 目录结构

```
elpis-demo/
├── app/                        # 业务代码根目录（框架自动加载）
│   ├── controller/             # 控制器：处理请求、返回统一响应结构
│   │   └── business.js         #   商品 CRUD 接口
│   ├── middleware.js           # 业务全局中间件入口（按顺序注册）
│   ├── middleware/             # 业务中间件
│   ├── pages/                  # 前端页面（每个目录一个 Webpack 入口）
│   │   ├── dashboard/          #   中后台主框架页
│   │   │   ├── router.js       #     页面内部路由注册
│   │   │   ├── todo/           #     待开发占位页
│   │   │   └── complex-view/   #     复合视图组件
│   │   ├── project-list/       #   项目列表页（首页）
│   │   └── widgets/            #   通用 Schema 组件
│   │       ├── schema-form/    #     Schema 表单
│   │       └── schema-search-bar/ #  Schema 搜索栏
│   ├── public/                 # 静态资源与构建产物
│   │   └── dist/               #   编译输出（.gitignore 已忽略）
│   ├── router/                 # 服务端路由（约定式加载）
│   │   └── business.js         #   /api/proj/product* 路由
│   ├── router-schema/          # 接口参数 JSON Schema 校验声明
│   │   └── business.js
│   ├── service/                # 服务层（数据聚合与业务编排）
│   └── webpack.config.js       # 项目级 Webpack 定制（合并至框架默认配置）
├── config/                     # 多环境配置
│   ├── config.default.js       #   公共配置
│   ├── config.local.js         #   本地配置（.gitignore 已忽略）
│   ├── config.beta.js          #   测试环境
│   └── config.prod.js          #   生产环境
├── logs/                       # 运行日志（log4js 输出，已忽略）
├── model/                      # 业务模型 / 视图 Schema 定义
│   ├── buiness/                #   电商业务模型（含菜单与 Schema 定义）
│   └── course/                 #   课程业务模型
├── build.js                    # 前端构建入口
├── server.js                   # 服务端启动入口
└── package.json
```

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Node.js | >= 16（建议 18 LTS 及以上） |
| npm | >= 8 |
| 操作系统 | Windows / macOS / Linux |

> 当前 `package.json` 中的脚本使用了 Windows CMD 语法（`set _ENV=local&& ...`），**在 Windows 上请使用 CMD 或 PowerShell 执行**。使用 Git Bash / WSL 的注意事项见[常见问题](#常见问题)。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2.（可选）补齐本地配置。config.local.js 已被 .gitignore 忽略，新克隆的仓库中不存在；
#    缺失时框架仅打印警告并回退到 config.default.js，不影响启动。
#    config/config.local.js
#    module.exports = { name: "elpis-demo-local" };

# 3. 启动前端构建服务（终端 A，占用 9002，保持运行）
npm run build:dev

# 4. 启动服务端（终端 B，占用 8082，保持运行）
npm run dev
```

两个终端均启动成功后，访问：

- 项目首页：<http://127.0.0.1:8082/view/project-list>
- 中后台主框架：<http://127.0.0.1:8082/view/dashboard>

页面路由遵循 `/view/:page` 约定，`page` 对应 `app/pages/<page>` 目录名，例如 `/view/project-list` 会渲染 `app/pages/project-list/entry.project-list.js`。

## NPM Scripts

| 命令 | 说明 | 使用场景 |
| --- | --- | --- |
| `npm run dev` | 以 `local` 环境启动服务端，nodemon 监听 `server.js` 变更自动重启 | 日常开发（终端 B） |
| `npm run build:dev` | 以 `local` 环境启动 Webpack DevServer（端口 9002），支持 HMR | 日常开发（终端 A） |
| `npm run beta` | 以 `beta` 环境启动服务端 | 部署至测试环境 |
| `npm run prod` | 以 `production` 环境启动服务端 | 部署至生产环境 |
| `npm run build:prod` | 编译前端产物至 `app/public/dist/prod/` | 生产构建 |
| `npm run build:dev` | 编译并热更新前端产物至 `app/public/dist/dev/` | 本地构建 |

## 多环境配置

环境由 `_ENV` 环境变量决定，框架通过 `configLoader` 按 `default → <env>` 的顺序合并配置：

| `_ENV` | 加载配置 | 生效名称 |
| --- | --- | --- |
| `local`（默认） | `config.default.js` + `config.local.js` | `elpis-demo-local` |
| `beta` | `config.default.js` + `config.beta.js` | `elpis-demo-beta` |
| `production` | `config.default.js` + `config.prod.js` | `elpis-demo-prod` |

未显式设置 `_ENV` 时，框架默认回退至 `local`。

## 接口清单

所有业务接口以 `/api/proj/` 为前缀。请求需在 **Header 中携带 `proj_key`**，`projectHandler` 中间件会据此隔离项目数据，缺失时返回 `code: 446`。

| 方法 | 路径 | 说明 | 必填参数 |
| --- | --- | --- | --- |
| `GET` | `/api/proj/product/list` | 商品分页列表 | `page`、`size`（query） |
| `GET` | `/api/proj/product` | 商品详情 | `product_id`（query） |
| `POST` | `/api/proj/product` | 新增商品 | `product_name`（body） |
| `PUT` | `/api/proj/product` | 修改商品 | `product_id`、`product_name`（body） |
| `DELETE` | `/api/proj/product` | 删除商品 | `product_id`（body） |
| `GET` | `/api/proj/product_enum/list` | 商品名称下拉枚举 | — |

**统一响应结构**（由 `Controller.Base` 提供）：

```jsonc
// 成功
{
  "success": true,
  "data": {},          // 核心数据
  "metadata": {}       // 分页等附加信息
}

// 失败
{
  "success": false,
  "message": "错误信息",
  "code": 446
}
```

**参数校验**：接口的入参约束以 JSON Schema 形式声明在 `app/router-schema/business.js`，由 `apiParamsVerify` 中间件基于 AJV 自动校验，未通过则直接拦截，不进入控制器。

## Schema 驱动开发

以「商品管理」模块为例，一份 Schema 同时描述详情、表格、搜索、新增、编辑五种形态：

```js
// model/buiness/model.js（节选）
{
  product_name: {
    type: "string",
    label: "商品名称",
    tableOption:  { width: 200 },                        // 表格列配置
    searchOption: { comType: "dynamicSelect", api: "..." }, // 搜索栏配置
    createFormOption: { comType: "input" },              // 新增表单配置
    editFormOption:   { comType: "input" },              // 编辑表单配置
    detailPanelOption: {},                               // 详情面板配置
  }
}
```

新增一个字段时，只需在此处补充声明，`app/pages/widgets/` 下的 `schema-form`、`schema-search-bar` 与 `schema-view` 组件会自动渲染出对应的 UI 与交互，无需改动视图层代码。

## 分支模型（GitFlow）

本仓库采用标准 GitFlow 分支模型：

| 分支 | 命名 | 来源 | 合并去向 | 说明 |
| --- | --- | --- | --- | --- |
| 主分支 | `main` | — | — | 始终与生产环境一致，仅接受 `release/*` 与 `hotfix/*` 合入，每次合入需打版本 Tag |
| 开发分支 | `develop` | `main` | — | 日常集成分支，汇集所有已完成的功能 |
| 功能分支 | `feature/<name>` | `develop` | `develop` | 单个功能开发，完成后合回 `develop` 并删除 |
| 发布分支 | `release/<version>` | `develop` | `main` + `develop` | 发布前冻结、测试与修 Bug，合入 `main` 后打 Tag，并回合并至 `develop` |
| 修复分支 | `hotfix/<version>` | `main` | `main` + `develop` | 线上紧急修复，修复后直接合入 `main` 并同步回 `develop` |

**典型工作流**：

```bash
# 开发新功能
git checkout develop && git pull
git checkout -b feature/product-export
# ... 开发与提交 ...
git checkout develop && git merge --no-ff feature/product-export
git branch -d feature/product-export

# 发布
git checkout -b release/0.2.0 develop
# ... 测试与修复 ...
git checkout main && git merge --no-ff release/0.2.0
git tag -a v0.2.0 -m "Release v0.2.0"
git checkout develop && git merge --no-ff release/0.2.0
git branch -d release/0.2.0
```

合并一律使用 `--no-ff`，以保留完整的功能分支拓扑。

## 提交规范

提交信息遵循 [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format)：

```
<type>(<scope>): <subject>
```

| type | 含义 |
| --- | --- |
| `feat` | 新增功能 |
| `fix` | 修复缺陷 |
| `docs` | 文档变更 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 重构（非新增功能、非修复缺陷） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建流程或辅助工具变更 |

示例：

```bash
git commit -m "feat(product): 支持按名称模糊搜索商品"
git commit -m "fix(api): 修复分页参数缺失时的空指针异常"
```

## 常见问题

<details>
<summary><b>Q1：执行 <code>npm run dev</code> 报 <code>ENOENT: no such file or directory, open '...\package.json'</code></b></summary>

当前目录下没有 `package.json`。请确认已在项目根目录（即含有 `package.json`、`server.js` 的目录）执行命令：

```bash
cd /d <项目根目录>
npm run dev
```
</details>

<details>
<summary><b>Q2：服务启动成功，但浏览器访问页面一片空白</b></summary>

这是最常见的问题，通常由以下原因导致：

1. **未启动前端构建服务**。页面 HTML 中的 `<script>` 指向 `http://127.0.0.1:9002/public/dist/dev/js/*.bundle.js`，若 `npm run build:dev` 未运行，所有脚本 404，`<div id="root">` 为空且不报错。**解决：新开一个终端执行 `npm run build:dev`**。
2. **DevServer 尚未完成首次编译**。Webpack 首次构建需要一定时间，请等待终端输出 `app listening on port 9002` 及编译完成信息后再刷新。
3. **构建产物路径不匹配**。确认 `app/public/dist/` 下存在与页面同名的 `.tpl` 文件，且其中的 bundle 文件名与 DevServer 实际产物一致。
4. **端口被占用**。检查 8082 / 9002 是否被其他进程占用。

排查时请打开浏览器开发者工具的 **Network 面板**，若看到大量 `.bundle.js` 请求返回 404 或 `net::ERR_CONNECTION_REFUSED`，即可确认属于第 1 种情况。
</details>

<details>
<summary><b>Q3：在 Git Bash / WSL 中执行脚本，环境变量 <code>_ENV</code> 未生效</b></summary>

`package.json` 中的 `set _ENV=local&& ...` 是 Windows CMD 语法，在 Bash 中 `set` 不会设置环境变量。后果：

- `npm run dev` — `_ENV` 虽为空，但框架默认回退 `local`，**恰好可用**
- `npm run build:dev` — `frontendBuild(undefined)` 不会匹配任何分支，**构建静默不执行**，DevServer 不会启动且不报错

**推荐方案**：在 Windows 上使用 CMD 或 PowerShell 执行上述命令。

**备选方案**：引入 `cross-env` 使脚本跨平台：

```bash
npm install --save-dev cross-env
```

```json
"dev":       "cross-env _ENV=local nodemon ./server.js",
"build:dev": "cross-env _ENV=local node --max_old_space_size=4096 ./build.js"
```
</details>

<details>
<summary><b>Q4：接口返回 <code>{"success": false, "message": "proj_key not found", "code": 446}</code></b></summary>

业务接口要求在请求 Header 中携带 `proj_key`。使用 Postman / curl 调试时请手动添加：

```bash
curl -H "proj_key: demo" "http://127.0.0.1:8082/api/proj/product/list?page=1&size=10"
```
</details>

## License

[ISC](https://opensource.org/licenses/ISC) © 涛波
