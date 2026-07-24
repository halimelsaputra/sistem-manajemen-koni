'use client'

import { ArrowUpRight, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

type DashboardStatCardProps = {
  value: string | number
  title: string
  increase?: string
  subtitle?: string
  delay?: string
  variant?: 'primary' | 'default'
  isActive?: boolean
  onClick?: () => void
}

export default function DashboardStatCard({
  value,
  title,
  increase,
  subtitle,
  delay = '0ms',
  variant = 'default',
  isActive = false,
  onClick,
}: DashboardStatCardProps) {
  const isPrimary = variant === 'primary'

  return (
    <Card
      onClick={onClick}
      style={{ animationDelay: delay }}
      className={`p-4 transition-all duration-300 ease-out cursor-pointer animate-slide-in-up ${
        isActive
          ? 'bg-[#dc2626] text-white shadow-xl scale-105'
          : isPrimary
            ? 'bg-[#dc2626] text-white hover:shadow-xl hover:scale-105 shadow-lg'
            : 'bg-white text-gray-900 hover:shadow-xl hover:scale-105 shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xs font-medium opacity-90">{title}</h3>
        <div
          className={`w-6 h-6 rounded-full ${
            isActive || isPrimary ? 'bg-white/20' : 'bg-[#dc2626]'
          } flex items-center justify-center transition-transform duration-300 ${
            isActive ? 'rotate-45' : ''
          }`}
        >
          <ArrowUpRight className="w-3 h-3 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {increase && (
          <>
            <TrendingUp className="w-3 h-3" />
            <span>{increase}</span>
          </>
        )}
        {subtitle && <span>{subtitle}</span>}
      </div>
    </Card>
  )
}
