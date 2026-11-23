/**
 * Maps model name / provider id patterns to a prompt template file in ./templates.
 * Source of the prompts: https://github.com/togg53192-cmd/jailbreaks
 * Patterns are tested against `${providerID}/${modelID}`.toLowerCase(); first match wins.
 */
export interface Entry {
  /** Template file path relative to ./templates, also used as the selection key. */
  readonly key: string
  readonly patterns: readonly RegExp[]
  readonly label: string
}

export const catalog: readonly Entry[] = [
  { key: "bigpickle", label: "Big Pickle", patterns: [/big.?pickle/] },
  { key: "beam", label: "Beam", patterns: [/\bbeam\b/] },
  { key: "crouton", label: "Crouton Alpha", patterns: [/crouton/] },
  { key: "spacebunny", label: "Space Bunny", patterns: [/space.?bunny/] },
  { key: "tidepool", label: "Tidepool", patterns: [/tidepool/] },
  { key: "iceman", label: "Iceman", patterns: [/iceman/] },
  { key: "longcat", label: "LongCat", patterns: [/longcat/] },
  { key: "mimo", label: "MiMo", patterns: [/mimo/] },
  { key: "hy4", label: "HY4", patterns: [/\bhy4\b/] },
  { key: "step5", label: "Step 5", patterns: [/\bstep-?5/] },
  { key: "gemma", label: "Gemma", patterns: [/gemma/] },
  { key: "gpt-oss", label: "GPT-OSS", patterns: [/gpt-?oss/] },
  { key: "nemotron", label: "Nemotron", patterns: [/nemotron/] },
  { key: "muse", label: "Muse", patterns: [/muse/] },
  { key: "grok", label: "Grok", patterns: [/grok/] },
  { key: "deepseek", label: "DeepSeek", patterns: [/deepseek/] },
  { key: "glm", label: "GLM", patterns: [/\bglm\b/, /z-?ai/, /zhipu/] },
  { key: "qwen", label: "Qwen", patterns: [/qwen/, /alibaba/] },
  { key: "kimi", label: "Kimi", patterns: [/kimi/, /moonshot/] },
  { key: "gemini", label: "Gemini", patterns: [/gemini/, /google/] },
  { key: "claude", label: "Claude", patterns: [/claude/, /opus/, /sonnet/, /anthropic/] },
  { key: "mistral", label: "Mistral", patterns: [/mistral/] },
]

/** Used when nothing matches and the caller did not disable the fallback. */
export const FALLBACK_KEY = "unified"

export function match(needle: string): Entry | undefined {
  const value = needle.toLowerCase()
  return catalog.find((entry) => entry.patterns.some((pattern) => pattern.test(value)))
}

export function find(key: string | undefined): Entry | undefined {
  if (!key) return undefined
  const value = key.toLowerCase().replace(/\.md$/, "").replace(/^.*\//, "")
  return catalog.find((entry) => entry.key === value)
}
