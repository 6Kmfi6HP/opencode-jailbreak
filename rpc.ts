import { Rpc } from "@opencode/plugin/rpc"

export const Jailbreak = Rpc.define({
  id: "jailbreak",
  methods: {
    run: {
      input: {
        type: "object",
        properties: { args: { type: "string" }, sessionID: { type: "string" } },
        required: ["args"],
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
  events: {},
} as const)
