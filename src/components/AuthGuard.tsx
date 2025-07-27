import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireProfile?: boolean; // 프로필 설정이 필요한 페이지인지
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireProfile = true,
}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const checkProfile = useCallback(async () => {
    if (!user || !requireProfile) {
      setProfileChecked(true);
      return;
    }

    try {
      setProfileLoading(true);
      const profile = await getProfile();

      // full_name이 없으면 프로필 설정 페이지로 리다이렉트
      if (!profile.full_name) {
        navigate("/profile-setup");
        return;
      }

      setProfileChecked(true);
    } catch (error) {
      console.error("프로필 확인 실패:", error);
      // 프로필을 가져올 수 없으면 프로필 설정 페이지로 이동
      navigate("/profile-setup");
    } finally {
      setProfileLoading(false);
    }
  }, [user, requireProfile, navigate]);

  useEffect(() => {
    if (user && !profileChecked) {
      checkProfile();
    }
  }, [user, profileChecked, checkProfile]);

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  if (requireProfile && !profileChecked) {
    return null; // 프로필 확인 중이거나 리다이렉트 중
  }

  return <>{children}</>;
};
