// 웹 알림 유틸리티
export class NotificationManager {
  private static instance: NotificationManager;
  private hasPermission = false;
  private originalTitle: string = document.title;
  private flashInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.init();
    this.originalTitle = document.title;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async init() {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        this.hasPermission = true;
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === "granted";
      }
    }
  }

  // 탭 제목 깜빡이기 기능
  private startTitleFlash(message: string) {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
    }

    let isFlashing = false;
    this.flashInterval = setInterval(() => {
      if (isFlashing) {
        document.title = this.originalTitle;
      } else {
        document.title = `🔔 ${message}`;
      }
      isFlashing = !isFlashing;
    }, 1000); // 1초마다 깜빡임

    // 5초 후 자동으로 정지
    setTimeout(() => {
      this.stopTitleFlash();
    }, 5000);
  }

  private stopTitleFlash() {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    document.title = this.originalTitle;
  }

  // 브라우저 탭 포커스하기
  private focusTab() {
    // 창을 포커스
    window.focus();

    // 가능한 경우 브라우저 창을 앞으로 가져오기
    if (window.parent !== window) {
      window.parent.focus();
    }
  }

  // 시각적 알림 (페이지 번쩍임)
  private flashPage() {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(59, 130, 246, 0.2);
      z-index: 9999;
      pointer-events: none;
      animation: flash-animation 0.5s ease-out;
    `;

    // CSS 애니메이션 추가
    const style = document.createElement("style");
    style.textContent = `
      @keyframes flash-animation {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    }, 500);
  }

  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("이 브라우저는 웹 알림을 지원하지 않습니다.");
      return false;
    }

    console.log("현재 알림 권한 상태:", Notification.permission);

    if (Notification.permission === "granted") {
      this.hasPermission = true;
      console.log("알림 권한이 이미 허용되어 있습니다.");
      return true;
    }

    if (Notification.permission !== "denied") {
      console.log("알림 권한을 요청합니다...");
      const permission = await Notification.requestPermission();
      console.log("알림 권한 요청 결과:", permission);
      this.hasPermission = permission === "granted";
      return this.hasPermission;
    }

    console.log("알림 권한이 거부되어 있습니다.");
    return false;
  }

  public showNotification(title: string, options?: NotificationOptions) {
    console.log("=== 알림 진단 시작 ===");
    console.log("1. title:", title);
    console.log("2. hasPermission (내부):", this.hasPermission);
    console.log("3. Notification.permission (실제):", Notification.permission);
    console.log("4. options:", options);
    console.log("5. 브라우저 포커스:", document.hasFocus());
    console.log("6. 현재 시간:", new Date().toISOString());
    console.log("7. User Agent:", navigator.userAgent);
    console.log("8. 페이지 가시성:", document.visibilityState);

    // 즉시 시각적 알림 효과 실행 (권한과 관계없이)
    this.startTitleFlash(title);
    this.flashPage();

    // 탭이 백그라운드에 있으면 포커스
    if (document.visibilityState === "hidden" || !document.hasFocus()) {
      this.focusTab();
    }

    // 실제 권한 상태와 내부 상태 동기화
    if (Notification.permission === "granted") {
      this.hasPermission = true;
    } else {
      this.hasPermission = false;
    }

    if (!this.hasPermission || Notification.permission !== "granted") {
      console.log("알림 권한이 없어서 alert로 대체합니다.");
      alert(`${title}\n${options?.body || ""}`);
      return null;
    }

    try {
      console.log("웹 알림을 생성합니다...");

      // 고유한 태그 생성 (타임스탬프 추가)
      const uniqueTag = `pomodoro-${Date.now()}`;

      // macOS/Chrome에 최적화된 알림 설정
      const notificationOptions: NotificationOptions = {
        body: options?.body || "",
        tag: uniqueTag,
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
        silent: false,
        dir: "auto",
        lang: "ko",
      };

      console.log("알림 옵션:", notificationOptions);

      const notification = new Notification(title, notificationOptions);

      console.log("웹 알림이 성공적으로 생성되었습니다.");
      console.log("알림 객체:", notification);
      console.log("알림 태그:", uniqueTag);

      // 알림 이벤트 리스너
      notification.onshow = () => {
        console.log("✅ 알림이 화면에 표시되었습니다!");
        console.log("✅ 알림 제목:", notification.title);
        console.log("✅ 알림 본문:", notification.body);
        console.log("✅ 알림 태그:", notification.tag);

        // 웹 알림이 표시될 때도 포커스 시도
        this.focusTab();
      };

      notification.onerror = (error) => {
        console.error("❌ 알림 표시 중 오류 발생:", error);
        console.error("❌ 알림 객체 상태:", notification);
      };

      notification.onclose = () => {
        console.log("🔔 알림이 닫혔습니다.");
        console.log("🔔 닫힌 시간:", new Date().toISOString());
        // 알림이 닫히면 제목 깜빡임 정지
        this.stopTitleFlash();
      };

      // 알림 클릭 시 창 포커스
      notification.onclick = () => {
        console.log("👆 알림이 클릭되었습니다.");
        this.focusTab();
        this.stopTitleFlash();
        notification.close();
      };

      // requireInteraction이 true이므로 자동 닫기 시간을 늘림
      setTimeout(() => {
        console.log("⏰ 알림을 자동으로 닫습니다.");
        this.stopTitleFlash();
        notification.close();
      }, 15000); // 15초로 연장

      console.log("=== 알림 생성 완료 ===");
      return notification;
    } catch (error) {
      console.error("❌ 알림 표시 실패:", error);
      console.error("에러 타입:", typeof error);
      console.error(
        "에러 메시지:",
        error instanceof Error ? error.message : String(error)
      );
      console.log("=== 알림 진단 종료 (실패) ===");
      // 실패 시 alert로 대체
      alert(`${title}\n${options?.body || ""}`);
      return null;
    }
  }

  // macOS 시스템 알림 상태 체크 헬퍼 메서드
  public checkSystemNotificationStatus() {
    console.log("=== macOS 알림 시스템 체크 ===");
    console.log(
      "브라우저:",
      navigator.userAgent.includes("Chrome") ? "Chrome" : "Other"
    );
    console.log("macOS:", navigator.platform.includes("Mac"));
    console.log("현재 포커스:", document.hasFocus());
    console.log("페이지 가시성:", document.visibilityState);
    console.log("알림 권한:", Notification.permission);

    // 테스트 알림 즉시 발송
    if (Notification.permission === "granted") {
      console.log("테스트 알림을 발송합니다...");
      this.showNotification("🔔 시스템 테스트", {
        body: "macOS 알림 센터 연동 테스트입니다.",
      });
    }
  }

  // 브라우저 포커스를 잃게 한 후 알림 테스트
  public testNotificationWithBlur() {
    console.log("=== 포커스 해제 후 알림 테스트 ===");

    // 브라우저 포커스 해제 시도
    window.blur();

    // 잠시 후 알림 발송
    setTimeout(() => {
      console.log("포커스 해제 후 알림 발송 중...");
      this.showNotification("🔔 포커스 해제 테스트", {
        body: "브라우저 포커스를 해제한 후 발송되는 알림입니다.",
      });
    }, 500);
  }

  // 최소한의 옵션으로 알림 테스트
  public testMinimalNotification() {
    console.log("=== 최소 옵션 알림 테스트 ===");

    try {
      // 가장 기본적인 알림만 생성
      const notification = new Notification("🔔 최소 알림 테스트", {
        body: "최소한의 옵션으로 생성된 알림입니다.",
      });

      notification.onshow = () => {
        console.log("✅ 최소 알림이 표시됨");
      };

      notification.onerror = (error) => {
        console.error("❌ 최소 알림 오류:", error);
      };

      // 3초 후 자동 닫기
      setTimeout(() => {
        notification.close();
      }, 3000);

      return notification;
    } catch (error) {
      console.error("❌ 최소 알림 생성 실패:", error);
      return null;
    }
  }

  // 탭 번쩍임 효과만 테스트
  public testTabFlash() {
    console.log("=== 탭 번쩍임 테스트 ===");
    this.startTitleFlash("테스트 메시지");
    this.flashPage();

    // 3초 후 자동 정지
    setTimeout(() => {
      this.stopTitleFlash();
    }, 3000);
  }

  // 포커스 테스트
  public testFocus() {
    console.log("=== 포커스 테스트 ===");
    this.focusTab();
  }
}

// 포모도로 타이머 타입
export interface PomodoroSettings {
  workDuration: number; // 분 단위
  shortBreakDuration: number; // 분 단위
  longBreakDuration: number; // 분 단위
  sessionsUntilLongBreak: number;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 1,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

export type PomodoroPhase = "work" | "shortBreak" | "longBreak" | "idle";

export interface PomodoroState {
  phase: PomodoroPhase;
  sessionCount: number;
  timeRemaining: number; // 초 단위
  isRunning: boolean;
}
