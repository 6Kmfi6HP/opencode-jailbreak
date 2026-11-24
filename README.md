# opencode-jailbreak

OpenCode V2 插件：按模型自动注入「解除拒答」系统提示词，模板来自
https://github.com/togg53192-cmd/jailbreaks （已内置于 `templates/`）。

## 结构（V2 四部分）

| 文件 | 导出 | 作用 |
|---|---|---|
| `index.ts` | `.`（server） | 注入、抹除、继承、重试；`jailbreak.run` / `state` / `patch` RPC |
| `tui.tsx` | `./tui` | 终端斜杠命令 `/jailbreak`（keymap layer） |
| `gui.tsx` | `./gui-experimental` | Desktop 命令 / 斜杠命令（`ctx.add(Command)`） |
| `rpc.ts` | `./rpc` | server ↔ TUI/GUI 的 RPC 契约 |
| `catalog.ts` | — | 模型 → 模板正则映射 |
| `cards.ts` | — | `~/.config/opencode/jailbreak/cards/*.md` 覆盖或新增模板 |
| `inject.ts` | — | 尾部幂等注入、剥离宿主限制句、用户轮次改写 |
| `intent.ts` / `refusal.ts` | — | 意图词表、拒答识别 |
| `templates/*.md` | — | 22 个内置模板 |

## 为什么命令放在 TUI / GUI 部分

V2 中 server 插件通过 `ctx.command.transform` 注册的命令，其 `execute` 只能发送
**synthetic** 消息（不显示给用户），所以看起来「命令没反应」。可见命令需要：
终端用 TUI 插件的 `keymap.layer`，Desktop 用 GUI 插件的 `ctx.add(Command)`；
输出用 `ui.dialog` / `ctx.dialogs` 展示，状态操作走 RPC 回到 server。

## 构建 Desktop 部分

`./gui-experimental` 必须是一个预构建的 CommonJS 文件：

```bash
bun install
bunx vite build        # 生成 dist/gui-experimental.cjs
```

修改 `gui.tsx` 后必须重新构建，然后重启 OpenCode Desktop（窗口启动时才加载 GUI 部分）。

## 用法

在 TUI / Desktop 输入框：

```
/jailbreak status
/jailbreak on|off
/jailbreak set <模板|auto|off>
/jailbreak list
/jailbreak cards
/jailbreak fallback <on|off>
/jailbreak override <模型|供应商> <模板>
/jailbreak clear [目标]
/jailbreak rewrite <on|off>
/jailbreak strip <on|off>
/jailbreak scrub <on|off>
/jailbreak retry <on|off|0-5>
/jailbreak allow <on|off|all|action,action>
/jailbreak agents <*|id,id>
/jailbreak session <on|off|clear>
```

Desktop 还可在命令面板（Ctrl+Shift+P）搜索 “Jailbreak prompt control”，
或在 **Settings > Jailbreak** 里改。输入框上方的药丸显示当前会话是 `off` 还是实际用到的卡。
TUI 在提示符状态栏显示同一行。`/jailbreak set` 不带参数时弹出模板选择。
结果以对话框显示，无需模型参与。

默认对所有 agent 生效。`agents` 收成白名单后，只有列出的 agent 会被注入；
`session on` 强制当前会话开，`session off` 强制关，两者都压过 agent 白名单。
分叉出来的会话和子会话没有自己的开关时，沿 `parentID`、再沿 `fork` 继承，最多 4 层。
`session clear` 去掉自己的开关，改回继承。`on` / `off` 是总开关。

`rewrite` 只改发往模型的用户文本（命中安全意图词才加一句研究语境，不写回历史）。
`strip` 删掉其他 system 段里单独成行的「我不能 / I cannot」句。
`scrub` 默认开。发出去的请求里，没有工具调用的助手拒答会被换成一句撤回说明，历史原文不动；压缩摘要看到的也是换成之后的记录。
`retry` 在会话空闲、最后一条是拒答且没有工具调用时，自动补一句「继续」再试。供应商把请求打成安全类错误时，同样在 `retry` 上限内再送一次，并在下一次正式请求的系统提示后加那句「继续」。文本拒答和安全错误共用这个上限，默认 2。限流、鉴权和上下文过长不干预。
`allow` 默认关。打开后把权限询问从 `ask` 改成 `allow`，显式 `deny` 和组织策略不动。`allow shell,edit` 只放行这些动作；`allow all` 恢复全部。已存的 `allow: true` 且没有动作列表时，仍是全部放行。

换卡不用改代码：把 `<key>.md` 丢进下面这个目录，同名文件覆盖内置模板。

```
~/.config/opencode/jailbreak/cards/
```

可用 `JAILBREAK_CARDS` 改这个目录。改完 `gui.tsx` 仍要 `bunx vite build` 再重启 Desktop。

> Desktop 只会为出现在**全局** `opencode.json(c)` 的 `plugins` 里的插件加载 GUI 部分。
> 所以除自动发现外，还需在全局配置里显式列出（见下）。

## 配置

持久化在插件 storage；也可在 `opencode.json` 插件 options 预置：

```jsonc
{
  "plugins": [
    { "package": "./plugins/jailbreak", "options": { "template": "auto", "extra": "附加要求" } }
  ]
}
```

## 模板选择顺序

`override` 精确匹配 → `set` 固定模板 → `auto` 按模型正则匹配 → `unified` 兜底。
