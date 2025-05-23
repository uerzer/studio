"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { getFocusCompanionSuggestion, FocusCompanionOutput } from "@/ai/flows/focus-ai-companion-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import { prioritizeTask, PrioritizeTaskOutput } from "@/ai/flows/intelligent-task-prioritization";
import { Play } from "lucide-react"; // Import the Play icon
import VoiceDictation from "@/components/VoiceDictation"; // Import the VoiceDictation component
interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}
const defaultWorkDuration = 25;
const defaultBreakDuration = 5;

const goalSchema = z.object({
  goal: z.string().min(2, {
    message: "Goal must be at least 2 characters.",
  }),
});

const useTextToSpeech = () => {
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSpeechReady(true);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
      setIsSpeechReady(false);
    }
  }, []);

  const speak = (text: string, voiceName?: string) => {
    if (isSpeechReady) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech is not available.");
    }
  };

  return { speak };
};

export default function Home() {
  const [workDuration, setWorkDuration] = useState(defaultWorkDuration);
  const [breakDuration, setBreakDuration] = useState(defaultBreakDuration);
  const [isWorking, setIsWorking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goal, setGoal] = useState("");
  const [energyLevel, setEnergyLevel] = useState<"Low" | "Medium" | "High">("Medium");
  const [focusSuggestion, setFocusSuggestion] = useState<FocusCompanionOutput | null>(null);
  const { toast } = useToast();
  const { speak } = useTextToSpeech(); // Use the text-to-speech hook
  const [aiTaskSuggestion, setAiTaskSuggestion] = useState<PrioritizeTaskOutput | null>(null);

  const userId = "user-001"; // Replace with actual user ID

  // React Hook Form setup
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal: "",
    },
  });

  useEffect(() => {
    if (goal) {
      getAiTaskSuggestion();
    }
  }, [goal, energyLevel]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWorking && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      clearInterval(interval);
      handleTimerEnd();
    }

    return () => clearInterval(interval);
  }, [isWorking, timeRemaining]);

  const handleTimerEnd = () => {
    // Display a toast notification
    const message = isWorking ? "Work session complete! Time for a break." : "Break time's over! Get back to work!";
    toast({
      title: isWorking ? "Work session complete!" : "Break time's over!",
      description: isWorking ? "Time for a break." : "Get back to work!",
    });

    speak(message); // Speak the notification message

    setIsWorking(!isWorking);
    setTimeRemaining((isWorking ? breakDuration : workDuration) * 60);
  };

  const toggleTimer = () => {
    setIsWorking(!isWorking);
  };

  const resetTimer = () => {
    setIsWorking(false);
    setTimeRemaining(workDuration * 60);
  };

  const secondsToMinutesAndSeconds = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const getFocusSuggestion = useCallback(async () => {
    try {
      const suggestion = await getFocusCompanionSuggestion({
        userId: userId,
        goal: goal,
        energyLevel: energyLevel,
        currentTaskName: currentTask?.name || "No task selected",
        timeRemaining: timeRemaining,
      });
      setFocusSuggestion(suggestion);
        if (suggestion?.suggestion) {
          speak(`Focus Suggestion: ${suggestion.suggestion}`); // Speak the focus suggestion
        }
    } catch (error: any) {
      toast({
        title: "Failed to get focus suggestion",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId, goal, energyLevel, currentTask, timeRemaining, toast, speak]);

    const getAiTaskSuggestion = useCallback(async () => {
      if (!goal) {
        return; // Don't fetch suggestion if goal is empty
      }
      try {
        const suggestion = await prioritizeTask({
          userId: userId,
          goal: goal,
          energyLevel: energyLevel,
        });
        setAiTaskSuggestion(suggestion);
        if (suggestion?.taskName && suggestion?.justification) {
          speak(`AI Task Suggestion: ${suggestion.taskName}. Justification: ${suggestion.justification}`);
        }
      } catch (error: any) {
        toast({
          title: "Failed to get AI task suggestion",
          description: error.message,
          variant: "destructive",
        });
      }
    }, [userId, goal, energyLevel, toast, speak]);

  const handleSelectTask = (task: Task) => {
      setCurrentTask(task);
      setTimeRemaining(workDuration * 60);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>FocusFriend AI</CardTitle>
            <CardDescription>
              {isWorking ? "Work Session" : "Break Time"} - {secondsToMinutesAndSeconds(timeRemaining)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            {currentTask && <p>Current Task: {currentTask.name}</p>}
            <div className="flex items-center space-x-2">
              <Label htmlFor="work-duration">Work Duration ({workDuration} min)</Label>
              <Slider
                id="work-duration"
                defaultValue={[workDuration]}
                max={60}
                min={1}
                step={1}
                onValueChange={(value) => setWorkDuration(value[0])}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="break-duration">Break Duration ({breakDuration} min)</Label>
              <Slider
                id="break-duration"
                defaultValue={[breakDuration]}
                max={30}
                min={1}
                step={1}
                onValueChange={(value) => setBreakDuration(value[0])}
              />
            </div>
            <div>
              <Label htmlFor="energy-level">Energy Level</Label>
              <Select value={energyLevel} onValueChange={(value) => setEnergyLevel(value as "Low" | "Medium" | "High")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select energy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Energy Levels</SelectLabel>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((values) => setGoal(values.goal))} className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal</FormLabel>
                      <FormControl>
                        <div >
                          <Input
                            placeholder="What do you want to achieve?"
                            {...field}
                          />
                          <VoiceDictation
                            onResult={(text) => field.onChange(text)}
                            className="absolute right-2 top-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Set Goal</Button>
              </form>
            </Form>
            {aiTaskSuggestion && (
              <div className="border rounded p-2">
                <p>AI Task Suggestion: {aiTaskSuggestion.taskName}</p>
                <p>Justification: {aiTaskSuggestion.justification}</p>
                <Button onClick={() => {
                  const task = {
                    id: aiTaskSuggestion.taskId,
                    name: aiTaskSuggestion.taskName,
                    description: aiTaskSuggestion.justification,
                    completed: false,
                  };
                  handleSelectTask(task);
                }}>Select Task</Button>
              </div>
            )}
            {focusSuggestion && (
              <div className="border rounded p-2">
                <p>Focus Suggestion: {focusSuggestion.suggestion}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={toggleTimer}>{isWorking ? "Pause" : "Start"}</Button>
            <Button variant="secondary" onClick={resetTimer}>Reset</Button>
          </CardFooter>
        </Card>

        <div className="flex justify-center space-x-4 mt-4">
          <Button onClick={getFocusSuggestion}>Get Focus Suggestion</Button>
        </div>
      </div>
    </>
  );
}

