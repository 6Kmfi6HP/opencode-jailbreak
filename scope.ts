export interface Lineage {
  parentID?: string | null
  fork?: { sessionID?: string | null } | null
}

/** Parent session, else the session this one was forked from. */
export function ancestorOf(session: Lineage | undefined): string | undefined {
  if (!session) return undefined
  return session.parentID || session.fork?.sessionID || undefined
}
