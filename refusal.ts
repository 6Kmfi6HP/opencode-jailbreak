/** Leading-token refusal. A long answer that merely mentions the phrase does not count. */
const LEAD =
  /^\s*(?:I(?:'m| am) (?:sorry|afraid|unable)|I (?:cannot|can't|won't|will not|must refuse)|Sorry, but I|I (?:must|have to) (?:decline|refuse)|作为.{0,8}(?:AI|人工智能)|我(?:无法|不能|不会)(?:协助|帮助|提供|满足|生成)|抱歉[,，]|无法(?:协助|提供|满足)|不能(?:协助|提供))/i

export function isRefusal(text: string): boolean {
  const head = text.trim().slice(0, 400)
  if (!head) return false
  return LEAD.test(head)
}

/** Host self-limit lines. Only a line that is itself the disclaimer is removed. */
const DISCLAIMER =
  /^\s*(?:I(?:'m| am) (?:sorry|unable)|I (?:cannot|can't|must refuse|won't|will not) (?:help|assist|provide|comply|generate|create|write)|作为.{0,8}(?:人工智能|AI).{0,16}(?:不能|无法)|我(?:无法|不能|不会)(?:协助|帮助|提供|生成|编写)|抱歉[,，].{0,40}(?:无法|不能))/i

export function stripDisclaimerLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => line.length > 240 || !DISCLAIMER.test(line))
    .join("\n")
}
