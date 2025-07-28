import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import type { TaskStatus, TaskType } from "../types/database";

// 시간 포맷팅 유틸리티
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)}시간`;
};

// 날짜 포맷팅 유틸리티
export const formatDate = (
  date: Date | string,
  formatStr: string = "yyyy-MM-dd"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ko });
};

// 주간 날짜 유틸리티
export const getWeekStart = (date: Date = new Date()): string => {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // 월요일 시작
  const end = endOfWeek(date, { weekStartsOn: 1 }); // 일요일 끝

  return {
    start,
    end,
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
    label: `${format(start, "M월 d일", { locale: ko })} - ${format(
      end,
      "M월 d일",
      { locale: ko }
    )}`,
  };
};

export const getNextWeek = (currentWeekStart: string): string => {
  const date = new Date(currentWeekStart);
  const nextWeek = addWeeks(date, 1);
  return format(nextWeek, "yyyy-MM-dd");
};

export const getPreviousWeek = (currentWeekStart: string): string => {
  const date = new Date(currentWeekStart);
  const prevWeek = subWeeks(date, 1);
  return format(prevWeek, "yyyy-MM-dd");
};

// 진행률 계산 유틸리티
export const calculateProgress = (
  current: number,
  target: number,
  maxPercent: number = 100
): number => {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, maxPercent);
};

// 태스크 타입별 라벨 가져오기
export const getTaskTypeLabel = (type: TaskType): string => {
  const labels = {
    time: "시간 목표",
    quantity: "수량 목표",
    time_and_quantity: "시간 + 수량 목표",
  };
  return labels[type];
};

// 태스크 상태별 라벨 가져오기
export const getTaskStatusLabel = (status: TaskStatus): string => {
  const labels = {
    active: "진행 중",
    completed: "완료",
    paused: "일시정지",
    archived: "보관됨",
  };
  return labels[status];
};

// 태스크 상태별 색상 가져오기
export const getTaskStatusColor = (status: TaskStatus): string => {
  const colors = {
    active: "blue",
    completed: "green",
    paused: "yellow",
    archived: "gray",
  };
  return colors[status];
};

// 랜덤 색상 생성 (아바타용)
export const generateAvatarColor = (seed: string): string => {
  const colors = [
    "#F87171",
    "#FB923C",
    "#FBBF24",
    "#A3E635",
    "#34D399",
    "#22D3EE",
    "#60A5FA",
    "#A78BFA",
    "#F472B6",
    "#FB7185",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }

  return colors[Math.abs(hash) % colors.length];
};

// 초기 문자 가져오기 (아바타용)
export const getInitials = (name?: string): string => {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// 숫자 포맷팅 (천 단위 콤마)
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(num);
};

// 백분율 포맷팅
export const formatPercentage = (
  value: number,
  decimals: number = 0
): string => {
  return `${value.toFixed(decimals)}%`;
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 상대 시간 포맷팅 (예: "3분 전", "2시간 전")
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return "방금 전";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) {
    return `${days}일 전`;
  }

  return formatDate(targetDate, "yyyy년 M월 d일");
};

// 유효성 검사 유틸리티
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// URL 유틸리티
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("클립보드 복사 실패:", err);
    return false;
  }
};

// 로컬 스토리지 유틸리티
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("로컬 스토리지 저장 실패:", err);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error("로컬 스토리지 삭제 실패:", err);
    }
  },
};
