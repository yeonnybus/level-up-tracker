import { format, startOfWeek } from "date-fns";
import { supabase } from "../lib/supabase";
import type {
  CreateTaskForm,
  Task,
  TaskProgress,
  TaskWithLogs,
  UpdateTaskForm,
} from "../types";

// 주간 시작일 계산 (월요일)
export const getWeekStart = (date: Date = new Date()): string => {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
};

// 태스크 생성
export const createTask = async (data: CreateTaskForm): Promise<Task> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const taskData = {
    ...data,
    user_id: user.user.id,
    week_start: data.week_start || getWeekStart(),
  };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()
    .single();

  if (error) throw error;
  return task;
};

// 태스크 목록 조회 (주간 기준)
export const getTasks = async (weekStart?: string): Promise<Task[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const targetWeek = weekStart || getWeekStart();

  console.log("getTasks 디버깅:", {
    userId: user.user.id,
    targetWeek,
    weekStart,
  });

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("week_start", targetWeek)
    .order("created_at", { ascending: false });

  console.log("getTasks 결과:", { tasks, error });

  if (error) throw error;
  return tasks || [];
};

// 모든 태스크 조회 (주간 필터링 없음) - 디버깅용
export const getAllTasksForUser = async (): Promise<Task[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  console.log("getAllTasksForUser 디버깅:", {
    userId: user.user.id,
  });

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });

  console.log("getAllTasksForUser 결과:", { tasks, error });

  if (error) throw error;
  return tasks || [];
};

// 태스크 상세 조회 (로그 포함)
export const getTaskWithLogs = async (
  taskId: string
): Promise<TaskWithLogs> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.user.id)
    .single();

  if (taskError) throw taskError;

  const { data: timeLogs, error: timeError } = await supabase
    .from("task_time_logs")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .order("start_time", { ascending: false });

  if (timeError) throw timeError;

  const { data: quantityLogs, error: quantityError } = await supabase
    .from("task_quantity_logs")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });

  if (quantityError) throw quantityError;

  return {
    ...task,
    time_logs: timeLogs || [],
    quantity_logs: quantityLogs || [],
  };
};

// 태스크 업데이트
export const updateTask = async (
  taskId: string,
  data: UpdateTaskForm
): Promise<Task> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: task, error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId)
    .eq("user_id", user.user.id)
    .select()
    .single();

  if (error) throw error;
  return task;
};

// 태스크 삭제
export const deleteTask = async (taskId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.user.id);

  if (error) throw error;
};

// 태스크 진행률 계산
export const calculateTaskProgress = async (
  taskId: string
): Promise<TaskProgress> => {
  const task = await getTaskWithLogs(taskId);

  const totalTimeMinutes = task.time_logs.reduce((sum, log) => {
    // duration_seconds가 있으면 초를 분으로 변환, 없으면 기존 duration_minutes 사용
    const seconds = log.duration_seconds;
    const minutes = log.duration_minutes;
    return (
      sum + (seconds ? Math.round((seconds / 60) * 100) / 100 : minutes || 0)
    );
  }, 0);

  const totalQuantityCompleted = task.quantity_logs.reduce(
    (sum, log) => sum + log.completed_count,
    0
  );

  let progressPercentage = 0;

  if (task.task_type === "time" && task.target_time_hours) {
    progressPercentage = Math.min(
      (totalTimeMinutes / (task.target_time_hours * 60)) * 100,
      100
    );
  } else if (task.task_type === "quantity" && task.target_quantity) {
    progressPercentage = Math.min(
      (totalQuantityCompleted / task.target_quantity) * 100,
      100
    );
  } else if (task.task_type === "time_and_quantity") {
    const timeProgress = task.target_time_hours
      ? (totalTimeMinutes / (task.target_time_hours * 60)) * 100
      : 0;
    const quantityProgress = task.target_quantity
      ? (totalQuantityCompleted / task.target_quantity) * 100
      : 0;
    progressPercentage = Math.min((timeProgress + quantityProgress) / 2, 100);
  }

  const isCompleted = progressPercentage >= 100;

  return {
    task_id: taskId,
    total_time_minutes: totalTimeMinutes,
    total_quantity_completed: totalQuantityCompleted,
    progress_percentage: progressPercentage,
    is_completed: isCompleted,
  };
};

