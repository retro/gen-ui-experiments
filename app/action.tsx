"use server";

import * as Schemas from "@/schemas";

import { createAI, getMutableAIState, render } from "ai/rsc";

import { AssistantMessage } from "@/components/chat-messages";
import { CreateProjectExtendedForm } from "@/components/create-project-extended-form";
import { OpenAI } from "openai";
import exp from "constants";
import { parseWithZod } from "@conform-to/zod";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createProject(prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, { schema: Schemas.CreateProject });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const project = await prisma.project.create({ data: submission.value });

  return redirect(`/projects/${project.id}`);
}

function getUpdateProjectDescription(
  lastCreateOrUpdateProjectCall: string | null
) {
  return `\
Display updated project properties.

Properties:

\`\`\`
${lastCreateOrUpdateProjectCall}
\`\`\`

## Examples

\`create_project\` was called with:

\`\`\`
{name: "My Project", tasks: ["Task 1", "Task 2"]}
\`\`\`

and user sends the message:

> Rename project to "Our Project"

You should call this tool with:

\`\`\`
{name: "Our Project", tasks: ["Task 1", "Task 2"]}
\`\`\`

---

\`create_project\` was called with:

\`\`\`
{name: "My Project", tasks: ["Task 1", "Task 2"]}
\`\`\`

and user sends the message:

> Add Task 3

You should call this tool with:

\`\`\`
{name: "My Project", tasks: ["Task 1", "Task 2", "Task 3"]}
\`\`\`

---

\`create_project\` was called with:

\`\`\`
{name: "My Project", tasks: ["Task 1", "Task 2"]}
\`\`\`

and user sends the message:

> Remove Task 2

You should call this tool with:

\`\`\`
{name: "My Project", tasks: ["Task 1"]}
\`\`\`
`;
}

/*`\
You are a project manager assistant. Your job is to take user's input and call one of the provided tools with appropriate payload. If there is no tool that matches user's intent answer with:

> I'm sorry Dave, I'm afraid I can't do that.`*/

export async function createProjectExtended(
  prevState: unknown,
  formData: FormData
) {
  const submission = parseWithZod(formData, {
    schema: Schemas.CreateProjectExtended,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const project = await prisma.project.create({
    data: {
      name: submission.value.name,
      tasks: {
        create: submission.value.tasks.map((name) => ({ name })),
      },
    },
  });

  return redirect(`/projects/${project.id}`);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

async function submitUserMessage(userInput: string) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();

  const lastCreateOrUpdateProjectCall = aiState
    .get()
    .reduce<null | string>((acc, message) => {
      if (
        message.role === "function" &&
        (message.name === "create_project" || message.name === "update_project")
      ) {
        return message.content;
      }

      return acc;
    }, null);

  const updateProjectDescription = getUpdateProjectDescription(
    lastCreateOrUpdateProjectCall
  );

  const id = Date.now().toString();

  console.log(aiState.get());

  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content: userInput,
    },
  ]);

  // render() returns a stream of UI components
  const ui = render({
    model: "gpt-4-0125-preview",
    provider: openai,
    messages: [
      {
        role: "system",
        content: `\
You are a project manager assistant. Your job is to take user's input and call one of the provided tools with appropriate payload.`,
      },
      { role: "user", content: userInput },
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call)
    text: ({ content, done }) => {
      // text can be streamed from the LLM, but we only want to close the stream with .done() when its completed.
      // done() marks the state as available for the client to access
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: "assistant",
            content,
            id,
          },
        ]);
      }

      return <AssistantMessage>{content}</AssistantMessage>;
    },
    tools: {
      create_project: {
        description:
          "Display properties of project that is being created. Call this tool if user wants to create a new project.",
        parameters: Schemas.CreateProjectExtended,
        render: async function* (raw) {
          // It seems that the argument passed to `render` function is actually a string although it's typed
          // as whatever the `parameters` return type is. We need to parse it to JSON first.
          const payload = Schemas.CreateProjectExtended.parse(
            JSON.parse(raw as unknown as string)
          );

          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "create_project",
              content: JSON.stringify(payload, null, 2),
              id,
            },
          ]);

          console.log(payload);

          return (
            <CreateProjectExtendedForm
              name={payload.name}
              tasks={payload.tasks}
            />
          );
        },
      },
      update_project: {
        description: updateProjectDescription,
        parameters: Schemas.CreateProjectExtended,
        render: async function* (raw) {
          // It seems that the argument passed to `render` function is actually a string although it's typed
          // as whatever the `parameters` type is. We need to parse it to JSON first.
          const payload = Schemas.CreateProjectExtended.parse(
            JSON.parse(raw as unknown as string)
          );

          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "update_project",
              content: JSON.stringify(payload),
              id,
            },
          ]);

          return (
            <CreateProjectExtendedForm
              name={payload.name}
              tasks={payload.tasks}
            />
          );
        },
      },
    },
  });

  return {
    id,
    display: ui,
  };
}

// Define the initial state of the AI. It can be any JSON object.
const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

export type AIState = typeof initialAIState;

// The initial UI state that the client will keep track of.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState,
  initialAIState,
});
