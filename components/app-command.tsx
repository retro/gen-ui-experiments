"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import { useActions, useUIState } from "ai/rsc";

import { AI } from "@/app/action";
import { AppCommandChat } from "./app-command-chat";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { CreateProjectForm } from "./create-project-form";
import { UserMessage } from "./chat-messages";
import { useReducer } from "react";
import { useRouter } from "next/navigation";

type ReducerState =
  | {
      state: "idle";
      selected: string;
      value: string;
    }
  | { state: "creatingProject" }
  | { state: "openingProject"; selected: string; value: string }
  | { state: "chat" };

type ReducerAction =
  | { type: "createProject" }
  | { type: "openProject" }
  | { type: "cancel" }
  | { type: "selectedChange"; selected: string }
  | { type: "valueChange"; value: string }
  | { type: "chatStarted" };

function reducer(reducerState: ReducerState, action: ReducerAction) {
  switch (reducerState.state) {
    case "idle":
      if (action.type === "createProject") {
        return { state: "creatingProject" } as const;
      } else if (action.type === "selectedChange") {
        return { ...reducerState, selected: action.selected } as const;
      } else if (action.type === "valueChange") {
        return { ...reducerState, value: action.value } as const;
      } else if (action.type === "cancel") {
        return { state: "idle", value: "", selected: "" } as const;
      } else if (action.type === "openProject") {
        return { state: "openingProject", value: "", selected: "" } as const;
      } else if (action.type === "chatStarted") {
        return { state: "chat", value: "", selected: "" } as const;
      }
      break;
    case "openingProject":
      if (action.type === "selectedChange") {
        return { ...reducerState, selected: action.selected } as const;
      } else if (action.type === "valueChange") {
        return { ...reducerState, value: action.value } as const;
      } else if (action.type === "cancel" && reducerState.value !== "") {
        return { ...reducerState, value: "", selected: "" } as const;
      } else if (action.type === "cancel") {
        return { state: "idle", value: "", selected: "" } as const;
      }
      break;
    case "creatingProject":
      if (action.type === "cancel") {
        return { state: "idle", value: "", selected: "" } as const;
      }
      break;
  }
  return reducerState;
}

export function AppCommand({
  projects,
}: {
  projects: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    state: "idle",
    value: "",
    selected: "",
  });
  const [, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();

  const canStartChat = state.state === "idle" && state.selected === "";

  const startChat = async () => {
    if (canStartChat) {
      setMessages((currentMessages) => [
        {
          id: Date.now(),
          display: <UserMessage>{state.value}</UserMessage>,
        },
      ]);

      const responseMessage = await submitUserMessage(state.value);

      setMessages((currentMessages) => [...currentMessages, responseMessage]);

      dispatch({ type: "chatStarted" });
    }
  };

  if (state.state === "creatingProject") {
    return (
      <div className="p-2 flex gap-2 flex-col">
        <Button
          variant="outline"
          size="icon"
          onClick={() => dispatch({ type: "cancel" })}
        >
          <ArrowLeftIcon />
        </Button>
        <CreateProjectForm onCancel={() => dispatch({ type: "cancel" })} />
      </div>
    );
  } else if (state.state === "chat") {
    return <AppCommandChat />;
  }

  return (
    <Command
      onValueChange={(selected) => {
        dispatch({ type: "selectedChange", selected });
      }}
      value={state.selected ?? ""}
      loop={true}
    >
      <CommandInput
        placeholder="Type a command or start a chat..."
        autoFocus
        value={state.value}
        onValueChange={(value) => {
          dispatch({ type: "valueChange", value });
        }}
        onKeyDown={async (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            dispatch({ type: "cancel" });
          } else if (e.key === "Enter" && canStartChat) {
            e.preventDefault();

            await startChat();
          }
        }}
      />
      {state.state === "idle" ? (
        <CommandList>
          <CommandEmpty>
            <Button onClick={startChat}>Start Chat</Button>
          </CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={(e) => dispatch({ type: "createProject" })}>
              Create Project
            </CommandItem>
            <CommandItem onSelect={() => dispatch({ type: "openProject" })}>
              Open Project
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      ) : (
        <CommandList>
          <CommandEmpty>No Projects found.</CommandEmpty>
          <CommandGroup heading="Projects">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => router.push(`/projects/${project.id}`)}
              >
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      )}
    </Command>
  );
}
