import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import React, { useState } from "react";

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

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {mode === "login" ? (
        <LoginForm onSuccess={onSuccess} onToggleMode={toggleMode} />
      ) : (
        <SignUpForm onSuccess={onSuccess} onToggleMode={toggleMode} />
      )}
    </div>
  );
};
