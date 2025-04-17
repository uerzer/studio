"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

const defaultWorkDuration = 25;
const defaultBreakDuration = 5;

const taskSchema = z.object({
  name: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

// Custom hook for Text-to-Speech
const useTextToSpeech = () => {
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if responsiveVoice is defined
      if (window.responsiveVoice) {
        setIsSpeechAvailable(true);
      } else {
        // Load responsiveVoice dynamically if it's not already loaded
        const script = document.createElement('script');
        script.src = 'https://code.responsivevoice.org/responsivevoice.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          setIsSpeechAvailable(true);
        };
      }
    }
  }, []);

  const speak = (text: string) => {
    if (isSpeechAvailable) {
      window.responsiveVoice.speak(text);
    } else {
      console.warn("Text-to-speech is not available.");
    }
  };

  return { speak, isSpeechAvailable };
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
  const [showInsights, setShowInsights] = useState(false);
  const { toast } = useToast();
    const { speak } = useTextToSpeech(); // Use the text-to-speech hook

  const userId = "user-001"; // Replace with actual user ID

  // React Hook Form setup
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Voice dictation states
  const [isDictatingName, setIsDictatingName] = useState(false);
  const [isDictatingDescription, setIsDictatingDescription] = useState(false);

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

  const addTask = (values: z.infer<typeof taskSchema>) => {
      const newTask: Task = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description || "",
        completed: false,
      };
      setTasks([...tasks, newTask]);
      form.reset();
  };

  const editTask = (id: string, newName: string, newDescription: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, name: newName, description: newDescription } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
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

  // Speech Recognition hook
  const useSpeechRecognition = (setValue: (value: string) => void, isDictating: boolean) => {
    useEffect(() => {
      if (!('webkitSpeechRecognition' in window)) {
        console.log('Speech Recognition Not Available');
        return;
      }

      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setValue(transcript);
      };

      if (isDictating) {
        recognition.start();
      } else {
        recognition.stop();
      }

      return () => {
        recognition.stop();
      };
    }, [isDictating, setValue]);
  };

  // Use the hook for the task name field
  useSpeechRecognition((value) => {
    form.setValue("name", value);
  }, isDictatingName);

  // Use the hook for the task description field
  useSpeechRecognition((value) => {
    form.setValue("description", value);
  }, isDictatingDescription);

  return (
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
          <div>
            <Label htmlFor="goal">Goal</Label>
            <Input
              type="text"
              id="goal"
              placeholder="Enter your current goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
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

      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>Manage your tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addTask)} className="flex flex-col space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>
                    <div className="flex rounded-md shadow-sm">
                      <FormControl>
                        <Input placeholder="New task name" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDictatingName(!isDictatingName)}
                      >
                        {isDictatingName ? <Icons.pause /> : <Icons.mic />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description</FormLabel>
                    <div className="flex rounded-md shadow-sm">
                      <FormControl>
                        <Textarea placeholder="New task description" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDictatingDescription(!isDictatingDescription)}
                      >
                        {isDictatingDescription ? <Icons.pause /> : <Icons.mic />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Task</Button>
            </form>
          </Form>
          <ul className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task.id)}
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={`task-${task.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {task.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newName = prompt("Enter new task name", task.name);
                      const newDescription = prompt("Enter new task description", task.description);
                      if (newName && newDescription) {
                        editTask(task.id, newName, newDescription);
                      }
                    }}
                  >
                    <Icons.edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                    <Icons.trash className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setCurrentTask(task);
                    setTimeRemaining(workDuration * 60);
                  }}>
                    <Icons.arrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4 mt-4">
        <Button onClick={getFocusSuggestion}>Get Focus Suggestion</Button>
      </div>
    </div>
  );
}
