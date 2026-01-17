export interface User {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    telegram_id: number | null
    time_zone: string
    locale: string
    is_active: boolean
    created_at: string
}

export interface LoginAttempt {
    login_token: string
    qr_code_data: string
    deep_link: string
    expires_in_seconds: number
}

export interface LoginStatus {
    status: 'pending' | 'confirmed' | 'expired'
    one_time_secret: string | null
}

export interface AuthTokens {
    access_token: string
    refresh_token: string
    token_type: string
    user: User
}

export interface ApiResponse<T = any> {
    ok: boolean
    result?: T
    error?: {
        code: string
        message: string
        details?: any
    }
}

export interface MeResponse {
    user: User
    subscription_expires_at: string | null
    plan: 'free' | 'pro'
    usage: {
        text: { used: number; limit: number }
        image: { used: number; limit: number }
    }
}

export type GoalStatus = 'draft' | 'planned' | 'in_progress' | 'done' | 'dropped'

export interface Goal {
    id: string
    user_id: string
    area_id: string
    horizon: string
    title: string
    description?: string
    metric?: string
    target_date?: string
    priority: number
    reason?: string
    status: GoalStatus
    created_at: string
    updated_at: string
}

export interface GoalIn {
    area_id: string
    horizon: string
    title: string
    description?: string
    metric?: string
    target_date?: string
    priority?: number
    reason?: string
    status?: GoalStatus
}

export interface GoalsGenerateIn {
    limits?: Record<string, any>
}

export type StepLevel = 'year' | 'quarter' | 'month' | 'week' | 'day'
export type StepStatus = 'planned' | 'in_progress' | 'done' | 'skipped'

export interface Step {
    id: string
    user_id: string
    goal_id: string
    level: StepLevel
    title: string
    description?: string
    planned_date?: string
    done_date?: string
    status: StepStatus
    created_at: string
    updated_at: string
}

export interface StepIn {
    goal_id: string
    level: StepLevel
    title: string
    description?: string
    planned_date?: string
    status?: StepStatus
}

export interface StepsGenerateIn {
    goal_ids: string[]
    current_load_hint?: Record<string, any>
    year_bounds?: Record<string, any>
}

export type WantsRawStatus = 'draft' | 'completed'

export interface WantsRaw {
    id: string
    user_id: string
    status: WantsRawStatus
    stream_started_at?: string
    stream_timer_seconds: number
    raw_wants_stream?: string
    stream_completed_at?: string
    raw_future_me?: string
    future_me_completed_at?: string
    raw_envy?: string
    raw_regrets?: string
    raw_what_to_do_5y?: string
    reverse_completed_at?: string
    completed_at?: string
    created_at: string
    updated_at: string
}

export interface WantsProgress {
    raw_id: string
    status: WantsRawStatus
    stream_done: boolean
    future_me_done: boolean
    reverse_done: boolean
    all_done: boolean
}

export interface WantsAnalysis {
    id: string
    user_id: string
    top_wants: string[]
    top_pains: string[]
    focus_areas: string[]
    patterns: string[]
    summary_comment: string
    suggested_questions?: string[]
    created_at: string
}

export interface WantsStreamStartResponse {
    raw_id: string
    stream_started_at?: string
    stream_timer_seconds: number
    stream_completed_at?: string
}

export interface WantsStreamAppendResponse {
    raw_id: string
    is_completed: boolean
    raw_wants_stream_preview?: string
}

export type WantsRawPublic = WantsRaw
export type WantsProgressPublic = WantsProgress

export interface WantsTopWant {
    id: string
    text: string
    area_id: string | null
    horizon: string
    priority: number
}

export interface WantsTopPain {
    id: string
    text: string
    area_id: string | null
    intensity: number
}

export interface WantsFocusArea {
    area_id: string
    reason: string
    weight: number
}

export interface WantsPattern {
    id: string
    text: string
}

// Re-defining WantsAnalysis to be more specific with above types if needed, 
// or just keep it simple as currently string[] arrays might be wrong if backend returns objects.
// Let's check backend schema for WantsAnalysis.
// Backend schema: 
// top_wants: list[WantsTopWant]
// top_pains: list[WantsTopPain]
// focus_areas: list[WantsFocusArea]
// patterns: list[WantsPattern]

// So I should update WantsAnalysis as well.

export interface WantsAnalysisPublic {
    id: string
    user_id: string
    top_wants: WantsTopWant[]
    top_pains: WantsTopPain[]
    focus_areas: WantsFocusArea[]
    patterns: WantsPattern[]
    summary_comment: string
    suggested_questions?: string[]
    created_at: string
}

export interface GamificationProfile {
    level: number
    level_title: string
    xp: number
    xp_to_next_level: number
    streak: number
    longest_streak: number
}

export interface Achievement {
    id: string
    title: string
    description: string
    xp_reward: number
    icon_url?: string
    is_obtained: boolean
}

export interface LeaderboardEntry {
    user_id: string
    first_name?: string
    last_name?: string
    total_xp: number
    level: number
}

export interface RitualsTodayStatus {
    date: string
    morning_done: boolean
    evening_done: boolean
    interception?: Record<string, any>
}

export interface JournalEntryIn {
    type: 'morning' | 'evening'
    answers: Record<string, string>
    mood_score?: number
    energy_score?: number
}

export interface JournalEntryPublic {
    id: string
    user_id: string
    date: string
    type: 'morning' | 'evening'
    answers: Record<string, string>
    mood_score?: number
    energy_score?: number
    ai_feedback?: string
    created_at: string
}

export interface WeeklyAnalyzeIn {
    user_reflection: string
}

export interface WeeklyReviewPublic {
    id: string
    user_id: string
    week_start: string
    week_end: string
    completed_steps: string[]
    failed_steps: string[]
    user_reflection?: string
    ai_analysis?: Record<string, any>
    status: 'in_progress' | 'completed' | 'auto_archived'
    created_at: string
}

export interface WeeklyCommitIn {
    next_week_step_ids: string[]
}
