import { format, startOfWeek } from "date-fns";
import { supabase } from "../lib/supabase";
import type { GroupStats, TaskStats, WeeklyStats } from "../types";

// 고정 태스크의 총 누적시간 조회 (모든 주차 합산)
export const getRecurringTaskTotalTime = async (
  taskId: string
): Promise<number> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 해당 태스크 정보 조회
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, original_task_id, title, is_recurring")
    .eq("id", taskId)
    .single();

  if (taskError) throw taskError;
  if (!task) throw new Error("태스크를 찾을 수 없습니다");

  // 원본 태스크 ID 결정 (현재 태스크가 원본이면 자신의 ID, 아니면 original_task_id 사용)
  const originalTaskId = task.original_task_id || task.id;

  // 같은 원본에서 파생된 모든 태스크 ID 조회
  const { data: relatedTasks, error: relatedError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.user.id)
    .or(`id.eq.${originalTaskId},original_task_id.eq.${originalTaskId}`);

  if (relatedError) throw relatedError;

  const allTaskIds = relatedTasks?.map((t) => t.id) || [taskId];

  // 모든 관련 태스크의 시간 로그 합산
  const { data: timeLogs, error: timeError } = await supabase
    .from("task_time_logs")
    .select("duration_minutes, duration_seconds")
    .in("task_id", allTaskIds)
    .eq("user_id", user.user.id);

  if (timeError) throw timeError;

  const totalTimeMinutes =
    timeLogs?.reduce((sum, log) => {
      const seconds = log.duration_seconds;
      const minutes = log.duration_minutes;
      return (
        sum + (seconds ? Math.round((seconds / 60) * 100) / 100 : minutes || 0)
      );
    }, 0) || 0;

  return totalTimeMinutes;
};

// 주간 통계 조회
export const getWeeklyStats = async (
  weekStart?: string
): Promise<WeeklyStats> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const targetWeek =
    weekStart ||
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // 해당 주의 모든 태스크 조회
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("week_start", targetWeek);

  if (tasksError) throw tasksError;

  if (!tasks || tasks.length === 0) {
    return {
      week_start: targetWeek,
      total_tasks: 0,
      completed_tasks: 0,
      total_time_minutes: 0,
      completion_rate: 0,
    };
  }

  // 시간 로그 조회
  const taskIds = tasks.map((t) => t.id);
  const { data: timeLogs, error: timeError } = await supabase
    .from("task_time_logs")
    .select("duration_minutes, duration_seconds")
    .in("task_id", taskIds)
    .eq("user_id", user.user.id);

  if (timeError) throw timeError;

  const totalTimeMinutes =
    timeLogs?.reduce((sum, log) => {
      // duration_seconds가 있으면 초를 분으로 변환, 없으면 기존 duration_minutes 사용
      const seconds = log.duration_seconds;
      const minutes = log.duration_minutes;
      return (
        sum + (seconds ? Math.round((seconds / 60) * 100) / 100 : minutes || 0)
      );
    }, 0) || 0;

  // 완료된 태스크 계산 (진행률 100% 기준)
  let completedTasks = 0;
  for (const task of tasks) {
    // 간단한 완료 계산 로직 (실제로는 calculateTaskProgress 사용)
    if (task.status === "completed") {
      completedTasks++;
    }
  }

  const completionRate =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return {
    week_start: targetWeek,
    total_tasks: tasks.length,
    completed_tasks: completedTasks,
    total_time_minutes: totalTimeMinutes,
    completion_rate: completionRate,
  };
};

// 특정 태스크 통계 조회
export const getTaskStats = async (taskId: string): Promise<TaskStats> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 시간 로그 통계
  const { data: timeLogs, error: timeError } = await supabase
    .from("task_time_logs")
    .select("duration_minutes, duration_seconds, start_time")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .not("duration_minutes", "is", null);

  if (timeError) throw timeError;

  // 수량 로그 통계
  const { data: quantityLogs, error: quantityError } = await supabase
    .from("task_quantity_logs")
    .select("completed_count")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id);

  if (quantityError) throw quantityError;

  const totalTimeMinutes =
    timeLogs?.reduce((sum, log) => {
      // duration_seconds가 있으면 초를 분으로 변환, 없으면 기존 duration_minutes 사용
      const seconds = log.duration_seconds;
      const minutes = log.duration_minutes;
      return (
        sum + (seconds ? Math.round((seconds / 60) * 100) / 100 : minutes || 0)
      );
    }, 0) || 0;

  const totalQuantityCompleted =
    quantityLogs?.reduce((sum, log) => sum + log.completed_count, 0) || 0;

  const sessionsCount = timeLogs?.length || 0;
  const averageSessionDuration =
    sessionsCount > 0 ? totalTimeMinutes / sessionsCount : 0;

  // 연속 일수 계산 (간단한 버전)
  const streakDays = calculateStreakDays(timeLogs || []);

  return {
    task_id: taskId,
    total_time_minutes: totalTimeMinutes,
    total_quantity_completed: totalQuantityCompleted,
    sessions_count: sessionsCount,
    average_session_duration: averageSessionDuration,
    streak_days: streakDays,
  };
};

// 연속 일수 계산 헬퍼 함수
const calculateStreakDays = (
  timeLogs: Array<{ start_time: string }>
): number => {
  if (!timeLogs.length) return 0;

  const uniqueDays = new Set(
    timeLogs.map((log) => format(new Date(log.start_time), "yyyy-MM-dd"))
  );

  const sortedDays = Array.from(uniqueDays).sort().reverse();

  let streak = 0;
  const currentDate = new Date();

  for (const day of sortedDays) {
    const dayDate = format(currentDate, "yyyy-MM-dd");
    if (day === dayDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// 그룹 통계 조회
export const getGroupStats = async (groupId: string): Promise<GroupStats> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 그룹 멤버 수 조회
  const { data: memberships, error: memberError } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId);

  if (memberError) throw memberError;

  // 공유된 태스크 수 조회
  const { data: sharedTasks, error: tasksError } = await supabase
    .from("group_shared_tasks")
    .select("*")
    .eq("group_id", groupId);

  if (tasksError) throw tasksError;

  // 가장 활동적인 멤버 찾기 (간단한 버전)
  let mostActiveUser = {
    user_id: "",
    username: "",
    total_time_minutes: 0,
  };

  if (memberships && memberships.length > 0) {
    // 실제로는 각 멤버의 시간 로그를 집계해야 함
    mostActiveUser = {
      user_id: memberships[0].user_id,
      username: "Unknown",
      total_time_minutes: 0,
    };
  }

  return {
    group_id: groupId,
    member_count: memberships?.length || 0,
    total_shared_tasks: sharedTasks?.length || 0,
    average_completion_rate: 0, // 실제 계산 필요
    most_active_member: mostActiveUser,
  };
};

// 전체 사용자 통계 대시보드
export const getUserDashboardStats = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const currentWeek = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );

  // 이번 주 통계
  const weeklyStats = await getWeeklyStats(currentWeek);

  // 전체 태스크 수
  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.user.id);

  // 참여 중인 그룹 수
  const { count: groupCount } = await supabase
    .from("group_memberships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.user.id);

  return {
    weekly_stats: weeklyStats,
    total_tasks_all_time: totalTasks || 0,
    groups_joined: groupCount || 0,
  };
};
