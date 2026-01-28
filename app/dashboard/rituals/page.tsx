'use client'

import { useState, useEffect, useRef } from 'react'
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
    const [isNight, setIsNight] = useState(false)   
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

    useEffect(() => {
        const evaluatePeriod = () => {
            const currentHour = new Date().getHours()
            setIsNight(currentHour >= 18 || currentHour < 6)
        }

        evaluatePeriod()
        const intervalId = window.setInterval(evaluatePeriod, 60_000)
        return () => window.clearInterval(intervalId)
    }, [])

    const loadData = async () => {
        if (!session?.accessToken) return
        apiClient.setAuthToken(session.accessToken)
        setLoading(true)
        try {
            const data = await apiClient.getRitualsToday(session.accessToken)
            setTodayStatus(data || null)
        } catch (error) {
            console.error('Не удалось загрузить статус ритуалов', error)
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

    const handleCardClick = (type: 'morning' | 'evening') => {
        if (type === 'morning' && isNight) {
            toast.error('Утренний ритуал доступен только днём')
            return
        }
        if (type === 'evening' && !isNight) {
            toast.error('Вечерний ритуал доступен только ночью')
            return
        }

        if (type === 'morning' && todayStatus?.morning_done) return
        if (type === 'evening' && todayStatus?.evening_done) return

        openModal(type)
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
            console.error('Не удалось сохранить ритуал', error)
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

    const morningLocked = isNight && !todayStatus?.morning_done
    const eveningLocked = !isNight && !todayStatus?.evening_done

    return (
        <div className={`${isNight ? 'bg-[#020308]' : 'bg-gradient-to-br from-[#101010] via-[#0c0c0c] to-[#050505]'} min-h-screen relative overflow-hidden`}> 
            {isNight && <NightMoonBackground />}
            {!isNight && <DaySunBackground />}

            <div className="relative z-10 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
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
                        onClick={() => handleCardClick('morning')}
                        className={`
                            relative p-8 rounded-3xl border transition-all duration-300 group overflow-hidden
                            ${todayStatus?.morning_done
                                ? 'bg-[#121212] border-[#ff6b35]/20 cursor-default'
                                : morningLocked
                                    ? 'bg-[#1a1a1a]/80 border-white/5 cursor-not-allowed opacity-70'
                                    : 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5 hover:border-[#ff6b35]/50 hover:shadow-[0_0_20px_rgba(255,107,53,0.1)] cursor-pointer'
                            }
                        `}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>

                        {morningLocked && (
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 hidden sm:flex items-end justify-center pb-6">
                                <span className="px-3 py-1 bg-black/60 text-xs uppercase tracking-wide text-gray-300 rounded-full border border-white/10">
                                    Доступно днём
                                </span>
                            </div>
                        )}

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
                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${morningLocked ? 'bg-white/5 text-gray-500' : 'bg-white/5 text-gray-400 group-hover:bg-[#ff6b35]/10 group-hover:text-[#ff6b35]'}`}>
                                        <FiCircle /> К выполнению
                                    </span>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Утренний настрой</h2>
                                <p className="text-gray-400">
                                    Зарядитесь энергией, определите фокус дня и настройтесь на победу.
                                </p>
                                {morningLocked && (
                                    <div className="mt-4 sm:hidden">
                                        <span className="px-3 py-1 bg-black/60 text-xs uppercase tracking-wide text-gray-300 rounded-full border border-white/10">
                                            Доступно днём
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Evening Card */}
                    <div
                        onClick={() => handleCardClick('evening')}
                        className={`
                            relative p-8 rounded-3xl border transition-all duration-300 group overflow-hidden
                            ${todayStatus?.evening_done
                                ? 'bg-[#121212] border-[#ff6b35]/20 cursor-default'
                                : eveningLocked
                                    ? 'bg-[#1a1a1a]/80 border-white/5 cursor-not-allowed opacity-70'
                                    : 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5 hover:border-[#ff6b35]/50 hover:shadow-[0_0_20px_rgba(255,107,53,0.1)] cursor-pointer'
                            }
                        `}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all"></div>

                        {eveningLocked && (
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 hidden sm:flex items-end justify-center pb-6">
                                <span className="px-3 py-1 bg-black/60 text-xs uppercase tracking-wide text-gray-300 rounded-full border border-white/10">
                                    Доступно ночью
                                </span>
                            </div>
                        )}

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
                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${eveningLocked ? 'bg-white/5 text-gray-500' : 'bg-white/5 text-gray-400 group-hover:bg-[#ff6b35]/10 group-hover:text-[#ff6b35]'}`}>
                                        <FiCircle /> К выполнению
                                    </span>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Вечерняя рефлексия</h2>
                                <p className="text-gray-400">
                                    Подведите итоги, проанализируйте день и очистите разум для сна.
                                </p>
                                {eveningLocked && (
                                    <div className="mt-4 sm:hidden">
                                        <span className="px-3 py-1 bg-black/60 text-xs uppercase tracking-wide text-gray-300 rounded-full border border-white/10">
                                            Доступно ночью
                                        </span>
                                    </div>
                                )}
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
        </div>
    )
}

function DaySunBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const flaresRef = useRef<
        Array<{ left: number; top: number; size: number; delay: number; duration: number; opacity: number }>
    >([])

    if (flaresRef.current.length === 0) {
        flaresRef.current = Array.from({ length: 8 }, () => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 60 + 40,
            delay: Math.random() * 4,
            duration: Math.random() * 4 + 6,
            opacity: Math.random() * 0.35 + 0.35,
        }))
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const sunRadius = 200
        const centerX = 200
        const centerY = 200

        const createSunspot = (x: number, y: number, radius: number, intensity: number) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
            gradient.addColorStop(0, `rgba(180, 80, 0, ${intensity * 0.6})`)
            gradient.addColorStop(0.5, `rgba(150, 60, 0, ${intensity * 0.4})`)
            gradient.addColorStop(1, `rgba(120, 40, 0, ${intensity * 0.2})`)

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
        }

        const createGranulation = (x: number, y: number, size: number, brightness: number) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
            if (brightness > 0.5) {
                gradient.addColorStop(0, `rgba(255, 240, 150, ${brightness * 0.3})`)
                gradient.addColorStop(1, 'rgba(255, 220, 100, 0)')
            } else {
                gradient.addColorStop(0, `rgba(255, 180, 50, ${brightness * 0.2})`)
                gradient.addColorStop(1, 'rgba(255, 150, 30, 0)')
            }

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
        }

        const createProminence = (angle: number, length: number, width: number) => {
            const baseX = centerX + Math.cos(angle) * sunRadius
            const baseY = centerY + Math.sin(angle) * sunRadius
            const endX = centerX + Math.cos(angle) * (sunRadius + length)
            const endY = centerY + Math.sin(angle) * (sunRadius + length)

            const gradient = ctx.createLinearGradient(baseX, baseY, endX, endY)
            gradient.addColorStop(0, 'rgba(255, 150, 50, 0.5)')
            gradient.addColorStop(0.5, 'rgba(255, 100, 30, 0.3)')
            gradient.addColorStop(1, 'rgba(255, 80, 20, 0)')

            ctx.strokeStyle = gradient
            ctx.lineWidth = width
            ctx.lineCap = 'round'

            ctx.beginPath()
            ctx.moveTo(baseX, baseY)

            const curve = Math.sin(angle * 3) * 20
            const midX = (baseX + endX) / 2 + Math.cos(angle + Math.PI / 2) * curve
            const midY = (baseY + endY) / 2 + Math.sin(angle + Math.PI / 2) * curve

            ctx.quadraticCurveTo(midX, midY, endX, endY)
            ctx.stroke()
        }

        const isInsideSun = (x: number, y: number) => {
            const dx = x - centerX
            const dy = y - centerY
            return dx * dx + dy * dy <= sunRadius * sunRadius
        }

        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * (sunRadius * 0.95)
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance
            const size = Math.random() * 4 + 2
            const brightness = Math.random()

            if (isInsideSun(x, y)) {
                createGranulation(x, y, size, brightness)
            }
        }

        const sunspots = [
            { x: 280, y: 180, r: 18, i: 0.8 },
            { x: 150, y: 250, r: 22, i: 0.9 },
            { x: 320, y: 280, r: 12, i: 0.7 },
            { x: 200, y: 320, r: 15, i: 0.75 },
            { x: 120, y: 150, r: 10, i: 0.65 },
            { x: 260, y: 240, r: 8, i: 0.6 },
        ]

        sunspots.forEach((spot) => {
            if (isInsideSun(spot.x, spot.y)) {
                createSunspot(spot.x, spot.y, spot.r, spot.i)
            }
        })

        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * (sunRadius * 0.9)
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance
            const r = Math.random() * 5 + 2
            const intensity = Math.random() * 0.4 + 0.3

            if (isInsideSun(x, y)) {
                createSunspot(x, y, r, intensity)
            }
        }

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.5
            const length = Math.random() * 30 + 20
            const width = Math.random() * 6 + 3
            createProminence(angle, length, width)
        }

        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * (sunRadius * 0.85)
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance

            if (isInsideSun(x, y)) {
                const brightness = Math.random() * 100 + 155
                ctx.fillStyle = `rgba(255, ${brightness}, ${brightness - 50}, ${Math.random() * 0.15 + 0.05})`
                ctx.fillRect(x, y, 1, 1)
            }
        }
    }, [])

    return (
        <>
            <div className="day-sun-background">
                <div className="sun-container">
                    <div className="glow-outer-1"></div>
                    <div className="glow-outer-2"></div>
                    <div className="glow-inner"></div>
                    <div className="sun">
                        <canvas ref={canvasRef} width={400} height={400}></canvas>
                        <div className="corona"></div>
                    </div>
                    {flaresRef.current.map((f, idx) => (
                        <div
                            key={idx}
                            className="flare"
                            style={{
                                width: `${f.size}px`,
                                height: `${f.size}px`,
                                left: `${f.left}%`,
                                top: `${f.top}%`,
                                animationDelay: `${f.delay}s`,
                                animationDuration: `${f.duration}s`,
                                opacity: f.opacity,
                            }}
                        />
                    ))}
                </div>
            </div>
            <style jsx>{`
                .day-sun-background {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-start;
                    padding-right: min(12vw, 140px);
                    padding-top: clamp(20px, 6vh, 90px);
                    background: radial-gradient(ellipse at center, rgba(26, 5, 0, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%);
                    pointer-events: none;
                    z-index: 0;
                }

                .sun-container {
                    position: relative;
                    width: clamp(220px, 28vw, 360px);
                    height: clamp(220px, 28vw, 360px);
                }

                .glow-outer-1 {
                    position: absolute;
                    width: 180%;
                    height: 180%;
                    top: -40%;
                    left: -40%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 200, 50, 0.4) 0%, rgba(255, 150, 30, 0.2) 30%, rgba(255, 100, 0, 0.1) 50%, transparent 70%);
                    animation: pulseGlow1 4s ease-in-out infinite;
                    filter: blur(20px);
                }

                .glow-outer-2 {
                    position: absolute;
                    width: 140%;
                    height: 140%;
                    top: -20%;
                    left: -20%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 220, 100, 0.5) 0%, rgba(255, 180, 50, 0.3) 40%, rgba(255, 120, 20, 0.15) 60%, transparent 80%);
                    animation: pulseGlow2 3s ease-in-out infinite;
                    filter: blur(15px);
                }

                .glow-inner {
                    position: absolute;
                    width: 110%;
                    height: 110%;
                    top: -5%;
                    left: -5%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 255, 200, 0.8) 0%, rgba(255, 230, 150, 0.4) 50%, transparent 70%);
                    animation: pulseGlow3 2s ease-in-out infinite;
                    filter: blur(10px);
                }

                @keyframes pulseGlow1 {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: scale(1.08);
                        opacity: 0.8;
                    }
                }

                @keyframes pulseGlow2 {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.9;
                    }
                }

                @keyframes pulseGlow3 {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.02);
                        opacity: 1;
                    }
                }

                .sun {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 35%, #fffef0 0%, #fffecc 10%, #ffed88 25%, #ffdb66 40%, #ffc444 55%, #ffaa22 70%, #ff8800 85%, #ff6600 100%);
                    box-shadow:
                        inset 0 0 100px rgba(255, 255, 200, 0.8),
                        inset -20px -20px 80px rgba(255, 140, 0, 0.4),
                        0 0 80px rgba(255, 200, 50, 0.8),
                        0 0 150px rgba(255, 150, 30, 0.6),
                        0 0 250px rgba(255, 100, 0, 0.4);
                    animation: sunPulse 6s ease-in-out infinite;
                    overflow: hidden;
                }

                @keyframes sunPulse {
                    0%,
                    100% {
                        box-shadow:
                            inset 0 0 100px rgba(255, 255, 200, 0.8),
                            inset -20px -20px 80px rgba(255, 140, 0, 0.4),
                            0 0 80px rgba(255, 200, 50, 0.8),
                            0 0 150px rgba(255, 150, 30, 0.6),
                            0 0 250px rgba(255, 100, 0, 0.4);
                    }
                    50% {
                        box-shadow:
                            inset 0 0 120px rgba(255, 255, 200, 1),
                            inset -20px -20px 80px rgba(255, 140, 0, 0.5),
                            0 0 100px rgba(255, 200, 50, 1),
                            0 0 180px rgba(255, 150, 30, 0.8),
                            0 0 280px rgba(255, 100, 0, 0.5);
                    }
                }

                canvas {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                }

                .corona {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    opacity: 0.6;
                }

                .flare {
                    position: absolute;
                    background: radial-gradient(ellipse, rgba(255, 255, 150, 0.8) 0%, rgba(255, 200, 100, 0.4) 40%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(3px);
                    animation: flareFloat 8s ease-in-out infinite;
                }

                @keyframes flareFloat {
                    0%,
                    100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(10px, -10px) scale(1.1);
                        opacity: 0.9;
                    }
                }
            `}</style>
        </>
    )
}

function NightMoonBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const starsRef = useRef<Array<{ top: number; left: number; size: number; opacity: number }>>([])

    if (starsRef.current.length === 0) {
        starsRef.current = Array.from({ length: 70 }, () => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
            size: Math.random() * 1.8 + 0.6,
            opacity: Math.random() * 0.55 + 0.15,
        }))
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const moonRadius = 200

        const createCrater = (x: number, y: number, radius: number, depth: number) => {
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3,
                y - radius * 0.3,
                0,
                x,
                y,
                radius
            )

            gradient.addColorStop(0, `rgba(180, 180, 170, ${depth})`)
            gradient.addColorStop(0.5, `rgba(130, 130, 120, ${depth * 1.2})`)
            gradient.addColorStop(1, `rgba(90, 90, 80, ${depth * 1.5})`)

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()

            const shadowGradient = ctx.createRadialGradient(
                x + radius * 0.3,
                y + radius * 0.3,
                0,
                x,
                y,
                radius * 1.2
            )
            shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
            shadowGradient.addColorStop(0.6, `rgba(0, 0, 0, ${depth * 0.4})`)
            shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

            ctx.fillStyle = shadowGradient
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2)
            ctx.fill()
        }

        const createMaria = (
            x: number,
            y: number,
            width: number,
            height: number,
            rotation: number
        ) => {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(rotation)

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) / 2)
            gradient.addColorStop(0, 'rgba(120, 120, 110, 0.5)')
            gradient.addColorStop(0.7, 'rgba(90, 90, 80, 0.6)')
            gradient.addColorStop(1, 'rgba(70, 70, 60, 0.3)')

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)
            ctx.fill()

            ctx.restore()
        }

        const isInsideMoon = (x: number, y: number) => {
            const dx = x - moonRadius
            const dy = y - moonRadius
            return dx * dx + dy * dy <= moonRadius * moonRadius
        }

        createMaria(280, 150, 140, 160, 0.3)
        createMaria(120, 280, 180, 120, -0.2)
        createMaria(180, 100, 100, 80, 0.5)

        const presetCraters = [
            { x: 300, y: 120, r: 45, d: 0.8 },
            { x: 150, y: 200, r: 55, d: 0.9 },
            { x: 280, y: 280, r: 35, d: 0.7 },
            { x: 100, y: 100, r: 30, d: 0.6 },
            { x: 320, y: 220, r: 25, d: 0.65 },
            { x: 180, y: 320, r: 40, d: 0.75 },
            { x: 230, y: 180, r: 20, d: 0.5 },
            { x: 350, y: 300, r: 28, d: 0.7 },
            { x: 80, y: 260, r: 22, d: 0.6 },
            { x: 200, y: 80, r: 18, d: 0.55 }
        ]

        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * (moonRadius * 0.85)
            const x = moonRadius + Math.cos(angle) * distance
            const y = moonRadius + Math.sin(angle) * distance
            const r = Math.random() * 8 + 3
            const d = Math.random() * 0.3 + 0.2

            if (isInsideMoon(x, y)) {
                createCrater(x, y, r, d)
            }
        }

        presetCraters.forEach((crater) => {
            if (isInsideMoon(crater.x, crater.y)) {
                createCrater(crater.x, crater.y, crater.r, crater.d)
            }
        })

        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * (moonRadius * 0.9)
            const x = moonRadius + Math.cos(angle) * distance
            const y = moonRadius + Math.sin(angle) * distance

            if (isInsideMoon(x, y)) {
                ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 140 : 100}, ${Math.random() > 0.5 ? 140 : 100}, ${Math.random() > 0.5 ? 130 : 90}, ${Math.random() * 0.2 + 0.1})`
                ctx.fillRect(x, y, 2, 2)
            }
        }
    }, [])

    return (
        <>
            <div className="night-moon-background">
                <div className="stars" aria-hidden="true">
                    {starsRef.current.map((s, idx) => (
                        <span
                            key={idx}
                            className="star"
                            style={{
                                top: `${s.top}%`,
                                left: `${s.left}%`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                opacity: s.opacity,
                            }}
                        />
                    ))}
                </div>
                <div className="moon-container">
                    <div className="glow-outer"></div>
                    <div className="moon">
                        <canvas ref={canvasRef} width={400} height={400}></canvas>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .night-moon-background {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-start;
                    padding-right: min(15vw, 160px);
                    padding-top: clamp(40px, 10vh, 140px);
                    background: radial-gradient(ellipse at bottom, rgba(10, 14, 39, 0.25), transparent 60%);
                    pointer-events: none;
                    z-index: 0;
                }

                .stars {
                    position: absolute;
                    inset: 0;
                    opacity: 0.9;
                }

                .star {
                    position: absolute;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.25);
                }

                .moon-container {
                    position: relative;
                    width: clamp(220px, 28vw, 360px);
                    height: clamp(220px, 28vw, 360px);
                }

                .moon {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, #f4f4f2 0%, #e8e8e0 20%, #d4d4ca 40%, #b8b8ae 60%, #9a9a8e 80%, #7a7a6e 100%);
                    box-shadow:
                        inset -30px -30px 80px rgba(0, 0, 0, 0.4),
                        inset 20px 20px 60px rgba(255, 255, 255, 0.1),
                        0 0 60px rgba(240, 240, 220, 0.4),
                        0 0 120px rgba(240, 240, 220, 0.2),
                        0 0 180px rgba(240, 240, 220, 0.1);
                    animation: moonGlow 4s ease-in-out infinite alternate;
                    overflow: hidden;
                }

                @keyframes moonGlow {
                    0% {
                        box-shadow:
                            inset -30px -30px 80px rgba(0, 0, 0, 0.4),
                            inset 20px 20px 60px rgba(255, 255, 255, 0.1),
                            0 0 60px rgba(240, 240, 220, 0.4),
                            0 0 120px rgba(240, 240, 220, 0.2),
                            0 0 180px rgba(240, 240, 220, 0.1);
                    }
                    100% {
                        box-shadow:
                            inset -30px -30px 80px rgba(0, 0, 0, 0.4),
                            inset 20px 20px 60px rgba(255, 255, 255, 0.1),
                            0 0 80px rgba(240, 240, 220, 0.5),
                            0 0 140px rgba(240, 240, 220, 0.3),
                            0 0 200px rgba(240, 240, 220, 0.15);
                    }
                }

                .glow-outer {
                    position: absolute;
                    width: 120%;
                    height: 120%;
                    top: -10%;
                    left: -10%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(240, 240, 220, 0.15) 0%, transparent 70%);
                    animation: pulseGlow 6s ease-in-out infinite;
                }

                @keyframes pulseGlow {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 1;
                    }
                }

                canvas {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    opacity: 0.3;
                }
            `}</style>
        </>
    )
}



