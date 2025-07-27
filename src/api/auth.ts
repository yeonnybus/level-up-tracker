import { supabase } from "../lib/supabase";

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// 프로필 관련 함수들
export const getProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 프로필이 없는 경우 생성
  if (error && error.code === "PGRST116") {
    console.log("프로필이 없어서 새로 생성합니다.");
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        user_id: user.id, // user_id 필드도 추가
        full_name: null,
        avatar_url: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("프로필 생성 실패:", insertError);
      throw insertError;
    }
    return newProfile;
  }

  if (error) {
    console.error("프로필 조회 실패:", error);
    throw error;
  }

  return data;
};

export const updateProfile = async (profileData: {
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  // 먼저 기존 프로필이 있는지 확인
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  const updateData: {
    id?: string;
    user_id?: string; // user_id 필드 추가
    updated_at?: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } = {
    updated_at: new Date().toISOString(),
  };

  // username이 제공된 경우만 업데이트
  if (profileData.username !== undefined) {
    updateData.username = profileData.username?.trim() || null;
  }

  // full_name은 반드시 업데이트
  if (profileData.full_name !== undefined) {
    updateData.full_name = profileData.full_name?.trim() || null;
  }

  // avatar_url이 제공된 경우만 업데이트
  if (profileData.avatar_url !== undefined) {
    updateData.avatar_url = profileData.avatar_url?.trim() || null;
  }

  console.log("Profile operation data:", updateData);

  let data, error;

  if (existingProfile) {
    // 기존 프로필이 있으면 업데이트
    console.log("Updating existing profile");
    const result = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    data = result.data;
    error = result.error;
  } else {
    // 기존 프로필이 없으면 새로 생성
    console.log("Creating new profile");
    updateData.id = user.id;
    updateData.user_id = user.id; // user_id도 설정

    const result = await supabase
      .from("profiles")
      .insert(updateData)
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Profile operation error:", error);
    throw error;
  }

  return data;
};

export const checkUsernameAvailability = async (username: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return !data; // 데이터가 없으면 사용 가능
};
