import { useAIState, useActions, useUIState } from "ai/rsc";

import { AI, type AIState } from "@/app/action";
import { Input } from "./ui/input";
import { UserMessage } from "./chat-messages";
import { useState } from "react";

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
  const [aiState] = useAIState<typeof AI>();
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();

  const hiddenCalls = getHiddenCreateOrUpdateProjectCalls(aiState);

  console.log(messages);

  return (
    <div>
      <div>
        {messages.map((message) => {
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
        })}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          // Add user message to UI state
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id: Date.now(),
              display: <UserMessage>{inputValue}</UserMessage>,
            },
          ]);

          // Submit and get response message
          const responseMessage = await submitUserMessage(inputValue);
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
