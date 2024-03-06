"use client";

import { ConversationMachineContext } from "@/app/conversation-machine-context";
import { useEffect } from "react";

export function ConversationActorSend(props: { type: string; id: string }) {
  const conversationActorRef = ConversationMachineContext.useActorRef();
  useEffect(() => {
    conversationActorRef.send({ type: props.type, id: props.id });
  }, [props.type, props.id, conversationActorRef]);
  return null;
}
