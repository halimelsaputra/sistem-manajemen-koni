'use client'

import { LayoutDashboard, Trophy, Home, LogOut, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Trophy, label: 'Direktori Prestasi', href: '/athletes' },
  { icon: Home, label: 'Kepengurusan', href: '/management' },
]

const generalItems = [
  { icon: LogOut, label: 'Keluar', href: '/logout' },
]

export default function Navbar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: 'url(/img/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-gray-200 z-40 transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "w-52 p-4" : "w-[63px] p-3"
        )}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 group" onClick={(e) => {
            if (!sidebarOpen) {
              e.preventDefault();
              setSidebarOpen(true);
            }
          }}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform group-hover:scale-110 duration-300 overflow-hidden shrink-0">
              <Image
                src="/img/koni-logo.png"
                alt="KONI Aceh"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className={cn(
              "text-lg font-semibold text-gray-900 whitespace-nowrap transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0"
            )}>KONI</span>
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Menu Section */}
        <div className="space-y-4 flex-1">
          <div>
            <p className={cn(
              "text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider whitespace-nowrap transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0"
            )}>Menu</p>
            <nav className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className={cn(
                      "text-sm whitespace-nowrap transition-opacity duration-300",
                      sidebarOpen ? "opacity-100" : "opacity-0"
                    )}>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* General Section */}
          <div>
            <p className={cn(
              "text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider whitespace-nowrap transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0"
            )}>General</p>
            <nav className="space-y-0.5">
              {generalItems.map((item) => {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className={cn(
                      "text-sm whitespace-nowrap transition-opacity duration-300",
                      sidebarOpen ? "opacity-100" : "opacity-0"
                    )}>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-screen overflow-y-auto transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "ml-52" : "ml-[63px]"
        )}
      >
        <div className="flex-1 bg-white/85 backdrop-blur-xs p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
