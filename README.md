# DSH Plugins

A small, opinionated collection of **DeepSeek Harness** plugin bundles for
Windows software analysis. Each plugin registers one model-invocable skill and
ships the PowerShell tools that skill drives.

中文简介：两个可独立开关的 DeepSeek Harness 插件——一个做 Windows 安装包的静态画像与动态取证，一个做本地软件的逆向与反编译。两者可以单独用，也可以串联：画像是"瞄准具"，反编译是"读代码"。

## Plugins

| Plugin | Row id | Skill | What it does |
|---|---|---|---|
| [install-profiler](https://github.com/MLMLZJ/dsh-install-profiler) | `install-profiler` | `install-profiler` | Profiles a Windows installer or an installed app: install layout, registry writes, services, config files, logs, Event Log sources. Mines binaries for evidence when there is no MSI database, derives a dynamic probe plan, diffs before/after snapshots, and packages a handoff brief for the reverse-engineering skill. |
| [reverse-skill](https://github.com/MLMLZJ/dsh-reverse-skill) | `reverse-skill` | `reverse-engineering` | Static-first reverse engineering: artifact classification (APK/AAB, JAR, native PE/ELF, .NET, Electron, firmware), decompiler toolchain probe, gated authorization, degradation when a tool is missing, evidence-tagged reporting. |

## Install

### Prerequisites

- A DSH build that supports `dsh.bundle.patch` and `ctx.skills.register`
- Full access for the session, or the ability to approve `plugin_manager` actions
- Windows 10/11 for the PowerShell-driven scripts (the skills themselves are portable)

### One-time, per plugin

```powershell
git clone https://github.com/MLMLZJ/dsh-install-profiler.git C:\Tools\dsh-install-profiler
git clone https://github.com/MLMLZJ/dsh-reverse-skill.git  C:\Tools\dsh-reverse-skill
```

Then, in a DSH session:

```
plugin_manager action=install_bundle target=C:\Tools\dsh-install-profiler
plugin_manager action=install_bundle target=C:\Tools\dsh-reverse-skill
```

`install_bundle` links the directory rather than copying it, so **keep those
paths in place**. A successful result reports `"application": "applied"`.

### Verify

```
plugin_manager action=list_plugins
cordis_inspect_query platform=host provider=Config method=listConfigs input={"name":"@local/dsh-install-profiler"}
```

Or simply check that `install-profiler` and `reverse-engineering` appear in the
session skill catalog.

## How they fit together

```
                 install-profiler
  profile.json  ─┐   static map: files, registry, services, logs, event sources
  strings       ─┤   no MSI database? mine the binary for paths and error strings
  probe-plan    ─┤   derive what to watch at runtime; diff before/after snapshots
                 │
                 └── handoff.md ──────────────►  reverse-engineering
                                                  .NET (ilspycmd) / Electron (asar)
                                                  / native (objdump, rizin)
```

- **install-profiler answers "what should be observed"** — and hands over the
  facts it already established so the second pass does not rediscover them.
- **reverse-engineering answers "how to read the code"** — and returns findings
  tagged `[verified] / [inferred] / [unknown]`.
- Each plugin works alone. The handoff is opt-in and degrades honestly when the
  other plugin is absent.

## Updating

```powershell
cd C:\Tools\dsh-install-profiler ; git pull
cd C:\Tools\dsh-reverse-skill   ; git pull
```

Then toggle each row so the skill body is re-read (no DSH restart needed for
documentation changes; `index.js` changes need a restart):

```
plugin_manager action=set_plugin target=install-profiler enabled=false
plugin_manager action=set_plugin target=install-profiler enabled=true
```

## Turning one off

```
plugin_manager action=set_plugin target=install-profiler enabled=false
plugin_manager action=remove_bundle target=@local/dsh-install-profiler
```

## Design rules shared by these plugins

- **Read-only analysis.** No plugin executes the target program; dynamic
  verification needs the user's machine or a disposable VM.
- **Evidence before conclusion.** Every finding is tagged verified / inferred /
  unknown, and every fix is paired with the mechanism behind it.
- **No silent installs.** Missing tools are reported with install hints; nothing
  is downloaded or installed without explicit approval.
- **Refuse the wrong work.** Neither plugin bypasses licensing, activation, DRM
  or anti-tamper, and neither extracts other users' credentials.

## Machine-readable index

`plugins.json` lists the same data (repository, row id, skill, script count,
version) for tooling.

## License

No license has been declared yet, so all rights are reserved by default. Open an
issue if you need a specific license.
