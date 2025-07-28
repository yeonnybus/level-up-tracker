import { Clock, Pause, Play, RotateCcw, Square } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_POMODORO_SETTINGS,
  NotificationManager,
  type PomodoroSettings,
  type PomodoroState,
} from "../../utils/pomodoro";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type PomodoroPhase = "idle" | "work" | "shortBreak" | "longBreak";

interface PomodoroTimerProps {
  onWorkSessionComplete?: (duration: number) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onWorkSessionComplete,
}) => {
  const [settings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [state, setState] = useState<PomodoroState>({
    phase: "idle",
    sessionCount: 0,
    timeRemaining: DEFAULT_POMODORO_SETTINGS.workDuration * 60,
    isRunning: false,
  });
  const [notificationManager] = useState(() =>
    NotificationManager.getInstance()
  );

  // 타이머 완료 처리
  const handleTimerComplete = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));

    if (state.phase === "work") {
      const newSessionCount = state.sessionCount + 1;
      const isLongBreakTime =
        newSessionCount % settings.sessionsUntilLongBreak === 0;

      notificationManager.showNotification("🍅 포모도로 완료!", {
        body: `${settings.workDuration}분 집중 완료!`,
        icon: "/vite.svg",
      });

      if (onWorkSessionComplete) {
        onWorkSessionComplete(settings.workDuration);
      }

      const nextPhase: PomodoroPhase = isLongBreakTime
        ? "longBreak"
        : "shortBreak";
      const nextDuration = isLongBreakTime
        ? settings.longBreakDuration
        : settings.shortBreakDuration;

      setState((prev) => ({
        ...prev,
        phase: nextPhase,
        sessionCount: newSessionCount,
        timeRemaining: nextDuration * 60,
      }));
    } else {
      notificationManager.showNotification("☕ 휴식 완료!", {
        body: "다시 집중할 시간입니다!",
        icon: "/vite.svg",
      });

      setState((prev) => ({
        ...prev,
        phase: "work",
        timeRemaining: settings.workDuration * 60,
      }));
    }
  }, [
    state.phase,
    state.sessionCount,
    settings,
    notificationManager,
    onWorkSessionComplete,
  ]);

  // 타이머 틱
  useEffect(() => {
    if (!state.isRunning) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleTimerComplete();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isRunning, handleTimerComplete]);

  // 컨트롤 함수들
  const startTimer = () => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      phase: prev.phase === "idle" ? "work" : prev.phase,
    }));
  };

  const pauseTimer = () => {
    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const stopTimer = () => {
    console.log("=== stopTimer 호출 ===");
    console.log("현재 settings.workDuration:", settings.workDuration);
    console.log("설정될 timeRemaining:", settings.workDuration * 60);
    console.log("현재 state:", state);

    // 현재 진행 중인 작업 시간을 누적에 기록
    if (state.phase === "work" && onWorkSessionComplete) {
      const elapsedSeconds = settings.workDuration * 60 - state.timeRemaining;
      const elapsedMinutes = Math.round(elapsedSeconds / 60);

      console.log("elapsedSeconds:", elapsedSeconds);
      console.log("elapsedMinutes:", elapsedMinutes);

      // 10초 이상일 때만 기록
      if (elapsedSeconds >= 10) {
        console.log("기록됨: ", elapsedMinutes);
        onWorkSessionComplete(elapsedMinutes);
      } else {
        console.log("10초 미만이라 기록 안됨");
      }
    }

    // 완전히 처음 상태로 리셋 (10초 미만이든 이상이든 항상 기본값으로)
    const newState = {
      phase: "idle" as const,
      sessionCount: 0,
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
    };

    console.log("새로운 state로 설정:", newState);
    setState(newState);
  };

  const resetTimer = () => {
    console.log("=== resetTimer 호출 ===");
    console.log("현재 settings.workDuration:", settings.workDuration);
    console.log("설정될 timeRemaining:", settings.workDuration * 60);

    const newState = {
      phase: "idle" as const,
      sessionCount: 0,
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
    };

    console.log("새로운 state로 설정:", newState);
    setState(newState);
  };

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // 현재 단계 이름
  const getPhaseTitle = (phase: PomodoroPhase): string => {
    switch (phase) {
      case "work":
        return "집중 시간";
      case "shortBreak":
        return "짧은 휴식";
      case "longBreak":
        return "긴 휴식";
      default:
        return "포모도로 타이머";
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          {getPhaseTitle(state.phase)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 타이머 디스플레이 */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold">
            {formatTime(state.timeRemaining)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            세션 {state.sessionCount} 완료
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex justify-center gap-2">
          {!state.isRunning ? (
            <Button onClick={startTimer} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              시작
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              일시정지
            </Button>
          )}
          {state.phase !== "idle" && (
            <Button
              onClick={stopTimer}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              정지
            </Button>
          )}
          <Button
            onClick={resetTimer}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            리셋
          </Button>
        </div>

        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{
              width: `${
                ((settings.workDuration * 60 - state.timeRemaining) /
                  (settings.workDuration * 60)) *
                100
              }%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
