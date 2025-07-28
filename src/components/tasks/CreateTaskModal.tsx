import { Plus } from "lucide-react";
import React, { useState } from "react";
import { createTask, getWeekStart } from "../../api/tasks";
import type { CreateTaskForm, TaskType } from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("time");
  const [targetTimeHours, setTargetTimeHours] = useState<number | null>(null);
  const [targetQuantity, setTargetQuantity] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (taskType === "time" || taskType === "time_and_quantity") {
      if (!targetTimeHours || targetTimeHours <= 0) {
        newErrors.targetTimeHours = "목표 시간을 입력해주세요.";
      }
    }

    if (taskType === "quantity" || taskType === "time_and_quantity") {
      if (!targetQuantity || targetQuantity <= 0) {
        newErrors.targetQuantity = "목표 횟수를 입력해주세요.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const taskData: CreateTaskForm = {
        title: title.trim(),
        description: description.trim() || undefined,
        task_type: taskType,
        target_time_hours:
          taskType === "time" || taskType === "time_and_quantity"
            ? targetTimeHours || undefined
            : undefined,
        target_quantity:
          taskType === "quantity" || taskType === "time_and_quantity"
            ? targetQuantity || undefined
            : undefined,
        week_start: getWeekStart(),
        is_recurring: isRecurring,
      };

      await createTask(taskData);

      // 성공 후 폼 초기화
      setTitle("");
      setDescription("");
      setTaskType("time");
      setTargetTimeHours(null);
      setTargetQuantity(null);
      setIsRecurring(false);

      onSuccess();
    } catch (error) {
      console.error("태스크 생성 실패:", error);
      setErrors({ submit: "태스크 생성에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    // 폼 초기화
    setTitle("");
    setDescription("");
    setTaskType("time");
    setTargetTimeHours(null);
    setTargetQuantity(null);
    setIsRecurring(false);
    setErrors({});

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-bold">
            새 태스크 만들기
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            목표를 설정하고 진행 상황을 추적할 새 태스크를 만드세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                태스크 제목 *
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 운동하기, 독서, 프로젝트 작업"
                className={`transition-colors ${
                  errors.title ? "border-red-500 focus:border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                설명 (선택사항)
              </Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="태스크에 대한 간단한 설명을 입력하세요"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* 태스크 유형 섹션 */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">태스크 유형 *</Label>
              <div className="grid gap-3">
                {[
                  {
                    value: "time" as TaskType,
                    label: "시간 측정",
                    desc: "시간을 측정하는 태스크",
                  },
                  {
                    value: "quantity" as TaskType,
                    label: "횟수 카운트",
                    desc: "횟수를 세는 태스크",
                  },
                  {
                    value: "time_and_quantity" as TaskType,
                    label: "시간 + 횟수",
                    desc: "시간과 횟수를 모두 추적",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      taskType === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name="taskType"
                      value={option.value}
                      checked={taskType === option.value}
                      onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 태스크 반복 설정 섹션 */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">태스크 반복 설정</Label>
              <div className="grid gap-3">
                {[
                  {
                    value: false,
                    label: "일회성",
                    desc: "이번 주에만 실행하는 태스크",
                  },
                  {
                    value: true,
                    label: "고정",
                    desc: "매주 자동으로 새 태스크가 생성됩니다",
                  },
                ].map((option) => (
                  <label
                    key={option.value.toString()}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isRecurring === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name="isRecurring"
                      value={option.value.toString()}
                      checked={isRecurring === option.value}
                      onChange={(e) =>
                        setIsRecurring(e.target.value === "true")
                      }
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 목표 설정 섹션 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">주간 목표 설정</Label>

            {(taskType === "time" || taskType === "time_and_quantity") && (
              <div className="space-y-2">
                <Label
                  htmlFor="targetTimeHours"
                  className="text-sm text-muted-foreground"
                >
                  목표 시간 (시간) *
                </Label>
                <Input
                  id="targetTimeHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={targetTimeHours || ""}
                  onChange={(e) =>
                    setTargetTimeHours(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="예: 10"
                  className={`transition-colors ${
                    errors.targetTimeHours
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.targetTimeHours && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.targetTimeHours}
                  </p>
                )}
              </div>
            )}

            {(taskType === "quantity" || taskType === "time_and_quantity") && (
              <div className="space-y-2">
                <Label
                  htmlFor="targetQuantity"
                  className="text-sm text-muted-foreground"
                >
                  목표 횟수 *
                </Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  min="1"
                  value={targetQuantity || ""}
                  onChange={(e) =>
                    setTargetQuantity(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="예: 50"
                  className={`transition-colors ${
                    errors.targetQuantity
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.targetQuantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.targetQuantity}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 전체 에러 메시지 */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.submit}
              </p>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  태스크 생성
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
