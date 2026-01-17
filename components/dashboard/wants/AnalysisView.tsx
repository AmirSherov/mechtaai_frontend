'use client'

import React from 'react'

interface AnalysisViewProps {
    analysisData: any
    onRetry?: () => void
}

export default function AnalysisView({ analysisData, onRetry }: AnalysisViewProps) {
    if (!analysisData) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400">Данные анализа не найдены.</p>
                {onRetry && (
                    <button onClick={onRetry} className="mt-4 text-white underline">Попробовать снова</button>
                )}
            </div>
        )
    }

    const { top_wants, top_pains, focus_areas, patterns, summary_comment } = analysisData

    return (
        <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-20">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ff6b35] to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#ff6b35]/20">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-white">Анализ вашей личности</h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    {summary_comment}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Wants */}
                <div className="glass border border-[#333] rounded-3xl p-8 hover:border-green-500/30 transition-colors">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                        Ключевые Желания
                    </h3>
                    <div className="space-y-4">
                        {top_wants?.map((want: any, idx: number) => (
                            <div key={idx} className="bg-[#2a2a2a]/50 p-4 rounded-xl border border-white/5">
                                <div className="text-lg text-white font-medium mb-1">{want.text}</div>
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-lg">Приоритет: {want.priority}</span>
                                    <span className="bg-gray-700 text-gray-400 px-2 py-1 rounded-lg">{want.horizon}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Pains */}
                <div className="glass border border-[#333] rounded-3xl p-8 hover:border-red-500/30 transition-colors">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-red-500 rounded-full"></span>
                        Основные Барьеры
                    </h3>
                    <div className="space-y-4">
                        {top_pains?.map((pain: any, idx: number) => (
                            <div key={idx} className="bg-[#2a2a2a]/50 p-4 rounded-xl border border-white/5">
                                <div className="text-lg text-white font-medium mb-1">{pain.text}</div>
                                <div className="text-xs text-red-400">Интенсивность: {pain.intensity}/10</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Patterns */}
            <div className="glass border border-[#333] rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                    Психологические Паттерны
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patterns?.map((pattern: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-[#2a2a2a]/30 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">{idx + 1}</span>
                            </div>
                            <p className="text-gray-300">{pattern.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Focus Areas */}
            <div className="glass border border-[#333] rounded-3xl p-8 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a]">
                <h3 className="text-2xl font-bold text-white mb-6">Зоны Фокуса</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {focus_areas?.map((area: any, idx: number) => (
                        <div key={idx} className="relative p-6 rounded-2xl bg-[#111] border border-[#333]">
                            <div className="text-4xl font-bold text-[#ff6b35]/20 absolute top-4 right-4">{idx + 1}</div>
                            <h4 className="text-xl font-bold text-white mb-3 capitalize">{area.area_id?.replace('_', ' ')}</h4>
                            <p className="text-gray-400 text-sm">{area.reason}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggested Questions */}
            {analysisData.suggested_questions && analysisData.suggested_questions.length > 0 && (
                <div className="glass border border-[#333] rounded-3xl p-8 bg-blue-900/10 border-blue-500/20">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">?</span>
                        Вопросы для размышления
                    </h3>
                    <p className="text-gray-400 mb-6">AI подготовил несколько глубоких вопросов на основе ваших ответов. Вам не нужно писать ответы здесь — просто подумайте над ними наедине с собой.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysisData.suggested_questions.map((question: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-[#2a2a2a]/40 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    {idx + 1}
                                </div>
                                <p className="text-gray-200 font-medium italic">"{question}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
