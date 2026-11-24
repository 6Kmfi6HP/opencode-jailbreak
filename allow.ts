/** Built-in permission actions the allow list can name. An empty list means every ask. */
export const ACTIONS = [
  "shell",
  "edit",
  "read",
  "glob",
  "grep",
  "webfetch",
  "websearch",
  "external_directory",
  "subagent",
  "skill",
  "question",
] as const

export function allows(allow: boolean, allowActions: readonly string[] | undefined, action: string): boolean {
  if (!allow) return false
  if (!allowActions?.length || allowActions.includes("*")) return true
  return allowActions.includes(action)
}

/** `undefined` when a name is not a known action. `[]` means every action. */
export function parseActions(arg: string): string[] | undefined {
  const names = [...new Set(arg.split(",").map((item) => item.trim()).filter(Boolean))]
  if (!names.length) return undefined
  if (names.includes("*") || names.includes("all")) return []
  if (names.some((name) => !ACTIONS.includes(name as (typeof ACTIONS)[number]))) return undefined
  return names.length === ACTIONS.length ? [] : names
}
