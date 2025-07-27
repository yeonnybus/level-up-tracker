import { Clock, Edit, Plus, Target } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getAllTasksForUser, getTasks } from "../api/tasks";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { EditTaskModal } from "../components/tasks/EditTaskModal";
import { TaskQuantityCounter } from "../components/tasks/TaskQuantityCounter";
import { TaskTimer } from "../components/tasks/TaskTimer";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { Task } from "../types";

export const TasksPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleTaskCreated = () => {
    setIsCreateModalOpen(false);
    loadTasks();
  };

  const handleTaskUpdated = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
    // 현재 선택된 타이머/카운터 해제
    setSelectedTask(null);
    loadTasks();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log("태스크 로딩 시작...");

      // 먼저 주간 필터링으로 시도
      let tasksData = await getTasks();
      console.log("주간 필터링 결과:", tasksData);

      // 주간 필터링 결과가 없으면 모든 태스크 조회
      if (tasksData.length === 0) {
        console.log("주간 태스크가 없음, 모든 태스크 조회 시도...");
        tasksData = await getAllTasksForUser();
        console.log("모든 태스크 결과:", tasksData);
      }

      setTasks(tasksData);
    } catch (error) {
      console.error("태스크 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTimeLogged = () => {
    loadTasks();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold">태스크 관리</h1>
          <p className="text-muted-foreground">
            주간 목표를 설정하고 진행 상황을 추적하세요
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />새 태스크
        </Button>
      </div>

      {/* 활성 타이머 */}
      {selectedTask && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {selectedTask.task_type === "quantity"
              ? "활성 카운터"
              : "활성 타이머"}
          </h2>
          {selectedTask.task_type === "quantity" ? (
            <TaskQuantityCounter
              task={selectedTask}
              onQuantityLogged={handleTimeLogged}
            />
          ) : (
            <TaskTimer task={selectedTask} onTimeLogged={handleTimeLogged} />
          )}
        </div>
      )}

      {/* 태스크 목록 */}
      {tasks.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/25 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              등록된 태스크가 없습니다
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              첫 번째 태스크를 만들어 목표 달성을 시작해보세요.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              태스크 생성하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold leading-6 truncate">
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditTask(task)}
                    className="shrink-0 h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 태스크 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      타입
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {task.task_type === "time" && "시간 측정"}
                      {task.task_type === "quantity" && "횟수 카운트"}
                      {task.task_type === "time_and_quantity" && "시간+횟수"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      목표
                    </span>
                    <span className="font-medium">
                      {task.task_type === "time" &&
                        task.target_time_hours &&
                        `${task.target_time_hours}시간`}
                      {task.task_type === "quantity" &&
                        task.target_quantity &&
                        `${task.target_quantity}회`}
                      {task.task_type === "time_and_quantity" && (
                        <>
                          {task.target_time_hours &&
                            `${task.target_time_hours}시간`}
                          {task.target_time_hours &&
                            task.target_quantity &&
                            " / "}
                          {task.target_quantity && `${task.target_quantity}회`}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      상태
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : task.status === "paused"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {task.status === "completed" && "완료"}
                      {task.status === "paused" && "일시정지"}
                      {task.status === "active" && "진행 중"}
                      {task.status === "archived" && "보관됨"}
                    </span>
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex gap-2 pt-2">
                  {/* 시간 타입 타이머 버튼 */}
                  {(task.task_type === "time" ||
                    task.task_type === "time_and_quantity") && (
                    <Button
                      size="sm"
                      variant={
                        selectedTask?.id === task.id ? "secondary" : "default"
                      }
                      onClick={() =>
                        setSelectedTask(
                          selectedTask?.id === task.id ? null : task
                        )
                      }
                      className="flex-1"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedTask?.id === task.id ? "닫기" : "타이머"}
                    </Button>
                  )}

                  {/* 횟수 타입 카운터 버튼 */}
                  {(task.task_type === "quantity" ||
                    task.task_type === "time_and_quantity") && (
                    <Button
                      size="sm"
                      variant={
                        selectedTask?.id === task.id ? "secondary" : "default"
                      }
                      onClick={() =>
                        setSelectedTask(
                          selectedTask?.id === task.id ? null : task
                        )
                      }
                      className="flex-1"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      {selectedTask?.id === task.id ? "닫기" : "카운터"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTaskCreated}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleTaskUpdated}
        task={editingTask}
      />
    </div>
  );
};
