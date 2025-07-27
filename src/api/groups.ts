import { supabase } from "../lib/supabase";
import type {
  CreateGroupForm,
  Group,
  GroupMembership,
  GroupSharedTask,
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

// 사용자가 속한 그룹 목록 조회
export const getUserGroups = async (): Promise<GroupWithMembers[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: memberships, error } = await supabase
    .from("group_memberships")
    .select(
      `
      *,
      groups!inner(*)
    `
    )
    .eq("user_id", user.user.id);

  if (error) throw error;

  // 각 그룹의 멤버 정보 가져오기
  const groupsWithMembers = await Promise.all(
    (memberships || []).map(async (membership) => {
      const { data: allMemberships } = await supabase
        .from("group_memberships")
        .select(
          `
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("group_id", membership.groups.id);

      return {
        ...membership.groups,
        memberships:
          allMemberships?.map((m) => ({
            ...m,
            user: {
              id: m.profiles.id,
              username: m.profiles.username,
              full_name: m.profiles.full_name,
              avatar_url: m.profiles.avatar_url,
            },
          })) || [],
        member_count: allMemberships?.length || 0,
      };
    })
  );

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
export const getGroupSharedTasks = async (groupId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("로그인이 필요합니다");

  const { data: sharedTasks, error } = await supabase
    .from("group_shared_tasks")
    .select(
      `
      *,
      tasks!inner(*),
      profiles!shared_by(
        id,
        username,
        full_name
      )
    `
    )
    .eq("group_id", groupId);

  if (error) throw error;

  return (
    sharedTasks?.map((st) => ({
      ...st,
      task: st.tasks,
      shared_by_user: {
        id: st.profiles.id,
        username: st.profiles.username,
        full_name: st.profiles.full_name,
      },
    })) || []
  );
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
