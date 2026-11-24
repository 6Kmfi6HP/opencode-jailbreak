export interface JailState {
  enabled: boolean
  effective: boolean
  template: string
  card: string
  fallback: boolean
  rewrite: boolean
  strip: boolean
  scrub: boolean
  retry: boolean
  retryMax: number
  allow: boolean
  allowActions: string[]
  agents: string[]
  session: string
  last: string
  templates: { key: string; label: string }[]
}

export function statusLabel(state: Pick<JailState, "effective" | "card" | "template">): string {
  if (!state.effective) return "jailbreak off"
  if (state.card) return `jailbreak ${state.card}`
  if (state.template !== "auto" && state.template !== "off") return `jailbreak ${state.template}`
  return "jailbreak auto"
}
