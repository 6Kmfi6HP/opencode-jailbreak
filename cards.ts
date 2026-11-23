import { readdir, readFile, stat } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { FALLBACK_KEY, find } from "./catalog.ts"

const cache = new Map<string, { mtime: number; text: string }>()

/** Drop-in templates. A file named like a built-in key replaces that built-in. */
export function cardsDir(): string {
  return process.env.JAILBREAK_CARDS || join(homedir(), ".config", "opencode", "jailbreak", "cards")
}

export async function listCards(): Promise<string[]> {
  const names = await readdir(cardsDir()).catch(() => [] as string[])
  return names
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -3))
    .sort()
}

export async function readCard(key: string): Promise<string | undefined> {
  const file = join(cardsDir(), `${key}.md`)
  try {
    const info = await stat(file)
    const hit = cache.get(key)
    if (hit && hit.mtime === info.mtimeMs) return hit.text
    const text = (await readFile(file, "utf8")).trim()
    if (!text) return undefined
    cache.set(key, { mtime: info.mtimeMs, text })
    return text
  } catch {
    return undefined
  }
}

export async function known(key: string): Promise<boolean> {
  if (key === FALLBACK_KEY || find(key)) return true
  return (await listCards()).includes(key)
}
