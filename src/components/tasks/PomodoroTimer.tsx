import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DEFAULT_POMODORO_SETTINGS, NotificationManager, type PomodoroSettings, type PomodoroState } from '../../utils/pomodoro';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
interface PomodoroTimerProps {  onWorkSessionComplete?: (duration: number) => void;}export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({   onWorkSessionComplete }) => {  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);  const [state, setState] = useState<PomodoroState>({    phase: 'idle',    sessionCount: 0,    timeRemaining: DEFAULT_POMODORO_SETTINGS.workDuration * 60,    isRunning: false,  });  const [notificationManager] = useState(() => NotificationManager.getInstance());  // 타이머 완료 처리  const handleTimerComplete = useCallback(() => {    setState(prev => ({ ...prev, isRunning: false }));    notificationManager.playSound();    if (state.phase === 'work') {      const newSessionCount = state.sessionCount + 1;      const isLongBreakTime = newSessionCount % settings.sessionsUntilLongBreak === 0;            notificationManager.showNotification(        '🍅 포모도로 완료!',        {          body: `${settings.workDuration}분 집중 완료!`,          icon: '/vite.svg'        }      );      if (onWorkSessionComplete) {        onWorkSessionComplete(settings.workDuration);      }      const nextPhase: PomodoroPhase = isLongBreakTime ? 'longBreak' : 'shortBreak';      const nextDuration = isLongBreakTime ? settings.longBreakDuration : settings.shortBreakDuration;      setState(prev => ({        ...prev,        phase: nextPhase,        sessionCount: newSessionCount,        timeRemaining: nextDuration * 60,      }));    } else {      notificationManager.showNotification(        '☕ 휴식 완료!',        { body: '다시 집중할 시간입니다!', icon: '/vite.svg' }      );      setState(prev => ({
        ...prev,
        phase: 'work',
        timeRemaining: settings.workDuration * 60,
      }));
    }
  }, [state.phase, state.sessionCount, settings, notificationManager, onWorkSessionComplete]);

  // 타이머 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isRunning && state.timeRemaining > 0) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
    } else if (state.timeRemaining === 0 && state.isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.timeRemaining, handleTimerComplete]);

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 시작/일시정지
  const handleStartPause = () => {
    if (state.phase === 'idle') {
      setState(prev => ({
        ...prev,
        phase: 'work',
        timeRemaining: settings.workDuration * 60,
        isRunning: true,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isRunning: !prev.isRunning,
      }));
    }

    if (!state.isRunning) {
      notificationManager.requestPermission();
    }
  };

  // 리셋
  const handleReset = () => {
    setState({
      phase: 'idle',
      sessionCount: 0,
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
    });
  };

  const getPhaseColor = () => {
    switch (state.phase) {
      case 'work': return 'text-red-600 bg-red-50';
      case 'shortBreak': return 'text-green-600 bg-green-50';
      case 'longBreak': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPhaseTitle = () => {
    switch (state.phase) {
      case 'work': return '집중 시간';
      case 'shortBreak': return '짧은 휴식';
      case 'longBreak': return '긴 휴식';
      default: return '시작 대기';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="w-6 h-6" />
          포모도로 타이머
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className={`text-center p-4 rounded-lg ${getPhaseColor()}`}>
          <div className="text-lg font-semibold">
            {getPhaseTitle()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            완료된 세션: {state.sessionCount}
          </div>
        </div>

        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
            {formatTime(state.timeRemaining)}
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            onClick={handleStartPause}
            variant={state.isRunning ? "outline" : "default"}
            size="lg"
            className="flex-1"
          >
            {state.isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                일시정지
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {state.phase === 'idle' ? '시작' : '재개'}
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
