'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { GamificationProfile, Achievement, LeaderboardEntry } from '@/lib/types'
import { FiAward, FiTrendingUp, FiZap, FiLock, FiUnlock, FiUser } from 'react-icons/fi'

export default function GamificationPage() {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<GamificationProfile | null>(null)
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements')

    useEffect(() => {
        if (session?.accessToken) {
            loadData()
        }
    }, [session])

    const loadData = async () => {
        if (!session?.accessToken) return
        apiClient.setAuthToken(session.accessToken)
        setLoading(true)
        try {
            const [profileData, achievementsData, leaderboardData] = await Promise.all([
                apiClient.getGamificationProfile(session.accessToken),
                apiClient.getAchievements(session.accessToken),
                apiClient.getLeaderboard(20, session.accessToken)
            ])
            setProfile(profileData || null)
            setAchievements(achievementsData || [])
            setLeaderboard(leaderboardData || [])
        } catch (error) {
            console.error('Ошибка при загрузке данных геймификации:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ff6b35] to-purple-600 mb-4 animate-spin"></div>
                    <p className="text-sm md:text-base text-gray-400 max-w-2xl">Загрузка данных...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <FiAward className="w-6 h-6 text-white" />
                    </span>
                    Геймификация
                </h1>
                <p className="text-sm md:text-base text-gray-400 max-w-2xl">Отслеживайте свой прогресс и достигайте новых высот</p>
            </div>

            {/* Profile Overview Card */}
            {profile && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Level Card */}
                    <div className="col-span-1 md:col-span-2 bg-[#121212] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b35]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#ff6b35]/10 transition-all duration-500"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b35] to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-4xl font-bold text-white mb-4 md:mb-0">
                                {profile.level}
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{profile.level_title || `Уровень ${profile.level}`}</h3>
                                        <p className="text-sm text-gray-400">Ваш текущий статус</p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="text-[#ff6b35] font-bold text-xl">{profile.xp}</span>
                                        <span className="text-gray-500 text-sm"> / {profile.xp + profile.xp_to_next_level} XP</span>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#ff6b35] to-purple-600 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(profile.xp / (profile.xp + profile.xp_to_next_level)) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Ещё {profile.xp_to_next_level} XP до следующего уровня
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 flex flex-col justify-center space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <FiZap className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{profile.streak} 🔥</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Текущий стрик</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <FiTrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{profile.longest_streak} ⚡</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Рекорд стрика</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex border-b border-white/10 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('achievements')}
                    className={`pb-4 px-4 md:px-6 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'achievements' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Достижения
                    {activeTab === 'achievements' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`pb-4 px-4 md:px-6 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'leaderboard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Лидерборд
                    {activeTab === 'leaderboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35]"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                {activeTab === 'achievements' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`
                                    relative p-6 rounded-2xl border transition-all duration-300 group
                                    ${achievement.is_obtained
                                        ? 'bg-[#181818] border-[#ff6b35]/20 hover:border-[#ff6b35]/50'
                                        : 'bg-[#0a0a0a] border-white/5 opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                        ${achievement.is_obtained
                                            ? 'bg-gradient-to-br from-[#ff6b35] to-purple-600 shadow-lg shadow-orange-500/10 text-white'
                                            : 'bg-white/5 text-gray-600'}
                                    `}>
                                        {achievement.is_obtained ? <FiUnlock className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${achievement.is_obtained ? 'bg-[#ff6b35]/10 text-[#ff6b35]' : 'bg-white/5 text-gray-500'}`}>
                                        +{achievement.xp_reward} XP
                                    </span>
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${achievement.is_obtained ? 'text-white' : 'text-gray-400'}`}>
                                    {achievement.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {achievement.description}
                                </p>
                            </div>
                        ))}
                        {achievements.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                <div className="text-4xl mb-4">🏆</div>
                                <p>Достижения пока не доступны</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.user_id}
                                    className={`bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center gap-3 ${entry.user_id === session?.user?.id ? 'ring-1 ring-[#ff6b35]/40' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                                        {index + 1 === 1 && <span className="text-yellow-400">🥇</span>}
                                        {index + 1 === 2 && <span className="text-gray-300">🥈</span>}
                                        {index + 1 === 3 && <span className="text-amber-700">🥉</span>}
                                        {index + 1 > 3 && <span className="text-gray-400">#{index + 1}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-white font-semibold truncate">
                                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <FiUser className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={`truncate ${entry.user_id === session?.user?.id ? 'text-[#ff6b35]' : 'text-white'}`}>
                                                {entry.first_name || 'Аноним'} {entry.last_name || ''}
                                                {entry.user_id === session?.user?.id && ' (Вы)'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            LVL {entry.level} · {entry.total_xp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 text-center text-gray-500">Лидерборд пока пуст</div>
                            )}
                        </div>

                        <div className="hidden md:block bg-[#121212] border border-white/10 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#181818] text-gray-200 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Ранг</th>
                                            <th className="px-6 py-4">Пользователь</th>
                                            <th className="px-6 py-4 text-center">Уровень</th>
                                            <th className="px-6 py-4 text-right">XP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {leaderboard.map((entry, index) => (
                                            <tr
                                                key={entry.user_id}
                                                className={`hover:bg-white/5 transition-colors ${entry.user_id === session?.user?.id ? 'bg-[#ff6b35]/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {index + 1 === 1 && <span className="text-yellow-400 text-lg">🥇</span>}
                                                    {index + 1 === 2 && <span className="text-gray-300 text-lg">🥈</span>}
                                                    {index + 1 === 3 && <span className="text-amber-700 text-lg">🥉</span>}
                                                    {index + 1 > 3 && <span className="text-gray-500">#{index + 1}</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                            <FiUser className="w-4 h-4" />
                                                        </div>
                                                        <span className={entry.user_id === session?.user?.id ? 'text-[#ff6b35] font-bold' : 'text-white'}>
                                                            {entry.first_name || 'Аноним'} {entry.last_name || ''}
                                                            {entry.user_id === session?.user?.id && ' (Вы)'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-white/10 px-2 py-1 rounded-md text-white font-medium text-xs">LVL {entry.level}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-white">
                                                    {entry.total_xp.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-gray-500">Лидерборд пока пуст</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
