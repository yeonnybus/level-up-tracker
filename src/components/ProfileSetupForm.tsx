import { CheckCircle, Loader2, User } from "lucide-react";
import React, { useState } from "react";
import { checkUsernameAvailability, updateProfile } from "../api/auth";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ProfileSetupFormProps {
  onSuccess: () => void;
  isInitialSetup?: boolean; // 최초 설정인지 여부
  initialData?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({
  onSuccess,
  isInitialSetup = false,
  initialData,
}) => {
  const [username, setUsername] = useState(initialData?.username || "");
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const checkUsername = async (value: string) => {
    if (!value.trim() || value === initialData?.username) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const isAvailable = await checkUsernameAvailability(value);
      setUsernameAvailable(isAvailable);
    } catch (err) {
      console.error("사용자명 확인 실패:", err);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    // 사용자명 유효성 검사 (영문, 숫자, 언더스코어만 허용)
    const isValid = /^[a-zA-Z0-9_]*$/.test(value);
    if (!isValid && value !== "") {
      setError("사용자명은 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.");
      return;
    }

    setError(null);

    // 디바운싱을 위한 타이머
    const timer = setTimeout(() => {
      if (value.length >= 3) {
        checkUsername(value);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (username.trim() && username.length < 3) {
      setError("사용자명은 3자 이상이어야 합니다.");
      return;
    }

    if (username.trim() && usernameAvailable === false) {
      setError("이미 사용 중인 사용자명입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfile({
        username: username.trim() || null,
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isInitialSetup ? "프로필 설정" : "프로필 수정"}
        </CardTitle>
        <CardDescription className="text-center">
          {isInitialSetup
            ? "레벨업 트래커 사용을 위해 프로필을 설정해주세요"
            : "프로필 정보를 수정하세요"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">이름 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="실제 이름을 입력하세요"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">사용자명 (선택사항)</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="고유한 사용자명 (영문, 숫자, _)"
                value={username}
                onChange={handleUsernameChange}
                disabled={loading}
                className="pl-10"
              />
              {usernameChecking && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {usernameAvailable === true && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {usernameAvailable === false && (
                <div className="absolute right-3 top-3 h-4 w-4 rounded-full bg-red-500" />
              )}
            </div>
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-amber-600">
                사용자명은 3자 이상이어야 합니다
              </p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-600">
                사용 가능한 사용자명입니다
              </p>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-red-600">
                이미 사용 중인 사용자명입니다
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">프로필 이미지 URL (선택사항)</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/profile.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isInitialSetup ? "프로필 설정 완료" : "프로필 수정"}
          </Button>

          {isInitialSetup && (
            <p className="text-xs text-gray-500 text-center">
              나중에 설정에서 언제든 수정할 수 있습니다
            </p>
          )}
        </CardContent>
      </form>
    </Card>
  );
};
