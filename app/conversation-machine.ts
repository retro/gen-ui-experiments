import { assign, setup } from "xstate";

export const conversationMachine = setup({
  types: {
    context: {} as {
      systemPrompt: string;
      availableTools: Set<string>;
      seenMessageIds: string[];
      batches: {
        type: "root" | "create_project";
        messageIds: string[];
        lastWidgetMessageId?: string;
        hiddenWidgetMessageIds: string[];
      }[];
    },
    events: {} as { type: string; id: string },
  },
  actions: {
    setupRootToolsAndPrompt: assign(({ context }) => ({
      ...context,
      systemPrompt:
        "You are a project manager assistant. Your job is to take user's input and call one of the provided tools with appropriate payload",
      availableTools: new Set(["create_project"]),
    })),
    setupCreatingProjectToolsAndPrompt: assign(({ context }) => ({
      ...context,
      systemPrompt:
        "You are a project manager assistant in process of creating a project. Your job is to take user's input and call one of the provided tools with appropriate payload",
      availableTools: new Set(["update_project", "cancel"]),
    })),
    startRootBatch: assign(({ context }) => ({
      ...context,
      batches: [
        ...context.batches,
        { type: "root" as const, messageIds: [], hiddenWidgetMessageIds: [] },
      ],
    })),
    startCreateProjectBatch: assign(({ context }) => {
      const lastBatch = context.batches[context.batches.length - 1];
      const lastBatchMessageIds = lastBatch.messageIds;

      const lastMessageFromLastBatch =
        lastBatchMessageIds[lastBatchMessageIds.length - 1];
      const lastBatchMessagesWithoutLastMessage = lastBatchMessageIds.slice(
        0,
        -1
      );
      const batches = context.batches.slice(0, -1);

      return {
        ...context,
        batches: [
          ...batches,
          { ...lastBatch, messageIds: lastBatchMessagesWithoutLastMessage },
          {
            type: "create_project" as const,
            messageIds: [lastMessageFromLastBatch],
            hiddenWidgetMessageIds: [],
          },
        ],
      };
    }),

    addMessageToBatch: assign(({ context, event }) => {
      if (context.seenMessageIds.includes(event.id)) {
        return context;
      }
      const batch = context.batches[context.batches.length - 1];
      const messageIds = [...batch.messageIds, event.id];
      const lastWidgetMessageId =
        event.type === "update_project" || event.type === "create_project"
          ? event.id
          : batch.lastWidgetMessageId;
      const hiddenWidgetMessageIds =
        event.type === "update_project" && batch.lastWidgetMessageId
          ? [...batch.hiddenWidgetMessageIds, batch.lastWidgetMessageId]
          : batch.hiddenWidgetMessageIds;
      const batches = context.batches.slice(0, -1);
      return {
        ...context,
        seenMessageIds: [...context.seenMessageIds, event.id],
        batches: [
          ...batches,
          { ...batch, messageIds, lastWidgetMessageId, hiddenWidgetMessageIds },
        ],
      };
    }),
  },
}).createMachine({
  context: {
    systemPrompt: "",
    availableTools: new Set<string>(),
    batches: [],
    seenMessageIds: [],
  },
  initial: "root",
  states: {
    root: {
      entry: ["setupRootToolsAndPrompt", "startRootBatch"],
      on: {
        message: { actions: ["addMessageToBatch"] },
        create_project: "creatingProject",
      },
    },
    creatingProject: {
      entry: [
        "setupCreatingProjectToolsAndPrompt",
        "startCreateProjectBatch",
        "addMessageToBatch",
      ],
      exit: ["addMessageToBatch"],
      on: {
        message: { actions: ["addMessageToBatch"] },
        update_project: { actions: ["addMessageToBatch"] },
        cancel: "root",
      },
    },
  },
});
