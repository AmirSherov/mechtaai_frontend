'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { Goal, GoalIn, Step, StepIn } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import GoalForm from '@/components/dashboard/GoalForm'
import StepForm from '@/components/dashboard/StepForm'

export default function GoalDetailsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const goalId = params.id as string

    const [goal, setGoal] = useState<Goal | null>(null)
    const [steps, setSteps] = useState<Step[]>([])
    const [loading, setLoading] = useState(true)

    // Action loading states
    const [actionLoading, setActionLoading] = useState(false)
    const [stepLoadingId, setStepLoadingId] = useState<string | null>(null)

    // Modal states
    const [isEditGoalOpen, setIsEditGoalOpen] = useState(false)
    const [isCreateStepOpen, setIsCreateStepOpen] = useState(false)
    const [editingStep, setEditingStep] = useState<Step | null>(null)

    // AI Plan states
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
    const [generatedPlan, setGeneratedPlan] = useState<any>(null)

    const goalStatusLabel = (status?: string) => {
        switch (status) {
            case 'planned':
                return '?????????????'
            case 'in_progress':
                return '? ????????'
            case 'done':
                return '?????????'
            case 'dropped':
                return '????????'
            default:
                return status || '?'
        }
    }

    const stepStatusLabel = (status?: string) => {
        switch (status) {
            case 'planned':
                return '????????????'
            case 'in_progress':
                return '? ????????'
            case 'done':
                return '????????'
            case 'skipped':
                return '????????'
            default:
                return status || '?'
        }
    }
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadData()
        }
    }, [status, router, session, goalId])

    const loadData = async (silent = false) => {
        if (!goalId) return
        try {
            if (!silent) setLoading(true)
            // Ideally we need getGoalById but getGoals can filter? No, standard is get list.
            // Let's rely on getGoals() filtering or client side finding for now if API doesn't support getById directly.
            // Wait, looking at apiClient.getGoals uses query params.
            // Looking at backend routes: GET /goals (list), PUT /goals/{id}, DELETE /goals/{id}.
            // Backend currently doesn't have GET /goals/{id} specifically, only list with filters.
            // BUT... typically REST APIs have GET /goals/{id}. Let's check backend routes_goals.py again...
            // It has GET /goals (list) and PUT /goals/{id}. It DOES NOT seem to have GET /goals/{id} explicitly in the snippet I saw earlier (lines 102-115).
            // So I might have to fetch all goals and find one, OR update backend.
            // Updating backend is safer but I can just fetch all for now or filter by ID if update backend.
            // Let's try to fetch all and find. It's not efficient but works for MVP.
            // Wait, I can upgrade backend quickly? No, let's stick to frontend request.
            // Actually, I can use the existing list endpoint.

            const goalsData = await apiClient.getGoals()
            const foundGoal = goalsData?.find(g => g.id === goalId)

            if (foundGoal) {
                setGoal(foundGoal)
                // Fetch steps for this goal
                const stepsData = await apiClient.getSteps(goalId)
                if (stepsData) {
                    // Deduplicate by ID
                    const uniqueSteps = Array.from(new Map(stepsData.map(s => [s.id, s])).values())

                    // Sort by Level priority then Planned Date
                    const levelPriority: Record<string, number> = {
                        'year': 1,
                        'quarter': 2,
                        'month': 3,
                        'week': 4
                    }

                    uniqueSteps.sort((a, b) => {
                        const levelDiff = (levelPriority[a.level] || 99) - (levelPriority[b.level] || 99)
                        if (levelDiff !== 0) return levelDiff
                        // If same level, sort by date (if exists) or title
                        if (a.planned_date && b.planned_date) return a.planned_date.localeCompare(b.planned_date)
                        return 0
                    })

                    setSteps(uniqueSteps)
                }
            } else {
                router.push('/dashboard/goals') // Not found
            }
        } catch (error) {
            console.error(error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const handleUpdateGoal = async (data: GoalIn) => {
        if (!goalId) return
        setActionLoading(true)
        try {
            await apiClient.updateGoal(goalId, data)
            setIsEditGoalOpen(false)
            loadData(true)
        } catch (error) {
            console.error('?? ??????? ???????? ????', error)
            alert('?? ??????? ???????? ????')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteGoal = async () => {
        if (!confirm('Вы уверены, что хотите удалить эту цель и все её шаги?')) return
        setActionLoading(true)
        try {
            await apiClient.deleteGoal(goalId)
            router.push('/dashboard/goals')
        } catch (error) {
            console.error('?? ??????? ??????? ????', error)
        } finally {
            setActionLoading(false)
        }
    }

    // Step handlers
    const handleCreateStep = async (data: StepIn) => {
        setActionLoading(true)
        try {
            await apiClient.createStepsBatch([data])
            setIsCreateStepOpen(false)
            loadData(true)
        } catch (error) {
            console.error('?? ??????? ??????? ???', error)
            alert('?? ??????? ??????? ???')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateStep = async (data: StepIn) => {
        if (!editingStep) return
        setActionLoading(true)
        try {
            await apiClient.updateStep(editingStep.id, data)
            setEditingStep(null)
            loadData(true)
        } catch (error) {
            console.error('?? ??????? ???????? ???', error)
            alert('?? ??????? ???????? ???')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteStep = async (id: string) => {
        if (!confirm('Удалить этот шаг?')) return
        setStepLoadingId(id)
        try {
            await apiClient.deleteStep(id)
            loadData(true)
        } catch (error) {
            console.error('?? ??????? ??????? ???', error)
        } finally {
            setStepLoadingId(null)
        }
    }

    const toggleStepStatus = async (step: Step) => {
        setStepLoadingId(step.id)
        const newStatus = step.status === 'done' ? 'planned' : 'done'
        const payload: StepIn = {
            goal_id: step.goal_id,
            level: step.level,
            title: step.title,
            description: step.description,
            planned_date: step.planned_date,
            status: newStatus
        }
        try {
            await apiClient.updateStep(step.id, payload)
            // Optimistic
            setSteps(steps.map(s => s.id === step.id ? { ...s, status: newStatus } : s))
        } catch (error) {
            console.error('?? ??????? ???????? ??????', error)
            loadData(true)
        } finally {
            setStepLoadingId(null)
        }
    }

    // AI Plan Generation
    const handleGeneratePlan = async () => {
        try {
            setIsGeneratingPlan(true)
            const result = await apiClient.generateSteps({
                goal_ids: [goalId]
            })
            if (result) {
                setGeneratedPlan(result)
            }
        } catch (error) {
            console.error('?? ??????? ????????????? ????', error)
            alert('?? ??????? ????????????? ????')
        } finally {
            setIsGeneratingPlan(false)
        }
    }

    const saveGeneratedPlan = async () => {
        if (!generatedPlan || !generatedPlan.plan_by_goal) return
        setActionLoading(true)
        try {
            const stepsToSave: StepIn[] = []

            for (const plan of generatedPlan.plan_by_goal) {
                // Quarters
                for (const q of plan.quarters || []) {
                    for (const action of q.key_actions || []) {
                        stepsToSave.push({
                            goal_id: goalId,
                            level: 'quarter',
                            title: action.title,
                            description: action.description,
                            status: 'planned'
                        })
                    }
                }
                // Weeklies
                for (const t of plan.weekly_templates || []) {
                    for (const action of t.recommended_actions || []) {
                        stepsToSave.push({
                            goal_id: goalId,
                            level: 'week',
                            title: `${action.title} (${action.frequency_per_week} раз/нед)`,
                            status: 'planned'
                        })
                    }
                }
            }

            if (stepsToSave.length > 0) {
                await apiClient.createStepsBatch(stepsToSave)
            }

            setGeneratedPlan(null)
            setIsPlanModalOpen(false)
            loadData(true)
        } catch (error) {
            console.error('?? ??????? ????????? ????', error)
        } finally {
            setActionLoading(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!goal) return <div>Goal not found</div>

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-4">
                <Link href="/dashboard/goals" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Назад к целям
                </Link>

                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white max-w-2xl">{goal.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${goal.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                goal.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-700 text-gray-400'
                                }`}>
                                {goalStatusLabel(goal.status)}
                            </span>
                        </div>
                        <p className="text-gray-400 text-lg mb-4">{goal.description || 'Нет описания'}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                                <span className="text-gray-400">Горизонт:</span>
                                <span className="text-white">{goal.horizon}</span>
                            </div>
                            {goal.target_date && (
                                <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                                    <span className="text-gray-400">Дэдлайн:</span>
                                    <span className="text-white">{new Date(goal.target_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            {goal.metric && (
                                <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                                    <span className="text-gray-400">Метрика:</span>
                                    <span className="text-white">{goal.metric}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditGoalOpen(true)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-[#2a2a2a] border border-[#333] text-white rounded-xl hover:bg-[#333] transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Изменить</span>
                        </button>
                        <button
                            onClick={handleDeleteGoal}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'Удаление...' : 'Удалить'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="border-t border-[#333] my-8"></div>

            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </span>
                        План действий
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setIsPlanModalOpen(true); handleGeneratePlan(); }}
                            className="px-4 py-2 bg-[#2a2a2a] border border-[#333] text-white rounded-xl hover:bg-[#333] transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>AI План</span>
                        </button>
                        <button
                            onClick={() => setIsCreateStepOpen(true)}
                            className="px-4 py-2 gradient-orange text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Добавить шаг</span>
                        </button>
                    </div>
                </div>

                {steps.length === 0 ? (
                    <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400 mb-4">Для этой цели пока нет запланированных действий.</p>
                        <button onClick={() => setIsCreateStepOpen(true)} className="text-[#ff6b35] hover:underline">Создать первый шаг</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`glass p-4 rounded-xl border border-[#333] hover:border-[#ff6b35]/30 transition-all flex items-start gap-4 ${step.status === 'done' ? 'opacity-60' : ''}`}
                            >
                                <button
                                    onClick={() => toggleStepStatus(step)}
                                    disabled={!!stepLoadingId}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${step.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-[#ff6b35]'}`}
                                >
                                    {stepLoadingId === step.id ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : step.status === 'done' && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                <div className="flex-1 cursor-pointer" onClick={() => setEditingStep(step)}>
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-lg font-medium text-white ${step.status === 'done' ? 'line-through text-gray-500' : ''}`}>{step.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${step.level === 'year' ? 'bg-purple-900/30 text-purple-400' :
                                                step.level === 'quarter' ? 'bg-blue-900/30 text-blue-400' :
                                                    step.level === 'month' ? 'bg-green-900/30 text-green-400' :
                                                        step.level === 'week' ? 'bg-yellow-900/30 text-yellow-400' :
                                                            'bg-gray-800 text-gray-400'
                                                }`}>
                                                {step.level}
                                            </span>
                                        </div>
                                    </div>
                                    {step.description && <p className="text-gray-400 text-sm mt-1">{step.description}</p>}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>{step.planned_date || 'Без даты'}</span>
                                        {step.status !== 'planned' && step.status !== 'done' && <span className="capitalize text-orange-400">{stepStatusLabel(step.status)}</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteStep(step.id)}
                                    disabled={!!stepLoadingId}
                                    className={`p-2 text-gray-600 hover:text-red-500 transition-colors ${stepLoadingId === step.id ? 'opacity-50' : ''}`}
                                >
                                    {stepLoadingId === step.id ? (
                                        <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Edit Goal Modal */}
            <Modal isOpen={isEditGoalOpen} onClose={() => setIsEditGoalOpen(false)} title="Редактировать цель">
                <GoalForm
                    initialData={goal}
                    onSubmit={handleUpdateGoal}
                    isLoading={actionLoading}
                    onCancel={() => setIsEditGoalOpen(false)}
                />
            </Modal>

            {/* Create Actions/Step Modal */}
            <Modal isOpen={isCreateStepOpen} onClose={() => setIsCreateStepOpen(false)} title="Новое действие">
                <StepForm
                    goals={[goal]} // Only current goal available
                    initialData={{ goal_id: goal.id, level: 'week' }}
                    onSubmit={handleCreateStep}
                    isLoading={actionLoading}
                    onCancel={() => setIsCreateStepOpen(false)}
                />
            </Modal>

            {/* Edit Step Modal */}
            <Modal isOpen={!!editingStep} onClose={() => setEditingStep(null)} title="Редактировать действие">
                {editingStep && (
                    <StepForm
                        goals={[goal]}
                        initialData={editingStep}
                        onSubmit={handleUpdateStep}
                        isLoading={actionLoading}
                        onCancel={() => setEditingStep(null)}
                    />
                )}
            </Modal>

            {/* AI Plan Modal */}
            <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="AI Планировщик">
                {isGeneratingPlan ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-12 h-12 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
                        <p className="text-gray-300">Пыхтим над планом действий...</p>
                    </div>
                ) : !generatedPlan ? (
                    <div className="text-center p-6">
                        <p className="text-red-400">Не удалось сгенерировать план. Попробуйте еще раз.</p>
                        <button onClick={() => handleGeneratePlan()} className="mt-4 px-4 py-2 bg-[#333] text-white rounded-lg">Повторить</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400">
                            План готов! AI предлагает следующие шаги для цели "{goal.title}".
                        </div>
                        <div className="text-gray-300 space-y-2">
                            <p>{generatedPlan.comment_for_user}</p>
                            <div className="bg-[#2a2a2a] p-4 rounded-xl text-sm max-h-60 overflow-y-auto">
                                {/* Simple preview */}
                                {generatedPlan.plan_by_goal[0]?.quarters?.map((q: any, i: number) => (
                                    <div key={i} className="mb-4">
                                        <div className="font-bold text-orange-400 mb-2">Квартал {q.quarter_id}: {q.summary}</div>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {q.key_actions?.map((a: any, j: number) => (
                                                <li key={j}>{a.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsPlanModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveGeneratedPlan}
                                disabled={actionLoading}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <span>Принять план</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    )
}
