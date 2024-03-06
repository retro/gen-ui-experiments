"use client";

import { conversationMachine } from "./conversation-machine";
import { createActorContext } from "@xstate/react";

export const ConversationMachineContext =
  createActorContext(conversationMachine);
