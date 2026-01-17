'use client'

import React, { useState, useEffect } from 'react'
import { WantsRawPublic } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

interface HistoryModalProps {
    isOpen: boolean
    onClose: () => void
    accessToken: string
}

export default function HistoryModal({ isOpen, onClose, accessToken }: HistoryModalProps) {
    const [history, setHistory] = useState<WantsRawPublic[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WantsRawPublic | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadHistory(1)
            setSelectedItem(null)
        }
    }, [isOpen])

    const loadHistory = async (pageNum: number) => {
        apiClient.setAuthToken(accessToken)
        setLoading(true)
        try {
            const response = await apiClient.getWantsHistory(pageNum)
            if (response && response.items) {
                setHistory(prev => pageNum === 1 ? response.items : [...prev, ...response.items])
                // Simple check for next page based on page size default 20
                setHasMore(response.items.length === 20)
                setPage(pageNum)
            }
        } catch (error) {
            console.error('Failed to load history', error)
        } finally {
            setLoading(false)
        }
    }

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`
                relative bg-[#121212] md:bg-[#181818]/90 md:backdrop-blur-xl border-t md:border border-white/10
                w-full h-[100dvh] md:h-[85vh] md:max-w-5xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden
                transform transition-all duration-300 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95
            `}>

                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 bg-[#121212] border-b border-white/5">
                    {selectedItem ? (
                        <div className="p-4 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 -ml-2 text-gray-400 hover:text-white active:bg-white/10 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex-1">
                                <h3 className="text-white font-medium text-sm">Сессия от {new Date(selectedItem.created_at).toLocaleDateString()}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">История</h2>
                            <button
                                onClick={onClose}
                                className="p-2 border border-white/10 rounded-full text-gray-400 hover:text-white active:bg-white/10 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex p-6 border-b border-white/5 justify-between items-center bg-white/[0.02]">
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b35] to-purple-600 flex items-center justify-center text-sm shadow-lg shadow-purple-500/20">📜</span>
                        Архив Желаний
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden relative">

                    {/* Sidebar / List - sliding animation on mobile */}
                    <div className={`
                        absolute inset-0 z-20 bg-[#121212] md:static md:w-80 md:bg-transparent md:border-r border-white/5
                        overflow-y-auto custom-scrollbar transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                        ${selectedItem ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
                    `}>
                        <div className="p-3 space-y-2 pb-20 md:pb-3">
                            {loading && page === 1 ? (
                                <div className="space-y-3 p-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                    <p>История пуста</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${selectedItem?.id === item.id
                                            ? 'bg-gradient-to-r from-white/10 to-transparent border-l-2 border-[#ff6b35]'
                                            : 'hover:bg-white/5 border-l-2 border-transparent hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-medium ${selectedItem?.id === item.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                            </span>
                                            {item.status === 'completed' && (
                                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500 group-hover:text-gray-400">
                                            <span>{new Date(item.created_at).toLocaleTimeString().slice(0, 5)}</span>
                                            <span className="capitalize opacity-60">{item.status}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                            {hasMore && (
                                <button
                                    onClick={() => loadHistory(page + 1)}
                                    disabled={loading}
                                    className="w-full py-4 text-xs text-gray-500 hover:text-[#ff6b35] transition-colors uppercase tracking-wider font-medium"
                                >
                                    {loading ? 'Загрузка...' : 'Загрузить еще'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content View */}
                    <div className={`
                        flex-1 overflow-y-auto bg-[#0a0a0a] md:bg-transparent custom-scrollbar
                        transition-transform duration-300 md:transform-none
                        ${selectedItem ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                        absolute inset-0 md:static z-20 md:z-auto
                    `}>
                        {selectedItem ? (
                            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20 md:pb-8">

                                {/* Session Info Card (Mobile only details) */}
                                <div className="md:hidden bg-white/5 p-4 rounded-2xl mb-6">
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Статус</span>
                                        <span className={selectedItem.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>{selectedItem.status}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Stream */}
                                    <section>
                                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-orange-400 mb-4 flex items-center gap-2">
                                            Поток желаний
                                        </h3>
                                        <div className="bg-[#181818] p-6 rounded-2xl text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap border border-white/5 shadow-inner">
                                            {selectedItem.raw_wants_stream || <span className="text-gray-600 italic">Нет записей</span>}
                                        </div>
                                    </section>

                                    {/* Future Me */}
                                    <section>
                                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 mb-4 flex items-center gap-2">
                                            Письмо в будущее
                                        </h3>
                                        <div className="bg-[#181818] p-6 rounded-2xl text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap border border-white/5 shadow-inner">
                                            {selectedItem.raw_future_me || <span className="text-gray-600 italic">Нет записей</span>}
                                        </div>
                                    </section>

                                    {/* Reverse */}
                                    <section>
                                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-4 flex items-center gap-2">
                                            От обратного
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#181818] p-5 rounded-2xl border border-white/5">
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Зависть</div>
                                                <div className="text-gray-300 text-sm">{selectedItem.raw_envy || '—'}</div>
                                            </div>
                                            <div className="bg-[#181818] p-5 rounded-2xl border border-white/5">
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Сожаления</div>
                                                <div className="text-gray-300 text-sm">{selectedItem.raw_regrets || '—'}</div>
                                            </div>
                                            <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 md:col-span-2">
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">План на 5 лет</div>
                                                <div className="text-gray-300 text-sm">{selectedItem.raw_what_to_do_5y || '—'}</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-600">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium">Выберите запись слева</p>
                                <p className="text-sm opacity-60">Здесь появятся детали вашей сессии</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
