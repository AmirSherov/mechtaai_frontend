'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LifeWheelPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    if (status === 'loading') {
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </span>
                    Колесо Баланса
                </h1>
                <p className="text-gray-400 text-lg">
                    Оцените текущее состояние сфер вашей жизни для гармоничного развития.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">

                        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 via-transparent to-transparent pointer-events-none"></div>

                        <div className="w-24 h-24 rounded-full bg-[#ff6b35]/10 flex items-center justify-center mb-6 float-animation relative z-10">
                            <svg className="w-12 h-12 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Анализ сфер жизни</h2>
                        <p className="text-gray-400 max-w-md mb-8 relative z-10 text-balance">
                            Интерактивный инструмент для оценки удовлетворенности в разных сферах жизни. Скоро вы сможете визуализировать свой текущий баланс.
                        </p>

                        <button className="px-8 py-3 gradient-orange text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-[#ff6b35]/30 transform hover:-translate-y-0.5 active:translate-y-0 relative z-10 flex items-center gap-2">
                            <span>Пройти диагностику</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Зачем это нужно?
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Колесо баланса помогает увидеть перекосы и понять, какой сфере уделить внимание прямо сейчас.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
