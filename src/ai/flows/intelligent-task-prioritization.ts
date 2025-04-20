'use server';
/**
 * @fileOverview An AI agent that prioritizes tasks for the user.
 *
 * - prioritizeTask - A function that handles the task prioritization process.
 * - PrioritizeTaskInput - The input type for the prioritizeTask function.
 * - PrioritizeTaskOutput - The return type for the prioritizeTask function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {AsanaTask, getAsanaTasks} from '@/services/asana';
import {TodoistTask, getTodoistTasks} from '@/services/todoist';
import {NotionTask, getNotionTasks} from '@/services/notion';

const PrioritizeTaskInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  goal: z.string().describe('The user-defined goal.'),
  energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level of the user.'),
});
export type PrioritizeTaskInput = z.infer<typeof PrioritizeTaskInputSchema>;

const PrioritizeTaskOutputSchema = z.object({
  taskId: z.string().describe('The ID of the suggested task.'),
  taskName: z.string().describe('The name of the suggested task.'),
  justification: z.string().describe('The justification for the task suggestion.'),
});
export type PrioritizeTaskOutput = z.infer<typeof PrioritizeTaskOutputSchema>;

export async function prioritizeTask(input: PrioritizeTaskInput): Promise<PrioritizeTaskOutput> {
  return prioritizeTaskFlow(input);
}

const prioritizeTaskPrompt = ai.definePrompt({
  name: 'prioritizeTaskPrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user.'),
      goal: z.string().describe('The user-defined goal.'),
      asanaTasks: z.array(z.object({
        id: z.string(),
        name: z.string(),
        completed: z.boolean(),
        notes: z.string(),
      })).describe('The list of Asana tasks.'),
      todoistTasks: z.array(z.object({
        id: z.string(),
        content: z.string(),
        completed: z.boolean(),
      })).describe('The list of Todoist tasks.'),
      notionTasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
      })).describe('The list of Notion tasks.'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level of the user.'),
    }),
  },
  output: {
    schema: z.object({
      taskId: z.string().describe('The ID of the suggested task.'),
      taskName: z.string().describe('The name of the suggested task.'),
      justification: z.string().describe('The justification for the task suggestion.'),
    }),
  },
  prompt: `You are an AI assistant helping the user prioritize their tasks for a Pomodoro session.

  The user's goal is: {{{goal}}}
  The user's energy level is: {{{energyLevel}}}

  Here are the user's tasks from Asana:
  {{#if asanaTasks}}
  {{#each asanaTasks}}
  - ID: {{id}}, Name: {{name}}, Completed: {{completed}}, Notes: {{notes}}
  {{/each}}
  {{else}}
  No Asana tasks.
  {{/if}}

  Here are the user's tasks from Todoist:
  {{#if todoistTasks}}
  {{#each todoistTasks}}
  - ID: {{id}}, Content: {{content}}, Completed: {{completed}}
  {{/each}}
  {{else}}
  No Todoist tasks.
  {{/if}}

  Here are the user's tasks from Notion:
  {{#if notionTasks}}
  {{#each notionTasks}}
  - ID: {{id}}, Title: {{title}}, Completed: {{completed}}
  {{/each}}
  {{else}}
  No Notion tasks.
  {{/if}}

  Based on the user's goal, energy level, and tasks, suggest the most optimal task for the next Pomodoro session.
  Provide a brief justification for your suggestion.

  Make sure to return a valid task ID from the tasks provided in the prompt.
  Do not return a task id which is completed. Pick an uncompleted task.
  `, // Ensure Handlebars syntax is correctly applied
});

const prioritizeTaskFlow = ai.defineFlow<
  typeof PrioritizeTaskInputSchema,
  typeof PrioritizeTaskOutputSchema
>({
  name: 'prioritizeTaskFlow',
  inputSchema: PrioritizeTaskInputSchema,
  outputSchema: PrioritizeTaskOutputSchema,
}, async input => {
  const asanaTasks = await getAsanaTasks(input.userId);
  const todoistTasks = await getTodoistTasks(input.userId);
  const notionTasks = await getNotionTasks(input.userId);

  const {output} = await prioritizeTaskPrompt({
    ...input,
    asanaTasks,
    todoistTasks,
    notionTasks,
  });
  return output!;
});
