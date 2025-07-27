import {
  Clock,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Square,
  Timer,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { createTimeLog } from "../../api/timeLogs";
import { useTaskProgress } from "../../hooks/useTaskProgress";
import { supabase } from "../../lib/supabase";
import type { Task } from "../../types";
import { formatDuration } from "../../utils";
import {
  DEFAULT_POMODORO_SETTINGS,
  NotificationManager,
  type PomodoroPhase,
  type PomodoroSettings,
} from "../../utils/pomodoro";
import { NotificationDiagnosticDialog } from "../NotificationDiagnosticDialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TaskTimerProps {
  task: Task;
  onTimeLogged?: (minutes: number) => void;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task, onTimeLogged }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // 초 단위
  const [totalTime, setTotalTime] = useState(0); // 이번 세션의 총 시간 (초)
  const [isLoading, setIsLoading] = useState(false);

  // 포모도로 모드 상태
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [pomodoroSettings] = useState<PomodoroSettings>(
    DEFAULT_POMODORO_SETTINGS
  );
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("idle");
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0);
  const [pomodoroTimeRemaining, setPomodoroTimeRemaining] = useState(
    DEFAULT_POMODORO_SETTINGS.workDuration * 60
  );
  const [notificationManager] = useState(() =>
    NotificationManager.getInstance()
  );

  // 디버깅용: 컴포넌트 마운트 시 Supabase 연결 확인
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        console.log("TaskTimer - 사용자 인증 상태:", user);
        if (user.user) {
          console.log("TaskTimer - 사용자 ID:", user.user.id);
          console.log("TaskTimer - 사용자 이메일:", user.user.email);
        } else {
          console.log("TaskTimer - 사용자가 로그인되어 있지 않음");
        }
      } catch (error) {
        console.error("TaskTimer - Supabase 연결 확인 실패:", error);
      }
    };

    checkSupabaseConnection();
  }, []);

  // 데이터베이스에서 진행률 가져오기
  const {
    progress,
    loading: progressLoading,
    refreshProgress,
  } = useTaskProgress(task.id);

  // 포모도로 완료 처리
  const handlePomodoroComplete = useCallback(() => {
    if (pomodoroPhase === "work") {
      // 작업 세션 완료
      const newSessionCount = pomodoroSessionCount + 1;
      const isLongBreakTime =
        newSessionCount % pomodoroSettings.sessionsUntilLongBreak === 0;

      notificationManager.showNotification("🍅 포모도로 완료!", {
        body: `${pomodoroSettings.workDuration}분 집중 완료! ${
          isLongBreakTime ? "긴 휴식" : "짧은 휴식"
        } 시간입니다.`,
        icon: "/vite.svg",
      });

      // 다음 페이즈로 전환
      const nextPhase: PomodoroPhase = isLongBreakTime
        ? "longBreak"
        : "shortBreak";
      const nextDuration = isLongBreakTime
        ? pomodoroSettings.longBreakDuration
        : pomodoroSettings.shortBreakDuration;

      setPomodoroPhase(nextPhase);
      setPomodoroSessionCount(newSessionCount);
      setPomodoroTimeRemaining(nextDuration * 60);
    } else {
      // 휴식 완료
      notificationManager.showNotification("☕ 휴식 완료!", {
        body: "휴식이 끝났습니다. 다시 집중할 시간입니다!",
        icon: "/vite.svg",
      });

      // 작업 페이즈로 전환
      setPomodoroPhase("work");
      setPomodoroTimeRemaining(pomodoroSettings.workDuration * 60);
    }
  }, [
    pomodoroPhase,
    pomodoroSessionCount,
    pomodoroSettings,
    notificationManager,
  ]);

  // 타이머 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);

        // 포모도로 모드일 때 남은 시간 업데이트
        if (isPomodoroMode) {
          setPomodoroTimeRemaining((prev) => {
            if (prev <= 1) {
              // 포모도로 타이머 완료
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime, isPomodoroMode, handlePomodoroComplete]);

  // 포모도로 시간 포맷팅 (MM:SS)
  const formatPomodoroTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // 포모도로 모드 토글
  const togglePomodoroMode = () => {
    const newMode = !isPomodoroMode;
    setIsPomodoroMode(newMode);

    if (newMode) {
      // 포모도로 모드 활성화
      setPomodoroPhase("work");
      setPomodoroTimeRemaining(pomodoroSettings.workDuration * 60);
      setPomodoroSessionCount(0);
      notificationManager.requestPermission();
    } else {
      // 포모도로 모드 비활성화
      setPomodoroPhase("idle");
    }
  };

  // 시작/일시정지 토글
  const handleStartPause = () => {
    if (isRunning) {
      // 일시정지: 누적 시간에 현재 세션 추가
      setTotalTime((prev) => prev + elapsedTime);
      setElapsedTime(0);
      setIsRunning(false);
      setStartTime(null);
    } else {
      // 시작
      setIsRunning(true);
      setStartTime(new Date());
    }
  };

  // 정지 및 저장
  const handleStop = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 현재 실행 중이면 먼저 일시정지
      if (isRunning) {
        setTotalTime((prev) => prev + elapsedTime);
        setIsRunning(false);
        setStartTime(null);
      }

      const finalTotalSeconds = totalTime + elapsedTime;
      const minutes = Math.floor(finalTotalSeconds / 60);
      const remainingSeconds = finalTotalSeconds % 60;

      console.log("타이머 정지 - 세부 정보:", {
        finalTotalSeconds,
        minutes,
        remainingSeconds,
        taskId: task.id,
        taskTitle: task.title,
      });

      if (finalTotalSeconds >= 10) {
        // 10초 이상이면 저장
        const timeLogData = {
          task_id: task.id,
          start_time: new Date(
            Date.now() - finalTotalSeconds * 1000
          ).toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: Math.max(1, minutes), // 최소 1분으로 저장 (기존 스키마 호환)
          duration_seconds: finalTotalSeconds, // 실제 초 단위 시간
          note: `실제 작업 시간: ${minutes}분 ${remainingSeconds}초`,
        };

        console.log("시간 로그 저장 시도:", timeLogData);

        // 시간 로그 저장
        const savedLog = await createTimeLog(timeLogData);
        console.log("시간 로그 저장 완료:", savedLog);

        // 진행률 새로고침
        console.log("진행률 새로고침 시작...");
        await refreshProgress();
        console.log("진행률 새로고침 완료");

        // 부모 컴포넌트에 알림
        if (onTimeLogged) {
          onTimeLogged(Math.max(1, minutes)); // 최소 1분으로 전달
        }

        console.log("태스크 목록 새로고침 호출됨");
      } else {
        console.log("저장할 시간이 너무 짧음 (10초 미만)");
      }

      // 상태 초기화
      setElapsedTime(0);
      setTotalTime(0);
      console.log("타이머 상태 초기화 완료");
    } catch (error) {
      console.error("시간 저장 실패:", error);
      if (error instanceof Error) {
        console.error("에러 상세:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 리셋
  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setTotalTime(0);
  };

  // 시간 포맷팅 (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentDisplayTime = totalTime + elapsedTime;
  const totalMinutesSpent = progress
    ? progress.total_time_minutes + Math.floor(currentDisplayTime / 60)
    : Math.floor(currentDisplayTime / 60);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">{task.title}</CardTitle>
        <p className="text-muted-foreground text-sm">시간 측정 모드</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 포모도로 모드 표시 */}
        {isPomodoroMode && (
          <div className="text-center space-y-4">
            <div
              className={`p-4 rounded-lg ${
                pomodoroPhase === "work"
                  ? "bg-red-50 text-red-600"
                  : pomodoroPhase === "shortBreak"
                  ? "bg-green-50 text-green-600"
                  : pomodoroPhase === "longBreak"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {pomodoroPhase === "work" ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Coffee className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {pomodoroPhase === "work"
                    ? "집중 시간"
                    : pomodoroPhase === "shortBreak"
                    ? "짧은 휴식"
                    : pomodoroPhase === "longBreak"
                    ? "긴 휴식"
                    : "시작 대기"}
                </span>
              </div>
              <div className="text-4xl font-mono font-bold mb-2">
                {formatPomodoroTime(pomodoroTimeRemaining)}
              </div>
              <div className="text-sm">완료된 세션: {pomodoroSessionCount}</div>
            </div>
          </div>
        )}

        {/* 메인 시간 표시 */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-mono font-bold">
              {formatTime(currentDisplayTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              현재 세션: {formatTime(elapsedTime)}
            </div>
            {progress && !progressLoading && (
              <div className="text-xs text-muted-foreground">
                총 누적 시간: {formatDuration(totalMinutesSpent)}
              </div>
            )}
          </div>

          {/* 진행률 바 */}
          {task.target_time_hours && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (totalMinutesSpent / (task.target_time_hours * 60)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {Math.floor(totalMinutesSpent / 60)}시간{" "}
                  {totalMinutesSpent % 60}분
                </span>
                <span>목표: {task.target_time_hours}시간</span>
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-3 justify-center">
          {/* 포모도로 모드 토글 */}
          <Button
            onClick={togglePomodoroMode}
            variant={isPomodoroMode ? "default" : "outline"}
            size="lg"
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            {isPomodoroMode ? "포모도로 OFF" : "포모도로 ON"}
          </Button>

          <Button
            onClick={handleStartPause}
            variant={isRunning ? "secondary" : "default"}
            size="lg"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                일시정지
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                시작
              </>
            )}
          </Button>

          <Button
            onClick={handleStop}
            variant="destructive"
            size="lg"
            disabled={
              isLoading || (!isRunning && totalTime === 0 && elapsedTime === 0)
            }
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            {isLoading ? "저장 중..." : "정지"}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={isRunning || (totalTime === 0 && elapsedTime === 0)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            리셋
          </Button>
        </div>

        {/* 포모도로 알림 설정 */}
        <div className="flex justify-center">
          <NotificationDiagnosticDialog />
        </div>

        {/* 알림 권한 안내 */}
        {typeof window !== "undefined" &&
          Notification.permission === "denied" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="font-semibold text-yellow-800 mb-2">
                🔔 알림 권한이 필요합니다
              </div>
              <div className="text-yellow-700 mb-2">
                포모도로 타이머 완료 알림을 받으려면 브라우저 설정에서 알림을
                허용해주세요.
              </div>
              <div className="text-xs text-yellow-600">
                위의 "알림 설정" 버튼을 클릭하여 자세한 안내를 확인하세요.
              </div>
            </div>
          )}

        {/* 상태 표시 */}
        <div className="text-center">
          {isRunning && (
            <div className="flex items-center justify-center gap-2 text-sm bg-muted px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>타이머 실행 중</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
