import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  LogOut,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getGroupDashboardStats,
  getGroupDetails,
  getGroupMembersProgress,
  leaveGroup,
} from "../api/groups";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { supabase } from "../lib/supabase";
import type { GroupMemberWithProgress, GroupWithMembers } from "../types";

interface GroupDashboardStats {
  memberCount: number;
  totalPoints: number;
  thisWeekActivity: number;
  averagePoints: number;
  thisWeekCompletedTasks: number;
  averageCompletionRate: number;
}

export const GroupDashboardPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [stats, setStats] = useState<GroupDashboardStats | null>(null);
  const [membersProgress, setMembersProgress] = useState<
    GroupMemberWithProgress[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  console.log(membersProgress);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroupDashboard = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      // 현재 사용자 정보 가져오기
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const [groupData, statsData, progressData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupDashboardStats(groupId),
        getGroupMembersProgress(groupId),
      ]);

      setGroup(groupData);
      setStats(statsData);
      setMembersProgress(progressData);
    } catch (err) {
      console.error("그룹 대시보드 로딩 실패:", err);
      setError("그룹 대시보드를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const handleLeaveGroup = async () => {
    if (!groupId || !group) return;

    if (!confirm("정말 이 그룹을 나가시겠습니까?")) {
      return;
    }

    try {
      await leaveGroup(groupId);
      alert("그룹을 나갔습니다.");
      navigate("/groups");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "그룹 나가기에 실패했습니다."
      );
    }
  };

  useEffect(() => {
    loadGroupDashboard();
  }, [loadGroupDashboard]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">{error}</div>
            <div className="mt-4 text-center">
              <Button onClick={loadGroupDashboard}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group || !stats) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              그룹을 찾을 수 없습니다
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* 그룹 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{group.member_count}명의 멤버</span>
            <span>•</span>
            <span>초대 코드: {group.invite_code}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* 현재 사용자가 소유자가 아닌 경우에만 나가기 버튼 표시 */}
          {currentUserId &&
            group.memberships.find((m) => m.user_id === currentUserId)?.role !==
              "owner" && (
              <Button
                variant="outline"
                onClick={handleLeaveGroup}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                그룹 나가기
              </Button>
            )}
          <Button variant="outline" onClick={() => navigate("/groups")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">멤버 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberCount}</div>
            <p className="text-xs text-muted-foreground">활성 멤버</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">그룹 포인트</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              완료된 태스크 기준 (태스크당 10점)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 포인트</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePoints}</div>
            <p className="text-xs text-muted-foreground">멤버당 평균 포인트</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 완료</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.thisWeekCompletedTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              이번 주 완료된 태스크 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 완료율</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageCompletionRate}%
            </div>
            <p className="text-xs text-muted-foreground">전체 태스크 완료율</p>
          </CardContent>
        </Card>
      </div>

      {/* 포인트 정책 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            포인트 정책
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                완료된 태스크: <strong>10 포인트</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>진행률 100% 달성 시 완료 처리</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            * 현재는 완료된 태스크에 대해서만 포인트가 부여됩니다
          </div>
        </CardContent>
      </Card>

      {/* 멤버 진행상황 */}
      <Card>
        <CardHeader>
          <CardTitle>멤버 진행상황 (이번 주)</CardTitle>
        </CardHeader>
        <CardContent>
          {membersProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              진행상황 데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {membersProgress.map((memberData, index) => (
                <div
                  key={memberData.member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* 순위 */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold">
                      {index + 1}
                    </div>

                    {/* 프로필 */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {memberData.member.user.avatar_url ? (
                          <img
                            src={memberData.member.user.avatar_url}
                            alt={
                              memberData.member.user.full_name ||
                              memberData.member.user.username ||
                              ""
                            }
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {(memberData.member.user.full_name ||
                              memberData.member.user.username ||
                              "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {memberData.member.user.full_name ||
                            memberData.member.user.username ||
                            "사용자"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {memberData.member.role === "owner"
                            ? "그룹장"
                            : memberData.member.role === "admin"
                            ? "관리자"
                            : "멤버"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 진행상황 */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg text-blue-600">
                        {memberData.progress.points.toFixed(2)}
                      </div>
                      <div className="text-gray-500">포인트</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {memberData.progress.completedTasks}/
                        {memberData.progress.totalTasks}
                      </div>
                      <div className="text-gray-500">완료율</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(memberData.progress.totalTimeMinutes)}
                      </div>
                      <div className="text-gray-500">총 시간</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {memberData.progress.completionRate.toFixed(2)}%
                      </div>
                      <div className="text-gray-500">달성률</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
