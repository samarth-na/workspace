import { TasksView } from "@/components/views/tasks-view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    draft?: string;
    description?: string;
    task?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <TasksView
      initialTitle={params.draft}
      initialDescription={params.description}
      initialTaskId={params.task}
    />
  );
}
