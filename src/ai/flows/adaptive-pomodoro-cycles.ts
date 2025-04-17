'use server';
/**
 * @fileOverview An AI agent that suggests dynamic Pomodoro work/break cycles based on user energy level and task type.
 *
 * - suggestAdaptivePomodoroCycle - A function that handles the suggestion of adaptive Pomodoro cycles.
 * - AdaptivePomodoroCycleInput - The input type for the suggestAdaptivePomodoroCycle function.
 * - AdaptivePomodoroCycleOutput - The return type for the suggestAdaptivePomodoroCycle function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AdaptivePomodoroCycleInputSchema = z.object({
  energyLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The user reported energy level.'),
  taskType: z.string().describe('The type of task the user is working on.'),
  historicalData: z
    .string()
    .optional()
    .describe('Historical data on user focus patterns.'),
});
export type AdaptivePomodoroCycleInput = z.infer<
  typeof AdaptivePomodoroCycleInputSchema
>;

const AdaptivePomodoroCycleOutputSchema = z.object({
  suggestedWorkDuration: z
    .number()
    .describe('Suggested work duration in minutes.'),
  suggestedBreakDuration: z
    .number()
    .describe('Suggested break duration in minutes.'),
  justification: z.string().describe('Justification for the suggestion.'),
});
export type AdaptivePomodoroCycleOutput = z.infer<
  typeof AdaptivePomodoroCycleOutputSchema
>;

export async function suggestAdaptivePomodoroCycle(
  input: AdaptivePomodoroCycleInput
): Promise<AdaptivePomodoroCycleOutput> {
  return adaptivePomodoroCycleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptivePomodoroCyclePrompt',
  input: {
    schema: z.object({
      energyLevel: z
        .enum(['Low', 'Medium', 'High'])
        .describe('The user reported energy level.'),
      taskType: z.string().describe('The type of task the user is working on.'),
      historicalData: z
        .string()
        .optional()
        .describe('Historical data on user focus patterns.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedWorkDuration: z
        .number()
        .describe('Suggested work duration in minutes.'),
      suggestedBreakDuration: z
        .number()
        .describe('Suggested break duration in minutes.'),
      justification: z.string().describe('Justification for the suggestion.'),
    }),
  },
  prompt: `You are an AI assistant that suggests Pomodoro work/break cycles based on user energy level and task type.

Given the following information, suggest a work duration and a break duration in minutes.

Energy Level: {{{energyLevel}}}
Task Type: {{{taskType}}}
Historical Data: {{{historicalData}}}

Provide a brief justification for your suggestion.

Output the work duration, break duration, and justification in JSON format.`,
});

const adaptivePomodoroCycleFlow = ai.defineFlow<
  typeof AdaptivePomodoroCycleInputSchema,
  typeof AdaptivePomodoroCycleOutputSchema
>(
  {
    name: 'adaptivePomodoroCycleFlow',
    inputSchema: AdaptivePomodoroCycleInputSchema,
    outputSchema: AdaptivePomodoroCycleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

