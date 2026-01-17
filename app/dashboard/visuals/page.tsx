'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function VisualsPage() {
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </span>
                    Визуализации
                </h1>
                <p className="text-gray-400 text-lg">
                    Создайте доску желаний (Vision Board), которая будет вдохновлять вас каждый день.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">

                        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 via-transparent to-transparent pointer-events-none"></div>

                        <div className="w-24 h-24 rounded-full bg-[#ff6b35]/10 flex items-center justify-center mb-6 float-animation relative z-10">
                            <svg className="w-12 h-12 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Карта Желаний</h2>
                        <p className="text-gray-400 max-w-md mb-8 relative z-10 text-balance">
                            Загружайте изображения, создавайте коллажи и визуализируйте свою мечту с помощью AI-генератора.
                        </p>

                        <button className="px-8 py-3 gradient-orange text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-[#ff6b35]/30 transform hover:-translate-y-0.5 active:translate-y-0 relative z-10 flex items-center gap-2">
                            <span>Создать доску</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                            Инсайт
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Визуализация укрепляет нейронные связи и помогает мозгу быстрее находить пути к цели.
                        </p>
                    </div>

                    <div className="glass-orange rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">AI Генератор</h3>
                        <p className="text-sm text-white/80">
                            Опишите свою мечту словами, и нейросеть создаст для неё уникальное изображение.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
