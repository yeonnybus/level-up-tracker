import { supabase } from "../lib/supabase";
import type {
  CreateGroupForm,
  Group,
  GroupMembership,
  GroupSharedTask,
  GroupSharedTaskWithDetails,
  GroupWithMembers,
} from "../types";

// 그룹 생성
export const createGroup = async (data: CreateGroupForm): Promise<Group> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      ...data,
      created_by: user.user.id,
      invite_code: "", // 트리거에서 자동 생성
    })
    .select()
    .single();

  if (error) throw error;

  // 그룹 생성자를 owner로 자동 추가
  await supabase.from("group_memberships").insert({
    group_id: group.id,
    user_id: user.user.id,
    role: "owner",
  });

  return group;
};

// 사용자가 속한 그룹 목록 조회 (RLS 정책 문제 임시 우회)
export const getUserGroups = async (): Promise<
  (GroupWithMembers & { currentUserMembership: GroupMembership })[]
> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 1. 사용자의 멤버십만 먼저 조회 (RLS 정책 우회)
  const { data: userMemberships, error: membershipError } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("user_id", user.user.id);

  if (membershipError) throw membershipError;

  if (!userMemberships || userMemberships.length === 0) {
    return [];
  }

  // 2. 그룹 정보 조회
  const groupIds = userMemberships.map((m) => m.group_id);
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds);

  if (groupsError) throw groupsError;

  // 3. 간단한 형태로 반환 (멤버 목록은 나중에 별도 구현)
  const groupsWithMembers =
    groups?.map((group) => {
      const currentUserMembership = userMemberships.find(
        (m) => m.group_id === group.id
      );

      return {
        ...group,
        memberships: [], // 임시로 빈 배열
        member_count: 1, // 임시로 1 (현재 사용자만)
        currentUserMembership: currentUserMembership!,
      };
    }) || [];

  return groupsWithMembers;
};

// 초대 코드로 그룹 참여
export const joinGroup = async (
  inviteCode: string
): Promise<GroupMembership> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 초대 코드로 그룹 찾기
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (groupError || !group) {
    throw new Error("유효하지 않은 초대 코드입니다");
  }

  // 이미 멤버인지 확인
  const { data: existingMembership } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", user.user.id)
    .single();

  if (existingMembership) {
    throw new Error("이미 해당 그룹의 멤버입니다");
  }

  // 멤버십 생성
  const { data: membership, error } = await supabase
    .from("group_memberships")
    .insert({
      group_id: group.id,
      user_id: user.user.id,
      role: "member",
    })
    .select()
    .single();

  if (error) throw error;
  return membership;
};

