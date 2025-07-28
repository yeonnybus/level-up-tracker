import { supabase } from "../lib/supabase";
import type {
  CreateGroupForm,
  Group,
  GroupMembership,
  GroupSharedTask,
  GroupSharedTaskWithDetails,
  GroupWithMembers,
} from "../types";
import { getWeekStart } from "../utils";

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

  // 권한 확인 (owner만)
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    throw new Error("그룹을 삭제할 권한이 없습니다");
  }

  // 그룹 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

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
  data: { name: string; description?: string }
): Promise<Group> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 권한 확인 (owner 또는 admin)
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    throw new Error("그룹을 수정할 권한이 없습니다");
  }

  const { data: group, error } = await supabase
    .from("groups")
    .update({
      name: data.name,
      description: data.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
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

  // 그룹의 모든 멤버 조회 - RPC 함수 사용
  const { data: memberships, error: membershipsError } = await supabase.rpc(
    "get_group_memberships",
    { group_id_param: groupId }
  );

  if (membershipsError) {
    throw membershipsError;
  }

  // 멤버들의 프로필 정보를 RPC 함수로 조회 (RLS 우회)
  let profilesData: Array<{
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }> = [];

  if (memberships && memberships.length > 0) {
    // RPC 함수 사용해서 그룹 멤버 프로필 조회
    const { data: rpcProfiles, error: rpcError } = await supabase.rpc(
      "get_group_member_profiles",
      { group_id_param: groupId }
    );

    if (rpcProfiles) {
      profilesData = rpcProfiles.map(
        (p: {
          user_id: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
        }) => ({
          id: p.user_id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        })
      );
    }

    // 프로필이 없는 멤버들을 위한 기본 프로필 생성
    const userIds = memberships.map((m) => m.user_id);
    const missingProfileUserIds = userIds.filter(
      (userId: string) => !profilesData.find((p) => p.id === userId)
    );

    if (missingProfileUserIds.length > 0) {
      for (const userId of missingProfileUserIds) {
        try {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              user_id: userId,
              full_name: null,
              username: null,
              avatar_url: null,
            })
            .select()
            .single();

          if (newProfile) {
            profilesData.push(newProfile);
          }
        } catch (error) {
          // 프로필 생성 실패 시 무시
        }
      }
    }
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
            full_name: userProfile?.full_name || "새 멤버",
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

  // RPC 함수로 그룹 멤버십 조회 (RLS 우회)
  const { data: groupMembers, error: membersError } = await supabase.rpc(
    "get_group_memberships",
    { group_id_param: groupId }
  );

  if (membersError) {
    throw membersError;
  }

  const memberCount = groupMembers?.length || 0;

  // 이번 주 시작일 계산 (getWeekStart 함수 사용)
  const weekStartStr = getWeekStart(); // "2025-07-28" 형식

  let totalGroupPoints = 0;
  let thisWeekActivity = 0;
  let thisWeekCompletedTasks = 0;
  let averageCompletionRate = 0;

  if (groupMembers && groupMembers.length > 0) {
    // RPC 함수로 그룹 멤버들의 태스크 조회
    const { data: allGroupTasks, error: tasksError } = await supabase.rpc(
      "get_group_member_tasks",
      { group_id_param: groupId }
    );

    if (tasksError) {
      throw tasksError;
    }

    if (allGroupTasks) {
      // 멤버별로 데이터를 그룹화하여 더 정확한 통계 계산
      let totalCompletionRates = 0;
      let totalMembersCount = 0; // 전체 멤버 수

      groupMembers.forEach((member: any) => {
        totalMembersCount++; // 모든 멤버를 카운트

        const memberTasks = allGroupTasks.filter(
          (task: any) => task.user_id === member.user_id
        );

        // 이번 주 태스크인지 확인 (week_start 기준)
        const thisWeekTasks = memberTasks.filter((task: any) => {
          if (!task.week_start) {
            return false;
          }

          // 문자열로 직접 비교
          const isMatch = task.week_start === weekStartStr;
          return isMatch;
        });

        // 이번 주 태스크 중 완료된 것
        const thisWeekCompletedTasksForMember = thisWeekTasks.filter(
          (task: any) => task.status === "completed"
        );

        // 이번 주 완료 태스크 수 합산
        thisWeekCompletedTasks += thisWeekCompletedTasksForMember.length;

        // 완료율 계산 - 이번 주 태스크 기준으로 변경!
        let completionRate = 0;
        if (thisWeekTasks.length > 0) {
          completionRate =
            (thisWeekCompletedTasksForMember.length / thisWeekTasks.length) *
            100;
        }
        // 모든 멤버의 완료율을 합산 (이번 주 태스크가 없으면 0%)
        totalCompletionRates += completionRate;
      });

      // 전체 완료된 태스크 (포인트 계산용)
      const allCompletedTasks = allGroupTasks.filter(
        (task: any) => task.status === "completed"
      );

      // 포인트 계산 정책
      totalGroupPoints = allCompletedTasks.length * 10; // 완료된 태스크당 10점
      thisWeekActivity = thisWeekCompletedTasks; // 이번 주 완료 태스크 수

      // 평균 완료율 계산 - 전체 멤버 수로 나누기
      averageCompletionRate =
        totalMembersCount > 0
          ? Math.round(totalCompletionRates / totalMembersCount)
          : 0;
    }
  }

  return {
    memberCount,
    totalPoints: totalGroupPoints,
    thisWeekActivity,
    averagePoints: memberCount ? Math.round(totalGroupPoints / memberCount) : 0,
    thisWeekCompletedTasks,
    averageCompletionRate,
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

  // 그룹 멤버들 조회 - RPC 함수 사용
  const { data: members, error: membersError } = await supabase.rpc(
    "get_group_memberships",
    { group_id_param: groupId }
  );

  if (!members) return [];

  // 이번 주 시작일 (getWeekStart 함수 사용)
  const weekStartStr = getWeekStart(); // "2025-07-28" 형식

  // 각 멤버의 진행상황 조회 - RPC 함수 사용
  // RPC로 모든 그룹 멤버의 태스크 조회
  const { data: allGroupTasks, error: tasksRpcError } = await supabase.rpc(
    "get_group_member_tasks",
    { group_id_param: groupId }
  );

  // RPC로 모든 그룹 멤버의 타임로그 조회
  const { data: allGroupTimeLogs, error: timeLogsRpcError } =
    await supabase.rpc("get_group_member_time_logs", {
      group_id_param: groupId,
    });

  // RPC로 프로필 조회
  const { data: rpcProfiles } = await supabase.rpc(
    "get_group_member_profiles",
    { group_id_param: groupId }
  );

  // 각 멤버의 진행상황 계산
  const membersProgress = members.map((member) => {
    // 프로필 정보 (RPC 결과에서 찾기)
    const profile = rpcProfiles?.find((p: any) => p.user_id === member.user_id);

    // 해당 멤버의 태스크들 필터링
    const memberTasks =
      allGroupTasks?.filter((t: any) => t.user_id === member.user_id) || [];

    // 이번 주 태스크들 (week_start 기준)
    const weekTasks = memberTasks.filter((t: any) => {
      return t.week_start === weekStartStr;
    });

    // 전체 완료된 태스크
    const allCompletedTasks = memberTasks.filter(
      (t: any) => t.status === "completed"
    );

    // 이번 주 완료된 태스크
    const weekCompletedTasks = weekTasks.filter(
      (t: any) => t.status === "completed"
    );

    // 이번 주 활성 태스크
    const weekActiveTasks = weekTasks.filter((t: any) => t.status === "active");

    // 해당 멤버의 타임로그들 (이번 주)
    const weekStartDate = new Date(weekStartStr);
    const memberTimeLogs =
      allGroupTimeLogs?.filter((log: any) => {
        if (log.user_id !== member.user_id) return false;
        const logDate = new Date(log.start_time);
        return logDate >= weekStartDate;
      }) || [];

    // 총 시간 계산
    const totalMinutes = memberTimeLogs.reduce(
      (sum: number, log: any) => sum + (log.duration_minutes || 0),
      0
    );

    // 개인 포인트 계산 (전체 완료된 태스크 기준)
    const memberPoints = allCompletedTasks.length * 10;

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
          full_name: profile?.full_name || "새 멤버",
          avatar_url: profile?.avatar_url || null,
        },
      },
      progress: {
        completedTasks: weekCompletedTasks.length,
        activeTasks: weekActiveTasks.length,
        totalTasks: weekTasks.length,
        totalTimeMinutes: totalMinutes,
        points: memberPoints,
        completionRate: weekTasks.length
          ? Math.round((weekCompletedTasks.length / weekTasks.length) * 100)
          : 0,
      },
    };
  });

  // 포인트 순으로 정렬
  const sortedProgress = membersProgress.sort(
    (a, b) => b.progress.points - a.progress.points
  );

  return sortedProgress;
};

