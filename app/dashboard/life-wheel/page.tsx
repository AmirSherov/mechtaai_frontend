'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Area, LifeWheel, LifeWheelCreateIn } from '@/lib/types'

const SCORE_MIN = 0
const SCORE_MAX = 10
const SCORE_STEP = 1
const HISTORY_PAGE_SIZE = 10

function buildInitialScores(areas: Area[], latestScores?: Record<string, number>) {
    const scores: Record<string, number> = {}
    for (const area of areas) {
        const value = latestScores?.[area.id]
        if (typeof value === 'number' && !Number.isNaN(value)) {
            scores[area.id] = Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(value)))
        } else {
            scores[area.id] = 5
        }
    }
    return scores
}

function formatDate(value?: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(value?: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function averageScore(scores: Record<string, number>, areaIds: string[]) {
    if (!areaIds.length) return 0
    const sum = areaIds.reduce((acc, id) => acc + (scores[id] ?? 0), 0)
    return Math.round((sum / areaIds.length) * 10) / 10
}

function LifeWheelChart({ areas, scores }: { areas: Area[]; scores: Record<string, number> }) {
    const size = 320
    const center = size / 2
    const radius = 120
    const levels = [0.25, 0.5, 0.75, 1]

    if (!areas.length) return null

    const points = areas.map((area, index) => {
        const angle = (Math.PI * 2 * index) / areas.length - Math.PI / 2
        const value = scores[area.id] ?? 0
        const r = (Math.min(SCORE_MAX, Math.max(SCORE_MIN, value)) / SCORE_MAX) * radius
        const x = center + r * Math.cos(angle)
        const y = center + r * Math.sin(angle)
        return `${x},${y}`
    })

    return (
        <svg width={size} height={size} className="w-full h-auto">
            <defs>
                <linearGradient id="lifeWheelFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffb703" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            <g>
                {levels.map((lvl, idx) => (
                    <circle
                        key={`grid-${idx}`}
                        cx={center}
                        cy={center}
                        r={radius * lvl}
                        fill="none"
                        stroke="#2a2a2a"
                        strokeDasharray="4 6"
                    />
                ))}
                {areas.map((_, index) => {
                    const angle = (Math.PI * 2 * index) / areas.length - Math.PI / 2
                    const x = center + radius * Math.cos(angle)
                    const y = center + radius * Math.sin(angle)
                    return (
                        <line
                            key={`axis-${index}`}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="#2a2a2a"
                        />
                    )
                })}
                <polygon points={points.join(' ')} fill="url(#lifeWheelFill)" stroke="#ff6b35" strokeWidth="2" />
                {areas.map((area, index) => {
                    const angle = (Math.PI * 2 * index) / areas.length - Math.PI / 2
                    const x = center + (radius + 18) * Math.cos(angle)
                    const y = center + (radius + 18) * Math.sin(angle)
                    const score = scores[area.id] ?? 0
                    return (
                        <g key={`label-${area.id}`}>
                            <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#9ca3af"
                            >
                                {area.title}
                            </text>
                            <text
                                x={x}
                                y={y + 12}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#ff6b35"
                            >
                                {score}
                            </text>
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}

export default function LifeWheelPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [areas, setAreas] = useState<Area[]>([])
    const [scores, setScores] = useState<Record<string, number>>({})
    const [note, setNote] = useState('')
    const [latest, setLatest] = useState<LifeWheel | null>(null)
    const [history, setHistory] = useState<LifeWheel[]>([])
    const [historyPage, setHistoryPage] = useState(1)
    const [historyHasNext, setHistoryHasNext] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const areaIds = useMemo(() => areas.map((area) => area.id), [areas])
    const areasById = useMemo(() => {
        const map: Record<string, Area> = {}
        for (const area of areas) {
            map[area.id] = area
        }
        return map
    }, [areas])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadLifeWheel()
        }
    }, [status, router, session])

    const loadLifeWheel = async () => {
        try {
            setLoading(true)
            setError(null)
            const [areasRes, latestRes, historyRes] = await Promise.all([
                apiClient.getAreas(false),
                apiClient.getLifeWheelLatest(),
                apiClient.getLifeWheelHistory(1, HISTORY_PAGE_SIZE)
            ])
            const list = areasRes?.items || []
            setAreas(list)
            setLatest(latestRes ?? null)
            setHistory(historyRes.items)
            setHistoryPage(1)
            setHistoryHasNext(Boolean(historyRes.pagination?.has_next))
            setScores(buildInitialScores(list, latestRes?.scores))
            setNote('')
        } catch (err) {
            console.error(err)
            setError('Не удалось загрузить данные Колеса жизни.')
        } finally {
            setLoading(false)
        }
    }

    const loadMoreHistory = async () => {
        try {
            setLoadingHistory(true)
            const nextPage = historyPage + 1
            const historyRes = await apiClient.getLifeWheelHistory(nextPage, HISTORY_PAGE_SIZE)
            setHistory((prev) => [...prev, ...historyRes.items])
            setHistoryPage(nextPage)
            setHistoryHasNext(Boolean(historyRes.pagination?.has_next))
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleScoreChange = (areaId: string, value: number) => {
        setScores((prev) => ({
            ...prev,
            [areaId]: Math.min(SCORE_MAX, Math.max(SCORE_MIN, value))
        }))
    }

    const handleSave = async () => {
        if (!areaIds.length) return
        try {
            setSaving(true)
            const payload: LifeWheelCreateIn = {
                scores: areaIds.reduce((acc, id) => {
                    acc[id] = scores[id] ?? 0
                    return acc
                }, {} as Record<string, number>),
                note: note.trim() ? note.trim() : null
            }
            const created = await apiClient.createLifeWheel(payload)
            if (created) {
                setLatest(created)
                setHistory((prev) => [created, ...prev])
                setNote('')
            }
        } catch (err) {
            console.error(err)
            alert('Не удалось сохранить замер. Проверьте оценки по сферам.')
        } finally {
            setSaving(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </span>
                    Колесо жизни
                </h1>
                <p className="text-gray-400 text-lg">
                    Отметьте, насколько вы довольны ключевыми сферами жизни сегодня, и зафиксируйте результат.
                </p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-white mb-3">Текущая визуализация</h2>
                                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                    <LifeWheelChart areas={areas} scores={scores} />
                                </div>
                            </div>
                            <div className="w-full lg:w-64 space-y-4">
                                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                    <div className="text-sm text-gray-400">Средний баланс</div>
                                    <div className="text-3xl font-bold text-white mt-1">
                                        {averageScore(scores, areaIds)}
                                        <span className="text-base text-gray-500">/10</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Последний замер: {latest ? formatDate(latest.created_at) : 'ещё не было'}
                                    </div>
                                </div>
                                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                    <div className="text-sm text-gray-400">Подсказка</div>
                                    <p className="text-sm text-gray-300 mt-2">
                                        Оцените каждую сферу от 0 до 10. После сохранения вы увидите динамику в истории.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-[#333] space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Оцените сферы</h2>
                            <button
                                onClick={handleSave}
                                disabled={saving || !areaIds.length}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Сохраняем...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Сохранить замер</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {areas.map((area) => (
                                <div key={area.id} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-white font-semibold">{area.title}</div>
                                            {area.description && (
                                                <div className="text-xs text-gray-500 mt-1">{area.description}</div>
                                            )}
                                        </div>
                                        <div className="text-lg font-bold text-[#ff6b35]">{scores[area.id] ?? 0}/10</div>
                                    </div>
                                    <input
                                        type="range"
                                        min={SCORE_MIN}
                                        max={SCORE_MAX}
                                        step={SCORE_STEP}
                                        value={scores[area.id] ?? 0}
                                        onChange={(event) => handleScoreChange(area.id, Number(event.target.value))}
                                        className="w-full mt-4 accent-[#ff6b35]"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                            <div className="text-sm text-gray-400 mb-2">Заметка (опционально)</div>
                            <textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                rows={4}
                                className="w-full bg-[#151515] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35]"
                                placeholder="Что повлияло на оценки?"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4">Последний замер</h3>
                        {latest ? (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-400">Дата: {formatDateTime(latest.created_at)}</div>
                                <div className="space-y-2">
                                    {Object.entries(latest.scores)
                                        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                                        .map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-300">{areasById[key]?.title || key}</span>
                                                <span className="text-[#ff6b35] font-semibold">{value}/10</span>
                                            </div>
                                        ))}
                                </div>
                                {latest.note && (
                                    <div className="text-xs text-gray-500 border-t border-[#2a2a2a] pt-3">
                                        {latest.note}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Вы ещё не делали замер. Заполните оценки и сохраните.</p>
                        )}
                    </div>

                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4">История замеров</h3>
                        {history.length === 0 ? (
                            <p className="text-sm text-gray-400">История пока пустая.</p>
                        ) : (
                            <div className="space-y-4">
                                {history.map((item) => {
                                    const ids = Object.keys(item.scores || {})
                                    const avg = averageScore(item.scores || {}, ids)
                                    return (
                                        <div key={item.id} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-400">{formatDateTime(item.created_at)}</div>
                                                <div className="text-sm text-[#ff6b35] font-semibold">{avg}/10</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                {ids.map((key) => (
                                                    <div key={key} className="text-xs text-gray-300 flex items-center justify-between">
                                                        <span className="truncate">{areasById[key]?.title || key}</span>
                                                        <span className="text-[#ff6b35] font-semibold">{item.scores[key]}/10</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {item.note && (
                                                <div className="text-xs text-gray-500 border-t border-[#2a2a2a] pt-2 mt-2">
                                                    {item.note}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {historyHasNext && (
                            <button
                                onClick={loadMoreHistory}
                                disabled={loadingHistory}
                                className="w-full mt-4 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#222] transition-colors"
                            >
                                {loadingHistory ? 'Загрузка...' : 'Показать ещё'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
