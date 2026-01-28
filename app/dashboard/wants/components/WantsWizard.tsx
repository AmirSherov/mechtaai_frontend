'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { WantsProgress, WantsAnalysis } from '@/lib/types'
import StreamStep from './StreamStep'
import FutureMeStep from './FutureMeStep'
import ReverseStep from './ReverseStep'

export default function WantsWizard() {
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<WantsProgress | null>(null)
    const [analysis, setAnalysis] = useState<WantsAnalysis | null>(null)
    const [error, setError] = useState<string | null>(null)
    const statusLabel = (status?: string) => {
        switch (status) {
            case 'completed':
                return 'Завершено'
            case 'in_progress':
                return 'В процессе'
            case 'pending':
                return 'Ожидание'
            case 'draft':
                return 'Черновик'
            case 'failed':
                return 'Ошибка'
            default:
                return status || '—'
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const p = await apiClient.getWantsProgress()
            if (p) setProgress(p)

            if (p?.status === 'completed') {
                const a = await apiClient.getWantsAnalysis()
                if (a) setAnalysis(a)
            }
        } catch (err) {
            console.error(err)
            setError('?? ??????? ????????? ???????? ?? ?????')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-400">????????...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>
    }

    if (!progress) {
        return <div className="p-8 text-center text-gray-400">?????????????...</div>
    }

    if (progress.status === 'completed') {
        return (
            <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-green-400">
                    <h2 className="text-xl font-bold mb-2">?????? ????????</h2>
                    <p>???? ??????? ????????????????.</p>
                </div>
                {analysis && (
                    <div className="glass p-6 rounded-xl space-y-4">
                        <h3 className="text-xl font-bold text-white">??????</h3>
                        <p className="text-gray-300">{analysis.summary_comment}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold text-[#ff6b35]">??????? ???????</h4>
                                <ul className="list-disc pl-5 text-gray-300">
                                    {analysis.top_wants.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#ff6b35]">??????? ????</h4>
                                <ul className="list-disc pl-5 text-gray-300">
                                    {analysis.top_pains.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }


    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-2">
                    <div className={`h-2 w-16 rounded-full ${progress.stream_done ? 'bg-green-500' : 'bg-gray-700'}`} />
                    <div className={`h-2 w-16 rounded-full ${progress.future_me_done ? 'bg-green-500' : 'bg-gray-700'}`} />
                    <div className={`h-2 w-16 rounded-full ${progress.reverse_done ? 'bg-green-500' : 'bg-gray-700'}`} />
                </div>
                <div className="text-sm text-gray-400">Статус: {statusLabel(progress.status)}</div>
            </div>

            {!progress.stream_done && (
                <StreamStep onComplete={loadData} />
            )}

            {progress.stream_done && !progress.future_me_done && (
                <FutureMeStep onComplete={loadData} />
            )}

            {progress.stream_done && progress.future_me_done && !progress.reverse_done && (
                <ReverseStep onComplete={loadData} />
            )}

            {progress.all_done && (
                <div className="glass p-8 rounded-2xl text-center space-y-6">
                    <h2 className="text-2xl font-bold text-white">?????? ? ???????</h2>
                    <p className="text-gray-400">?? ?????? ??? ????.</p>
                    <button
                        onClick={async () => {
                            await apiClient.completeWants()
                            await apiClient.analyzeWants()
                            loadData()
                        }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
                    >
                        ????????? ? ????????????????
                    </button>
                </div>
            )}
        </div>
    )
}
