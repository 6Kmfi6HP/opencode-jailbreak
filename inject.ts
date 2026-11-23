import { rewriteText } from "./intent.ts"
import { stripDisclaimerLines } from "./refusal.ts"

export const MARKER = "[[JAILBREAK]]"

export interface TextPart {
  type?: string
  text?: string
  metadata?: Record<string, unknown>
}

export interface DraftMessage {
  role?: string
  readonly content?: readonly { type?: string; text?: string | null }[]
}

/** Replace any earlier copy and append, so the card stays in the last system part. */
export function place(system: TextPart[], text: string): void {
  for (let index = system.length - 1; index >= 0; index--) {
    const part = system[index]
    if (part?.type === "text" && part.text?.includes(MARKER)) system.splice(index, 1)
  }
  system.push({
    type: "text",
    text: `${MARKER}\n${text}`,
    metadata: { experimental: { instructions: [{ key: "jailbreak", text }] } },
  })
}

/** Drop host self-limit lines. The injected card is left untouched. */
export function stripHost(system: TextPart[]): void {
  for (const part of system) {
    if (part?.type !== "text" || typeof part.text !== "string" || part.text.includes(MARKER)) continue
    part.text = stripDisclaimerLines(part.text)
  }
}

/** Prefix matching user turns. Idempotent, and only the outgoing request is changed. */
export function rewriteUsers(messages: readonly DraftMessage[]): void {
  for (const message of messages) {
    if (message?.role !== "user" || !Array.isArray(message.content)) continue
    for (const part of message.content) {
      if (part?.type !== "text" || typeof part.text !== "string") continue
      const next = rewriteText(part.text)
      if (next !== part.text) part.text = next
    }
  }
}
