import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { deleteTask, updateTask } from "../../api/tasks";
import type { Task, TaskType, UpdateTaskForm } from "../../types";
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

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task,
}) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [targetTimeHours, setTargetTimeHours] = useState<number | null>(
    task?.target_time_hours || null
  );
  const [targetQuantity, setTargetQuantity] = useState<number | null>(
    task?.target_quantity || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 모달이 열릴 때마다 상태 초기화
  React.useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setTargetTimeHours(task.target_time_hours || null);
      setTargetQuantity(task.target_quantity || null);
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (task.task_type === "time" || task.task_type === "time_and_quantity") {
      if (!targetTimeHours || targetTimeHours <= 0) {
        newErrors.targetTimeHours = "목표 시간을 입력해주세요.";
      }
    }

    if (
      task.task_type === "quantity" ||
      task.task_type === "time_and_quantity"
    ) {
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
      const updateData: UpdateTaskForm = {
        title: title.trim(),
        description: description.trim() || undefined,
      };

      // 태스크 타입에 따라 목표 값 설정
      if (task.task_type === "time" || task.task_type === "time_and_quantity") {
        updateData.target_time_hours = targetTimeHours || undefined;
      }

      if (
        task.task_type === "quantity" ||
        task.task_type === "time_and_quantity"
      ) {
        updateData.target_quantity = targetQuantity || undefined;
      }

      await updateTask(task.id, updateData);
      onSuccess();
    } catch (error) {
      console.error("태스크 수정 실패:", error);
      setErrors({ submit: "태스크 수정에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onSuccess();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("태스크 삭제 실패:", error);
      setErrors({ submit: "태스크 삭제에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isDeleting) return;
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!task) return null;

  const getTaskTypeLabel = (type: TaskType) => {
    switch (type) {
      case "time":
        return "시간 측정";
      case "quantity":
        return "횟수 카운트";
      case "time_and_quantity":
        return "시간 + 횟수";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-bold">태스크 수정</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            태스크 정보를 수정하거나 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          // 삭제 확인 UI
          <div className="space-y-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">태스크 삭제</h3>
                <p className="text-muted-foreground mt-2">
                  <strong>"{task.title}"</strong> 태스크를 삭제하시겠습니까?
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  삭제된 태스크와 모든 진행 기록은 복구할 수 없습니다.
                </p>
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {errors.submit}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </Button>
            </div>
          </div>
        ) : (
          // 수정 폼 UI
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 태스크 타입 표시 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">태스크 타입</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {getTaskTypeLabel(task.task_type)}
              </div>
            </div>

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
                  placeholder="태스크 제목을 입력하세요"
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

            {/* 목표 설정 섹션 */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">목표 설정</Label>

              {(task.task_type === "time" ||
                task.task_type === "time_and_quantity") && (
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

              {(task.task_type === "quantity" ||
                task.task_type === "time_and_quantity") && (
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
            <div className="flex gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
              <div className="flex gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
