import { useState } from "react";
import { createTask } from "../api/tasks";
import type { CreateTaskForm, Task } from "../types";
import { getWeekStart } from "../utils";

export const useTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async (
    data: CreateTaskForm
  ): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      // 주간 시작일이 없으면 현재 주로 설정
      const taskData = {
        ...data,
        week_start: data.week_start || getWeekStart(),
      };

      const task = await createTask(taskData);
      return task;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "태스크 생성에 실패했습니다";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTask: handleCreateTask,
    loading,
    error,
  };
};
