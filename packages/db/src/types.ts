export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)';
  };
  public: {
    Tables: {
      club_members: {
        Row: {
          club_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          club_id: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          club_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_members_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          }
        ];
      };
      clubs: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_private: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_private?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_private?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          visibility: Database['public']['Enums']['group_visibility'];
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          visibility?: Database['public']['Enums']['group_visibility'];
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          visibility?: Database['public']['Enums']['group_visibility'];
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: Database['public']['Enums']['group_role'];
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: Database['public']['Enums']['group_role'];
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['group_role'];
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      group_events: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_events_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_events_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      permission_check_trigger: {
        Row: {
          id: number | null;
        };
        Insert: {
          id?: number | null;
        };
        Update: {
          id?: number | null;
        };
        Relationships: [];
      };
      plan_sessions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          intensity: string | null;
          name: string;
          plan_week_id: string | null;
          scheduled_at: string | null;
          session_index: number;
          target_distance_km: number | null;
          target_duration: unknown;
          training_plan_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          intensity?: string | null;
          name: string;
          plan_week_id?: string | null;
          scheduled_at?: string | null;
          session_index: number;
          target_distance_km?: number | null;
          target_duration?: unknown;
          training_plan_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          intensity?: string | null;
          name?: string;
          plan_week_id?: string | null;
          scheduled_at?: string | null;
          session_index?: number;
          target_distance_km?: number | null;
          target_duration?: unknown;
          training_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_sessions_plan_week_id_fkey';
            columns: ['plan_week_id'];
            isOneToOne: false;
            referencedRelation: 'plan_weeks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plan_sessions_training_plan_id_fkey';
            columns: ['training_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plans';
            referencedColumns: ['id'];
          }
        ];
      };
      plan_weeks: {
        Row: {
          created_at: string;
          focus: string | null;
          id: string;
          planned_volume_km: number | null;
          start_date: string | null;
          training_plan_id: string;
          week_index: number;
        };
        Insert: {
          created_at?: string;
          focus?: string | null;
          id?: string;
          planned_volume_km?: number | null;
          start_date?: string | null;
          training_plan_id: string;
          week_index: number;
        };
        Update: {
          created_at?: string;
          focus?: string | null;
          id?: string;
          planned_volume_km?: number | null;
          start_date?: string | null;
          training_plan_id?: string;
          week_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_weeks_training_plan_id_fkey';
            columns: ['training_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plans';
            referencedColumns: ['id'];
          }
        ];
      };
      planned_sessions: {
        Row: {
          created_at: string;
          day_of_week: number;
          description: string | null;
          id: string;
          session_type: Database['public']['Enums']['session_type'];
          target_distance: number | null;
          target_duration: number | null;
          updated_at: string;
          week_id: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          description?: string | null;
          id?: string;
          session_type: Database['public']['Enums']['session_type'];
          target_distance?: number | null;
          target_duration?: number | null;
          updated_at?: string;
          week_id: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          description?: string | null;
          id?: string;
          session_type?: Database['public']['Enums']['session_type'];
          target_distance?: number | null;
          target_duration?: number | null;
          updated_at?: string;
          week_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'planned_sessions_week_id_fkey';
            columns: ['week_id'];
            isOneToOne: false;
            referencedRelation: 'planned_weeks';
            referencedColumns: ['id'];
          }
        ];
      };
      planned_weeks: {
        Row: {
          created_at: string;
          id: string;
          plan_id: string;
          updated_at: string;
          volume_distance: number | null;
          volume_duration: number | null;
          week_number: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          plan_id: string;
          updated_at?: string;
          volume_distance?: number | null;
          volume_duration?: number | null;
          week_number: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          plan_id?: string;
          updated_at?: string;
          volume_distance?: number | null;
          volume_duration?: number | null;
          week_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'planned_weeks_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'user_training_plans';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          country: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_points: {
        Row: {
          alt: number | null;
          data: Json | null;
          heart_rate: number | null;
          id: number;
          lat: number;
          lon: number;
          session_id: string;
          timestamp: string;
        };
        Insert: {
          alt?: number | null;
          data?: Json | null;
          heart_rate?: number | null;
          id?: number;
          lat: number;
          lon: number;
          session_id: string;
          timestamp: string;
        };
        Update: {
          alt?: number | null;
          data?: Json | null;
          heart_rate?: number | null;
          id?: number;
          lat?: number;
          lon?: number;
          session_id?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_points_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          end_time: string | null;
          id: string;
          metrics: Json | null;
          planned_session_id: string | null;
          start_time: string;
          status: Database['public']['Enums']['session_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_time?: string | null;
          id?: string;
          metrics?: Json | null;
          planned_session_id?: string | null;
          start_time?: string;
          status?: Database['public']['Enums']['session_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_time?: string | null;
          id?: string;
          metrics?: Json | null;
          planned_session_id?: string | null;
          start_time?: string;
          status?: Database['public']['Enums']['session_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_planned_session_id_fkey';
            columns: ['planned_session_id'];
            isOneToOne: false;
            referencedRelation: 'planned_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      training_plans: {
        Row: {
          created_at: string;
          distance_goal_km: number | null;
          id: string;
          name: string;
          plan_type: string;
          status: string;
          target_race_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distance_goal_km?: number | null;
          id?: string;
          name: string;
          plan_type: string;
          status?: string;
          target_race_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distance_goal_km?: number | null;
          id?: string;
          name?: string;
          plan_type?: string;
          status?: string;
          target_race_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_integrations: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: number;
          id: string;
          provider: string;
          refresh_token: string;
          sync_cursor: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: number;
          id?: string;
          provider: string;
          refresh_token: string;
          sync_cursor?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: number;
          id?: string;
          provider?: string;
          refresh_token?: string;
          sync_cursor?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_training_plans: {
        Row: {
          created_at: string;
          description: string | null;
          duration_weeks: number;
          id: string;
          name: string;
          start_date: string;
          status: Database['public']['Enums']['training_plan_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          duration_weeks: number;
          id?: string;
          name: string;
          start_date: string;
          status?: Database['public']['Enums']['training_plan_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          duration_weeks?: number;
          id?: string;
          name?: string;
          start_date?: string;
          status?: Database['public']['Enums']['training_plan_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_training_plans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      workout_feedback: {
        Row: {
          created_at: string;
          mood: string | null;
          pain_level: number | null;
          sleep_quality: number | null;
          surface: string | null;
          weather: string | null;
          workout_id: string;
        };
        Insert: {
          created_at?: string;
          mood?: string | null;
          pain_level?: number | null;
          sleep_quality?: number | null;
          surface?: string | null;
          weather?: string | null;
          workout_id: string;
        };
        Update: {
          created_at?: string;
          mood?: string | null;
          pain_level?: number | null;
          sleep_quality?: number | null;
          surface?: string | null;
          weather?: string | null;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_feedback_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: true;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      workouts: {
        Row: {
          completed_at: string | null;
          created_at: string;
          distance_km: number | null;
          elapsed_time: unknown;
          gps_trace: Json | null;
          id: string;
          moving_time: unknown;
          notes: string | null;
          plan_session_id: string | null;
          rpe: number | null;
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          elapsed_time?: unknown;
          gps_trace?: Json | null;
          id?: string;
          moving_time?: unknown;
          notes?: string | null;
          plan_session_id?: string | null;
          rpe?: number | null;
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          elapsed_time?: unknown;
          gps_trace?: Json | null;
          id?: string;
          moving_time?: unknown;
          notes?: string | null;
          plan_session_id?: string | null;
          rpe?: number | null;
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_plan_session_id_fkey';
            columns: ['plan_session_id'];
            isOneToOne: false;
            referencedRelation: 'plan_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null;
          fk_constraint_name: unknown;
          fk_schema_name: unknown;
          fk_table_name: unknown;
          fk_table_oid: unknown;
          is_deferrable: boolean | null;
          is_deferred: boolean | null;
          match_type: string | null;
          on_delete: string | null;
          on_update: string | null;
          pk_columns: unknown[] | null;
          pk_constraint_name: unknown;
          pk_index_name: unknown;
          pk_schema_name: unknown;
          pk_table_name: unknown;
          pk_table_oid: unknown;
        };
        Relationships: [];
      };
      tap_funky: {
        Row: {
          args: string | null;
          is_definer: boolean | null;
          is_strict: boolean | null;
          is_visible: boolean | null;
          kind: unknown;
          langoid: unknown;
          name: unknown;
          oid: unknown;
          owner: unknown;
          returns: string | null;
          returns_set: boolean | null;
          schema: unknown;
          volatility: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_auth_debug: { Args: never; Returns: Json };
      _cleanup: { Args: never; Returns: boolean };
      _contract_on: { Args: { '': string }; Returns: unknown };
      _currtest: { Args: never; Returns: number };
      _db_privs: { Args: never; Returns: unknown[] };
      _extensions: { Args: never; Returns: unknown[] };
      _get: { Args: { '': string }; Returns: number };
      _get_latest: { Args: { '': string }; Returns: number[] };
      _get_note: { Args: { '': string }; Returns: string };
      _is_verbose: { Args: never; Returns: boolean };
      _prokind: { Args: { p_oid: unknown }; Returns: unknown };
      _query: { Args: { '': string }; Returns: string };
      _refine_vol: { Args: { '': string }; Returns: string };
      _table_privs: { Args: never; Returns: unknown[] };
      _temptypes: { Args: { '': string }; Returns: string };
      _todo: { Args: never; Returns: string };
      col_is_null:
        | {
            Args: {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: unknown;
              description?: string;
              table_name: unknown;
            };
            Returns: string;
          };
      col_not_null:
        | {
            Args: {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: unknown;
              description?: string;
              table_name: unknown;
            };
            Returns: string;
          };
      create_full_training_plan: { Args: { plan_data: Json }; Returns: Json };
      diag:
        | {
            Args: { msg: unknown };
            Returns: {
              error: true;
            } & 'Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved';
          }
        | {
            Args: { msg: string };
            Returns: {
              error: true;
            } & 'Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved';
          };
      diag_test_name: { Args: { '': string }; Returns: string };
      do_tap:
        | { Args: never; Returns: string[] }
        | { Args: { '': string }; Returns: string[] };
      fail:
        | { Args: never; Returns: string }
        | { Args: { '': string }; Returns: string };
      findfuncs: { Args: { '': string }; Returns: string[] };
      finish: { Args: { exception_on_failure?: boolean }; Returns: string[] };
      has_unique: { Args: { '': string }; Returns: string };
      in_todo: { Args: never; Returns: boolean };
      is_empty: { Args: { '': string }; Returns: string };
      isnt_empty: { Args: { '': string }; Returns: string };
      lives_ok: { Args: { '': string }; Returns: string };
      no_plan: { Args: never; Returns: boolean[] };
      num_failed: { Args: never; Returns: number };
      os_name: { Args: never; Returns: string };
      pass:
        | { Args: never; Returns: string }
        | { Args: { '': string }; Returns: string };
      pg_version: { Args: never; Returns: string };
      pg_version_num: { Args: never; Returns: number };
      pgtap_version: { Args: never; Returns: number };
      runtests:
        | { Args: never; Returns: string[] }
        | { Args: { '': string }; Returns: string[] };
      skip:
        | { Args: { '': string }; Returns: string }
        | { Args: { how_many: number; why: string }; Returns: string };
      throws_ok: { Args: { '': string }; Returns: string };
      todo:
        | { Args: { how_many: number }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { why: string }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] };
      todo_end: { Args: never; Returns: boolean[] };
      todo_start:
        | { Args: never; Returns: boolean[] }
        | { Args: { '': string }; Returns: boolean[] };
    };
    Enums: {
      group_visibility: 'public' | 'private' | 'unlisted';
      group_role: 'owner' | 'admin' | 'member';
      session_status: 'in_progress' | 'completed' | 'aborted';
      session_type: 'run' | 'strength' | 'rest' | 'cross_training';
      training_plan_status:
        | 'active'
        | 'completed'
        | 'archived'
        | 'pending'
        | 'generated'
        | 'failed';
    };
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null;
      };
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          format: string;
          id: string;
          name: string;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name?: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Relationships: [];
      };
      buckets_vectors: {
        Row: {
          created_at: string;
          id: string;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      prefixes: {
        Row: {
          bucket_id: string;
          created_at: string | null;
          level: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string | null;
          level?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string | null;
          level?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          }
        ];
      };
      vector_indexes: {
        Row: {
          bucket_id: string;
          created_at: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id: string;
          metadata_configuration: Json | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id?: string;
          metadata_configuration?: Json | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          data_type?: string;
          dimension?: number;
          distance_metric?: string;
          id?: string;
          metadata_configuration?: Json | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vector_indexes_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets_vectors';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string };
        Returns: undefined;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      delete_prefix: {
        Args: { _bucket_id: string; _name: string };
        Returns: boolean;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_level: { Args: { name: string }; Returns: number };
      get_prefix: { Args: { name: string }; Returns: string };
      get_prefixes: { Args: { name: string }; Returns: string[] };
      get_size_by_bucket: {
        Args: never;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          start_after?: string;
        };
        Returns: {
          id: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_legacy_v1: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v1_optimised: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS' | 'VECTOR';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      session_status: ['in_progress', 'completed', 'aborted'],
      session_type: ['run', 'strength', 'rest', 'cross_training'],
      training_plan_status: [
        'active',
        'completed',
        'archived',
        'pending',
        'generated',
        'failed'
      ]
    }
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS', 'VECTOR']
    }
  }
} as const;