// 그룹 탈퇴
export const leaveGroup = async (groupId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("group_memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.user.id);

  if (error) throw error;
};

// 그룹 삭제 (owner만 가능)
export const deleteGroup = async (groupId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("created_by", user.user.id);

  if (error) throw error;
};

// 태스크를 그룹에 공유
export const shareTaskToGroup = async (
  groupId: string,
  taskId: string
): Promise<GroupSharedTask> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: sharedTask, error } = await supabase
    .from("group_shared_tasks")
    .insert({
      group_id: groupId,
      task_id: taskId,
      shared_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return sharedTask;
};

// 그룹의 공유된 태스크 목록 조회
export const getGroupSharedTasks = async (
  groupId: string
): Promise<GroupSharedTaskWithDetails[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 먼저 group_shared_tasks와 tasks를 조회
  const { data: sharedTasks, error } = await supabase
    .from("group_shared_tasks")
    .select(
      `
      *,
      tasks!inner(*)
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false });

  if (error) throw error;

  if (!sharedTasks || sharedTasks.length === 0) {
    return [];
  }

  // shared_by 사용자들의 프로필 정보를 별도로 조회
  const sharedByIds = [...new Set(sharedTasks.map((st) => st.shared_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", sharedByIds);

  // 결과 조합
  return sharedTasks.map((st) => {
    const sharedByProfile = profiles?.find((p) => p.id === st.shared_by);

    return {
      ...st,
      task: st.tasks,
      shared_by_user: {
        id: st.shared_by,
        username: sharedByProfile?.username || null,
        full_name: sharedByProfile?.full_name || null,
      },
    };
  });
};

// 그룹 정보 업데이트 (owner/admin만 가능)
export const updateGroup = async (
  groupId: string,
  data: Partial<CreateGroupForm>
): Promise<Group> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: group, error } = await supabase
    .from("groups")
    .update(data)
    .eq("id", groupId)
    .eq("created_by", user.user.id)
    .select()
    .single();

  if (error) throw error;
  return group;
};

// 그룹 상세 정보 조회 (멤버 목록 포함)
export const getGroupDetails = async (
  groupId: string
): Promise<GroupWithMembers> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 그룹 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError) throw groupError;

  // 현재 사용자가 이 그룹의 멤버인지 확인
  const { error: membershipError } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (membershipError) throw new Error("그룹에 접근할 권한이 없습니다");

  // 그룹의 모든 멤버 조회
  const { data: memberships, error: membershipsError } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId);

  if (membershipsError) throw membershipsError;

  // 멤버들의 프로필 정보를 별도로 조회
  let profilesData: Array<{
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }> = [];
  if (memberships && memberships.length > 0) {
    const userIds = memberships.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    profilesData = profiles || [];
  }

  return {
    ...group,
    memberships:
      memberships?.map((m) => {
        const userProfile = profilesData.find((p) => p.id === m.user_id);
        return {
          ...m,
          user: {
            id: m.user_id,
            username: userProfile?.username || null,
            full_name: userProfile?.full_name || null,
            avatar_url: userProfile?.avatar_url || null,
          },
        };
      }) || [],
    member_count: memberships?.length || 0,
  };
};

// 그룹 대시보드 통계 조회
export const getGroupDashboardStats = async (groupId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 현재 사용자가 그룹 멤버인지 확인
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (!membership) throw new Error("그룹에 접근할 권한이 없습니다");

  // 그룹 멤버 수
  const { count: memberCount } = await supabase
    .from("group_memberships")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  // 이번 주 시작일 계산
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // 월요일
  weekStart.setHours(0, 0, 0, 0);

  // 그룹 포인트 계산 (멤버들의 완료된 태스크 기준)
  const { data: groupMembers } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId);

  let totalGroupPoints = 0;
  let thisWeekActivity = 0;

  if (groupMembers) {
    const memberIds = groupMembers.map((m) => m.user_id);

    // 완료된 태스크 기준 포인트 계산
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*")
      .in("user_id", memberIds)
      .eq("status", "completed");

    // 이번 주 활동 (완료된 태스크)
    const { data: thisWeekTasks } = await supabase
      .from("tasks")
      .select("*")
      .in("user_id", memberIds)
      .eq("status", "completed")
      .gte("updated_at", weekStart.toISOString());

    // 포인트 계산 정책
    totalGroupPoints = (completedTasks?.length || 0) * 10; // 완료된 태스크당 10점
    thisWeekActivity = thisWeekTasks?.length || 0;
  }

  return {
    memberCount: memberCount || 0,
    totalPoints: totalGroupPoints,
    thisWeekActivity,
    averagePoints: memberCount ? Math.round(totalGroupPoints / memberCount) : 0,
  };
};

// 그룹원들의 태스크 진행상황 요약 조회
export const getGroupMembersProgress = async (groupId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 권한 확인
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (!membership) throw new Error("그룹에 접근할 권한이 없습니다");

  // 그룹 멤버들 조회
  const { data: members } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId);

  if (!members) return [];

  // 이번 주 시작일
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  // 각 멤버의 진행상황 조회
  const membersProgress = await Promise.all(
    members.map(async (member) => {
      // 프로필 정보 조회
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", member.user_id)
        .single();

      // 이번 주 태스크 통계
      const { data: weekTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", member.user_id)
        .gte("week_start", weekStart.toISOString().split("T")[0]);

      // 완료된 태스크
      const completedTasks =
        weekTasks?.filter((t) => t.status === "completed") || [];

      // 활성 태스크
      const activeTasks = weekTasks?.filter((t) => t.status === "active") || [];

      // 시간 로그 합계 (이번 주)
      const { data: timeLogs } = await supabase
        .from("task_time_logs")
        .select("duration_minutes")
        .eq("user_id", member.user_id)
        .gte("created_at", weekStart.toISOString());

      const totalMinutes =
        timeLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) ||
        0;

      // 개인 포인트 계산
      const memberPoints = completedTasks.length * 10;

      return {
        member: {
          id: member.id,
          group_id: member.group_id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          user: {
            id: member.user_id,
            username: profile?.username || null,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
          },
        },
        progress: {
          completedTasks: completedTasks.length,
          activeTasks: activeTasks.length,
          totalTasks: weekTasks?.length || 0,
          totalTimeMinutes: totalMinutes,
          points: memberPoints,
          completionRate: weekTasks?.length
            ? Math.round((completedTasks.length / weekTasks.length) * 100)
            : 0,
        },
      };
    })
  );

  // 포인트 순으로 정렬
  return membersProgress.sort((a, b) => b.progress.points - a.progress.points);
};
