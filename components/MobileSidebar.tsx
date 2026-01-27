'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
    FiHome, FiHeart, FiBookOpen, FiTarget, FiList,
    FiSun, FiImage, FiPieChart, FiStar, FiAward,
    FiCreditCard, FiSettings, FiMenu, FiX, FiLogOut
} from 'react-icons/fi'

const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Хочу', href: '/dashboard/wants', icon: <FiHeart className="w-5 h-5" /> },
    { name: 'История будущего', href: '/dashboard/future-story', icon: <FiBookOpen className="w-5 h-5" /> },
    { name: 'Цели', href: '/dashboard/goals', icon: <FiTarget className="w-5 h-5" /> },
    { name: 'Шаги', href: '/dashboard/steps', icon: <FiList className="w-5 h-5" /> },
    { name: 'Ритуалы', href: '/dashboard/rituals', icon: <FiSun className="w-5 h-5" /> },
    { name: 'Визуалы', href: '/dashboard/visuals', icon: <FiImage className="w-5 h-5" /> },
    { name: 'Колесо жизни', href: '/dashboard/life-wheel', icon: <FiPieChart className="w-5 h-5" /> },
    { name: 'Эзотерика', href: '/dashboard/esoterics', icon: <FiStar className="w-5 h-5" /> },
    { name: 'Геймификация', href: '/dashboard/gamification', icon: <FiAward className="w-5 h-5" /> },
    { name: 'Подписка', href: '/dashboard/billing', icon: <FiCreditCard className="w-5 h-5" /> },
    { name: 'Настройки', href: '/dashboard/settings', icon: <FiSettings className="w-5 h-5" /> },
]

export default function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Toggle Button */}
            <div className="md:hidden fixed top-4 right-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-11 h-11 rounded-full flex items-center justify-center btn-glass transition-transform active:scale-95"
                >
                    {isOpen ? (
                        <FiX className="w-6 h-6 text-white" />
                    ) : (
                        <FiMenu className="w-6 h-6 text-white" />
                    )}
                </button>
            </div>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 md:hidden p-3
                transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex h-full w-72 flex-col glass rounded-3xl border border-white/10 overflow-hidden">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto scrollbar-thin">
                        <div className="flex items-center flex-shrink-0 px-6 mb-8 mt-2">
                            <div className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <span className="ml-3 text-xl font-bold text-white tracking-wide">MechtaAI</span>
                        </div>

                        <nav className="mt-5 flex-1 px-3 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                            ${isActive
                                                ? 'bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20 shadow-[0_0_10px_rgba(255,107,53,0.1)]'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <div className={`${isActive ? 'text-[#ff6b35]' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                                            {item.icon}
                                        </div>
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="flex-shrink-0 flex border-t border-white/10 p-4">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                signOut({ callbackUrl: '/login' })
                            }}
                            className="flex-shrink-0 w-full group block"
                        >
                            <div className="flex items-center px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center text-white font-semibold shadow-md">
                                    A
                                </div>
                                <div className="ml-3 flex-1 text-left">
                                    <p className="text-sm font-medium text-white group-hover:text-[#ff6b35] transition-colors">Выйти</p>
                                    <p className="text-xs text-gray-500">Сессия</p>
                                </div>
                                <FiLogOut className="w-5 h-5 text-gray-500 group-hover:text-[#ff6b35] transition-colors" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
