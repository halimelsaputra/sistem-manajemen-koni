'use client'

import { LayoutDashboard, Trophy, Home, LogOut, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true) // kolaps di desktop (lg+)
  const [mobileOpen, setMobileOpen] = useState(false)  // drawer di mobile (<lg)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Tutup drawer mobile saat pindah halaman (termasuk tombol back/forward browser).
  // Pola resmi React: sesuaikan state saat render, bukan di dalam effect.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Kunci scroll halaman saat drawer mobile terbuka (mutasi DOM, bukan setState → aman dari lint)
  useEffect(() => {
    if (mobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [mobileOpen]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full app-background">
      {/* Mobile top bar — hamburger + logo (hanya tampil di layar kecil) */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white/95 border-b border-gray-200 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
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
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Backdrop mobile — klik untuk menutup drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: kolapsibel & selalu terlihat; mobile: drawer geser dari kiri */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-gray-200 z-50 transition-all duration-300 ease-in-out flex flex-col",
          // Mobile: lebar penuh 208px, masuk/keluar layar
          "w-52 p-4",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop (lg+): perilaku lama — kolapsibel & selalu terlihat
          "lg:translate-x-0",
          sidebarOpen ? "lg:w-52 lg:p-4" : "lg:w-[63px] lg:p-3"
        )}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 group" onClick={(e) => {
            // Di desktop yang sedang kolaps: klik logo → buka sidebar
            if (window.innerWidth >= 1024 && !sidebarOpen) {
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
          {/* Close drawer (mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu navigasi"
            className="lg:hidden w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          {/* Collapse sidebar (desktop) */}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Ciutkan sidebar"
              className="hidden lg:flex w-8 h-8 rounded-lg border border-gray-200 items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
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
                    onClick={() => setMobileOpen(false)}
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
                    onClick={item.label === 'Keluar' ? handleLogout : () => setMobileOpen(false)}
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
          // Mobile: tanpa margin kiri + ruang untuk top bar; Desktop: geser sesuai sidebar
          "pt-14 lg:pt-0",
          sidebarOpen ? "lg:ml-52" : "lg:ml-[63px]"
        )}
      >
        <div className="flex-1 p-4 sm:p-6 lg:bg-white/75 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