// 멤버 역할 변경 (owner만 가능)
export const changeGroupMemberRole = async (
  groupId: string,
  userId: string,
  newRole: "admin" | "member"
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 권한 확인 (owner만)
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    throw new Error("멤버 역할을 변경할 권한이 없습니다");
  }

  // 역할 변경
  const { error } = await supabase
    .from("group_memberships")
    .update({ role: newRole })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
};

// 멤버 추방 (owner/admin만 가능)
export const removeGroupMember = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 권한 확인 (owner 또는 admin)
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    throw new Error("멤버를 추방할 권한이 없습니다");
  }

  // 대상 멤버의 역할 확인 (owner는 추방할 수 없음)
  const { data: targetMembership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (targetMembership?.role === "owner") {
    throw new Error("그룹 소유자는 추방할 수 없습니다");
  }

  // admin이 다른 admin을 추방하려는 경우 확인
  if (membership.role === "admin" && targetMembership?.role === "admin") {
    throw new Error("관리자는 다른 관리자를 추방할 수 없습니다");
  }

  // 멤버 제거
  const { error } = await supabase
    .from("group_memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
};

// 그룹 소유권 양도 (owner만 가능)
export const transferGroupOwnership = async (
  groupId: string,
  newOwnerId: string
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  // 권한 확인 (owner만)
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    throw new Error("그룹 소유권을 양도할 권한이 없습니다");
  }

  // 새 소유자가 그룹 멤버인지 확인
  const { data: newOwnerMembership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", newOwnerId)
    .single();

  if (!newOwnerMembership) {
    throw new Error("새 소유자가 그룹 멤버가 아닙니다");
  }

  // 트랜잭션으로 소유권 양도
  // 1. 현재 소유자를 admin으로 변경
  const { error: currentOwnerError } = await supabase
    .from("group_memberships")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", user.user.id);

  if (currentOwnerError) throw currentOwnerError;

  // 2. 새 소유자를 owner로 변경
  const { error: newOwnerError } = await supabase
    .from("group_memberships")
    .update({ role: "owner" })
    .eq("group_id", groupId)
    .eq("user_id", newOwnerId);

  if (newOwnerError) {
    // 롤백: 현재 소유자를 다시 owner로 변경
    await supabase
      .from("group_memberships")
      .update({ role: "owner" })
      .eq("group_id", groupId)
      .eq("user_id", user.user.id);

    throw newOwnerError;
  }
};
