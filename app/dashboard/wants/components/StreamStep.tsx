'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api-client'

interface StreamStepProps {
    onComplete: () => void
}

export default function StreamStep({ onComplete }: StreamStepProps) {
    const [started, setStarted] = useState(false)
    const [text, setText] = useState('')
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes default
    const [sending, setSending] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const handleStart = async () => {
        try {
            setSending(true)
            const res = await apiClient.startStream()
            if (res) {
                setStarted(true)
                setTimeLeft(res.stream_timer_seconds || 600)
                startTimer()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSending(false)
        }
    }

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Time's up
                    if (timerRef.current) clearInterval(timerRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const handleAppend = async (newText: string) => {
        // Just send the delta or full text?
        // API says /stream/append takes "text" which is "chunk".
        // But usually user types in a textarea.
        // I will implement a debounce or send chunks.
        // Actually, simpler: user types in textarea (controlled), and I send the diff?
        // Or just one big textarea and I append?

        // The API `append_stream_text` appends text to existing. 
        // So I should only send *new* text.
        // This is tricky with a controlled input.

        // Alternative: "Chat-like" interface? 
        // Or just a big text area where user presses "Enter" to send a thought?
        // "Stream of thoughts" usually implies continuous writing.

        // Let's try: simple textarea. When user stops typing or presses Enter, we append.
        // Actually, the API says "text is appended via \n".
        // Let's use a "Enter to send" model for simplicity and robustness.
    }

    // Changing approach: Input field + List of sent thoughts.
    const [inputValue, setInputValue] = useState('')
    const [thoughts, setThoughts] = useState<string[]>([])

    const handleSubmitThought = async () => {
        if (!inputValue.trim()) return
        const t = inputValue
        setInputValue('')
        setThoughts(prev => [...prev, t])

        try {
            const res = await apiClient.appendStream(t)
            if (res?.is_completed) {
                onComplete()
            }
        } catch (e) {
            console.error('?? ??????? ????????? ?????', e)
            // Restore thought to input?
            setInputValue(t)
        }
    }

    const handleFinish = async () => {
        try {
            await apiClient.finishStream()
            onComplete()
        } catch (e) {
            console.error(e)
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    if (!started) {
        return (
            <div className="glass p-8 rounded-2xl text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-[#ff6b35]/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-white">????? ???????</h2>
                <p className="text-gray-400 max-w-lg mx-auto text-lg">????????? ?????? ?? 10 ?????. ??????????? ???, ??? ???????? ? ??????.
                    ?? ?????????? ? ?? ?????????? ? ?????? ??????.</p>
                <button
                    onClick={handleStart}
                    disabled={sending}
                    className="px-8 py-4 bg-[#ff6b35] hover:bg-[#ff8c61] text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-[#ff6b35]/30 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                >
                    {sending ? '?????????...' : '????????? ?????? (10 ???)'}
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between glass p-4 rounded-xl">
                <div className="text-white font-mono text-xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    {formatTime(timeLeft)}
                </div>
                <button
                    onClick={handleFinish}
                    className="text-gray-400 hover:text-white hover:underline text-sm"
                >
                    ????????? ??????
                </button>
            </div>

            <div className="space-y-4">
                {thoughts.map((t, i) => (
                    <div key={i} className="glass p-4 rounded-xl text-white/90 animate-slide-up">
                        {t}
                    </div>
                ))}
            </div>

            <div className="glass p-4 rounded-xl flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitThought()}
                    placeholder="? ????..."
                    className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-500"
                    autoFocus
                />
                <button
                    onClick={handleSubmitThought}
                    disabled={!inputValue.trim()}
                    className="p-2 bg-[#ff6b35] rounded-lg text-white disabled:opacity-50 hover:bg-[#ff8c61] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>
            <p className="text-center text-xs text-gray-500">??????? Enter, ????? ???????? ?????</p>
        </div>
    )
}
