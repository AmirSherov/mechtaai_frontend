import axios, { AxiosInstance } from 'axios'
import type {
    ApiResponse,
    LoginAttempt,
    LoginStatus,
    AuthTokens,
    Goal,
    GoalIn,
    GoalsGenerateIn,
    WantsRaw,
    WantsProgress,
    WantsAnalysis,
    WantsStreamStartResponse,
    WantsStreamAppendResponse,
    Step,
    StepIn,
    StepsGenerateIn,
    GamificationProfile,
    Achievement,
    LeaderboardEntry,
    RitualsTodayStatus,
    JournalEntryIn,
    JournalEntryPublic,
    WeeklyAnalyzeIn,
    WeeklyReviewPublic,
    WeeklyCommitIn
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mechtaai.ru'

class ApiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        })

        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('access_token')
                        localStorage.removeItem('refresh_token')
                        window.location.href = '/login'
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    setAuthToken(token: string) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    clearAuthToken() {
        delete this.client.defaults.headers.common['Authorization']
    }

    async initQRLogin(): Promise<LoginAttempt> {
        const response = await this.client.post<ApiResponse<LoginAttempt>>(
            '/api/v1/auth/telegram/qr/init'
        )
        if (response.data.ok && response.data.result) {
            return response.data.result
        }
        throw new Error('Failed to initialize QR login')
    }

    async checkQRLoginStatus(loginToken: string): Promise<LoginStatus> {
        const response = await this.client.get<ApiResponse<LoginStatus>>(
            '/api/v1/auth/telegram/qr/status',
            {
                params: { login_token: loginToken },
            }
        )
        if (response.data.ok && response.data.result) {
            return response.data.result
        }
        throw new Error('Failed to check login status')
    }

    async exchangeSecret(oneTimeSecret: string): Promise<AuthTokens> {
        const response = await this.client.post<ApiResponse<AuthTokens>>(
            '/api/v1/auth/telegram/qr/exchange',
            {
                one_time_secret: oneTimeSecret,
            }
        )
        if (response.data.ok && response.data.result) {
            return response.data.result
        }
        throw new Error('Failed to exchange secret')
    }

    async getMe(accessToken: string) {
        const response = await this.client.get('/api/v1/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
        return response.data.result
    }

    async getGoals(horizon?: string, status?: string) {
        const response = await this.client.get<ApiResponse<Goal[]>>('/api/v1/goals', {
            params: { horizon, status }
        })
        return response.data.result
    }

    async createGoalsBatch(goals: GoalIn[]) {
        const response = await this.client.post<ApiResponse<{ items: Goal[] }>>('/api/v1/goals/batch', {
            goals
        })
        return response.data.result
    }

    async generateGoals(payload: GoalsGenerateIn) {
        const response = await this.client.post<ApiResponse<{ items: Goal[] }>>('/api/v1/goals/generate', payload)
        return response.data.result
    }

    async updateGoal(id: string, payload: GoalIn) {
        const response = await this.client.put<ApiResponse<Goal>>(`/api/v1/goals/${id}`, payload)
        return response.data.result
    }

    async deleteGoal(id: string) {
        const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/api/v1/goals/${id}`)
        return response.data.result
    }

    async getSteps(goalId?: string, level?: string, status?: string) {
        const response = await this.client.get<ApiResponse<Step[]>>('/api/v1/steps', {
            params: { goal_id: goalId, level, status }
        })
        return response.data.result
    }

    async createStepsBatch(steps: StepIn[]) {
        const response = await this.client.post<ApiResponse<Step[]>>('/api/v1/steps/batch', {
            steps
        })
        return response.data.result
    }

    async generateSteps(payload: StepsGenerateIn) {
        // Returns AI plan structure, which is complex. For now let's assume it returns payload
        // The backend returns { result: result["payload"] } where payload is PlanStepsAIResponse
        // But let's check what exactly it returns. Backend schemas: PlanStepsAIResponse. 
        // We will just return the raw result for now as it might be used to populate UI before saving.
        const response = await this.client.post<ApiResponse<any>>('/api/v1/steps/generate', payload)
        return response.data.result
    }

    async updateStep(id: string, payload: Partial<StepIn>) {
        const response = await this.client.put<ApiResponse<Step>>(`/api/v1/steps/${id}`, payload)
        return response.data.result
    }

    async deleteStep(id: string) {
        const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/api/v1/steps/${id}`)
        return response.data.result
    }

    async getWantsDraft() {
        const response = await this.client.get<ApiResponse<WantsRaw>>('/api/v1/wants/raw')
        return response.data.result
    }

    async createOrGetWantsDraft() {
        const response = await this.client.post<ApiResponse<WantsRaw>>('/api/v1/wants/raw')
        return response.data.result
    }

    async startStream() {
        const response = await this.client.post<ApiResponse<WantsStreamStartResponse>>('/api/v1/wants/stream/start')
        return response.data.result
    }

    async appendStream(text: string) {
        const response = await this.client.post<ApiResponse<WantsStreamAppendResponse>>('/api/v1/wants/stream/append', { text })
        return response.data.result
    }

    async finishStream() {
        const response = await this.client.post<ApiResponse<WantsStreamStartResponse>>('/api/v1/wants/stream/finish')
        return response.data.result
    }

    async updateFutureMe(text: string) {
        const response = await this.client.put<ApiResponse<WantsRaw>>('/api/v1/wants/future-me', { text })
        return response.data.result
    }

    async appendFutureMe(text: string) {
        const response = await this.client.post<ApiResponse<WantsRaw>>('/api/v1/wants/future-me/append', { text })
        return response.data.result
    }

    async finishFutureMe() {
        const response = await this.client.post<ApiResponse<WantsRaw>>('/api/v1/wants/future-me/finish')
        return response.data.result
    }

    async updateReverse(raw_envy?: string, raw_regrets?: string, raw_what_to_do_5y?: string) {
        const response = await this.client.put<ApiResponse<WantsRaw>>('/api/v1/wants/reverse', {
            raw_envy,
            raw_regrets,
            raw_what_to_do_5y
        })
        return response.data.result
    }

    async getWantsProgress() {
        const response = await this.client.get<ApiResponse<WantsProgress>>('/api/v1/wants/progress')
        return response.data.result
    }

    async completeWants() {
        const response = await this.client.post<ApiResponse<WantsRaw>>('/api/v1/wants/complete')
        return response.data.result
    }

    async analyzeWants() {
        const response = await this.client.post<ApiResponse<WantsAnalysis>>('/api/v1/wants/analyze')
        return response.data.result
    }

    async getWantsAnalysis() {
        const response = await this.client.get<ApiResponse<WantsAnalysis>>('/api/v1/wants/analysis')
        return response.data.result
    }

    async getWantsHistory(page: number = 1, pageSize: number = 20) {
        // Backend returns { items: WantsRaw[], ... } inside result? 
        // Checking backend: result={items: [...]}, pagination=...
        // So response.data.result will be { items: [...] }
        const response = await this.client.get<ApiResponse<{ items: WantsRaw[] }>>('/api/v1/wants/history', {
            params: { page, page_size: pageSize }
        })
        return response.data.result
    }

    // Aliases to match UI components
    async createWantsDraft() { return this.createOrGetWantsDraft() }
    async startWantsStream() { return this.startStream() }
    async appendWantsStream(text: string) { return this.appendStream(text) }
    async finishWantsStream() { return this.finishStream() }
    async setFutureMe(text: string) { return this.updateFutureMe(text) }
    async updateReverseWants(payload: { raw_envy?: string, raw_regrets?: string, raw_what_to_do_5y?: string }) {
        return this.updateReverse(payload.raw_envy || undefined, payload.raw_regrets || undefined, payload.raw_what_to_do_5y || undefined)
    }

    async getGamificationProfile(token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.get<ApiResponse<GamificationProfile>>('/api/v1/gamification/profile', config)
        return response.data.result
    }

    async getAchievements(token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.get<ApiResponse<Achievement[]>>('/api/v1/gamification/achievements', config)
        return response.data.result
    }

    async getLeaderboard(limit: number = 20, token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` }, params: { limit } } : { params: { limit } }
        const response = await this.client.get<ApiResponse<LeaderboardEntry[]>>('/api/v1/gamification/leaderboard', config)
        return response.data.result
    }

    async getRitualsToday(token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.get<ApiResponse<RitualsTodayStatus>>('/api/v1/rituals/today', config)
        return response.data.result
    }

    async submitJournalEntry(payload: JournalEntryIn, token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.post<ApiResponse<JournalEntryPublic>>('/api/v1/rituals/entry', payload, config)
        return response.data.result
    }

    async analyzeWeekly(payload: WeeklyAnalyzeIn, token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.post<ApiResponse<WeeklyReviewPublic>>('/api/v1/rituals/weekly/analyze', payload, config)
        return response.data.result
    }

    async getWeeklyPlanSuggestion(token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.get<ApiResponse<Step[]>>('/api/v1/rituals/weekly/plan-suggestion', config)
        return response.data.result
    }

    async commitWeeklyPlan(payload: WeeklyCommitIn, token?: string) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await this.client.post<ApiResponse<Step[]>>('/api/v1/rituals/weekly/commit', payload, config)
        return response.data.result
    }
}

export const apiClient = new ApiClient()
