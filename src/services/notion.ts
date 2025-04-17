/**
 * Represents a Notion task.
 */
export interface NotionTask {
  /**
   * The unique identifier of the page representing the task.
   */
  id: string;
  /**
   * The title of the task.
   */
  title: string;
  /**
   * Whether the task is completed.
   */
  completed: boolean;
}

/**
 * Asynchronously retrieves Notion tasks for a given user.
 *
 * @param userId The ID of the user whose tasks to retrieve.
 * @returns A promise that resolves to an array of NotionTask objects.
 */
export async function getNotionTasks(userId: string): Promise<NotionTask[]> {
  // TODO: Implement this by calling the Notion API.

  return [
    {
      id: 'abcdef',
      title: 'Sample Notion Task',
      completed: false,
    },
  ];
}
