'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function BillingPage() {
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </span>
                    Подписка
                </h1>
                <p className="text-gray-400 text-lg">
                    Управление тарифным планом и лимитами.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="glass rounded-2xl p-8 border border-[#333] relative overflow-hidden">
                    <h2 className="text-2xl font-bold text-white mb-2">Базовый</h2>
                    <p className="text-gray-400 mb-6">Для начала пути</p>
                    <div className="text-3xl font-bold text-white mb-6">0 ₽ <span className="text-sm font-normal text-gray-400">/ мес</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-gray-300">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Базовый доступ к AI
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-300">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            5 генераций изображений в день
                        </li>
                    </ul>

                    <button className="w-full py-3 border border-[#333] rounded-xl text-white font-medium hover:bg-white/5 transition-all">
                        Ваш текущий план
                    </button>
                </div>

                
                <div className="glass-orange rounded-2xl p-8 relative overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 bg-[#ff6b35] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
                    <p className="text-white/80 mb-6">Максимальные возможности</p>
                    <div className="text-3xl font-bold text-white mb-6">490 ₽ <span className="text-sm font-normal text-white/70">/ мес</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-white">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Безлимитный AI-коуч
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            100 генераций изображений
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Расширенная аналитика
                        </li>
                    </ul>

                    <button className="w-full py-3 bg-white text-[#ff6b35] rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg">
                        Оформить подписку
                    </button>
                </div>
            </div>
        </div>
    )
}
