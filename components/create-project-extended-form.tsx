"use client";

import * as Schemas from "@/schemas";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createProjectExtended } from "@/app/action";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { useFormState } from "react-dom";

export function CreateProjectExtendedForm(props: {
  name: string;
  tasks?: string[];
}) {
  console.log(props);
  const [lastResult, action] = useFormState(createProjectExtended, undefined);
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,
    defaultValue: {
      name: props.name,
      tasks: props.tasks,
    },

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: Schemas.CreateProjectExtended });
    },

    // Validate the form on blur event triggered
    shouldValidate: "onBlur",
  });

  const tasks = fields.tasks.getFieldList();

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      action={action}
      noValidate
      className="p-4 bg-stone-100 flex flex-col gap-3 border-t border-b"
    >
      <div>
        Project Name
        <Input
          name={fields.name.name}
          defaultValue={fields.name.value}
          autoFocus
          placeholder="Enter project name"
          className="bg-white"
        />
        <div className="text-xs text-red-500 px-3 pt-1">
          {fields.name.errors}
        </div>
      </div>
      {tasks.length ? (
        <div className="pl-4">
          <div>Tasks:</div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <div key={task.key}>
                <Input
                  name={task.name}
                  defaultValue={task.value}
                  className="bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <Button variant="default">Create Project</Button>
      </div>
    </form>
  );
}
