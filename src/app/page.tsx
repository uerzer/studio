"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { prioritizeTask, PrioritizeTaskOutput } from "@/ai/flows/intelligent-task-prioritization";
import { suggestAdaptivePomodoroCycle, AdaptivePomodoroCycleOutput } from "@/ai/flows/adaptive-pomodoro-cycles";
import { analyzeFocusAndProvideInsights } from "@/ai/flows/focus-analysis-optimization-insights";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

const defaultWorkDuration = 25;
const defaultBreakDuration = 5;

export default function Home() {
  const [workDuration, setWorkDuration] = useState(defaultWorkDuration);
  const [breakDuration, setBreakDuration] = useState(defaultBreakDuration);
  const [isWorking, setIsWorking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [goal, setGoal] = useState("");
  const [energyLevel, setEnergyLevel] = useState<"Low" | "Medium" | "High">("Medium");
  const [suggestedTask, setSuggestedTask] = useState<PrioritizeTaskOutput | null>(null);
  const [suggestedCycle, setSuggestedCycle] = useState<AdaptivePomodoroCycleOutput | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const { toast } = useToast();

  const userId = "user-001"; // Replace with actual user ID

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
    toast({
      title: isWorking ? "Work session complete!" : "Break time's over!",
      description: isWorking ? "Time for a break." : "Get back to work!",
    });

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

  const addTask = () => {
    if (newTaskName.trim() !== "") {
      const newTask: Task = {
        id: Date.now().toString(),
        name: newTaskName,
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskName("");
    }
  };

  const editTask = (id: string, newName: string) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, name: newName } : task))
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

  const suggestTask = useCallback(async () => {
    try {
      const taskSuggestion = await prioritizeTask({
        userId: userId,
        goal: goal,
        energyLevel: energyLevel,
      });
      setSuggestedTask(taskSuggestion);
    } catch (error: any) {
      toast({
        title: "Failed to suggest task",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId, goal, energyLevel, toast]);

  const suggestCycle = useCallback(async () => {
    try {
      const cycleSuggestion = await suggestAdaptivePomodoroCycle({
        energyLevel: energyLevel,
        taskType: currentTask?.name || "General Task",
        historicalData: "", // Implement fetching historical data
      });
      setSuggestedCycle(cycleSuggestion);
      setWorkDuration(cycleSuggestion.suggestedWorkDuration);
      setBreakDuration(cycleSuggestion.suggestedBreakDuration);
      setTimeRemaining(cycleSuggestion.suggestedWorkDuration * 60);
    } catch (error: any) {
      toast({
        title: "Failed to suggest cycle",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [energyLevel, currentTask, toast]);

  const getInsights = useCallback(async () => {
    try {
      // Call the analyzeFocusAndProvideInsights function
      const insights = await analyzeFocusAndProvideInsights({ userId: userId });
      // Display the insights in a toast notification
      toast({
        title: "Focus Insights",
        description: (
          <>
            <p>Peak Productivity Times: {insights.peakProductivityTimes}</p>
            <p>Recommendations: {insights.recommendations}</p>
          </>
        ),
      });
    } catch (error: any) {
      // Handle any errors that occur during the process
      toast({
        title: "Failed to retrieve insights",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId, toast]);

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
            <select
              id="energy-level"
              className="w-full p-2 border rounded"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value as "Low" | "Medium" | "High")}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
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
          {suggestedTask && (
            <div className="border rounded p-2">
              <p>Suggested Task: {suggestedTask.taskName}</p>
              <p>Justification: {suggestedTask.justification}</p>
            </div>
          )}
          {suggestedCycle && (
            <div className="border rounded p-2">
              <p>Suggested Work Duration: {suggestedCycle.suggestedWorkDuration}</p>
              <p>Suggested Break Duration: {suggestedCycle.suggestedBreakDuration}</p>
              <p>Justification: {suggestedCycle.justification}</p>
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
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="New task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            <Button onClick={addTask}>Add Task</Button>
          </div>
          <ul className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task.id)}
                  />
                  <Label htmlFor={`task-${task.id}`}>{task.name}</Label>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newName = prompt("Enter new task name", task.name);
                      if (newName) {
                        editTask(task.id, newName);
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
        <Button onClick={suggestTask}>Suggest Task</Button>
        <Button onClick={suggestCycle}>Suggest Cycle</Button>
        <Button onClick={getInsights}>Get Insights</Button>
      </div>
    </div>
  );
}