// 사용자의 모든 태스크 진행률 조회
export const getAllTasksProgress = async (
  weekStart?: string
): Promise<TaskProgress[]> => {
  const tasks = await getTasks(weekStart);

  const progressPromises = tasks.map((task) => calculateTaskProgress(task.id));

  return Promise.all(progressPromises);
};

// 대시보드 통계 데이터 조회
export const getDashboardStats = async (weekStart?: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const targetWeek = weekStart || getWeekStart();

  // 이번 주 태스크 목록 가져오기
  const tasks = await getTasks(targetWeek);
  const tasksProgress = await getAllTasksProgress(targetWeek);

  // 완료된 태스크 수
  const completedTasks = tasksProgress.filter((p) => p.is_completed).length;

  // 총 시간 계산 (분 단위를 시간으로 변환)
  const totalMinutes = tasksProgress.reduce(
    (sum, p) => sum + p.total_time_minutes,
    0
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // 소수점 첫째자리까지

  // 전체 진행률 계산
  const avgProgress =
    tasks.length > 0
      ? Math.round(
          tasksProgress.reduce((sum, p) => sum + p.progress_percentage, 0) /
            tasks.length
        )
      : 0;

  // 최근 활동한 태스크들 (상위 5개)
  const recentTasks = await getRecentActiveTasks(targetWeek);

  return {
    totalTasks: tasks.length,
    completedTasks,
    totalHours,
    avgProgress,
    recentTasks,
    tasksWithProgress: tasks.map((task) => {
      const progress = tasksProgress.find((p) => p.task_id === task.id);
      return { ...task, progress };
    }),
  };
};

// 최근 활동한 태스크들 조회
export const getRecentActiveTasks = async (
  weekStart?: string,
  limit: number = 5
) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const targetWeek = weekStart || getWeekStart();

  // 먼저 현재 주의 사용자 태스크들을 가져옴
  const tasks = await getTasks(targetWeek);
  const taskIds = tasks.map((task) => task.id);

  if (taskIds.length === 0) {
    return [];
  }

  // 시간 로그 가져오기
  const { data: timeLogs, error: timeError } = await supabase
    .from("task_time_logs")
    .select(
      `
      id,
      task_id,
      created_at,
      duration_minutes
    `
    )
    .gte("created_at", targetWeek)
    .in("task_id", taskIds)
    .order("created_at", { ascending: false });

  if (timeError) throw timeError;

  // 수량 로그 가져오기
  const { data: quantityLogs, error: quantityError } = await supabase
    .from("task_quantity_logs")
    .select(
      `
      id,
      task_id,
      created_at,
      completed_count
    `
    )
    .gte("created_at", targetWeek)
    .in("task_id", taskIds)
    .order("created_at", { ascending: false });

  if (quantityError) throw quantityError;

  // 두 로그를 합치고 시간순으로 정렬
  const allLogs = [
    ...(timeLogs || []).map((log) => ({
      ...log,
      log_type: "time" as const,
      quantity_completed: undefined,
    })),
    ...(quantityLogs || []).map((log) => ({
      ...log,
      log_type: "quantity" as const,
      duration_minutes: undefined,
      quantity_completed: log.completed_count,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);

  // 태스크 정보를 수동으로 조인
  const logsWithTasks = allLogs.map((log) => {
    const task = tasks.find((t) => t.id === log.task_id);
    return {
      ...log,
      tasks: task
        ? {
            id: task.id,
            title: task.title,
            task_type: task.task_type,
            target_time_minutes: task.target_time_hours
              ? task.target_time_hours * 60
              : undefined,
            target_quantity: task.target_quantity,
          }
        : null,
    };
  });

  return logsWithTasks;
};
