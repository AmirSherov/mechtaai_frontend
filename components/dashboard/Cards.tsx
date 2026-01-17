'use client'

import { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: ReactNode
    trend?: {
        value: string
        isPositive: boolean
    }
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
    return (
        <div className="glass rounded-xl p-6 hover:border-[#ff6b35]/30 transition-all border border-[#eff6ff]/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                    <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className="w-12 h-12 bg-[#ff6b35]/10 rounded-xl flex items-center justify-center text-[#ff6b35] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,107,53,0.15)] ring-1 ring-[#ff6b35]/20">
                        {icon}
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 relative z-10">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${trend.isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {trend.isPositive ? '+' : '-'} {trend.value}
                    </span>
                    <span className="text-xs text-gray-600">к предыдущей неделе</span>
                </div>
            )}
        </div>
    )
}

interface ChartCardProps {
    title: string
    children: ReactNode
    action?: ReactNode
}

export function ChartCard({ title, children, action }: ChartCardProps) {
    return (
        <div className="glass rounded-2xl p-6 border border-[#333]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    )
}

interface ProgressCardProps {
    title: string
    current: number
    total: number
    color?: 'orange' | 'green' | 'blue'
}

export function ProgressCard({ title, current, total, color = 'orange' }: ProgressCardProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0

    const colorStyles = {
        orange: { bg: 'bg-[#ff6b35]', shadow: 'shadow-[0_0_10px_rgba(255,107,53,0.4)]', text: 'text-[#ff6b35]' },
        green: { bg: 'bg-green-500', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.4)]', text: 'text-green-500' },
        blue: { bg: 'bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]', text: 'text-blue-500' },
    }

    const activeColor = colorStyles[color]

    return (
        <div className="glass rounded-xl p-5 border border-transparent hover:border-[#333] transition-colors bg-[#0a0a0a]/50">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
                <span className={`text-sm font-bold ${activeColor.text}`}>{percentage}%</span>
            </div>
            <div className="w-full bg-[#222] rounded-full h-2.5 overflow-hidden ring-1 ring-white/5">
                <div
                    className={`h-full ${activeColor.bg} ${activeColor.shadow} transition-all duration-1000 ease-out rounded-full relative`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Прогресс</span>
                <span>{current} / {total}</span>
            </p>
        </div>
    )
}

interface QuickActionProps {
    title: string
    description: string
    icon: ReactNode
    onClick?: () => void
}

export function QuickAction({ title, description, icon, onClick }: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className="glass rounded-xl p-4 hover:bg-[#1a1a1a] transition-all text-left w-full group border border-transparent hover:border-[#ff6b35]/30 relative overflow-hidden"
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center text-gray-400 group-hover:text-[#ff6b35] group-hover:bg-[#ff6b35]/10 transition-colors">
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-[#ff6b35] transition-colors">{title}</h4>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-700 group-hover:text-[#ff6b35] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    )
}

