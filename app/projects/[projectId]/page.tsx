import { Button } from "@/components/ui/button";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function ProjectById({
  params,
}: {
  params: { projectId: string };
}) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: Number(params.projectId) },
    include: {
      tasks: true,
    },
  });

  return (
    <div className="container max-w-5xl my-8">
      <Button variant="outline" asChild>
        <Link href="/">Back</Link>
      </Button>
      <hr className="my-4" />
      {project.name}
      <hr className="my-4" />
      <ul>
        {project.tasks.map((task) => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
    </div>
  );
}
