'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface ReverseStepProps {
    onComplete: () => void
}

export default function ReverseStep({ onComplete }: ReverseStepProps) {
    const [form, setForm] = useState({
        envy: '',
        regrets: '',
        fiveYear: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!form.envy || !form.regrets || !form.fiveYear) return
        try {
            setLoading(true)
            const res = await apiClient.updateReverse(form.envy, form.regrets, form.fiveYear)
            if (res?.reverse_completed_at) {
                onComplete()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const isReady = form.envy.trim() && form.regrets.trim() && form.fiveYear.trim()

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="glass p-8 rounded-2xl space-y-8">
                <header className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">???????? ??????</h2>
                    <p className="text-gray-400">
                        ???????? ?????? ? ???? ??????? ????? ?????? ? ????????????.
                    </p>
                </header>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                        1. ???? ?? ????????? ? ??????? (??????? ??????? ? ??? ??????? ???????)
                    </label>
                    <textarea
                        value={form.envy}
                        onChange={(e) => handleChange('envy', e.target.value)}
                        className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                        placeholder="? ???????..."
                    />
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                        2. ? ??? ?? ?????? ??????, ???? ?? ???????? ??? ????? 10 ????
                    </label>
                    <textarea
                        value={form.regrets}
                        onChange={(e) => handleChange('regrets', e.target.value)}
                        className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                        placeholder="? ???? ??????, ???? ??..."
                    />
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                        3. ???? ?? ?? ?????, ??? ?? ?????? ???????????, ??? ?? ?? ??????? ?? 5 ????
                    </label>
                    <textarea
                        value={form.fiveYear}
                        onChange={(e) => handleChange('fiveYear', e.target.value)}
                        className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                        placeholder="? ??..."
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isReady}
                        className="px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8c61] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? '?????????...' : '????????? ? ???????'}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
