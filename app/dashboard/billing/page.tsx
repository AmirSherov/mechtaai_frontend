'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { MeResponse } from '@/lib/types'

const BOT_USERNAME = 'mechtaai_official_bot'
const BOT_PLANS_URL = `https://t.me/${BOT_USERNAME}?start=pro`

const PLANS = [
    {
        id: 'month',
        title: 'Pro на месяц',
        price: '99 ₽',
        period: '1 месяц',
        highlight: false,
        features: [
            'Больше запросов к AI и генераций',
            'Расширенные возможности по целям и шагам',
            'Больше генераций картинок и визуализаций',
            'Приоритетная скорость и стабильность'
        ]
    },
    {
        id: '6m',
        title: 'Pro на 6 месяцев',
        price: '499 ₽',
        period: '6 месяцев',
        highlight: true,
        features: [
            'Лучшее соотношение цены и возможностей',
            'Полный доступ к Pro-инструментам',
            'Больше генераций и аналитики',
            'Приоритетная скорость и стабильность'
        ]
    },
    {
        id: 'year',
        title: 'Pro на год',
        price: '899 ₽',
        period: '12 месяцев',
        highlight: false,
        features: [
            'Максимальная экономия на год',
            'Доступ ко всем Pro-возможностям',
            'Больше лимитов на текст и изображения',
            'Приоритетная скорость и стабильность'
        ]
    }
]

function formatDateTime(value?: string | null) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function BillingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [profile, setProfile] = useState<MeResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadProfile()
        }
    }, [status, router, session])

    const loadProfile = async () => {
        try {
            setLoading(true)
            const data = await apiClient.getMeProfile()
            if (data) setProfile(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </span>
                    Подписка
                </h1>
                <p className="text-gray-400 text-lg">
                    Тарифы совпадают с ботом. Оплата и активация происходит прямо в Telegram.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`rounded-2xl p-8 border ${plan.highlight
                            ? 'glass-orange border-[#ff6b35]/40 shadow-[0_0_30px_rgba(255,107,53,0.2)]'
                            : 'glass border-[#333]'
                            }`}
                    >
                        {plan.highlight && (
                            <div className="inline-flex items-center px-3 py-1 text-xs font-bold bg-[#ff6b35] text-white rounded-full mb-4">
                                Лучший выбор
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-white mb-2">{plan.title}</h2>
                        <p className={`mb-6 ${plan.highlight ? 'text-white/80' : 'text-gray-400'}`}>{plan.period}</p>
                        <div className="text-3xl font-bold text-white mb-6">
                            {plan.price}
                            <span className={`text-sm font-normal ${plan.highlight ? 'text-white/70' : 'text-gray-400'}`}> / период</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature) => (
                                <li key={feature} className={`flex items-start gap-3 text-sm ${plan.highlight ? 'text-white' : 'text-gray-300'}`}>
                                    <svg className={`w-5 h-5 ${plan.highlight ? 'text-white' : 'text-[#ff6b35]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <a
                            href={BOT_PLANS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${plan.highlight
                                ? 'bg-white text-[#ff6b35] hover:bg-gray-100'
                                : 'border border-[#333] text-white hover:bg-white/5'
                                }`}
                        >
                            Открыть в Telegram
                        </a>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 border border-[#333]">
                    <h3 className="text-lg font-bold text-white mb-4">Ваш статус</h3>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex items-center justify-between">
                            <span>План</span>
                            <span className="text-white font-semibold">{profile?.plan?.toUpperCase() ?? 'FREE'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Подписка до</span>
                            <span>{formatDateTime(profile?.subscription_expires_at ?? undefined)}</span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Оплата и управление подпиской доступны через бота.
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 border border-[#333]">
                    <h3 className="text-lg font-bold text-white mb-4">Почему через бот?</h3>
                    <p className="text-sm text-gray-400">
                        В Telegram уже подключены платежи и автоматическая активация Pro. После оплаты бот сразу покажет статус подписки.
                    </p>
                    <a
                        href={BOT_PLANS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-4 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#222] transition-colors"
                    >
                        Перейти в бот
                    </a>
                </div>
            </div>
        </div>
    )
}
