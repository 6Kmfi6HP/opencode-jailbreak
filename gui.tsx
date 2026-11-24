import { For, Show, createEffect, createSignal, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { Command, ComposerPill, Plugin, SettingsPage, createKeyed, usePlugin } from "@opencode/plugin/gui"
import { ACTIONS } from "./allow.ts"
import { Jailbreak } from "./rpc"
import { statusLabel, type JailState } from "./status.ts"

export default Plugin.define({
  setup(ctx) {
    const rpc = () => ctx.client.rpc(Jailbreak)
    const [labels, setLabels] = createStore<Record<string, string>>({})

    const loadSession = (id: string) => {
      void rpc()
        .state({ sessionID: id })
        .then((value) => setLabels(id, statusLabel(value as JailState)))
        .catch(() => undefined)
    }

    createKeyed(
      () => ctx.sessions.list().map((session) => session.id).join("\n"),
      (key) => {
        for (const id of key.split("\n")) if (id) loadSession(id)
      },
    )

    const stopUpdated = rpc().events.on("updated", () => {
      for (const session of ctx.sessions.list()) loadSession(session.id)
    })
    const stopRetry = rpc().events.on("retrying", (event) => {
      const data = event.data as { sessionID?: string; via?: string; count?: number }
      if (!data.sessionID || ctx.sessions.current()?.id !== data.sessionID) return
      ctx.toast.show({
        title: "jailbreak",
        description: `retry ${data.count ?? 1} (${data.via ?? "idle"})`,
      })
    })

    ctx.add(Command, (): Command => ({
      id: "jailbreak",
      title: "Jailbreak prompt control",
      description: "Show or change the refusal-suppression prompt injected into model requests",
      group: "Jailbreak",
      slash: { name: "jailbreak", arguments: true },
      run: async (input) => {
        try {
          const sessionID = ctx.sessions.current()?.id
          const result = (await rpc().run(sessionID ? { args: input ?? "", sessionID } : { args: input ?? "" })) as {
            text: string
          }
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

    ctx.add(ComposerPill, {
      id: "status",
      show: (input) => ({
        icon: "flask",
        label: labels[input.session.id] ?? "jailbreak",
        tone: (labels[input.session.id] ?? "").endsWith(" off") ? "warning" : undefined,
        title: "Jailbreak prompt",
        run: () => ctx.layout.settings("jailbreak"),
      }),
    })

    ctx.add(SettingsPage, {
      id: "jailbreak",
      icon: "flask",
      get title() {
        return "Jailbreak"
      },
      get entries() {
        return [
          { id: "template", title: "Template", keywords: "card model" },
          { id: "scrub", title: "Scrub refusals" },
          { id: "allow", title: "Allow prompts", keywords: "permission" },
        ]
      },
      render: () => <Settings />,
    })

    return () => {
      stopUpdated()
      stopRetry()
    }
  },
})

function Settings() {
  const ctx = usePlugin()
  const rpc = () => ctx.client.rpc(Jailbreak)
  const [state, setState] = createSignal<JailState | undefined>()
  const [error, setError] = createSignal("")

  const load = (sessionID?: string) => {
    void rpc()
      .state(sessionID ? { sessionID } : {})
      .then((value) => {
        setState(value as JailState)
        setError("")
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
  }

  createEffect(() => load(ctx.sessions.current()?.id))
  onCleanup(rpc().events.on("updated", () => load(ctx.sessions.current()?.id)))

  const patch = async (body: Record<string, unknown>) => {
    const sessionID = ctx.sessions.current()?.id
    try {
      const next = await rpc().patch(sessionID ? { ...body, sessionID } : body)
      setState(next as JailState)
      setError("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const selected = (action: string) => {
    const current = state()
    if (!current) return false
    if (!current.allowActions.length || current.allowActions.includes("*")) return true
    return current.allowActions.includes(action)
  }

  const toggleAction = (action: string, checked: boolean) => {
    const current = state()
    if (!current) return
    const all = !current.allowActions.length || current.allowActions.includes("*")
    const names = all ? [...ACTIONS] : current.allowActions.filter((item) => (ACTIONS as readonly string[]).includes(item))
    const next = checked ? [...names, action] : names.filter((item) => item !== action)
    const unique = [...new Set(next)]
    if (!unique.length) void patch({ allow: false, allowActions: [] })
    else if (unique.length === ACTIONS.length) void patch({ allow: true, allowActions: [] })
    else void patch({ allow: true, allowActions: unique })
  }

  const current = () => state()!
  const ui = ctx.ui
  return (
    <Show when={state()} fallback={<ui.Loader />}>
      <ui.SettingsLayout title="Jailbreak" description="Refusal-suppression prompt injected into model requests.">
        <ui.SettingsSection title="Prompt">
          <ui.SettingsRow id="enabled" title="Enabled" description="Master switch. Session overrides still apply.">
            <ui.Switch label="Enabled" hideLabel checked={current().enabled} onChange={(checked) => void patch({ enabled: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="template" title="Template" description="auto matches the model. off injects nothing.">
            <ui.Select
              label="Template"
              value={current().template}
              options={[
                { value: "auto", label: "auto" },
                ...current().templates.map((entry) => ({ value: entry.key, label: entry.key })),
                { value: "off", label: "off" },
              ]}
              onChange={(value) => void patch({ template: value })}
            />
          </ui.SettingsRow>
          <ui.SettingsRow id="fallback" title="Fallback" description="Use the unified card when auto matches nothing.">
            <ui.Switch label="Fallback" hideLabel checked={current().fallback} onChange={(checked) => void patch({ fallback: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="session" title="This session" description="Overrides the agent list. Inherit follows the parent, then agents.">
            <ui.Select
              label="This session"
              disabled={!ctx.sessions.current()}
              value={current().session}
              options={[
                { value: "inherit", label: "inherit" },
                { value: "on", label: "on" },
                { value: "off", label: "off" },
              ]}
              onChange={(value) => void patch({ session: value === "inherit" ? "clear" : value })}
            />
          </ui.SettingsRow>
        </ui.SettingsSection>
        <ui.SettingsSection title="Request">
          <ui.SettingsRow id="rewrite" title="Rewrite" description="Prefix user turns that match the intent list. Not saved to history.">
            <ui.Switch label="Rewrite" hideLabel checked={current().rewrite} onChange={(checked) => void patch({ rewrite: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="strip" title="Strip" description="Remove host self-limit lines from other system parts.">
            <ui.Switch label="Strip" hideLabel checked={current().strip} onChange={(checked) => void patch({ strip: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="scrub" title="Scrub refusals" description="Replace outgoing assistant refusals that have no tool call.">
            <ui.Switch label="Scrub refusals" hideLabel checked={current().scrub} onChange={(checked) => void patch({ scrub: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="retry" title="Retry" description="Continue after a refusal, and retry a safety error.">
            <ui.Switch label="Retry" hideLabel checked={current().retry} onChange={(checked) => void patch({ retry: checked })} />
          </ui.SettingsRow>
          <ui.SettingsRow id="retry-max" title="Retry max" description="Shared by text refusals and safety errors. 0 disables retry.">
            <ui.Select
              label="Retry max"
              value={String(current().retryMax)}
              options={["0", "1", "2", "3", "4", "5"].map((value) => ({ value, label: value }))}
              onChange={(value) => void patch({ retryMax: Number(value) })}
            />
          </ui.SettingsRow>
        </ui.SettingsSection>
        <ui.SettingsSection title="Permissions" footer={error() ? <span>{error()}</span> : undefined}>
          <ui.SettingsRow id="allow" title="Allow prompts" description="Turn ask into allow. Deny rules and policies still block.">
            <ui.Switch label="Allow prompts" hideLabel checked={current().allow} onChange={(checked) => void patch({ allow: checked })} />
          </ui.SettingsRow>
          <For each={ACTIONS}>
            {(action) => (
              <ui.SettingsRow id={`allow-${action}`} title={action}>
                <ui.Switch
                  label={action}
                  hideLabel
                  disabled={!current().allow}
                  checked={selected(action)}
                  onChange={(checked) => toggleAction(action, checked)}
                />
              </ui.SettingsRow>
            )}
          </For>
        </ui.SettingsSection>
      </ui.SettingsLayout>
    </Show>
  )
}
