import { Minus, Plus, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import { createQuantityLog } from "../../api/quantityLogs";
import { useTaskProgress } from "../../hooks/useTaskProgress";
import type { Task } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TaskQuantityCounterProps {
  task: Task;
  onQuantityLogged?: (count: number) => void;
}

export const TaskQuantityCounter: React.FC<TaskQuantityCounterProps> = ({
  task,
  onQuantityLogged,
}) => {
  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터베이스에서 진행률 가져오기
  const {
    progress,
    loading: progressLoading,
    refreshProgress,
  } = useTaskProgress(task.id);

  // 카운트 증가
  const incrementCount = () => {
    setCurrentCount((prev) => prev + 1);
  };

  // 카운트 감소
  const decrementCount = () => {
    setCurrentCount((prev) => Math.max(0, prev - 1));
  };

  // 리셋
  const resetCount = () => {
    setCurrentCount(0);
  };

  // 로그 저장
  const saveCount = async () => {
    if (currentCount === 0) {
      console.log("저장할 횟수가 0개입니다");
      return;
    }

    console.log("수량 로그 저장 시작...", {
      task_id: task.id,
      completed_count: currentCount,
      note: `${currentCount}회 완료`,
    });

    setIsLoading(true);
    try {
      const savedLog = await createQuantityLog({
        task_id: task.id,
        completed_count: currentCount,
        note: `${currentCount}회 완료`,
      });

      console.log("수량 로그 저장 성공:", savedLog);
      onQuantityLogged?.(currentCount);
      setCurrentCount(0); // 저장 후 리셋

      // 진행률 새로고침
      refreshProgress();
    } catch (error) {
      console.error("수량 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 누적 횟수 포함한 총 진행률 계산
  const totalCountCompleted = progress
    ? progress.total_quantity_completed + currentCount
    : currentCount;
  const progressPercentage =
    task.target_quantity && totalCountCompleted > 0
      ? Math.min((totalCountCompleted / task.target_quantity) * 100, 100)
      : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold">{task.title}</span>
          {task.target_quantity && (
            <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">
              목표: {task.target_quantity}회
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 카운트 표시 */}
        <div className="text-center space-y-3">
          <div className="text-6xl md:text-7xl font-bold">{currentCount}</div>
          <div className="text-sm text-muted-foreground font-medium">
            현재 세션 횟수
          </div>
          {progress && !progressLoading && (
            <div className="text-xs text-muted-foreground">
              총 누적 횟수: {totalCountCompleted}회
            </div>
          )}
        </div>

        {/* 진행률 바 */}
        {task.target_quantity && (
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {progressPercentage.toFixed(1)}% 달성
            </div>
          </div>
        )}

        {/* 컨트롤 버튼 */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={decrementCount}
            variant="outline"
            size="lg"
            disabled={currentCount === 0}
            className="flex items-center gap-2"
          >
            <Minus className="h-5 w-5" />
            -1
          </Button>

          <Button
            onClick={incrementCount}
            size="lg"
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            +1
          </Button>

          <Button
            onClick={resetCount}
            variant="outline"
            size="lg"
            disabled={currentCount === 0}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            리셋
          </Button>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-center">
          <Button
            onClick={saveCount}
            variant="secondary"
            size="lg"
            disabled={currentCount === 0 || isLoading}
            className="px-8"
          >
            {isLoading ? "저장 중..." : `${currentCount}회 기록하기`}
          </Button>
        </div>

        {/* 상태 표시 */}
        <div className="text-center">
          {currentCount > 0 && !isLoading && (
            <div className="text-xs text-muted-foreground bg-muted rounded-full px-4 py-2">
              저장하면 카운트가 데이터베이스에 기록됩니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
