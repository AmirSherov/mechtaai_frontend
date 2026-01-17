'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { RitualsTodayStatus, JournalEntryIn } from '@/lib/types'
import { FiSun, FiMoon, FiCheckCircle, FiCircle, FiCoffee, FiFeather, FiTrendingUp } from 'react-icons/fi'
import { Toaster, toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function RitualsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [todayStatus, setTodayStatus] = useState<RitualsTodayStatus | null>(null)
    const [loading, setLoading] = useState(true)

    // Journal Entry State
    const [activeModal, setActiveModal] = useState<'morning' | 'evening' | null>(null)
    const [step, setStep] = useState(1)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [mood, setMood] = useState<number>(5)
    const [energy, setEnergy] = useState<number>(5)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        if (session?.accessToken) {
            loadData()
        }
    }, [session, status, router])

    const loadData = async () => {
        if (!session?.accessToken) return
        apiClient.setAuthToken(session.accessToken)
        setLoading(true)
        try {
            const data = await apiClient.getRitualsToday(session.accessToken)
            setTodayStatus(data || null)
        } catch (error) {
            console.error('Failed to load rituals', error)
            toast.error('Не удалось загрузить статус ритуалов')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (type: 'morning' | 'evening') => {
        setActiveModal(type)
        setStep(1)
        setAnswers({})
        setMood(5)
        setEnergy(5)
    }

    const closeModal = () => {
        setActiveModal(null)
    }

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers({ ...answers, [questionId]: value })
    }

    const submitEntry = async () => {
        if (!session?.accessToken || !activeModal) return

        setIsSubmitting(true)
        try {
            const payload: JournalEntryIn = {
                type: activeModal,
                answers,
                mood_score: mood,
                energy_score: energy
            }

            await apiClient.submitJournalEntry(payload, session.accessToken)
            toast.success('Ритуал выполнен! +XP')
            loadData() // Refresh status
            closeModal()
        } catch (error) {
            console.error('Failed to submit entry', error)
            toast.error('Ошибка при сохранении')
        } finally {
            setIsSubmitting(false)
        }
    }

    const morningQuestions = [
        { id: 'gratitude', label: 'За что вы благодарны сегодня?', placeholder: 'Например: за вкусный кофе, солнечную погоду...' },
        { id: 'focus', label: 'Главный фокус на день (1-3 задачи)', placeholder: '1. ...\n2. ...' },
        { id: 'affirmation', label: 'Аффирмация дня', placeholder: 'Я полон сил и энергии...' }
    ]

    const eveningQuestions = [
        { id: 'wins', label: 'Топ-3 победы за день', placeholder: '1. ...' },
        { id: 'improvement', label: 'Что можно было сделать лучше?', placeholder: '...' },
        { id: 'tomorrow', label: 'Мысли на завтра', placeholder: '...' }
    ]

    const questions = activeModal === 'morning' ? morningQuestions : eveningQuestions

    if (loading && !todayStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <Toaster position="top-center" theme="dark" richColors />

            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <FiFeather className="w-6 h-6 text-white" />
                    </span>
                    Ритуалы
                </h1>
                <p className="text-gray-400">Начните и завершите день осознанно</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Morning Card */}
                <div
                    onClick={() => !todayStatus?.morning_done && openModal('morning')}
                    className={`
                        relative p-8 rounded-3xl border transition-all duration-300 group cursor-pointer overflow-hidden
                        ${todayStatus?.morning_done
                            ? 'bg-[#121212] border-[#ff6b35]/20'
                            : 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5 hover:border-[#ff6b35]/50 hover:shadow-[0_0_20px_rgba(255,107,53,0.1)]'
                        }
                    `}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4">
                                <FiSun className="w-8 h-8" />
                            </div>
                            {todayStatus?.morning_done ? (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                                    <FiCheckCircle /> Выполнено
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#ff6b35]/10 group-hover:text-[#ff6b35] text-sm transition-colors">
                                    <FiCircle /> К выполнению
                                </span>
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Утренний настрой</h2>
                            <p className="text-gray-400">
                                Зарядитесь энергией, определите фокус дня и настройтесь на победу.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Evening Card */}
                <div
                    onClick={() => !todayStatus?.evening_done && openModal('evening')}
                    className={`
                        relative p-8 rounded-3xl border transition-all duration-300 group cursor-pointer overflow-hidden
                        ${todayStatus?.evening_done
                            ? 'bg-[#121212] border-[#ff6b35]/20'
                            : 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5 hover:border-[#ff6b35]/50 hover:shadow-[0_0_20px_rgba(255,107,53,0.1)]'
                        }
                    `}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                                <FiMoon className="w-8 h-8" />
                            </div>
                            {todayStatus?.evening_done ? (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                                    <FiCheckCircle /> Выполнено
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#ff6b35]/10 group-hover:text-[#ff6b35] text-sm transition-colors">
                                    <FiCircle /> К выполнению
                                </span>
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Вечерняя рефлексия</h2>
                            <p className="text-gray-400">
                                Подведите итоги, проанализируйте день и очистите разум для сна.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Review Promo */}
            <div className="mt-8 rounded-3xl p-1 bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#ff6b35]/10 to-transparent"></div>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                            <FiTrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Еженедельный обзор</h3>
                            <p className="text-gray-400 max-w-lg">
                                Анализируйте прогресс за неделю, получайте советы от AI и планируйте следующие шаги.
                            </p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors">
                        Скоро доступно
                    </button>
                </div>
            </div>

            {/* Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={closeModal}
                    ></div>
                    <div className="relative bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
                        {/* Step 1: Mood & Energy */}
                        {step === 1 && (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">Как вы себя чувствуете?</h3>
                                    <p className="text-gray-400">Оцените свое состояние по шкале от 1 до 10</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white font-medium">Настроение</span>
                                            <span className="text-[#ff6b35] font-bold">{mood}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={mood}
                                            onChange={(e) => setMood(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6b35]"
                                        />
                                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                                            <span>Ужасно</span>
                                            <span>Отлично</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white font-medium">Энергия</span>
                                            <span className="text-[#ff6b35] font-bold">{energy}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={energy}
                                            onChange={(e) => setEnergy(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6b35]"
                                        />
                                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                                            <span>Истощен</span>
                                            <span>Заряжен</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-4 gradient-orange text-white font-bold rounded-xl shadow-lg hover:shadow-[#ff6b35]/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    Продолжить
                                </button>
                            </div>
                        )}

                        {/* Step 2: Questions */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">
                                        {activeModal === 'morning' ? 'Утренние вопросы' : 'Вечерние вопросы'}
                                    </h3>
                                    <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-white/5 rounded">1/3</span>
                                </div>

                                {questions.map((q) => (
                                    <div key={q.id}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {q.label}
                                        </label>
                                        <textarea
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                                            placeholder={q.placeholder}
                                            rows={3}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none"
                                        />
                                    </div>
                                ))}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-4 bg-white/5 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-all"
                                    >
                                        Назад
                                    </button>
                                    <button
                                        onClick={submitEntry}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 gradient-orange text-white font-bold rounded-xl shadow-lg hover:shadow-[#ff6b35]/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Сохранение...' : 'Завершить'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
