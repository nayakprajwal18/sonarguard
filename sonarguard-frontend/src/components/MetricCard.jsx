export default function MetricCard({ icon: Icon, label, value, trend, color }) {
  const colorClasses = {
    cyan: 'border-cyan-600/40 bg-cyan-500/10',
    red: 'border-red-600/40 bg-red-500/10',
    emerald: 'border-emerald-600/40 bg-emerald-500/10',
    amber: 'border-amber-600/40 bg-amber-500/10',
  }

  const iconColors = {
    cyan: 'text-cyan-500',
    red: 'text-red-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  }

  const valueColors = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }

  return (
    <div className={`glass-dark rounded-lg p-6 border ${colorClasses[color]} hover:border-opacity-100 transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-opacity-20 ${iconColors[color]}`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
      </div>
      <div>
        <p className="text-text-muted text-xs uppercase tracking-wide mb-2">{label}</p>
        <h3 className={`text-3xl font-bold ${valueColors[color]} mb-2`}>{value}</h3>
        <p className="text-xs text-text-muted">{trend}</p>
      </div>
    </div>
  )
}
