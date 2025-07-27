import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/auth";
import { ProfileSetupForm } from "../components/ProfileSetupForm";

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const checkProfileStatus = useCallback(async () => {
    try {
      const profile = await getProfile();

      // full_name이 없으면 프로필 설정이 필요
      if (!profile.full_name) {
        setNeedsSetup(true);
      } else {
        // 이미 프로필이 설정되어 있으면 대시보드로 이동
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("프로필 상태 확인 실패:", error);
      setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkProfileStatus();
  }, [checkProfileStatus]);

  const handleProfileSetupSuccess = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!needsSetup) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ProfileSetupForm
          onSuccess={handleProfileSetupSuccess}
          isInitialSetup={true}
        />
      </div>
    </div>
  );
};
