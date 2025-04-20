/**
 * Represents an Asana task.
 */
export interface AsanaTask {
  /**
   * The unique identifier of the task.
   */
  id: string;
  /**
   * The name of the task.
   */
  name: string;
  /**
   * Whether the task is completed.
   */
  completed: boolean;
  /**
   * Notes associated with the task.
   */
  notes: string;
}

/**
 * Asynchronously retrieves Asana tasks for a given user.
 *
 * @param userId The ID of the user whose tasks to retrieve.
 * @returns A promise that resolves to an array of AsanaTask objects.
 */
export async function getAsanaTasks(userId: string): Promise<AsanaTask[]> {
  // TODO: Implement this by calling the Asana API.
  // Returning an empty array for now.

  return [];
}

