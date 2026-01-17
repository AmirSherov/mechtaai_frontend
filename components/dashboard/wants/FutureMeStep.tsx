'use client'

import React, { useState, useEffect } from 'react'
import { WantsRawPublic } from '@/lib/types'

interface FutureMeStepProps {
    initialData: WantsRawPublic | null
    onComplete: () => void
    apiClient: any
}

export default function FutureMeStep({ initialData, onComplete, apiClient }: FutureMeStepProps) {
    const [text, setText] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    useEffect(() => {
        if (initialData?.raw_future_me) {
            setText(initialData.raw_future_me)
        }
    }, [initialData])

    // Auto-save logic (debounce could be here, but for now manual or on blur/finish)
    const saveText = async (silent = false) => {
        if (!text.trim()) return
        if (!silent) setIsSaving(true)
        try {
            await apiClient.setFutureMe(text)
            setLastSaved(new Date())
        } catch (error) {
            console.error('Auto-save failed', error)
        } finally {
            if (!silent) setIsSaving(false)
        }
    }

    const handleFinish = async () => {
        setIsSaving(true)
        try {
            await saveText(true) // Ensure saved
            await apiClient.finishFutureMe()
            onComplete()
        } catch (error) {
            console.error('Finish failed', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Письмо в будущее: Мне 40 лет</h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                    Представьте, что вам исполнилось 40 лет (или +10 лет к вашему возрасту).
                    Опишите один ваш идеальный день. Где вы живете? Кто рядом? Чем занимаетесь?
                    Как вы себя чувствуете? Пишите подробно и в настоящем времени.
                </p>
            </div>

            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={() => saveText(true)} // Auto-save on blur
                    placeholder="Мне 40 лет. Я просыпаюсь в..."
                    className="w-full h-96 bg-[#2a2a2a]/50 border border-[#333] rounded-2xl p-6 text-gray-200 focus:outline-none focus:border-purple-500/50 transition-colors resize-none leading-relaxed text-lg"
                />
                <div className="absolute bottom-4 right-4 text-xs text-gray-500">
                    {lastSaved ? `Сохранено в ${lastSaved.toLocaleTimeString()}` : 'Текст сохраняется автоматически'}
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button
                    onClick={() => saveText(false)}
                    disabled={isSaving}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                    Сохранить черновик
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isSaving || text.length < 50}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Сохранение...' : 'Завершить упражнение'}
                </button>
            </div>
        </div>
    )
}
