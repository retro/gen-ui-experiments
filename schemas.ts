import { z } from "zod";

export const CreateProject = z.object({
  name: z.string(),
});

export type CreateProject = z.infer<typeof CreateProject>;

export const CreateProjectExtended = z
  .object({
    name: z.string().min(1),
    tasks: z.array(z.string().min(1)).optional(),
  })
  .required();

export type CreateProjectExtended = z.infer<typeof CreateProjectExtended>;
