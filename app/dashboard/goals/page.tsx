'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Goal, GoalIn, GoalsGenerateIn } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import GoalForm from '@/components/dashboard/GoalForm'

export default function GoalsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)

    // AI Generation states
    const [aiContext, setAiContext] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedGoals, setGeneratedGoals] = useState<any>(null) // To store AI result before saving

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadGoals()
        }
    }, [status, router, session])

    const loadGoals = async () => {
        try {
            setLoading(true)
            const data = await apiClient.getGoals()
            if (data) setGoals(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (data: GoalIn) => {
        try {
            // We use batch for single create too as it's more convenient or just wrap in array
            // Actually apiClient has createGoalsBatch. Let's use that.
            await apiClient.createGoalsBatch([data])
            setIsCreateOpen(false)
            loadGoals()
        } catch (error) {
            console.error('Failed to create goal', error)
            alert('Failed to create goal')
        }
    }

    const handleUpdate = async (data: GoalIn) => {
        if (!editingGoal) return
        try {
            await apiClient.updateGoal(editingGoal.id, data)
            setEditingGoal(null)
            loadGoals()
        } catch (error) {
            console.error('Failed to update goal', error)
            alert('Failed to update goal')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту цель?')) return
        try {
            await apiClient.deleteGoal(id)
            loadGoals()
        } catch (error) {
            console.error('Failed to delete goal', error)
        }
    }

    const handleGenerate = async () => {
        try {
            setIsGenerating(true)
            const result = await apiClient.generateGoals({
                limits: { user_context: aiContext }
            })
            // Result structure depends on backend. Assuming returns { goals_1y: [...], ... }
            if (result) {
                setGeneratedGoals(result)
            }
        } catch (error) {
            console.error('AI Generation failed', error)
            alert('AI Generation failed')
        } finally {
            setIsGenerating(false)
        }
    }

    const saveGeneratedGoals = async () => {
        if (!generatedGoals) return
        try {
            // Flatten generated goals
            const goalsToSave: GoalIn[] = []
            const mapAiGoal = (g: any, horizon: string) => ({
                title: g.title,
                area_id: g.area_id,
                horizon: horizon,
                description: g.description,
                metric: g.metric,
                target_date: g.target_date,
                reason: g.reason,
                priority: g.priority,
                status: 'planned'
            } as GoalIn)

            if (generatedGoals.goals_1y) goalsToSave.push(...generatedGoals.goals_1y.map((g: any) => mapAiGoal(g, '1y')))
            if (generatedGoals.goals_3y) goalsToSave.push(...generatedGoals.goals_3y.map((g: any) => mapAiGoal(g, '3y')))
            if (generatedGoals.goals_5y) goalsToSave.push(...generatedGoals.goals_5y.map((g: any) => mapAiGoal(g, '5y')))

            await apiClient.createGoalsBatch(goalsToSave)
            setGeneratedGoals(null)
            setIsGenerateOpen(false)
            loadGoals()
        } catch (error) {
            console.error('Failed to save generated goals', error)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        Цели
                    </h1>
                    <p className="text-gray-400 text-lg mt-2">
                        Ставьте амбициозные цели и достигайте их шаг за шагом.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsGenerateOpen(true)}
                        className="px-4 py-2 bg-[#2a2a2a] border border-[#333] text-white rounded-xl hover:bg-[#333] transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Помощник</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 gradient-orange text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Создать</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="text-center text-gray-400">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center min-h-[400px]">
                    <h2 className="text-2xl font-bold text-white mb-3">Нет активных целей</h2>
                    <p className="text-gray-400 max-w-md mb-8">Создайте свою первую цель прямо сейчас или воспользуйтесь AI помощником.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsGenerateOpen(true)} className="px-6 py-2 bg-[#2a2a2a] rounded-xl text-white hover:bg-[#333]">AI Помощник</button>
                        <button onClick={() => setIsCreateOpen(true)} className="px-6 py-2 gradient-orange rounded-xl text-white">Создать цель</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => (
                        <div
                            key={goal.id}
                            onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
                            className="glass p-6 rounded-2xl border border-[#333] hover:border-[#ff6b35]/50 transition-colors cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${goal.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                        goal.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-700 text-gray-400'
                                    }`}>
                                    {goal.status}
                                </span>
                                <span className="text-xs text-gray-500 border border-[#333] px-2 py-1 rounded-md">{goal.horizon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff6b35] transition-colors">{goal.title}</h3>
                            {goal.description && <p className="text-gray-400 text-sm mb-4 line-clamp-3">{goal.description}</p>}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Без даты'}
                            </div>

                            {/* Explicit Edit Button within Card */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); }}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Редактировать"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Новая цель">
                <GoalForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editingGoal} onClose={() => setEditingGoal(null)} title="Редактировать цель">
                {editingGoal && (
                    <GoalForm
                        initialData={editingGoal}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingGoal(null)}
                    />
                )}
            </Modal>

            {/* AI Generate Modal */}
            <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="AI Генератор Целей">
                {!generatedGoals ? (
                    <div className="space-y-4">
                        <p className="text-gray-400">Опишите вашу текущую ситуацию, мечты и желания. AI предложит структурированный план целей на 1, 3 и 5 лет.</p>
                        <textarea
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            rows={6}
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35]"
                            placeholder="Например: Я работаю менеджером, но хочу стать программистом. Мечтаю переехать в теплую страну и выучить испанский..."
                        />
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !aiContext.trim()}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Думаем...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>Сгенерировать</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400">
                            Готово! AI сгенерировал цели. Проверьте их перед сохранением.
                        </div>
                        {/* Simple preview of generated goals count */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-[#2a2a2a] p-3 rounded-xl">
                                <div className="text-2xl font-bold text-white">{generatedGoals.goals_1y?.length || 0}</div>
                                <div className="text-xs text-gray-500">На 1 год</div>
                            </div>
                            <div className="bg-[#2a2a2a] p-3 rounded-xl">
                                <div className="text-2xl font-bold text-white">{generatedGoals.goals_3y?.length || 0}</div>
                                <div className="text-xs text-gray-500">На 3 года</div>
                            </div>
                            <div className="bg-[#2a2a2a] p-3 rounded-xl">
                                <div className="text-2xl font-bold text-white">{generatedGoals.goals_5y?.length || 0}</div>
                                <div className="text-xs text-gray-500">На 5 лет</div>
                            </div>
                        </div>

                        <div className="text-gray-400 text-sm">
                            <p className="mb-2 font-bold text-white">Комментарий AI:</p>
                            <p>{generatedGoals.comment_for_user}</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setGeneratedGoals(null)}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                            >
                                Назад
                            </button>
                            <button
                                onClick={saveGeneratedGoals}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90"
                            >
                                Сохранить все
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
