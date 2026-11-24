import { createEffect, createSignal } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import { Jailbreak } from "./rpc.ts"
import { statusLabel, type JailState } from "./status.ts"

/**
 * V2 slash command for the jailbreak server plugin. Server-side commands from
 * plugins only emit hidden synthetic messages, so the visible `/jailbreak`
 * command lives here and talks to the server over RPC.
 */
export default Plugin.define({
  id: "jailbreak.tui",
  setup(context) {
    const rpc = () => context.client.rpc(Jailbreak)
    const [revision, setRevision] = createSignal(0)
    const stopUpdated = rpc().events.on("updated", () => {
      setRevision((value) => value + 1)
    })
    const stopRetry = rpc().events.on("retrying", (event) => {
      const data = event.data as { sessionID?: string; via?: string; count?: number }
      const active = context.ui.tabs.list().find((tab) => tab.active)?.sessionID
      if (!data.sessionID || data.sessionID !== active) return
      context.ui.toast.show({
        title: "jailbreak",
        message: `retry ${data.count ?? 1} (${data.via ?? "idle"})`,
        variant: "warning",
        sessionID: data.sessionID,
      })
    })

    function Status(props: { sessionID?: string }) {
      const [line, setLine] = createSignal("jailbreak")
      createEffect(() => {
        revision()
        const sessionID = props.sessionID
        void rpc()
          .state(sessionID ? { sessionID } : {})
          .then((value) => setLine(statusLabel(value as JailState)))
          .catch(() => undefined)
      })
      return <text>{line()}</text>
    }

    context.ui.slot({
      append: "prompt.footer.status",
      render: (input) => <Status sessionID={input.sessionID} />,
    })

    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "jailbreak.control",
          title: "Jailbreak prompt control",
          description: "Show or change the refusal-suppression prompt injected into model requests",
          group: "Jailbreak",
          palette: true,
          slash: { name: "jailbreak", arguments: true },
          run: async (input) => {
            const sessionID = context.ui.tabs.list().find((tab) => tab.active)?.sessionID
            const args = input ?? ""
            const [action, ...rest] = args.trim().split(/\s+/)
            try {
              if ((action || "status").toLowerCase() === "set" && rest.join(" ").trim() === "") {
                const current = (await rpc().state(sessionID ? { sessionID } : {})) as JailState
                const picked = await context.ui.dialog.select({
                  title: "jailbreak template",
                  current: current.template,
                  options: [{ title: "auto", description: "match the model", value: "auto" }]
                    .concat(current.templates.map((entry) => ({ title: entry.key, description: entry.label, value: entry.key })))
                    .concat([{ title: "off", description: "inject nothing", value: "off" }]),
                })
                if (!picked) return
                const result = (await rpc().run(
                  sessionID ? { args: `set ${picked}`, sessionID } : { args: `set ${picked}` },
                )) as { text: string }
                await context.ui.dialog.alert({ title: "jailbreak", message: result.text })
                return
              }
              const result = (await rpc().run(sessionID ? { args, sessionID } : { args })) as { text: string }
              await context.ui.dialog.alert({ title: "jailbreak", message: result.text })
            } catch (error) {
              context.ui.toast.show({
                message: error instanceof Error ? error.message : String(error),
                variant: "error",
              })
            }
          },
        },
      ],
    }))

    return () => {
      stopUpdated()
      stopRetry()
    }
  },
})
