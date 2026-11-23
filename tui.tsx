import { Plugin } from "@opencode/plugin/tui"
import { Jailbreak } from "./rpc.ts"

/**
 * V2 slash command for the jailbreak server plugin. Server-side commands from
 * plugins only emit hidden synthetic messages, so the visible `/jailbreak`
 * command lives here and talks to the server over RPC.
 */
export default Plugin.define({
  id: "jailbreak.tui",
  setup(context) {
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
            try {
              const sessionID = context.ui.tabs.list().find((tab) => tab.active)?.sessionID
              const jailbreak = context.client.rpc(Jailbreak)
              const result = (await jailbreak.run(
                sessionID ? { args: input ?? "", sessionID } : { args: input ?? "" },
              )) as { text: string }
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
  },
})
