'use server';
/**
 * @fileOverview Analyzes user's Pomodoro completion rates and task data to identify peak productivity times and provide personalized insights.
 *
 * - analyzeFocusAndProvideInsights - A function that analyzes focus and provides insights.
 * - FocusAnalysisInput - The input type for the analyzeFocusAndProvideInsights function.
 * - FocusAnalysisOutput - The return type for the analyzeFocusAndProvideInsights function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const FocusAnalysisInputSchema = z.object({
  userId: z.string().describe('The ID of the user to analyze.'),
});
export type FocusAnalysisInput = z.infer<typeof FocusAnalysisInputSchema>;

const FocusAnalysisOutputSchema = z.object({
  peakProductivityTimes: z.string().describe('The peak productivity times for the user.'),
  recommendations: z.string().describe('Personalized recommendations for the user to optimize their work habits.'),
});
export type FocusAnalysisOutput = z.infer<typeof FocusAnalysisOutputSchema>;

export async function analyzeFocusAndProvideInsights(input: FocusAnalysisInput): Promise<FocusAnalysisOutput> {
  return focusAnalysisOptimizationInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'focusAnalysisOptimizationInsightsPrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user to analyze.'),
    }),
  },
  output: {
    schema: z.object({
      peakProductivityTimes: z.string().describe('The peak productivity times for the user.'),
      recommendations: z.string().describe('Personalized recommendations for the user to optimize their work habits.'),
    }),
  },
  prompt: `You are an AI assistant that analyzes user data to identify peak productivity times and provide personalized recommendations.

Analyze the Pomodoro completion rates and task data for user ID {{{userId}}}. Identify peak productivity times and correlations between task types, time of day, and cycle lengths.

Provide personalized insights and recommendations in the following format:

Peak Productivity Times: [Peak productivity times for the user]
Recommendations: [Personalized recommendations for the user to optimize their work habits]`,
});

const focusAnalysisOptimizationInsightsFlow = ai.defineFlow<
  typeof FocusAnalysisInputSchema,
  typeof FocusAnalysisOutputSchema
>(
  {
    name: 'focusAnalysisOptimizationInsightsFlow',
    inputSchema: FocusAnalysisInputSchema,
    outputSchema: FocusAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
