import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getDashboardStats, getWeekStart } from "../api/tasks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { Task, TaskProgress } from "../types";

interface TaskWithProgress extends Task {
  progress?: TaskProgress;
}

interface RecentActivity {
  id: string;
  task_id: string;
  created_at: string;
  log_type: "time" | "quantity";
  duration_minutes?: number;
  quantity_completed?: number;
  tasks?: {
    id: string;
    title: string;
    task_type: string;
    target_time_minutes?: number;
    target_quantity?: number;
  };
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  avgProgress: number;
  recentTasks: RecentActivity[];
  tasksWithProgress: TaskWithProgress[];
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getDashboardStats();
      setStats(dashboardData as unknown as DashboardStats);
    } catch (err) {
      console.error("대시보드 데이터 로딩 실패:", err);
      setError("대시보드 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const currentWeek = getWeekStart();
  const weekDisplayText = format(new Date(currentWeek), "yyyy년 MM월 dd일 주", {
    locale: ko,
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">{weekDisplayText}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">개인 대시보드</h1>
        <p className="text-muted-foreground mt-1">
          이번 주 진행 상황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              이번 주 태스크
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">완료된 태스크</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 활동 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalHours || 0}시간
            </div>
            <p className="text-xs text-muted-foreground">이번 주 누적 시간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 진행률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgProgress || 0}%</div>
            <p className="text-xs text-muted-foreground">전체 태스크 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">달성률</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTasks
                ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">주간 목표 달성률</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 진행 중인 태스크 */}
        <Card>
          <CardHeader>
            <CardTitle>진행 중인 태스크</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.tasksWithProgress?.length ? (
                stats.tasksWithProgress.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.task_type === "time"
                          ? `목표: ${
                              ((
                                task as TaskWithProgress & {
                                  target_time_hours: number;
                                }
                              ).target_time_hours || 0) * 60
                            }분`
                          : `목표: ${
                              (
                                task as TaskWithProgress & {
                                  target_quantity: number;
                                }
                              ).target_quantity || 0
                            }개`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {task.progress?.progress_percentage || 0}%
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              task.progress?.progress_percentage || 0,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  아직 생성된 태스크가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentTasks?.length ? (
                stats.recentTasks.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {log.tasks?.title || "알 수 없는 태스크"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "MM월 dd일 HH:mm", {
                          locale: ko,
                        })}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {log.duration_minutes ? (
                        <span className="text-blue-600">
                          {log.duration_minutes}분
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {log.quantity_completed}개
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  아직 활동 기록이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
