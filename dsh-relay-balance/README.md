# dsh-relay-balance

[DeepSeek Harness](https://github.com/deepseek-ai) 插件：在 Harness Web 界面里显示**第三方中转站**（new-api / one-api 兼容）的已用金额与剩余余额，同时读取**官方 DeepSeek 账号**余额。

界面由两部分组成：一张可拖动的**玻璃质感浮窗卡片**（`shell.overlay`），以及一页**设置面板**（`settings.section`）。

```
┌──────────────────────────┐
│ ⠿  用量与余额         ⌄  ✕ │
│ 官方   中转             22:41 │
│ ¥ 1.0160   剩余额度          │
│ ────────────────────────  │
│ 已用              ¥0.9840 │
│ 已用金额          ¥0.9840 │
│ ────────────────────────  │
│ ● 已同步                  ⟳ │
└──────────────────────────┘
```

## 功能

- **设置页「中转用量」**：官方 / 中转双栏总览、已用金额与余额、凭证管理、悬浮卡片开关
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
| `apiBaseUrl` | 中转站地址，例如 `https://relay.example.com`。**必填**；填在设置页里，优先于插件 Config |
| `apiKey` | 读用量，`/v1/dashboard/billing/usage`。留空则回落到 DSH 里已配置的 `DEEPSEEK_CLASH_API_KEY` |
| `cookie` | 读余额，站点 `session` 值（登录后 F12 → Application → Cookies） |
| `accessToken` | 读余额的另一种方式：站点「个人设置 → 系统访问令牌」 |
| `userId` | 站点要求 `new-api-user` 头时填写 |
| `quotaPerUnit` | 覆盖插件的配额换算单位 |
| `currency` | 填 `CNY` 显示 ¥、填 `USD` 显示 $、留空只显示数字 |

## 数据来源

| 数据 | 接口 | 凭证 |
| --- | --- | --- |
| 已用金额 | `GET {apiBaseUrl}/v1/dashboard/billing/usage` | API Key（`total_usage` 为「分」） |
| 中转余额 | `GET {apiBaseUrl}/api/user/self` | Session Cookie 或 `Authorization: Bearer <accessToken>` |
| 官方余额 | Harness 账号服务 `deepseekAccount.getBalance()` | DSH 登录态 |

`quota` ÷ `quotaPerUnit` 得到货币金额。

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
| 余额显示「未配置」 | 没填 `cookie` 或 `accessToken`，二者任一即可 |
| 余额数字不对 | 站点 `quotaPerUnit` 不是 500000，在设置页覆盖该值 |
| 卡片没有玻璃效果 | 设置页「运行环境」里看 `毛玻璃` / `折射` 两个标签：`无折射` 表示当前内核不支持 SVG 位移滤镜 |

## 兼容性

- DeepSeek Harness `0.2.1-rc.2` 上开发与验证
- 需要 Harness 提供 `webServer`、`credentials` Host 服务，以及 `shell.overlay`、`settings.section` 两个客户端槽位

## 致谢

玻璃质感的做法参考了这两个 MIT 项目，实现是自己写的：

- [deepika-builds/liquid-glass](https://github.com/deepika-builds/liquid-glass) — 单文件 SVG 位移折射，本插件的位移贴图与三通道合成按它的方案移植
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) — 镜面高光的 inset 阴影配方
- 技术背景：[aave.com/design/building-glass-for-the-web](https://aave.com/design/building-glass-for-the-web)

## License

MIT
