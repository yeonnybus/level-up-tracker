import { useCallback, useEffect, useState } from "react";
import { calculateTaskProgress } from "../api/tasks";
import type { TaskProgress } from "../types";

export const useTaskProgress = (taskId: string) => {
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const progressData = await calculateTaskProgress(taskId);
      setProgress(progressData);
    } catch (error) {
      console.error("진행률 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const refreshProgress = () => {
    loadProgress();
  };

  return {
    progress,
    loading,
    refreshProgress,
    totalTimeMinutes: progress?.total_time_minutes || 0,
    totalQuantityCompleted: progress?.total_quantity_completed || 0,
    progressPercentage: progress?.progress_percentage || 0,
    isCompleted: progress?.is_completed || false,
  };
};
