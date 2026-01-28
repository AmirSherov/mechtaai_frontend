'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { DailyEnergyResponse } from '@/lib/types'

export default function EsotericsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const todayIso = useMemo(() => {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }, [])

    const [queryDate, setQueryDate] = useState<string>(todayIso)
    const [loading, setLoading] = useState(true)
    const [energy, setEnergy] = useState<DailyEnergyResponse | null>(null)

    const loadEnergy = useCallback(
        async (token: string, dateIso?: string) => {
            setLoading(true)
            try {
                apiClient.setAuthToken(token)
                const result = await apiClient.getEsotericsToday(dateIso, token)
                if (!result) {
                    throw new Error('Пустой ответ от сервера')
                }
                setEnergy(result)
            } catch (error: any) {
                const message =
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    'Не удалось загрузить энергию дня'
                console.error('?? ??????? ????????? ????????? ?? ???????', error)
                toast.error(message)
                setEnergy(null)
            } finally {
                setLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        if (session?.accessToken) {
            void loadEnergy(session.accessToken, queryDate)
        }
    }, [loadEnergy, queryDate, router, session, status])

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Toaster position="top-center" theme="dark" richColors />
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    const onReload = async () => {
        if (!session?.accessToken) return
        await loadEnergy(session.accessToken, queryDate)
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <Toaster position="top-center" theme="dark" richColors />
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </span>
                    Эзотерика
                </h1>
                <p className="text-gray-400 text-lg">
                    Энергия дня: лунная фаза, персональная нумерология и короткий совет.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Энергия дня</h2>
                                <p className="text-sm text-gray-400 mt-1">Выберите дату и получите подсказку.</p>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <input
                                    type="date"
                                    value={queryDate}
                                    onChange={(e) => setQueryDate(e.target.value)}
                                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                                <button
                                    onClick={onReload}
                                    className="px-3 py-2 text-sm rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    Обновить
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-[#333] space-y-5">
                        {!energy ? (
                            <div className="text-gray-400">Нет данных</div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm text-gray-400">Дата</div>
                                        <div className="text-white font-semibold">{energy.date}</div>
                                    </div>
                                    <div className="text-4xl leading-none">{energy.moon.emoji}</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-sm text-gray-400">Луна</div>
                                        <div className="text-white font-semibold mt-1">{energy.moon.description}</div>
                                        <div className="text-gray-300 text-sm mt-2">Освещённость: {energy.moon.illumination}%</div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-sm text-gray-400">Нумерология</div>
                                        {energy.numerology ? (
                                            <>
                                                <div className="text-white font-semibold mt-1">Личный год: {energy.numerology.personal_year}</div>
                                                <div className="text-white font-semibold mt-1">Личный день: {energy.numerology.personal_day}</div>
                                                <div className="text-gray-300 text-sm mt-2">
                                                    {energy.numerology.keywords?.length ? (
                                                        <>Ключевые слова: {energy.numerology.keywords.join(', ')}</>
                                                    ) : (
                                                        <>Ключевые слова: —</>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-300 text-sm mt-2">
                                                Заполните дату рождения в профиле, чтобы увидеть персональную нумерологию.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm text-gray-400">Совет дня</div>
                                    <div className="text-white mt-2 whitespace-pre-wrap">{energy.daily_ai_tip}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Цитата
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Энергия дня — это подсказка, а не приговор. Используйте её как мягкий ориентир.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
