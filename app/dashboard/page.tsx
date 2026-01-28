'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Goal, MeResponse, Step } from '@/lib/types'
import { StatCard, ChartCard, ProgressCard } from '@/components/dashboard/Cards'

const GOAL_STATUS_LABELS: Record<string, string> = {
    planned: 'Запланирована',
    in_progress: 'В работе',
    done: 'Выполнена',
    dropped: 'Отменена'
}

const STEP_STATUS_LABELS: Record<string, string> = {
    planned: 'Запланирован',
    in_progress: 'В работе',
    done: 'Выполнен',
    skipped: 'Пропущен'
}

function formatDate(value?: string | null) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [me, setMe] = useState<MeResponse | null>(null)
    const [goals, setGoals] = useState<Goal[]>([])
    const [steps, setSteps] = useState<Step[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        const load = async () => {
            if (!session?.accessToken) {
                return
            }
            try {
                setLoading(true)
                apiClient.setAuthToken(session.accessToken)
                const [meData, goalsData, stepsData] = await Promise.all([
                    apiClient.getMeProfile(),
                    apiClient.getGoals(),
                    apiClient.getSteps()
                ])

                setMe(meData || null)

                const goalsList = Array.isArray(goalsData) ? goalsData : []
                const sortedGoals = [...goalsList].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                setGoals(sortedGoals.slice(0, 3))

                const stepsList = Array.isArray(stepsData) ? stepsData : []
                const sortedSteps = [...stepsList].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                setSteps(sortedSteps.slice(0, 4))
            } catch {
                setMe(null)
                setGoals([])
                setSteps([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session?.accessToken])

    const userName = useMemo(() => {
        const user = session?.user
        return user?.first_name || user?.name || 'Пользователь'
    }, [session?.user])

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 rounded-full border-2 border-[#ff6b35] border-t-transparent animate-spin"></div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    const subscriptionText = me?.subscription_expires_at
        ? new Date(me.subscription_expires_at).toLocaleDateString('ru-RU')
        : 'Нет подписки'

    return (
        <>
            <header className="sticky top-0 z-40 px-8 py-5 bg-transparent">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Добро пожаловать, <span className="text-[#ff6b35]">{userName}</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse"></span>
                            {me?.plan === 'pro' ? 'План Pro активен' : 'Бесплатный план'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Лимит текстовых запросов"
                            value={`${me?.usage.text.used ?? 0} / ${me?.usage.text.limit ?? 0}`}
                            subtitle="Запросы к AI за месяц"
                        />
                        <StatCard
                            title="Лимит изображений"
                            value={`${me?.usage.image.used ?? 0} / ${me?.usage.image.limit ?? 0}`}
                            subtitle="Генерации изображений"
                        />
                        <StatCard
                            title="Текущий план"
                            value={me?.plan === 'pro' ? 'PRO' : 'Бесплатный'}
                            subtitle="Статус подписки"
                        />
                        <StatCard
                            title="Подписка до"
                            value={subscriptionText}
                            subtitle="Дата окончания"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <ChartCard title="Использование ресурсов">
                                <div className="space-y-6 pt-2">
                                    <ProgressCard
                                        title="Текстовые запросы"
                                        current={me?.usage.text.used ?? 0}
                                        total={me?.usage.text.limit ?? 1}
                                        color="orange"
                                    />
                                    <ProgressCard
                                        title="Изображения"
                                        current={me?.usage.image.used ?? 0}
                                        total={me?.usage.image.limit ?? 1}
                                        color="blue"
                                    />
                                </div>
                            </ChartCard>

                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">Последние цели</h3>
                                    <button
                                        onClick={() => router.push('/dashboard/goals')}
                                        className="text-sm text-[#ff6b35] hover:underline"
                                    >
                                        Все цели
                                    </button>
                                </div>
                                {goals.length === 0 ? (
                                    <p className="text-sm text-gray-400">Пока нет целей. Создайте первую, чтобы начать движение.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {goals.map((goal) => (
                                            <div key={goal.id} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-white font-semibold">{goal.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {GOAL_STATUS_LABELS[goal.status] || goal.status}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{goal.horizon}</div>
                                                </div>
                                                {goal.description && (
                                                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{goal.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <h3 className="text-lg font-bold text-white mb-4">Аккаунт</h3>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span>{me?.user.email || session.user.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Часовой пояс</span>
                                        <span>{me?.user.time_zone || 'Europe/Moscow'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">Ближайшие шаги</h3>
                                    <button
                                        onClick={() => router.push('/dashboard/steps')}
                                        className="text-sm text-[#ff6b35] hover:underline"
                                    >
                                        Все шаги
                                    </button>
                                </div>
                                {steps.length === 0 ? (
                                    <p className="text-sm text-gray-400">Пока нет шагов. Создайте план действий.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {steps.map((step) => (
                                            <div key={step.id} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-3">
                                                <div className="text-white text-sm font-semibold">{step.title}</div>
                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                                    <span>{STEP_STATUS_LABELS[step.status] || step.status}</span>
                                                    <span>{formatDate(step.planned_date)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <h3 className="text-lg font-bold text-white mb-2">Рекомендация</h3>
                                <p className="text-sm text-gray-400">
                                    Обновите колесо жизни и цели — так AI сможет точнее подсветить фокус недели.
                                </p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => router.push('/dashboard/life-wheel')}
                                        className="px-4 py-2 text-white rounded-xl text-sm btn-glass"
                                    >
                                        Колесо жизни
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard/rituals')}
                                        className="px-4 py-2 text-white rounded-xl text-sm btn-glass"
                                    >
                                        Ритуалы
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
