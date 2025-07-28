// Application Types
import type { GroupRole, TaskStatus, TaskType } from "./database";

// Re-export types from database
export type { GroupRole, TaskStatus, TaskType } from "./database";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  category?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  target_time_hours?: number;
  target_quantity?: number;
  week_start: string;
  status: TaskStatus;
  is_recurring: boolean;
  original_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  task_type: TaskType;
  note?: string;
  target_time_hours?: number | null;
  target_quantity?: number | null;
  week_start?: string;
}

export interface TaskTimeLog {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  duration_seconds?: number;
  note?: string;
  created_at: string;
}

export interface TaskQuantityLog {
  id: string;
  task_id: string;
  user_id: string;
  completed_count: number;
  note?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  is_public: boolean;
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface GroupSharedTask {
  id: string;
  group_id: string;
  task_id: string;
  shared_by: string;
  shared_at: string;
}

// Extended Group Shared Task with relations
export interface GroupSharedTaskWithDetails extends GroupSharedTask {
  task: Task;
  shared_by_user: Pick<User, "id" | "full_name" | "username">;
}

// Extended Types (with relations)
export interface TaskWithLogs extends Task {
  time_logs: TaskTimeLog[];
  quantity_logs: TaskQuantityLog[];
}

export interface TaskProgress {
  task_id: string;
  total_time_minutes: number;
  total_quantity_completed: number;
  progress_percentage: number;
  is_completed: boolean;
}

export interface GroupWithMembers extends Group {
  memberships: (GroupMembership & {
    user: Pick<User, "id" | "full_name" | "username" | "avatar_url">;
  })[];
  member_count: number;
}

export interface GroupWithSharedTasks extends Group {
  shared_tasks: (GroupSharedTask & {
    task: Task;
    shared_by_user: Pick<User, "id" | "full_name" | "username">;
  })[];
}

// Group Progress Types
export interface MemberProgress {
  completedTasks: number;
  activeTasks: number;
  totalTasks: number;
  totalTimeMinutes: number;
  points: number;
  completionRate: number;
}

export interface GroupMemberWithProgress {
  member: GroupMembership & {
    user: Pick<User, "id" | "full_name" | "username" | "avatar_url">;
  };
  progress: MemberProgress;
}

// Form Types
export interface CreateTaskForm {
  title: string;
  description?: string;
  task_type: TaskType;
  target_time_hours?: number;
  target_quantity?: number;
  week_start: string;
  is_recurring?: boolean;
}

export interface CreateTimeLogForm {
  task_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  duration_seconds?: number;
  note?: string;
}

export interface CreateQuantityLogForm {
  task_id: string;
  completed_count: number;
  note?: string;
}

export interface CreateGroupForm {
  name: string;
  description?: string;
  is_public?: boolean;
  max_members?: number;
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  target_time_hours?: number;
  target_quantity?: number;
  status?: TaskStatus;
  is_recurring?: boolean;
}

export interface JoinGroupForm {
  invite_code: string;
}

// Timer Types
export interface TimerState {
  isRunning: boolean;
  startTime?: Date;
  elapsedTime: number; // in milliseconds
  task_id?: string;
}

export interface TimerSession {
  task_id: string;
  start_time: string;
  duration_minutes?: number;
  note?: string;
}

// Statistics Types
export interface WeeklyStats {
  week_start: string;
  total_tasks: number;
  completed_tasks: number;
  total_time_minutes: number;
  completion_rate: number;
}

export interface TaskStats {
  task_id: string;
  total_time_minutes: number;
  total_quantity_completed: number;
  sessions_count: number;
  average_session_duration: number;
  streak_days: number;
}

export interface GroupStats {
  group_id: string;
  member_count: number;
  total_shared_tasks: number;
  average_completion_rate: number;
  most_active_member: {
    user_id: string;
    username?: string;
    total_time_minutes: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Hook Types
export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskForm) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskForm) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export interface UseTimerReturn {
  timer: TimerState;
  startTimer: (task_id: string) => void;
  stopTimer: (note?: string) => Promise<void>;
  pauseTimer: () => void;
  resetTimer: () => void;
}

export interface UseGroupsReturn {
  groups: GroupWithMembers[];
  loading: boolean;
  error: string | null;
  createGroup: (data: CreateGroupForm) => Promise<Group>;
  joinGroup: (invite_code: string) => Promise<void>;
  leaveGroup: (group_id: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
}

// Utility Types
export type TaskTypeOption = {
  value: TaskType;
  label: string;
  description: string;
};

export type TaskStatusOption = {
  value: TaskStatus;
  label: string;
  color: string;
};

export type SortOption = {
  value: string;
  label: string;
  field: keyof Task;
  direction: "asc" | "desc";
};

export type FilterOption = {
  status?: TaskStatus[];
  task_type?: TaskType[];
  week_start?: string;
};
