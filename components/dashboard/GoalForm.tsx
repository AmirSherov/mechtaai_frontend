'use client'

import { useState } from 'react'
import { GoalIn } from '@/lib/types'

interface GoalFormProps {
    initialData?: Partial<GoalIn>
    onSubmit: (data: GoalIn) => void
    isLoading?: boolean
    onCancel: () => void
}

const HORIZONS = [
    { value: '2026', label: '2026' },
    { value: '1y', label: '1 год' },
    { value: '3y', label: '3 года' },
    { value: '5y', label: '5 лет' },
    { value: 'to_36', label: 'До 36 лет' }
]

const STATUSES = [
    { value: 'draft', label: 'Черновик' },
    { value: 'planned', label: 'Запланировано' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'done', label: 'Выполнено' },
    { value: 'dropped', label: 'Отменено' }
]

export default function GoalForm({ initialData, onSubmit, isLoading, onCancel }: GoalFormProps) {
    const [formData, setFormData] = useState<GoalIn>({
        title: initialData?.title || '',
        area_id: initialData?.area_id || 'general',
        horizon: initialData?.horizon || '2026',
        description: initialData?.description || '',
        metric: initialData?.metric || '',
        target_date: initialData?.target_date || '',
        priority: initialData?.priority || 1,
        reason: initialData?.reason || '',
        status: initialData?.status || 'planned'
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Название</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                        placeholder="Например: Выучить английский"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Сфера</label>
                    <input
                        type="text"
                        required
                        value={formData.area_id}
                        onChange={e => setFormData({ ...formData, area_id: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                        placeholder="health, career, relationships..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Горизонт</label>
                    <select
                        value={formData.horizon}
                        onChange={e => setFormData({ ...formData, horizon: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    >
                        {HORIZONS.map(h => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Статус</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    >
                        {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Приоритет</label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Дэдлайн</label>
                    <input
                        type="date"
                        value={formData.target_date || ''}
                        onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Метрика успеха</label>
                <input
                    type="text"
                    value={formData.metric || ''}
                    onChange={e => setFormData({ ...formData, metric: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    placeholder="Как вы поймете, что цель достигнута?"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Описание</label>
                <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    placeholder="Детали вашей цели..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Зачем это мне?</label>
                <textarea
                    rows={2}
                    value={formData.reason || ''}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    placeholder="Ваша мотивация..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                >
                    Отмена
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </form>
    )
}
