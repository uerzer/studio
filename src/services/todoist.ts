/**
 * Represents a Todoist task.
 */
export interface TodoistTask {
  /**
   * The unique identifier of the task.
   */
  id: string;
  /**
   * The content of the task.
   */
  content: string;
  /**
   * Whether the task is completed.
   */
  completed: boolean;
}

/**
 * Asynchronously retrieves Todoist tasks for a given user.
 *
 * @param userId The ID of the user whose tasks to retrieve.
 * @returns A promise that resolves to an array of TodoistTask objects.
 */
export async function getTodoistTasks(userId: string): Promise<TodoistTask[]> {
  // TODO: Implement this by calling the Todoist API.

  return [
    {
      id: '67890',
      content: 'Sample Todoist Task',
      completed: false,
    },
  ];
}
