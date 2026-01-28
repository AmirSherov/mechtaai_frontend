'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'
import type {
    FutureStoryPublic,
    FutureStoryQuestion,
    FutureStoryUpdateIn,
} from '@/lib/types'

export default function FutureStoryPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [mode, setMode] = useState<'interview' | 'story'>('interview')
    const [story, setStory] = useState<FutureStoryPublic | null>(null)
    const [questions, setQuestions] = useState<FutureStoryQuestion[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)

    const [activeHorizon, setActiveHorizon] = useState<'3y' | '5y'>('5y')
    const [editMode, setEditMode] = useState(false)
    const [draftFullText, setDraftFullText] = useState('')
    const [draftByArea, setDraftByArea] = useState<Array<{ area_id: string; title: string; paragraph: string }>>([])
    const [updating, setUpdating] = useState(false)

    const saveTimerRef = useRef<number | null>(null)
    const localStorageKey = 'future_story_answers_v1'

    const currentQuestion = questions[activeIndex]

    const answeredCount = useMemo(() => {
        if (!questions.length) return 0
        let count = 0
        for (const q of questions) {
            if ((answers[q.area_id] || '').trim().length > 0) count += 1
        }
        return count
    }, [answers, questions])

    const allAnswered = useMemo(() => {
        return questions.length > 0 && answeredCount === questions.length
    }, [answeredCount, questions.length])

    const loadAll = useCallback(async (token: string) => {
        apiClient.setAuthToken(token)
        setLoading(true)
        try {
            const [storyRes, questionsRes] = await Promise.all([
                apiClient.getFutureStory(token),
                apiClient.getFutureStoryQuestions(token),
            ])
            setStory(storyRes || null)
            setQuestions(questionsRes || [])

            setMode(storyRes?.id ? 'story' : 'interview')

            if (typeof window !== 'undefined') {
                const raw = localStorage.getItem(localStorageKey)
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw)
                        if (parsed && typeof parsed === 'object') {
                            setAnswers(parsed)
                        }
                    } catch {
                        setAnswers({})
                    }
                }
            }

            if (storyRes?.id) {
                setEditMode(false)
                setActiveHorizon('5y')
            }
        } catch (error) {
            console.error('?? ??????? ????????? ??????? ????????', error)
            toast.error('Не удалось загрузить Историю будущего')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        if (session?.accessToken) {
            void loadAll(session.accessToken)
        }
    }, [loadAll, session, status, router])

    useEffect(() => {
        if (questions.length === 0) return
        setActiveIndex((idx) => Math.min(Math.max(0, idx), questions.length - 1))
    }, [questions.length])

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current)
            }
        }
    }, [])

    const persistAnswers = (next: Record<string, string>) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(next))
        } catch {
            return
        }
    }

    const saveDraftAnswer = useCallback(
        async (areaId: string, questionText: string, answerText: string) => {
            if (!session?.accessToken) return
            const trimmed = (answerText || '').trim()
            if (!trimmed) return

            setSavingKey(areaId)
            try {
                apiClient.setAuthToken(session.accessToken)
                await apiClient.saveFutureStoryDraft(
                    { area_id: areaId, question: questionText, answer: trimmed },
                    session.accessToken
                )
            } catch (error: any) {
                const message =
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    'Не удалось сохранить ответ'
                console.error('?? ??????? ????????? ???????? ???????', error)
                toast.error(message)
            } finally {
                setSavingKey(null)
            }
        },
        [session]
    )

    const scheduleSaveCurrent = (areaId: string, questionText: string, answerText: string) => {
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = window.setTimeout(() => {
            void saveDraftAnswer(areaId, questionText, answerText)
        }, 800)
    }

    const onChangeAnswer = (areaId: string, questionText: string, value: string) => {
        const next = { ...answers, [areaId]: value }
        setAnswers(next)
        persistAnswers(next)
        scheduleSaveCurrent(areaId, questionText, value)
    }

    const saveAllAnswers = async () => {
        if (!session?.accessToken) return
        apiClient.setAuthToken(session.accessToken)
        for (const q of questions) {
            const value = (answers[q.area_id] || '').trim()
            if (!value) continue
            await apiClient.saveFutureStoryDraft(
                { area_id: q.area_id, question: q.question, answer: value },
                session.accessToken
            )
        }
    }

    const onGenerateStory = async () => {
        if (!session?.accessToken) return

        if (!allAnswered) {
            toast.error(`Ответьте на все вопросы: ${answeredCount}/${questions.length}`)
            setMode('interview')
            return
        }

        setGenerating(true)
        try {
            await saveAllAnswers()
            const result = await apiClient.generateFutureStory(session.accessToken)
            if (!result?.id) {
                throw new Error('Пустой ответ от сервера')
            }
            setStory(result)
            setEditMode(false)
            setActiveHorizon('5y')
            setMode('story')
            toast.success('История готова')
        } catch (error: any) {
            const errorCode = error?.response?.data?.error?.code
            const serverMessage = error?.response?.data?.error?.message || error?.response?.data?.message
            const message =
                errorCode === 'FUTURE_STORY_DRAFT_NOT_FOUND' || errorCode === 'FUTURE_STORY_EMPTY_ANSWERS'
                    ? 'Нет сохранённых ответов для генерации. Откройте интервью, заполните ответы и попробуйте снова.'
                    : serverMessage || 'Не удалось сгенерировать историю'
            console.error('?? ??????? ????????????? ???????', error)
            toast.error(message)
        } finally {
            setGenerating(false)
        }
    }

    const openEdit = () => {
        if (!story) return
        const horizon = activeHorizon === '3y' ? story.horizon_3y : story.horizon_5y
        setDraftFullText(horizon.full_text || '')
        setDraftByArea((horizon.by_area || []).map((x) => ({ ...x })))
        setEditMode(true)
    }

    const cancelEdit = () => {
        setEditMode(false)
        setDraftFullText('')
        setDraftByArea([])
    }

    const updateDraftParagraph = (areaId: string, value: string) => {
        setDraftByArea((prev) => prev.map((x) => (x.area_id === areaId ? { ...x, paragraph: value } : x)))
    }

    const onSaveStory = async () => {
        if (!session?.accessToken) return
        if (!story) return

        const payload: FutureStoryUpdateIn = {
            horizon: activeHorizon,
            full_text: draftFullText,
            by_area: draftByArea,
        }

        setUpdating(true)
        try {
            apiClient.setAuthToken(session.accessToken)
            const updated = await apiClient.updateFutureStory(payload, session.accessToken)
            if (!updated?.id) {
                throw new Error('Пустой ответ от сервера')
            }
            setStory(updated)
            setEditMode(false)
            toast.success('Сохранено')
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                'Не удалось сохранить изменения'
            console.error('?? ??????? ???????? ???????', error)
            toast.error(message)
        } finally {
            setUpdating(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Toaster position="top-center" theme="dark" richColors />
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <Toaster position="top-center" theme="dark" richColors />
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </span>
                    История Будущего
                </h1>
                <p className="text-gray-400 text-lg">
                    Напишите сценарий своей идеальной жизни в настоящем времени.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {mode === 'story' && story ? (
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Ваша история</h2>
                                        <p className="text-sm text-gray-400 mt-1">Переключайтесь между горизонтами и редактируйте текст.</p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href="/dashboard/visuals"
                                                className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                            >
                                                Визуалы
                                            </Link>
                                            <button
                                                onClick={() => setMode('interview')}
                                                className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                            >
                                                Создать/обновить
                                            </button>
                                            <button
                                                onClick={onGenerateStory}
                                                disabled={generating || !allAnswered}
                                                className="px-3 py-2 text-sm rounded-xl gradient-orange text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generating ? 'Генерация...' : 'Сгенерировать заново'}
                                            </button>
                                            <div className="px-3 py-2 text-xs rounded-xl bg-white/5 text-gray-400 border border-white/10">
                                                Ответы: {answeredCount}/{questions.length}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setActiveHorizon('3y')}
                                                className={`px-3 py-2 text-sm rounded-xl border transition-colors ${activeHorizon === '3y'
                                                    ? 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/30'
                                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                3 года
                                            </button>
                                            <button
                                                onClick={() => setActiveHorizon('5y')}
                                                className={`px-3 py-2 text-sm rounded-xl border transition-colors ${activeHorizon === '5y'
                                                    ? 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/30'
                                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                5 лет
                                            </button>

                                            {!editMode ? (
                                                <button
                                                    onClick={openEdit}
                                                    className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                                >
                                                    Редактировать
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={cancelEdit}
                                                        disabled={updating}
                                                        className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Отмена
                                                    </button>
                                                    <button
                                                        onClick={onSaveStory}
                                                        disabled={updating}
                                                        className="px-3 py-2 text-sm rounded-xl gradient-orange text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updating ? 'Сохранение...' : 'Сохранить'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-[#333] space-y-4">
                                {!editMode ? (
                                    <p className="text-gray-200 whitespace-pre-wrap">
                                        {(activeHorizon === '3y' ? story.horizon_3y.full_text : story.horizon_5y.full_text) || ''}
                                    </p>
                                ) : (
                                    <textarea
                                        value={draftFullText}
                                        onChange={(e) => setDraftFullText(e.target.value)}
                                        rows={10}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none"
                                    />
                                )}
                            </div>

                            <div className="glass rounded-2xl p-6 border border-[#333] space-y-4">
                                <h3 className="text-lg font-bold text-white">По сферам</h3>
                                <div className="space-y-4">
                                    {(editMode ? draftByArea : (activeHorizon === '3y' ? story.horizon_3y.by_area : story.horizon_5y.by_area)).map((item) => (
                                        <div key={item.area_id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-white font-semibold">{item.title}</div>
                                            {!editMode ? (
                                                <p className="text-gray-300 mt-2 whitespace-pre-wrap">{item.paragraph}</p>
                                            ) : (
                                                <textarea
                                                    value={draftByArea.find((x) => x.area_id === item.area_id)?.paragraph || ''}
                                                    onChange={(e) => updateDraftParagraph(item.area_id, e.target.value)}
                                                    rows={4}
                                                    className="w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Создать историю</h2>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Заполните ответы по всем сферам ({answeredCount}/{questions.length}), затем нажмите “Сгенерировать”.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {story ? (
                                            <button
                                                onClick={() => setMode('story')}
                                                className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                            >
                                                Назад к истории
                                            </button>
                                        ) : null}

                                        <button
                                            onClick={onGenerateStory}
                                            disabled={generating || !allAnswered}
                                            className="px-3 py-2 text-sm rounded-xl gradient-orange text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generating ? 'Генерация...' : story ? 'Сгенерировать заново' : 'Сгенерировать'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {story ? (
                                <div className="glass rounded-2xl p-5 border border-[#333]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-gray-300">
                                            У вас уже есть история. Измените ответы и нажмите “Сгенерировать заново”, чтобы создать новую.
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                {questions.length === 0 ? (
                                    <div className="text-gray-400">Вопросы пока не готовы</div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-400">
                                                Вопрос {activeIndex + 1} из {questions.length}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {savingKey === currentQuestion?.area_id ? 'Сохранение...' : 'Автосейв включён'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-white font-semibold text-lg">{currentQuestion?.question}</div>
                                            <textarea
                                                value={currentQuestion ? (answers[currentQuestion.area_id] || '') : ''}
                                                onChange={(e) => {
                                                    if (!currentQuestion) return
                                                    onChangeAnswer(currentQuestion.area_id, currentQuestion.question, e.target.value)
                                                }}
                                                rows={7}
                                                className="w-full mt-3 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none"
                                                placeholder="Пишите в настоящем времени, подробно и конкретно..."
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                                                disabled={activeIndex === 0}
                                                className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Назад
                                            </button>

                                            <button
                                                onClick={() => setActiveIndex((i) => Math.min(questions.length - 1, i + 1))}
                                                disabled={activeIndex >= questions.length - 1}
                                                className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Далее
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Техника
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Описывайте всё так, будто это уже произошло. Используйте яркие образы и ощущения. Мозг не отличает яркую фантазию от реальности.
                        </p>
                    </div>

                    <div className="glass-orange rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Подсказка</h3>
                        <p className="text-sm text-white/80">
                            Если хотите перегенерировать историю — просто допишите ответы в интервью и нажмите “Сгенерировать” ещё раз.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
