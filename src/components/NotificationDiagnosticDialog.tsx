import { Bell, BellRing, Info } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface NotificationDiagnosticDialogProps {
  trigger?: React.ReactNode;
}

export const NotificationDiagnosticDialog: React.FC<
  NotificationDiagnosticDialogProps
> = ({ trigger }) => {
  const [open, setOpen] = useState(false);

  const getNotificationStatus = () => {
    if (!("Notification" in window)) {
      return {
        supported: false,
        permission: "unsupported",
        message: "이 브라우저는 웹 알림을 지원하지 않습니다.",
        color: "red",
      };
    }

    const permission = Notification.permission;
    switch (permission) {
      case "granted":
        return {
          supported: true,
          permission,
          message: "알림 권한이 허용되어 있습니다.",
          color: "green",
        };
      case "denied":
        return {
          supported: true,
          permission,
          message: "알림 권한이 차단되어 있습니다.",
          color: "red",
        };
      case "default":
        return {
          supported: true,
          permission,
          message: "알림 권한을 요청해야 합니다.",
          color: "yellow",
        };
      default:
        return {
          supported: true,
          permission,
          message: "알 수 없는 권한 상태입니다.",
          color: "gray",
        };
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      console.log("알림 권한 요청 결과:", permission);
      // 상태가 변경되면 다이얼로그가 자동으로 업데이트됩니다
    } catch (error) {
      console.error("알림 권한 요청 실패:", error);
    }
  };

  const status = getNotificationStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            알림 설정
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            알림 진단 및 설정
          </DialogTitle>
          <DialogDescription>
            포모도로 타이머 알림 설정을 확인하고 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 상태 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  status.color === "green"
                    ? "bg-green-500"
                    : status.color === "red"
                    ? "bg-red-500"
                    : status.color === "yellow"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
              <span className="font-medium">
                {status.supported ? "웹 알림 지원됨" : "웹 알림 미지원"}
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>권한 상태:</strong> {status.permission}
            </div>

            <div className="text-sm">{status.message}</div>
          </div>

          {/* 권한 요청 버튼 */}
          {status.permission === "default" && (
            <Button onClick={requestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              알림 권한 요청
            </Button>
          )}

          {/* 설정 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
              <Info className="h-4 w-4" />
              설정 안내
            </div>

            {status.permission === "denied" ? (
              <div className="text-blue-700 space-y-2">
                <p>
                  <strong>알림이 차단된 경우:</strong>
                </p>
                <div className="text-xs space-y-1">
                  <p>• Chrome: 주소창 왼쪽 🔒 → 알림 → 허용</p>
                  <p>• 또는 chrome://settings/content/notifications</p>
                  <p>• macOS: 시스템 환경설정 → 알림 및 포커스 → Chrome</p>
                </div>
              </div>
            ) : status.permission === "granted" ? (
              <div className="text-blue-700 space-y-2">
                <p>
                  <strong>알림이 보이지 않는 경우:</strong>
                </p>
                <div className="text-xs space-y-1">
                  <p>
                    • 브라우저가 포커스되어 있으면 알림이 보이지 않을 수 있음
                  </p>
                  <p>• macOS: 시스템 환경설정에서 Chrome 알림 확인</p>
                  <p>• 다른 앱으로 전환한 후 알림 테스트</p>
                </div>
              </div>
            ) : (
              <div className="text-blue-700 space-y-2">
                <p>
                  <strong>포모도로 알림 받기:</strong>
                </p>
                <div className="text-xs space-y-1">
                  <p>• 위의 "알림 권한 요청" 버튼을 클릭하세요</p>
                  <p>• 브라우저에서 "허용"을 선택하세요</p>
                  <p>• 권한 허용 후 포모도로 타이머를 사용하세요</p>
                </div>
              </div>
            )}
          </div>

          {/* 시스템 정보 */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              시스템 정보 보기
            </summary>
            <div className="mt-2 space-y-1 font-mono bg-gray-50 p-2 rounded">
              <div>
                브라우저:{" "}
                {navigator.userAgent.includes("Chrome") ? "Chrome" : "Other"}
              </div>
              <div>플랫폼: {navigator.platform}</div>
              <div>포커스: {document.hasFocus() ? "Yes" : "No"}</div>
              <div>가시성: {document.visibilityState}</div>
            </div>
          </details>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
