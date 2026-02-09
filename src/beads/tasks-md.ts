export type TaskSummary = {
  id: string;
  title: string;
  status: string;
};

export function renderTasksMarkdown(tasks: TaskSummary[]): string {
  const lines = ['# Tasks', '', '| ID | Title | Status |', '| --- | --- | --- |'];
  for (const task of tasks) {
    lines.push(`| ${task.id} | ${task.title} | ${task.status} |`);
  }
  return lines.join('\n');
}
