import { CheckCircle, Mail, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { supabase } from "../lib/supabase";

export const EmailVerificationPage: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: user.email,
        });

        if (error) {
          setResendMessage(
            "이메일 재발송에 실패했습니다. 잠시 후 다시 시도해주세요."
          );
        } else {
          setResendMessage(
            "인증 이메일이 재발송되었습니다. 이메일을 확인해주세요."
          );
        }
      }
    } catch {
      setResendMessage("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            이메일을 확인해주세요
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-gray-600">
              회원가입이 완료되었습니다!
              <br />
              가입하신 이메일 주소로 인증 링크를 발송했습니다.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">다음 단계:</span>
              </div>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>이메일 받은편지함을 확인하세요</li>
                <li>스팸 폴더도 확인해보세요</li>
                <li>이메일의 "계정 인증" 링크를 클릭하세요</li>
                <li>인증 완료 후 로그인해주세요</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  인증 이메일 재발송
                </>
              )}
            </Button>

            {resendMessage && (
              <div
                className={`text-sm text-center p-3 rounded ${
                  resendMessage.includes("재발송되었습니다")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {resendMessage}
              </div>
            )}

            <Button
              onClick={handleBackToLogin}
              variant="default"
              className="w-full"
            >
              로그인 페이지로 돌아가기
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            이메일이 오지 않나요?
            <br />
            스팸 폴더를 확인하거나 몇 분 후 "인증 이메일 재발송" 버튼을
            눌러보세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
