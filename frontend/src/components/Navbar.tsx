'use client'

import { LayoutDashboard, Trophy, Home, LogOut } from 'lucide-react'
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed top-0 left-0 w-64 bg-card border-r border-gray-200 p-4 h-screen overflow-y-auto lg:block z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 group cursor-pointer">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform group-hover:scale-110 duration-300 overflow-hidden">
              <Image
                src="/img/koni-logo.png"
                alt="KONI Aceh"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">KONI</span>
          </Link>
        </div>

        {/* Menu Section */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Menu</p>
            <nav className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                      hoveredItem === item.label && !isActive && 'translate-x-1',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* General Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">General</p>
            <nav className="space-y-0.5">
              {generalItems.map((item) => {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200',
                      hoveredItem === item.label && 'translate-x-1',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area — Background image */}
      <main
        className="flex-1 ml-64 overflow-y-auto"
        style={{
          backgroundImage: 'url(/img/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="min-h-full bg-white/85 backdrop-blur-xs p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
