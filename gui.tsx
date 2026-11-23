import { Command, Plugin } from "@opencode/plugin/gui"
import { Jailbreak } from "./rpc"

export default Plugin.define({
  setup(ctx) {
    ctx.add(Command, (): Command => ({
      id: "jailbreak",
      title: "Jailbreak prompt control",
      description: "Show or change the refusal-suppression prompt injected into model requests",
      group: "Jailbreak",
      slash: { name: "jailbreak", arguments: true },
      run: async (input) => {
        try {
          const sessionID = ctx.sessions.current()?.id
          const result = (await ctx.client.rpc(Jailbreak).run(
            sessionID ? { args: input ?? "", sessionID } : { args: input ?? "" },
          )) as { text: string }
          await ctx.dialogs.alert({ title: "jailbreak", description: result.text })
        } catch (error) {
          ctx.toast.show({
            variant: "error",
            title: "jailbreak",
            description: error instanceof Error ? error.message : String(error),
          })
        }
      },
    }))
  },
})
