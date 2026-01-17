'use client'

import React, { useState, useEffect } from 'react'
import { WantsRawPublic } from '@/lib/types'

interface ReverseStepProps {
    initialData: WantsRawPublic | null
    onComplete: () => void
    apiClient: any
}

export default function ReverseStep({ initialData, onComplete, apiClient }: ReverseStepProps) {
    const [envy, setEnvy] = useState('')
    const [regrets, setRegrets] = useState('')
    const [plan, setPlan] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (initialData) {
            if (initialData.raw_envy) setEnvy(initialData.raw_envy)
            if (initialData.raw_regrets) setRegrets(initialData.raw_regrets)
            if (initialData.raw_what_to_do_5y) setPlan(initialData.raw_what_to_do_5y)
        }
    }, [initialData])

    const handleSave = async (finish = false) => {
        setIsSaving(true)
        try {
            // Save fields
            const payload = {
                raw_envy: envy,
                raw_regrets: regrets,
                raw_what_to_do_5y: plan
            }
            const result = await apiClient.updateReverseWants(payload)

            // If finishing, we check if cleanup is needed or just rely on parent to detect completion status.
            // But updateReverseWants sets reverse_completed_at automatically if all fields are present on backend?
            // Wait, backend logic: "When all 3 fields are filled... reverse_completed_at set automatically".
            // So if we send all 3, it should be done.

            if (finish && result.result?.reverse_completed_at) {
                onComplete()
            } else if (finish) {
                // If user clicked finished but backend didn't mark complete (maybe empty fields), warn?
                // Simple validation
                if (!envy || !regrets || !plan) {
                    alert('Пожалуйста, заполните все поля, чтобы завершить.')
                } else {
                    onComplete() // fallback
                }
            }
        } catch (error) {
            console.error('Save failed', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Метод от обратного</h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                    Иногда проще понять, чего мы хотим, поняв, чего нам не хватает или о чем мы жалеем.
                    Ответьте честно на эти три вопроса.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="glass p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-lg font-medium text-white mb-2">1. Зависть</h3>
                    <p className="text-gray-400 text-sm mb-4">Кому или чему вы завидуете? (Белая зависть - это индикатор ваших скрытых желаний)</p>
                    <textarea
                        value={envy}
                        onChange={(e) => setEnvy(e.target.value)}
                        className="w-full h-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        placeholder="Я завидую..."
                    />
                </div>

                <div className="glass p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-lg font-medium text-white mb-2">2. Сожаления</h3>
                    <p className="text-gray-400 text-sm mb-4">О чем вы будете жалеть через 10 лет, если не сделаете это сейчас?</p>
                    <textarea
                        value={regrets}
                        onChange={(e) => setRegrets(e.target.value)}
                        className="w-full h-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        placeholder="Я буду жалеть, если не..."
                    />
                </div>

                <div className="glass p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-lg font-medium text-white mb-2">3. План на 5 лет</h3>
                    <p className="text-gray-400 text-sm mb-4">Что конкретно нужно делать в ближайшие 5 лет, чтобы прийти к желаемой жизни?</p>
                    <textarea
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full h-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        placeholder="В ближайшие 5 лет мне нужно..."
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || !envy || !regrets || !plan}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Сохранение...' : 'Завершить этап'}
                </button>
            </div>
        </div>
    )
}
