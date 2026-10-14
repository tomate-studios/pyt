import { CheckCircle2, Clock, FileEdit, XCircle } from 'lucide-react'
import type { TheoryStatus } from '../types'

const config: Record<TheoryStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  published: {
    label: 'Publicada · verificada por ambos detectores',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    Icon: CheckCircle2,
  },
  pending: {
    label: 'Pendiente de revisión',
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    Icon: Clock,
  },
  rejected: {
    label: 'Rechazada en revisión',
    className: 'bg-red-500/15 text-red-300 border-red-400/30',
    Icon: XCircle,
  },
  draft: {
    label: 'Borrador',
    className: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
    Icon: FileEdit,
  },
}

export default function StatusBadge({ status }: { status: TheoryStatus }) {
  const { label, className, Icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
