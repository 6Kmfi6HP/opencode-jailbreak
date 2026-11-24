import { Rpc } from "@opencode/plugin/rpc"

const state = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    effective: { type: "boolean" },
    template: { type: "string" },
    card: { type: "string" },
    fallback: { type: "boolean" },
    rewrite: { type: "boolean" },
    strip: { type: "boolean" },
    scrub: { type: "boolean" },
    retry: { type: "boolean" },
    retryMax: { type: "number" },
    allow: { type: "boolean" },
    allowActions: { type: "array", items: { type: "string" } },
    agents: { type: "array", items: { type: "string" } },
    session: { type: "string" },
    last: { type: "string" },
    templates: {
      type: "array",
      items: {
        type: "object",
        properties: { key: { type: "string" }, label: { type: "string" } },
        required: ["key", "label"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "enabled",
    "effective",
    "template",
    "card",
    "fallback",
    "rewrite",
    "strip",
    "scrub",
    "retry",
    "retryMax",
    "allow",
    "allowActions",
    "agents",
    "session",
    "last",
    "templates",
  ],
  additionalProperties: false,
} as const

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
    state: {
      input: {
        type: "object",
        properties: { sessionID: { type: "string" } },
        additionalProperties: false,
      },
      output: state,
    },
    patch: {
      input: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          template: { type: "string" },
          fallback: { type: "boolean" },
          rewrite: { type: "boolean" },
          strip: { type: "boolean" },
          scrub: { type: "boolean" },
          retry: { type: "boolean" },
          retryMax: { type: "number" },
          allow: { type: "boolean" },
          allowActions: { type: "array", items: { type: "string" } },
          agents: { type: "array", items: { type: "string" } },
          session: { type: "string" },
          sessionID: { type: "string" },
        },
        additionalProperties: false,
      },
      output: state,
    },
  },
  events: {
    updated: { schema: state },
    retrying: {
      schema: {
        type: "object",
        properties: {
          sessionID: { type: "string" },
          via: { type: "string" },
          count: { type: "number" },
        },
        required: ["sessionID", "via", "count"],
        additionalProperties: false,
      },
    },
  },
} as const)
