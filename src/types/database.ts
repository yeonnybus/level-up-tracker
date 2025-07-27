// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_value: number;
          current_value: number;
          category: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          category?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          category?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          task_type: TaskType;
          target_time_hours: number | null;
          target_quantity: number | null;
          week_start: string;
          status: TaskStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          task_type: TaskType;
          target_time_hours?: number | null;
          target_quantity?: number | null;
          week_start: string;
          status?: TaskStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          task_type?: TaskType;
          target_time_hours?: number | null;
          target_quantity?: number | null;
          week_start?: string;
          status?: TaskStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_time_logs: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          note?: string | null;
          created_at?: string;
        };
      };
      task_quantity_logs: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          completed_count: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          completed_count?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          completed_count?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          is_public: boolean;
          max_members: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          invite_code: string;
          is_public?: boolean;
          max_members?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          invite_code?: string;
          is_public?: boolean;
          max_members?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_memberships: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
          joined_at?: string;
        };
      };
      group_shared_tasks: {
        Row: {
          id: string;
          group_id: string;
          task_id: string;
          shared_by: string;
          shared_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          task_id: string;
          shared_by: string;
          shared_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          task_id?: string;
          shared_by?: string;
          shared_at?: string;
        };
      };
    };
    Enums: {
      task_type: TaskType;
      task_status: TaskStatus;
      group_role: GroupRole;
    };
  };
};

// Enum Types
export type TaskType = "time" | "quantity" | "time_and_quantity";
export type TaskStatus = "active" | "completed" | "paused" | "archived";
export type GroupRole = "owner" | "admin" | "member";
