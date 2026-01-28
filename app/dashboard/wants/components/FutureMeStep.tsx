'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface FutureMeStepProps {
    onComplete: () => void
}

export default function FutureMeStep({ onComplete }: FutureMeStepProps) {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (!text.trim()) return
        try {
            setLoading(true)
            await apiClient.updateFutureMe(text)
            await apiClient.finishFutureMe()
            onComplete()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="glass p-8 rounded-2xl space-y-6">
                <header className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">?????? ?? ????????</h2>
                    <p className="text-gray-400">
                        ???????????, ??? ??? 40 ??? ?????? (??? ?? ?????? ????? ??????).
                        ?? ???????? ?????, ???? ??????. ?? ?????????.
                        ???????? ?????? ???? ?????????. ????? ????? ?? ?? ?????
                    </p>
                </header>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="???????(??) ?..."
                    className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]/50 resize-y"
                />

                <div className="flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={loading || !text.trim()}
                        className="px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8c61] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? '?????????...' : '????????? ? ??????'}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
