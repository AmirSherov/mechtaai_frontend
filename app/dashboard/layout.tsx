import Sidebar from '@/components/Sidebar'
import MobileSidebar from '@/components/MobileSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-transparent text-white overflow-hidden">
            <Sidebar />
            <MobileSidebar />
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen overflow-hidden relative z-0">
                {children}
            </div>
        </div>
    )
}

