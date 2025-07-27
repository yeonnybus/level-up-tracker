import { supabase } from "../lib/supabase";
import type { CreateTimeLogForm, TaskTimeLog, TimerSession } from "../types";

// 시간 로그 생성 (완료된 작업 시간 기록)
export const createTimeLog = async (
  data: CreateTimeLogForm
): Promise<TaskTimeLog> => {
  console.log("createTimeLog 호출됨:", data);

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    console.error("사용자 인증 실패");
    throw new Error("로그인이 필요합니다");
  }

  console.log("인증된 사용자:", user.user.id);

  const timeLogData = {
    ...data,
    user_id: user.user.id,
  };

  console.log("저장할 데이터:", timeLogData);

  const { data: timeLog, error } = await supabase
    .from("task_time_logs")
    .insert(timeLogData)
    .select()
    .single();

  console.log("Supabase 응답:", { timeLog, error });

  if (error) {
    console.error("시간 로그 저장 오류:", error);
    throw error;
  }

  console.log("시간 로그 저장 성공:", timeLog);
  return timeLog;
};

// 시간 로그 시작 (타이머 시작)
export const startTimeLog = async (taskId: string): Promise<TaskTimeLog> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: timeLog, error } = await supabase
    .from("task_time_logs")
    .insert({
      task_id: taskId,
      user_id: user.user.id,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return timeLog;
};

// 시간 로그 종료 (타이머 종료)
export const endTimeLog = async (
  logId: string,
  note?: string
): Promise<TaskTimeLog> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const endTime = new Date().toISOString();

  // 기존 로그 조회하여 시작 시간 확인
  const { data: existingLog, error: fetchError } = await supabase
    .from("task_time_logs")
    .select("start_time")
    .eq("id", logId)
    .eq("user_id", user.user.id)
    .single();

  if (fetchError) throw fetchError;

  // 지속 시간 계산 (분 단위)
  const startTime = new Date(existingLog.start_time);
  const endTimeDate = new Date(endTime);
  const durationMinutes = Math.round(
    (endTimeDate.getTime() - startTime.getTime()) / (1000 * 60)
  );

  const { data: timeLog, error } = await supabase
    .from("task_time_logs")
    .update({
      end_time: endTime,
      duration_minutes: durationMinutes,
      note: note || null,
    })
    .eq("id", logId)
    .eq("user_id", user.user.id)
    .select()
    .single();

  if (error) throw error;
  return timeLog;
};

// 진행 중인 타이머 조회
export const getActiveTimeLog = async (
  taskId: string
): Promise<TaskTimeLog | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: timeLogs, error } = await supabase
    .from("task_time_logs")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1);

  if (error) throw error;
  return timeLogs && timeLogs.length > 0 ? timeLogs[0] : null;
};

// 태스크의 모든 시간 로그 조회
export const getTaskTimeLogs = async (
  taskId: string
): Promise<TaskTimeLog[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: timeLogs, error } = await supabase
    .from("task_time_logs")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return timeLogs || [];
};

// 시간 로그 삭제
export const deleteTimeLog = async (logId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("task_time_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.user.id);

  if (error) throw error;
};

// 완료된 세션으로 시간 로그 직접 추가
export const addTimerSession = async (
  session: TimerSession
): Promise<TaskTimeLog> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const endTime = session.duration_minutes
    ? new Date(
        new Date(session.start_time).getTime() +
          session.duration_minutes * 60000
      ).toISOString()
    : new Date().toISOString();

  const { data: timeLog, error } = await supabase
    .from("task_time_logs")
    .insert({
      task_id: session.task_id,
      user_id: user.user.id,
      start_time: session.start_time,
      end_time: endTime,
      duration_minutes: session.duration_minutes || 0,
      note: session.note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return timeLog;
};
