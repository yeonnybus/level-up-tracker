import type { SortOption, TaskStatusOption, TaskTypeOption } from "../types";

// 태스크 타입 옵션
export const TASK_TYPE_OPTIONS: TaskTypeOption[] = [
  {
    value: "time",
    label: "시간 목표",
    description: "지정한 시간만큼 활동하는 것이 목표입니다",
  },
  {
    value: "quantity",
    label: "수량 목표",
    description: "지정한 개수만큼 완료하는 것이 목표입니다",
  },
  {
    value: "time_and_quantity",
    label: "시간 + 수량 목표",
    description: "시간과 수량 모두를 달성하는 것이 목표입니다",
  },
];

// 태스크 상태 옵션
export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  {
    value: "active",
    label: "진행 중",
    color: "blue",
  },
  {
    value: "completed",
    label: "완료",
    color: "green",
  },
  {
    value: "paused",
    label: "일시정지",
    color: "yellow",
  },
  {
    value: "archived",
    label: "보관됨",
    color: "gray",
  },
];

// 정렬 옵션
export const SORT_OPTIONS: SortOption[] = [
  {
    value: "created_desc",
    label: "최신 순",
    field: "created_at",
    direction: "desc",
  },
  {
    value: "created_asc",
    label: "오래된 순",
    field: "created_at",
    direction: "asc",
  },
  {
    value: "title_asc",
    label: "이름 순 (A-Z)",
    field: "title",
    direction: "asc",
  },
  {
    value: "title_desc",
    label: "이름 순 (Z-A)",
    field: "title",
    direction: "desc",
  },
];

// 시간 포맷팅 관련 상수
export const TIME_FORMATS = {
  HOUR_MINUTE: "HH:mm",
  DATE: "yyyy-MM-dd",
  DATE_TIME: "yyyy-MM-dd HH:mm",
  WEEK_START: "yyyy-MM-dd",
} as const;

// 기본값들
export const DEFAULT_VALUES = {
  MAX_GROUP_MEMBERS: 50,
  DEFAULT_TARGET_TIME: 60, // 분
  DEFAULT_TARGET_QUANTITY: 10,
  TIMER_UPDATE_INTERVAL: 1000, // 밀리초
  MAX_SESSION_HOURS: 12, // 최대 세션 시간
} as const;

// 색상 팔레트
export const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
  gray: "#6B7280",
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "로그인이 필요합니다",
  NETWORK_ERROR: "네트워크 오류가 발생했습니다",
  INVALID_DATA: "입력 데이터가 올바르지 않습니다",
  PERMISSION_DENIED: "권한이 없습니다",
  NOT_FOUND: "요청한 데이터를 찾을 수 없습니다",
  ALREADY_EXISTS: "이미 존재하는 데이터입니다",
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  TASK_CREATED: "태스크가 생성되었습니다",
  TASK_UPDATED: "태스크가 업데이트되었습니다",
  TASK_DELETED: "태스크가 삭제되었습니다",
  GROUP_JOINED: "그룹에 참여했습니다",
  GROUP_LEFT: "그룹에서 나갔습니다",
  TIMER_STARTED: "타이머가 시작되었습니다",
  TIMER_STOPPED: "타이머가 중지되었습니다",
} as const;
