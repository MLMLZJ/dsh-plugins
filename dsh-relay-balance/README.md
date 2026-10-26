# dsh-relay-balance

[DeepSeek Harness](https://github.com/deepseek-ai) 插件：在 Harness Web 界面里显示**第三方中转站**的已用金额与剩余余额，同时读取**官方 DeepSeek 账号**余额。

**自动识别站点类型**，不需要你选协议：sub2api（卡扣AI 等）、new-api / one-api 系列、OpenRouter，以及任何 OpenAI 兼容站点都能接。

界面由两部分组成：一张可拖动的**玻璃质感浮窗卡片**（`shell.overlay`），以及一页**设置面板**（`settings.section`）。

```
┌──────────────────────────┐
│ ⠿  用量与余额         ⌄  ✕ │
│ 官方   中转             22:41 │
│ $ 47.08   剩余额度          │
│ ────────────────────────  │
│ 今日实付          $0.6617 │
│ 累计实付          $0.7131 │
│ 今日请求              190 │
│ ────────────────────────  │
│ ● 已同步                  ⟳ │
└──────────────────────────┘
```

## 支持的站点

插件按「信息量从多到少」的顺序逐个探测，第一个认领成功的适配器生效。全部探测失败也不会抛错，只在设置页显示「未识别」。

| 适配器 | 识别依据 | 能读到 |
| --- | --- | --- |
| **sub2api**（卡扣AI 等） | `GET /v1/usage` | 余额、今日/累计实付、请求数、rpm、当前模型 |
| **OpenRouter** | `GET /api/v1/key` | 余额、额度上限、已用 |
| **new-api / one-api** 系列 | `GET /v1/dashboard/billing/usage` | 已用金额（分 → 货币）；余额需站点登录态 |
| **通用 OpenAI 兼容** | `GET /v1/models` | 仅验证地址与 Key 有效，不显示金额 |

sub2api 的 `/v1/usage` 只用 **API Key** 鉴权，**不需要**任何登录态、Cookie 或面板令牌——所以插件永远不会碰你的浏览器会话，退出登录、换设备、改密码都不影响取数。

## 功能

- **自动识别站点**：只填地址和 Key，插件自己判断是哪类中转站
- **设置页「中转用量」**：官方 / 中转双栏总览、站点类型、已用金额与余额、凭证管理、悬浮卡片开关
- **浮窗卡片**：拖动（位置记忆）、官方/中转切换、折叠、关闭、60 秒自动刷新、鼠标悬停刷新
- **两种余额来源并存**：官方余额走 Harness 的账号服务，中转余额走站点 API
- **凭证只在本机**：明文只写入 Host 侧的 `credential.json`，浏览器只拿得到「是否已配置」
- **玻璃质感**：SVG `feDisplacementMap` 边缘折射 + 镜面渐变描边（同 Apple Liquid Glass 的做法），非 Chromium 内核自动退回普通背景模糊
- **中英双语**：跟随 Harness 的界面语言

## 安装

插件是纯 ESM 的 Cordis 包，没有原生依赖，Linux / macOS / Windows 行为一致。
它位于 [dsh-plugins](https://github.com/MLMLZJ/dsh-plugins) 仓库的 `dsh-relay-balance/` 子目录。

### 方式 A：克隆父仓库（推荐）

```bash
git clone https://github.com/MLMLZJ/dsh-plugins.git
dsh plugin --profile web add "$(pwd)/dsh-plugins/dsh-relay-balance"
```

Windows（PowerShell）：

```powershell
git clone https://github.com/MLMLZJ/dsh-plugins.git C:\Tools\dsh-plugins
dsh plugin --profile web add C:\Tools\dsh-plugins\dsh-relay-balance
```

### 方式 B：交给 Harness 里的 Agent

把路径告诉 Agent，让它执行 `plugin_manager` 的 `install_bundle`，`target` 填该子目录的绝对路径：

```
plugin_manager action=install_bundle target=/abs/path/dsh-plugins/dsh-relay-balance
```

`install_bundle` 建立的是链接而不是拷贝，**请保留该目录**。

### 验证安装

```bash
dsh --profile web --dump-config | grep -A4 relay-balance
```

应输出 `id: relay-balance`、`name: dsh-relay-balance` 以及 `config` 里的四项。然后在界面里打开 **设置 → 中转用量**，页面底部「运行环境」会显示模块版本与 `毛玻璃` / `折射` 两个能力标签。

### 更新与卸载

```bash
cd dsh-plugins && git pull          # 更新
dsh plugin --profile web remove dsh-relay-balance   # 卸载
```

## 配置

### 插件 Config（`cordis.patch.yml`，也可在 设置 → 插件 里改）

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `apiBaseUrl` | 空 | 插件级默认站点地址；留空即可，日常在设置页里填（见下） |
| `quotaPerUnit` | `500000` | new-api 的配额换算单位，即 1 个货币单位等于多少 quota |
| `refreshMs` | `60000` | 后台刷新间隔 |
| `timeoutMs` | `15000` | 单个请求超时 |

### 凭证（在设置页里填，不需要改文件）

| 字段 | 用途 |
| --- | --- |
| `apiBaseUrl` | 中转站地址，例如 `https://relay.example.com`。**必填**；填在设置页里，优先于插件 Config。填 API 域名而不是网页地址（如 `https://api.kakouai.com`，不是 `https://kakouai.com/dashboard`） |
| `apiKey` | **sub2api / new-api / OpenRouter 都靠它取数**。留空则回落到 DSH 里已配置的 `DEEPSEEK_CLASH_API_KEY` |
| `cookie` | 仅 new-api 系列读余额时需要，站点 `session` 值（登录后 F12 → Application → Cookies） |
| `accessToken` | 仅 new-api 系列读余额时需要，站点「个人设置 → 系统访问令牌」 |
| `userId` | 站点要求 `new-api-user` 头时填写 |
| `quotaPerUnit` | 仅 new-api 系列的配额换算单位（1 货币单位 = 多少 quota） |
| `currency` | 覆盖货币符号：`CNY` 显示 ¥、`USD` 显示 $、留空则用站点返回值 |

> sub2api 与 OpenRouter 返回的金额**已经是货币单位**，`quotaPerUnit` 对它们不生效。

## 数据来源

| 站点类型 | 数据 | 接口 | 凭证 |
| --- | --- | --- | --- |
| sub2api | 余额 + 今日/累计实付 + 请求数 | `GET {apiBaseUrl}/v1/usage` | API Key |
| OpenRouter | 余额 + 额度上限 | `GET {apiBaseUrl}/api/v1/key` | API Key |
| new-api 系列 | 已用金额 | `GET {apiBaseUrl}/v1/dashboard/billing/usage` | API Key（`total_usage` 为「分」） |
| new-api 系列 | 余额 | `GET {apiBaseUrl}/api/user/self` | Session Cookie 或 `Authorization: Bearer <accessToken>` |
| 通用兼容 | 地址与 Key 有效性 | `GET {apiBaseUrl}/v1/models` | API Key |
| 官方 | 官方余额 | Harness 账号服务 `deepseekAccount.getBalance()` | DSH 登录态 |

new-api 系列的余额由 `quota ÷ quotaPerUnit` 得到货币金额。

### 探测顺序与失败行为

适配器按 `sub2api → openrouter → new-api → generic` 依次探测，**第一个成功认领的生效**：

- 某个适配器抛错（网络、超时）→ 记录错误并继续下一个
- 站点返回 401/403 → 判定为「Key 被拒绝」，停止探测并提示
- 全部未认领 → 卡片显示「未识别」，不误报成「已同步」

## 安全

- 三个 HTTP 路由（`/relay-balance/state`、`/credential`、`/refresh`）**只接受 loopback 请求**，其余返回 403
- 凭证写入 `<DSH_HOME>/relay-balance/credential.json`，POSIX 上创建为 `0600`、目录 `0700`（Windows 上 Node 会忽略 mode 参数，由用户目录 ACL 保护）
- `GET /relay-balance/state` 只返回 `hasApiKey` / `hasCookie` / `hasAccessToken` 这类布尔值，不含任何明文
- 插件不发送任何遥测

## 跨平台

- 无原生依赖、无 shell 脚本、无平台分支代码
- 凭证目录：Linux/macOS `~/.dsh/relay-balance/`，Windows `%USERPROFILE%\.dsh\relay-balance\`
- 后台刷新用 Node 定时器，不依赖 cron 或 systemd
- 边缘折射滤镜仅 Chromium 内核（Chrome / Edge / 大部分 WebView）支持；Safari、Firefox 会自动使用普通 `backdrop-filter` 模糊

## 排错

| 现象 | 处理 |
| --- | --- |
| 改了样式但界面没变 | 客户端模块按内容哈希缓存，按 **Ctrl+Shift+R** 硬刷新 |
| 设置里没有「中转用量」，卡片也消失了 | 重装插件会先卸载客户端半，页面若没收到重新导入的通知就一直是空的；**Ctrl+Shift+R** 一次即恢复（宿主端其实一直在跑，可用 `curl 127.0.0.1:3080/relay-balance/state` 验证） |
| 卡片显示「还没有填写中转站地址」 | 到设置页填你的中转站地址（`https://…`） |
| 显示「站点类型：未识别」 | 地址或 Key 不对，或者该站点不在支持列表里。确认填的是 **API 域名**（如 `https://api.example.com`）而不是网页控制台地址 |
| 提示「API Key 被拒绝」 | Key 失效/被禁用，或不是该站点的 Key |
| new-api 站点余额显示「未配置」 | 没填 `cookie` 或 `accessToken`，二者任一即可（sub2api / OpenRouter 不需要） |
| new-api 站点余额数字不对 | 该站 `quotaPerUnit` 不是 500000，在设置页覆盖该值 |
| 卡片没有玻璃效果 | 设置页「运行环境」里看 `毛玻璃` / `折射` 两个标签：`无折射` 表示当前内核不支持 SVG 位移滤镜 |

## 兼容性

- DeepSeek Harness `0.2.1-rc.2` 上开发与验证
- 需要 Harness 提供 `webServer`、`credentials` Host 服务，以及 `shell.overlay`、`settings.section` 两个客户端槽位

## 开发

适配器在 `providers.js`，每个适配器导出 `{ id, label, needsKey, detect(ctx) }`，`detect` 返回统一结构或 `null`（表示「不是我的站点」）。
新增站点类型只需加一个适配器并放进 `ADAPTERS` 数组，无需改 Host 或界面。

用真实站点验证适配层：

```bash
node verify-providers.mjs https://api.example.com sk-your-key
```

## 致谢

玻璃质感的做法参考了这两个 MIT 项目，实现是自己写的：

- [deepika-builds/liquid-glass](https://github.com/deepika-builds/liquid-glass) — 单文件 SVG 位移折射，本插件的位移贴图与三通道合成按它的方案移植
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) — 镜面高光的 inset 阴影配方
- 技术背景：[aave.com/design/building-glass-for-the-web](https://aave.com/design/building-glass-for-the-web)

## License

MIT
