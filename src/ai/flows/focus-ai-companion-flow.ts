'use server';
/**
 * @fileOverview An AI agent that acts as a focus companion, providing personalized assistance and accountability during Pomodoro sessions.
 *
 * - getFocusCompanionSuggestion - A function that returns suggestions to the user.
 * - FocusCompanionInput - The input type for the getFocusCompanionSuggestion function.
 * - FocusCompanionOutput - The return type for the getFocusCompanionSuggestion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {AsanaTask, getAsanaTasks} from '@/services/asana';
import {TodoistTask, getTodoistTasks} from '@/services/todoist';
import {NotionTask, getNotionTasks} from '@/services/notion';

const FocusCompanionInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  goal: z.string().describe('The user-defined goal.'),
  energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level of the user.'),
  currentTaskName: z.string().describe('The name of the current task the user is working on.'),
  timeRemaining: z.number().describe('The time remaining in the current Pomodoro session, in seconds.'),
});
export type FocusCompanionInput = z.infer<typeof FocusCompanionInputSchema>;

const FocusCompanionOutputSchema = z.object({
  suggestion: z.string().describe('The AI companion suggestion for the user.'),
});
export type FocusCompanionOutput = z.infer<typeof FocusCompanionOutputSchema>;

export async function getFocusCompanionSuggestion(input: FocusCompanionInput): Promise<FocusCompanionOutput> {
  return focusCompanionFlow(input);
}

const focusCompanionPrompt = ai.definePrompt({
  name: 'focusCompanionPrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user.'),
      goal: z.string().describe('The user-defined goal.'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level of the user.'),
      currentTaskName: z.string().describe('The name of the current task the user is working on.'),
      timeRemaining: z.number().describe('The time remaining in the current Pomodoro session, in seconds.'),
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
    }),
  },
  output: {
    schema: z.object({
      suggestion: z.string().describe('The AI companion suggestion for the user.'),
    }),
  },
  prompt: `You are an AI focus companion, designed to help users stay on track during their Pomodoro sessions. Your role is to provide encouragement, reminders, and helpful suggestions to maintain focus and productivity.

  The user's goal is: {{{goal}}}
  The user's energy level is: {{{energyLevel}}}
  The user is currently working on: {{{currentTaskName}}}
  Time remaining in the session: {{{timeRemaining}}} seconds

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


  Based on the user's current state, provide a single, concise suggestion to help them stay focused and productive. This could be a reminder of their goal, a suggestion to take a break soon, or a question to prompt reflection. Keep your suggestions short and actionable.
  `,
});

const focusCompanionFlow = ai.defineFlow<
  typeof FocusCompanionInputSchema,
  typeof FocusCompanionOutputSchema
>({
  name: 'focusCompanionFlow',
  inputSchema: FocusCompanionInputSchema,
  outputSchema: FocusCompanionOutputSchema,
}, async input => {
  const asanaTasks = await getAsanaTasks(input.userId);
  const todoistTasks = await getTodoistTasks(input.userId);
  const notionTasks = await getNotionTasks(input.userId);

  const {output} = await focusCompanionPrompt({
    ...input,
    asanaTasks,
    todoistTasks,
    notionTasks,
  });
  return output!;
});
