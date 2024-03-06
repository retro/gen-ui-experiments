import { useAIState, useActions, useUIState } from "ai/rsc";

import { AI, type AIState } from "@/app/action";
import { Input } from "./ui/input";
import { UserMessage } from "./chat-messages";
import { useState } from "react";
import { conversationMachine } from "@/app/conversation-machine";
import { createActor } from "xstate";
import { ConversationMachineContext } from "@/app/conversation-machine-context";

function getHiddenCreateOrUpdateProjectCalls(aiState: AIState) {
  const hiddenCalls = new Set<string>();
  let seenCreateOrUpdateProject = false;

  for (let i = aiState.length - 1; i >= 0; i--) {
    const message = aiState[i];
    if (
      message.role === "function" &&
      (message.name === "create_project" || message.name === "update_project")
    ) {
      if (seenCreateOrUpdateProject) {
        message.id && hiddenCalls.add(message.id);
      } else {
        seenCreateOrUpdateProject = true;
      }
    }
  }
  return hiddenCalls;
}

export function AppCommandChat() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();
  const conversationActorRef = ConversationMachineContext.useActorRef();
  const batches = ConversationMachineContext.useSelector(
    (state) => state.context.batches
  );
  const seenMessages = ConversationMachineContext.useSelector(
    (state) => state.context.seenMessageIds
  );

  const messagesById = new Map(
    messages.map((message) => [message.id, message])
  );

  const unseenMessages = messages.filter((m) => !seenMessages.includes(m.id));

  console.log(messages);

  console.log(batches);

  return (
    <div>
      <div>
        {batches.map((batch, idx) => {
          if (batch.type === "create_project") {
            return (
              <div
                key={idx}
                className="border border-stone-300 m-4 rounded-md shadow-lg  overflow-hidden"
              >
                <div className="pt-4 pl-4">
                  <span className="rounded-full text-xs bg-black text-white font-bold uppercase py-0.5 px-2">
                    Creating Project
                  </span>
                </div>
                {batch.messageIds.map((messageId) => {
                  const message = messagesById.get(messageId);
                  if (message) {
                    if (
                      batch.hiddenWidgetMessageIds.includes(`${message.id}`)
                    ) {
                      return (
                        <div key={message.id} className="p-4 bg-stone-100">
                          <span className="italic text-sm text-stone-700">
                            Obsolete form.
                          </span>
                        </div>
                      );
                    }
                    return <div key={message.id}>{message.display}</div>;
                  }
                })}
              </div>
            );
          } else {
            return (
              <div key={idx}>
                {batch.messageIds.map((messageId) => {
                  const message = messagesById.get(messageId);
                  if (message) {
                    return <div key={message.id}>{message.display}</div>;
                  }
                })}
              </div>
            );
          }
        })}

        {unseenMessages.map((message, idx) => (
          <div className="hidden" key={idx}>
            {message.display}
          </div>
        ))}

        {/*messages.map((message) => {
          if (hiddenCalls.has(`${message.id}`)) {
            return (
              <div key={message.id} className="p-4 bg-stone-100">
                <span className="italic text-sm text-stone-700">
                  Newer version of this form exists.
                </span>
              </div>
            );
          }
          return <div key={message.id}>{message.display}</div>;
        })*/}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const id = Date.now().toString();

          // Add user message to UI state
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id,
              display: <UserMessage>{inputValue}</UserMessage>,
            },
          ]);
          conversationActorRef.send({ type: "message", id });

          // Submit and get response message
          const responseMessage = await submitUserMessage(id, inputValue);
          setMessages((currentMessages) => [
            ...currentMessages,
            responseMessage,
          ]);

          setInputValue("");
        }}
      >
        <Input
          placeholder="Send a message..."
          value={inputValue}
          className="rounded-none border-l-0 border-r-0 border-b-0"
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
        />
      </form>
    </div>
  );
}
