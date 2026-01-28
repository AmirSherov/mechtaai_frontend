'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Step, StepIn, Goal, StepLevel } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import StepForm from '@/components/dashboard/StepForm'

export default function StepsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [steps, setSteps] = useState<Step[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [stepLoadingId, setStepLoadingId] = useState<string | null>(null)

    
    const statusLabel = (status?: string) => {
        switch (status) {
            case 'planned':
                return 'Запланирован'
            case 'in_progress':
                return 'В процессе'
            case 'done':
                return 'Выполнен'
            case 'skipped':
                return 'Пропущен'
            default:
                return status || '—'
        }
    }

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingStep, setEditingStep] = useState<Step | null>(null)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)

    // AI Generation states
    const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set())
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedPlan, setGeneratedPlan] = useState<any>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadData()
        }
    }, [status, router, session])

    const loadData = async () => {
        try {
            setLoading(true)
            const [stepsData, goalsData] = await Promise.all([
                apiClient.getSteps(),
                apiClient.getGoals()
            ])
            if (stepsData) setSteps(stepsData)
            if (goalsData) setGoals(goalsData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (data: StepIn) => {
        try {
            await apiClient.createStepsBatch([data])
            setIsCreateOpen(false)
            loadData()
        } catch (error) {
            console.error('Не удалось создать шаг', error)
            alert('Не удалось создать шаг')
        }
    }

    const handleUpdate = async (data: StepIn) => {
        if (!editingStep) return
        try {
            await apiClient.updateStep(editingStep.id, data)
            setEditingStep(null)
            loadData()
        } catch (error) {
            console.error('Не удалось обновить шаг', error)
            alert('Не удалось обновить шаг')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить этот шаг?')) return
        try {
            await apiClient.deleteStep(id)
            loadData()
        } catch (error) {
            console.error('Не удалось создать шаг', error)
        }
    }

    const toggleStepStatus = async (step: Step) => {
        const newStatus = step.status === 'done' ? 'planned' : 'done'
        try {
            setStepLoadingId(step.id)
            await apiClient.updateStep(step.id, {
                goal_id: step.goal_id,
                level: step.level,
                title: step.title,
                description: step.description,
                planned_date: step.planned_date,
                status: newStatus
            })
            // Optimistic update
            setSteps(steps.map(s => s.id === step.id ? { ...s, status: newStatus } : s))
        } catch (error) {
            console.error('Не удалось изменить статус', error)
            loadData() // Revert on error
        } finally {
            setStepLoadingId(null)
        }
    }

    const handleGenerate = async () => {
        if (selectedGoalIds.size === 0) return
        try {
            setIsGenerating(true)
            const result = await apiClient.generateSteps({
                goal_ids: Array.from(selectedGoalIds)
            })
            // Checking result structure. 
            // Backend returns PlanStepsAIResponse: { plan_by_goal: [...], comment_for_user: ... }
            if (result) {
                setGeneratedPlan(result)
            }
        } catch (error) {
            console.error('Не удалось сгенерировать план', error)
            alert('Не удалось сгенерировать план')
        } finally {
            setIsGenerating(false)
        }
    }

    const saveGeneratedPlan = async () => {
        if (!generatedPlan || !generatedPlan.plan_by_goal) return
        try {
            // We need to parse the complex structure into flat steps
            // PlanStepGoalPlan -> quarters -> key_actions ... 
            // This is complex because the AI returns a plan structure (PlanStepGoalPlan), but StepIn is flat.
            // I'll do a simplified mapping.
            // backend schemas: PlanStepQuarter, PlanStepWeeklyTemplate etc.

            const stepsToSave: StepIn[] = []

            for (const plan of generatedPlan.plan_by_goal) {
                const goalId = plan.goal_id // Note: backend schema says goal_id: str, ensure it matches existing goal IDs
                // Quarters
                for (const q of plan.quarters || []) {
                    // ?????? as a step? Or actions?
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
                // Weeklies (Templates) -> We can add them as "???????????? ????" steps?
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
                alert(`Сохранено ${stepsToSave.length} шагов!`)
            } else {
                alert('Не найдено шагов для сохранения в структуре AI.')
            }

            setGeneratedPlan(null)
            setIsGenerateOpen(false)
            loadData()
        } catch (error) {
            console.error('Не удалось сохранить сгенерированный план', error)
            alert('Ошибка при сохранении плана')
        }
    }

    const getGoalTitle = (id: string) => goals.find(g => g.id === id)?.title || 'Неизвестная цель'

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-5 md:flex-row md:justify-between md:items-start">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </span>
                        Действия
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-lg mt-2 leading-relaxed">
                        План конкретных шагов для реализации ваших целей.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsGenerateOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#2a2a2a] border border-[#333] text-white rounded-xl hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI План</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 gradient-orange text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Добавить шаг</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="text-center text-gray-400">Loading steps...</div>
            ) : steps.length === 0 ? (
                <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center min-h-[400px]">
                    <h2 className="text-2xl font-bold text-white mb-3">Нет запланированных действий</h2>
                    <p className="text-gray-400 max-w-md mb-8">Создайте шаги вручную или попросите AI составить план достижения целей.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsGenerateOpen(true)} className="px-6 py-2 bg-[#2a2a2a] rounded-xl text-white hover:bg-[#333]">Создать план (AI)</button>
                        <button onClick={() => setIsCreateOpen(true)} className="px-6 py-2 gradient-orange rounded-xl text-white">Добавить действие</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Group by Level? Or simply list. Let's start with a simple list but styled nicely */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-5">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`glass p-4 rounded-xl border border-[#333] hover:border-[#ff6b35]/30 transition-all flex flex-col sm:flex-row sm:items-start gap-4 ${step.status === 'done' ? 'opacity-60' : ''}`}
                            >
                                <button
                                    onClick={() => toggleStepStatus(step)}
                                    disabled={stepLoadingId === step.id}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${step.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-[#ff6b35]'} ${stepLoadingId === step.id ? 'cursor-wait' : ''}`}
                                >
                                    {stepLoadingId === step.id ? (
                                        <span className="w-3 h-3 rounded-full border-2 border-white/50 border-t-white animate-spin"></span>
                                    ) : step.status === 'done' && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                <div className="flex-1 cursor-pointer w-full" onClick={() => setEditingStep(step)}>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                                        <h3 className={`text-base sm:text-lg font-medium text-white leading-snug ${step.status === 'done' ? 'line-through text-gray-500' : ''}`}>{step.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-[#333] text-gray-300">{getGoalTitle(step.goal_id)}</span>
                                            <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full ${step.level === 'year' ? 'bg-purple-900/30 text-purple-400' :
                                                    step.level === 'quarter' ? 'bg-blue-900/30 text-blue-400' :
                                                        step.level === 'month' ? 'bg-green-900/30 text-green-400' :
                                                            step.level === 'week' ? 'bg-yellow-900/30 text-yellow-400' :
                                                                'bg-gray-800 text-gray-400'
                                                }`}>
                                                {step.level}
                                            </span>
                                        </div>
                                    </div>
                                    {step.description && <p className="text-gray-400 text-sm mt-1 leading-relaxed">{step.description}</p>}
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] sm:text-xs text-gray-500">
                                        <span>{step.planned_date || 'Без даты'}</span>
                                        {step.status !== 'planned' && step.status !== 'done' && <span className="capitalize text-orange-400">{statusLabel(step.status)}</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(step.id)}
                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors self-start sm:self-auto"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Новое действие">
                <StepForm
                    goals={goals}
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editingStep} onClose={() => setEditingStep(null)} title="Редактировать действие">
                {editingStep && (
                    <StepForm
                        goals={goals}
                        initialData={editingStep}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingStep(null)}
                    />
                )}
            </Modal>

            {/* AI Generate Modal */}
            <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="AI Планировщик">
                {!generatedPlan ? (
                    <div className="space-y-4">
                        <p className="text-gray-400">Выберите цели, для которых нужно сгенерировать план действий. AI разобьет их на квартальные и недельные задачи.</p>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {goals.length === 0 && <div className="text-yellow-500">Сначала создайте цели!</div>}
                            {goals.map(goal => (
                                <label key={goal.id} className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-xl cursor-pointer hover:bg-[#333]">
                                    <input
                                        type="checkbox"
                                        checked={selectedGoalIds.has(goal.id)}
                                        onChange={(e) => {
                                            const newSet = new Set(selectedGoalIds)
                                            if (e.target.checked) newSet.add(goal.id)
                                            else newSet.delete(goal.id)
                                            setSelectedGoalIds(newSet)
                                        }}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-[#ff6b35] focus:ring-[#ff6b35]"
                                    />
                                    <div>
                                        <div className="text-white font-medium">{goal.title}</div>
                                        <div className="text-xs text-gray-500">{goal.horizon}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || selectedGoalIds.size === 0}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex flex-wrap items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Генерируем план...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>Создать план</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400">
                            План готов!
                        </div>
                        <div className="text-gray-300 space-y-2">
                            <p>{generatedPlan.comment_for_user}</p>
                            <p className="text-sm text-gray-400">Найдено задач: {
                                // simple count
                                generatedPlan.plan_by_goal?.reduce((acc: number, p: any) =>
                                    acc + (p.quarters?.length || 0) + (p.weekly_templates?.length || 0), 0)
                            }
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setGeneratedPlan(null)}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                            >
                                Назад
                            </button>
                            <button
                                onClick={saveGeneratedPlan}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90"
                            >
                                Сохранить в календарь
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}


