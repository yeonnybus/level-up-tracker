import React, { useCallback, useEffect, useState } from "react";
import { getProfile, signOut } from "../api/auth";
import { ProfileSetupForm } from "../components/ProfileSetupForm";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getProfile();
      setProfile(profileData);
    } catch (err) {
      console.error("프로필 로딩 실패:", err);
      setError(
        err instanceof Error ? err.message : "프로필을 불러오는데 실패했습니다"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdateSuccess = () => {
    setShowProfileEdit(false);
    loadProfile(); // 프로필 데이터 새로고침
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/"; // 로그인 페이지로 리다이렉트
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">{error}</div>
            <div className="mt-4 text-center">
              <Button onClick={loadProfile}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showProfileEdit) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowProfileEdit(false)}
            className="mb-4"
          >
            ← 뒤로 가기
          </Button>
        </div>
        <ProfileSetupForm
          onSuccess={handleProfileUpdateSuccess}
          isInitialSetup={false}
          initialData={
            profile
              ? {
                  username: profile.username || undefined,
                  full_name: profile.full_name || undefined,
                  avatar_url: profile.avatar_url || undefined,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-gray-600">계정 및 앱 설정을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* 프로필 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 설정</CardTitle>
            <CardDescription>
              프로필 정보를 확인하고 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || profile.username || ""}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-medium text-gray-600">
                        {(profile.full_name ||
                          profile.username ||
                          "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-lg">
                      {profile.full_name || "이름 없음"}
                    </div>
                    <div className="text-gray-500">
                      @{profile.username || "사용자명 없음"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">이름:</span>{" "}
                    {profile.full_name || "설정되지 않음"}
                  </div>
                  <div>
                    <span className="font-medium">사용자명:</span>{" "}
                    {profile.username || "설정되지 않음"}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">가입일:</span>{" "}
                    {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setShowProfileEdit(true)}>
                프로필 수정
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 계정 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 설정</CardTitle>
            <CardDescription>계정 관련 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">로그아웃</h4>
                  <p className="text-sm text-gray-500">
                    현재 세션에서 로그아웃합니다
                  </p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>알림 옵션을 설정할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">
              알림 설정 기능은 향후 업데이트에서 제공될 예정입니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
