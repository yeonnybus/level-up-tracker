import { supabase } from "../lib/supabase";
import type { CreateQuantityLogForm, TaskQuantityLog } from "../types";

// 수량 로그 생성 (완료된 횟수 기록)
export const createQuantityLog = async (
  data: CreateQuantityLogForm
): Promise<TaskQuantityLog> => {
  console.log("createQuantityLog 호출됨:", data);

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    console.error("사용자 인증 실패");
    throw new Error("로그인이 필요합니다");
  }

  console.log("인증된 사용자:", user.user.id);

  const quantityLogData = {
    ...data,
    user_id: user.user.id,
  };

  console.log("저장할 데이터:", quantityLogData);

  const { data: quantityLog, error } = await supabase
    .from("task_quantity_logs")
    .insert(quantityLogData)
    .select()
    .single();

  console.log("Supabase 응답:", { quantityLog, error });

  if (error) {
    console.error("수량 로그 저장 오류:", error);
    throw error;
  }

  console.log("수량 로그 저장 성공:", quantityLog);
  return quantityLog;
};

// 수량 로그 추가 (체크리스트 완료)
export const addQuantityLog = async (
  taskId: string,
  completedCount: number = 1,
  note?: string
): Promise<TaskQuantityLog> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: quantityLog, error } = await supabase
    .from("task_quantity_logs")
    .insert({
      task_id: taskId,
      user_id: user.user.id,
      completed_count: completedCount,
      note: note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return quantityLog;
};

// 태스크의 모든 수량 로그 조회
export const getTaskQuantityLogs = async (
  taskId: string
): Promise<TaskQuantityLog[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: quantityLogs, error } = await supabase
    .from("task_quantity_logs")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return quantityLogs || [];
};

// 수량 로그 삭제 (체크 해제)
export const deleteQuantityLog = async (logId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("task_quantity_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.user.id);

  if (error) throw error;
};

// 태스크의 총 완료 수량 조회
export const getTotalQuantityCompleted = async (
  taskId: string
): Promise<number> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: quantityLogs, error } = await supabase
    .from("task_quantity_logs")
    .select("completed_count")
    .eq("task_id", taskId)
    .eq("user_id", user.user.id);

  if (error) throw error;

  return (
    quantityLogs?.reduce((total, log) => total + log.completed_count, 0) || 0
  );
};
