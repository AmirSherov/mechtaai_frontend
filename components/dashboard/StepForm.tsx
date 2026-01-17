'use client'

import { useState } from 'react'
import { StepIn, Goal, StepLevel, StepStatus } from '@/lib/types'

interface StepFormProps {
    goals: Goal[]
    initialData?: Partial<StepIn>
    onSubmit: (data: StepIn) => void
    isLoading?: boolean
    onCancel: () => void
}

const LEVELS: { value: StepLevel, label: string }[] = [
    { value: 'year', label: 'Год' },
    { value: 'quarter', label: 'Квартал' },
    { value: 'month', label: 'Месяц' },
    { value: 'week', label: 'Неделя' },
    { value: 'day', label: 'День' }
]

const STATUSES: { value: StepStatus, label: string }[] = [
    { value: 'planned', label: 'Запланировано' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'done', label: 'Выполнено' },
    { value: 'skipped', label: 'Пропущено' }
]

export default function StepForm({ goals, initialData, onSubmit, isLoading, onCancel }: StepFormProps) {
    const [formData, setFormData] = useState<StepIn>({
        goal_id: initialData?.goal_id || (goals[0]?.id || ''),
        level: initialData?.level || 'week',
        title: initialData?.title || '',
        description: initialData?.description || '',
        planned_date: initialData?.planned_date || '',
        status: initialData?.status || 'planned'
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-gray-300">Название действия</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                        placeholder="Что конкретно сделать?"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Цель</label>
                    <select
                        required
                        value={formData.goal_id}
                        onChange={e => setFormData({ ...formData, goal_id: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    >
                        <option value="" disabled>Выберите цель</option>
                        {goals.map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Уровень</label>
                    <select
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value as StepLevel })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    >
                        {LEVELS.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Дата</label>
                    <input
                        type="date"
                        value={formData.planned_date || ''}
                        onChange={e => setFormData({ ...formData, planned_date: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Статус</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as StepStatus })}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    >
                        {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Описание</label>
                <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6b35]"
                    placeholder="Детали..."
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
