import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";

type AuthMode = "login" | "signup";

interface AuthProps {
  onSuccess?: () => void;
  defaultMode?: AuthMode;
}

export const Auth: React.FC<AuthProps> = ({
  onSuccess,
  defaultMode = "login",
}) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  const handleSignUpSuccess = () => {
    // 회원가입 성공 시 프로필 설정 페이지로 이동
    navigate("/profile-setup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {mode === "login" ? (
        <LoginForm onSuccess={onSuccess} onToggleMode={toggleMode} />
      ) : (
        <SignUpForm onSuccess={handleSignUpSuccess} onToggleMode={toggleMode} />
      )}
    </div>
  );
};
