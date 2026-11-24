/** Provider failure that is a safety block, not rate limit, auth, or context overflow. */
const SKIP =
  /rate.?limit|too many requests|\b429\b|unauthorized|invalid[_ ]api[_ ]key|authentication|\b401\b|context length|context window|maximum context|too many tokens|context_length|prompt is too long|exceeds the context|token limit/i

const SAFETY =
  /content[\s_-]?filter|content[\s_-]?policy|\bsafety\b|moderation|usage policy|prohibited|recitation|\bblocked\b/i

export function isSafetyError(error: {
  type?: string
  message?: string
  status?: number
  response?: { body?: string }
}): boolean {
  if (error.status === 429 || error.status === 401) return false
  const blob = `${error.type ?? ""}\n${error.message ?? ""}\n${error.response?.body ?? ""}`
  if (SKIP.test(blob)) return false
  return SAFETY.test(blob)
}
