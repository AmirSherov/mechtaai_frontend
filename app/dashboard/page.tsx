'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { MeResponse } from '@/lib/types'
import { StatCard, ChartCard, ProgressCard } from '@/components/dashboard/Cards'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [me, setMe] = useState<MeResponse | null>(null)
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
                const data = await apiClient.getMe(session.accessToken)
                setMe(data as MeResponse)
            } catch {
                setMe(null)
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
            <div className="min-h-screen flex items-center justify-center bg-black">
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
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#333] px-8 py-5">
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
                            value={me?.plan === 'pro' ? 'Pro' : 'Free'}
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
                            <ChartCard
                                title="Использование ресурсов"
                            >
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
                                        <span className="text-gray-500">Telegram</span>
                                        <span>{me?.user.telegram_id ? `ID ${me.user.telegram_id}` : 'Не привязан'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Часовой пояс</span>
                                        <span>{me?.user.time_zone || 'Europe/Moscow'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <h3 className="text-lg font-bold text-white mb-4">Следующие шаги</h3>
                                <p className="text-sm text-gray-400">
                                    Начните с раздела «Хочу», чтобы сформировать базу для истории будущего и целей.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
