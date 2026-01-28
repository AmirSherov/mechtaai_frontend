'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { ChangePasswordIn, MeResponse, UserUpdateIn } from '@/lib/types'

const LIFE_FORMAT_OPTIONS = [
    { value: 'employee', label: 'Найм' },
    { value: 'self_employed', label: 'Самозанятый' },
    { value: 'business', label: 'Бизнес' },
    { value: 'searching', label: 'В поиске' }
]

const GENDER_OPTIONS = [
    { value: 'male', label: 'Мужчина' },
    { value: 'female', label: 'Женщина' },
    { value: 'other', label: 'Другое' }
]

const NEW_YEAR_OPTIONS = [
    { value: 'calendar', label: 'Календарный' },
    { value: 'birthday', label: 'От дня рождения' },
    { value: 'custom', label: 'Своя дата' }
]

const LOCALE_OPTIONS = [
    { value: 'ru-RU', label: 'Русский' },
    { value: 'en-US', label: 'Английский' }
]

function formatDateTime(value?: string | null) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [profile, setProfile] = useState<MeResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [form, setForm] = useState<UserUpdateIn>({})
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
            loadProfile()
        }
    }, [status, router, session])

    const loadProfile = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await apiClient.getMeProfile()
            if (data) {
                setProfile(data)
                setForm({
                    first_name: data.user.first_name ?? '',
                    last_name: data.user.last_name ?? '',
                    time_zone: data.user.time_zone ?? 'Europe/Moscow',
                    date_of_birth: data.user.date_of_birth ?? '',
                    gender: data.user.gender ?? null,
                    life_format: data.user.life_format ?? null,
                    locale: data.user.locale ?? 'ru-RU',
                    personal_new_year_type: data.user.personal_new_year_type ?? 'calendar',
                    personal_new_year_date: data.user.personal_new_year_date ?? ''
                })
            }
        } catch (err) {
            console.error(err)
            setError('Не удалось загрузить настройки профиля.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof UserUpdateIn, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            setSuccess(null)

            const payload: UserUpdateIn = {
                first_name: form.first_name?.trim() || null,
                last_name: form.last_name?.trim() || null,
                time_zone: form.time_zone?.trim() || null,
                date_of_birth: form.date_of_birth || null,
                gender: form.gender || null,
                life_format: form.life_format || null,
                locale: form.locale || null,
                personal_new_year_type: form.personal_new_year_type || null,
                personal_new_year_date:
                    form.personal_new_year_type === 'custom' ? (form.personal_new_year_date || null) : null
            }

            const updated = await apiClient.updateMe(payload)
            if (updated) {
                setProfile(updated)
                setSuccess('Профиль обновлён.')
            }
        } catch (err) {
            console.error(err)
            setError('Не удалось сохранить изменения. Проверьте данные.')
        } finally {
            setSaving(false)
        }
    }

    const handlePasswordChange = async () => {
        if (!passwordForm.current_password || !passwordForm.new_password) {
            setError('Заполните текущий и новый пароль.')
            return
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setError('Новый пароль и подтверждение не совпадают.')
            return
        }
        try {
            setPasswordSaving(true)
            setError(null)
            setSuccess(null)
            const payload: ChangePasswordIn = {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password
            }
            const result = await apiClient.changePassword(payload)
            if (result?.success) {
                setSuccess('Пароль успешно обновлён.')
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
            }
        } catch (err) {
            console.error(err)
            setError('Не удалось сменить пароль. Проверьте текущий пароль.')
        } finally {
            setPasswordSaving(false)
        }
    }

    const usage = useMemo(() => profile?.usage, [profile])

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </span>
                    Настройки
                </h1>
                <p className="text-gray-400 text-lg">
                    Управляйте профилем, языком, датами и безопасностью аккаунта.
                </p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-2xl p-4">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass rounded-2xl p-8 border border-[#333] space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Профиль</h2>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 gradient-orange text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Имя</label>
                                <input
                                    type="text"
                                    value={form.first_name ?? ''}
                                    onChange={(event) => handleChange('first_name', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Фамилия</label>
                                <input
                                    type="text"
                                    value={form.last_name ?? ''}
                                    onChange={(event) => handleChange('last_name', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Email</label>
                                <input
                                    type="text"
                                    value={profile?.user.email ?? ''}
                                    readOnly
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Дата рождения</label>
                                <input
                                    type="date"
                                    value={form.date_of_birth ?? ''}
                                    onChange={(event) => handleChange('date_of_birth', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Часовой пояс</label>
                                <input
                                    type="text"
                                    value={form.time_zone ?? ''}
                                    onChange={(event) => handleChange('time_zone', event.target.value)}
                                    placeholder="Europe/Moscow"
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Пол</label>
                                <select
                                    value={form.gender ?? ''}
                                    onChange={(event) => handleChange('gender', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                >
                                    <option value="">Не указано</option>
                                    {GENDER_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Формат жизни</label>
                                <select
                                    value={form.life_format ?? ''}
                                    onChange={(event) => handleChange('life_format', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                >
                                    <option value="">Не указано</option>
                                    {LIFE_FORMAT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Язык</label>
                                <select
                                    value={form.locale ?? 'ru-RU'}
                                    onChange={(event) => handleChange('locale', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                >
                                    {LOCALE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Личный Новый год</label>
                                <select
                                    value={form.personal_new_year_type ?? 'calendar'}
                                    onChange={(event) => handleChange('personal_new_year_type', event.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                >
                                    {NEW_YEAR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Дата личного Нового года</label>
                                <input
                                    type="date"
                                    value={form.personal_new_year_date ?? ''}
                                    onChange={(event) => handleChange('personal_new_year_date', event.target.value)}
                                    disabled={form.personal_new_year_type !== 'custom'}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors disabled:opacity-40"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-8 border border-[#333] space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Безопасность</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Текущий пароль</label>
                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Новый пароль</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Повторите пароль</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff6b35] transition-colors"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaving}
                            className="px-6 py-2 bg-[#222] text-white rounded-xl hover:bg-[#333] transition-all text-sm font-medium disabled:opacity-50"
                        >
                            {passwordSaving ? 'Сохраняем...' : 'Сменить пароль'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4">Тариф и лимиты</h3>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-center justify-between">
                                <span>План</span>
                                <span className="text-white font-semibold">{profile?.plan?.toUpperCase() ?? 'FREE'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Подписка до</span>
                                <span>{formatDateTime(profile?.subscription_expires_at ?? undefined)}</span>
                            </div>
                        </div>
                        <div className="mt-5 space-y-3">
                            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
                                <div className="text-xs text-gray-500">Текстовые запросы</div>
                                <div className="text-white font-semibold">
                                    {usage?.text.used ?? 0} / {usage?.text.limit ?? 0}
                                </div>
                            </div>
                            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
                                <div className="text-xs text-gray-500">Генерации изображений</div>
                                <div className="text-white font-semibold">
                                    {usage?.image.used ?? 0} / {usage?.image.limit ?? 0}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/billing')}
                            className="w-full mt-5 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#222] transition-colors"
                        >
                            Управление подпиской
                        </button>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-2">Подсказки</h3>
                        <p className="text-sm text-gray-400">
                            Заполняйте профиль полностью — это помогает AI давать более точные рекомендации.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
