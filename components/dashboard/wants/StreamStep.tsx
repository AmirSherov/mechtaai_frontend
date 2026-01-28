'use client'

import React, { useState, useEffect, useRef } from 'react'
import { WantsRawPublic } from '@/lib/types'

interface StreamStepProps {
    initialData: WantsRawPublic | null
    onComplete: () => void
    apiClient: any
}

export default function StreamStep({ initialData, onComplete, apiClient }: StreamStepProps) {
    const [isActive, setIsActive] = useState(false)
    const [timeLeft, setTimeLeft] = useState(600) // Default 10 mins
    const [inputValue, setInputValue] = useState('')
    const [streamHistory, setStreamHistory] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (initialData?.stream_timer_seconds) {
            setTimeLeft(initialData.stream_timer_seconds)
        }
        if (initialData?.raw_wants_stream) {
            setStreamHistory(initialData.raw_wants_stream.split('\n').filter(Boolean))
        }
        if (initialData?.stream_started_at && !initialData.stream_completed_at) {
            // If started but not completed, calculate remaining time? 
            // Ideally we should sync with server time, but for MVP let's just resume timer logic if active.
            // Actually backend doesn't enforce timer stop, so just showing standard timer is fine or continuing.
            setIsActive(true)
        }
    }, [initialData])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false)
            // Optional: auto-finish? Better to let user finish manually or notify.
            finishStream()
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [streamHistory])

    const startStream = async () => {
        setIsLoading(true)
        try {
            await apiClient.startWantsStream()
            setIsActive(true)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const submitLine = async () => {
        if (!inputValue.trim()) return

        const textToSend = inputValue
        setInputValue('')
        setStreamHistory(prev => [...prev, textToSend]) // Optimistic update

        try {
            const result = await apiClient.appendWantsStream(textToSend)
            if (result.is_completed) {
                onComplete()
            }
        } catch (error) {
            console.error('Не удалось сохранить мысль', error)
            // Revert optimistic? Or just error.
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submitLine()
        }
    }

    const finishStream = async () => {
        setIsLoading(true)
        try {
            await apiClient.finishWantsStream()
            setIsActive(false)
            onComplete()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#ff6b35]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Поток желаний</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                    У вас есть 10 минут. Пишите всё, что приходит в голову, когда вы думаете "Я хочу...".
                    Не фильтруйте, не оценивайте. Просто пишите. Каждая новая мысль — новая строка.
                </p>

                <div className="text-5xl font-mono font-bold text-[#ff6b35] my-6">
                    {formatTime(timeLeft)}
                </div>

                {!isActive && streamHistory.length === 0 ? (
                    <button
                        onClick={startStream}
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl font-medium text-lg text-white btn-glass"
                    >
                        {isLoading ? 'Запуск...' : 'Начать упражнение'}
                    </button>
                ) : (
                    <>
                        {!isActive && streamHistory.length > 0 && (
                            <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-xl mb-4">
                                Таймер остановлен. Вы можете продолжить или завершить упражнение.
                            </div>
                        )}

                        {/* Stream Chat Area */}
                        <div className="max-w-2xl mx-auto glass rounded-2xl border border-white/10 p-6 h-96 flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                                {streamHistory.map((line, idx) => (
                                    <div key={idx} className="bg-white/5 p-3 rounded-lg rounded-tl-none text-left text-gray-200 animate-fade-in">
                                        {line}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Я хочу..."
                                    autoFocus // Always focus when active
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35]/60 transition-colors"
                                />
                                <button
                                    onClick={submitLine}
                                    className="text-white p-3 rounded-xl btn-glass"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={finishStream}
                                disabled={isLoading}
                                className="px-6 py-2 text-gray-200 rounded-xl btn-glass"
                            >
                                {isLoading ? 'Завершение...' : 'Закончить упражнение'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
