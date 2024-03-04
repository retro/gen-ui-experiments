"use client";

import * as Schemas from "@/schemas";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createProject } from "@/app/action";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { useFormState } from "react-dom";

export function CreateProjectForm({ onCancel }: { onCancel: () => void }) {
  const [lastResult, action] = useFormState(createProject, undefined);
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: Schemas.CreateProject });
    },

    // Validate the form on blur event triggered
    shouldValidate: "onBlur",
  });

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      action={action}
      noValidate
      className="flex gap-2"
    >
      <div className="flex-grow">
        <Input
          name={fields.name.name}
          autoFocus
          placeholder="Enter project name"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <div className="text-xs text-red-500 px-3 pt-1">
          {fields.name.errors}
        </div>
      </div>

      <Button variant="default">Create Project</Button>
    </form>
  );
}
