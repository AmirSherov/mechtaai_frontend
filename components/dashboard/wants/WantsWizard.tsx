'use client'

import React, { useState, useEffect } from 'react'
import { WantsRawPublic, WantsProgressPublic } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import StreamStep from './StreamStep'
import FutureMeStep from './FutureMeStep'
import ReverseStep from './ReverseStep'
import AnalysisView from './AnalysisView'
import HistoryModal from './HistoryModal'

export default function WantsWizard({ accessToken }: { accessToken: string }) {
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<WantsProgressPublic | null>(null)
    const [draft, setDraft] = useState<WantsRawPublic | null>(null)
    const [analysis, setAnalysis] = useState<any>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    // Internal state to track active step
    // 0: Stream, 1: FutureMe, 2: Reverse, 3: Analysis
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (accessToken) {
            loadData()
        }
    }, [accessToken])

    const loadData = async () => {
        apiClient.setAuthToken(accessToken)
        setLoading(true)
        try {
            // Fetch progress and draft
            // If no draft (404), create it
            let currentDraft
            try {
                currentDraft = await apiClient.getWantsDraft()
            } catch (e: any) {
                if (e.response?.status === 404 || e.status === 404) {
                    // Create new draft
                    currentDraft = await apiClient.createWantsDraft()
                } else {
                    console.error('Не удалось загрузить черновик', e)
                }
            }

            setDraft(currentDraft || null)

            const prog = await apiClient.getWantsProgress() // assumes this exists or we derive it
            if (prog) {
                setProgress(prog)
                determineStep(prog, currentDraft?.status)
            }

            // Check if analysis exists
            if (currentDraft?.status === 'completed') {
                const analysisData = await apiClient.getWantsAnalysis()
                if (analysisData) setAnalysis(analysisData)
            }

        } catch (error) {
            console.error('Не удалось загрузить данные по желаниям', error)
        } finally {
            setLoading(false)
        }
    }

    const determineStep = (prog: WantsProgressPublic, status?: string) => {
        if (status === 'completed') {
            setCurrentStep(3)
        } else if (!prog.stream_done) {
            setCurrentStep(0)
        } else if (!prog.future_me_done) {
            setCurrentStep(1)
        } else if (!prog.reverse_done) {
            setCurrentStep(2)
        } else {
            // All done but not marked completed yet?
            // Ready for completion
            setCurrentStep(2) // Or a "Review" step, but let's stick to 2 and show a Finish button
        }
    }

    const refreshData = () => {
        loadData()
    }

    const handleCompleteWants = async () => {
        setAnalyzing(true)
        try {
            const completed = await apiClient.completeWants()
            if (completed) {
                // Trigger Analysis
                const analysisResult = await apiClient.analyzeWants()
                setAnalysis(analysisResult)
                setCurrentStep(3)
                setAnalyzing(false) // Done
            }
        } catch (error) {
            console.error('Не удалось завершить анализ', error)
            setAnalyzing(false)
            alert('Не удалось завершить анализ. Попробуйте еще раз.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    // Wizard Steps Navigation (Visual)
    const steps = [
        { id: 0, title: 'Поток' },
        { id: 1, title: 'Мне 40' },
        { id: 2, title: 'Обратное' },
        { id: 3, title: 'Анализ' },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pt-16 md:pt-8 relative">
            {/* Header / Actions */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    {currentStep > 0 && currentStep < 3 && (
                        <button
                            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-200 btn-glass"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Назад
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-200 transition-all text-sm btn-glass"
                >
                    <span>📘</span>
                    <span className="hidden md:inline">История</span>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex justify-between items-center mb-12 relative mt-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-[#333] -z-10 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#ff6b35] to-purple-600 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>

                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 font-bold ${currentStep >= step.id
                                ? 'bg-[#ff6b35] border-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                                : 'bg-[#1a1a1a] border-[#333] text-gray-600'
                                }`}
                        >
                            {currentStep > step.id ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                step.id + 1
                            )}
                        </div>
                        <span className={`text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-gray-600'}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {currentStep === 0 && (
                    <StreamStep
                        initialData={draft}
                        apiClient={apiClient}
                        onComplete={refreshData}
                    />
                )}
                {currentStep === 1 && (
                    <FutureMeStep
                        initialData={draft}
                        apiClient={apiClient}
                        onComplete={refreshData}
                    />
                )}
                {currentStep === 2 && (
                    <div>
                        <ReverseStep
                            initialData={draft}
                            apiClient={apiClient}
                            onComplete={refreshData}
                        />

                        {/* Finalize Button if all readiness checks pass (locally checked via progress) */}
                        {progress?.stream_done && progress?.future_me_done && progress?.reverse_done && (
                            <div className="flex justify-center mt-12 animate-fade-in-up">
                                <button
                                    onClick={handleCompleteWants}
                                    disabled={analyzing}
                                    className="group relative px-12 py-5 rounded-2xl font-bold text-xl text-white shadow-2xl shadow-[#ff6b35]/20 btn-glass disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {analyzing ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>AI анализирует вашу личность...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span>Запустить полный анализ</span>
                                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {currentStep === 3 && (
                    <AnalysisView analysisData={analysis} />
                )}
            </div>

            <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} accessToken={accessToken} />
        </div>
    )
}
