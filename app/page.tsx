import { AppCommand } from "@/components/app-command";
import prisma from "@/lib/prisma";

export default async function Home() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl my-4 border rounded">
      <AppCommand projects={projects} />
    </div>
  );
}
