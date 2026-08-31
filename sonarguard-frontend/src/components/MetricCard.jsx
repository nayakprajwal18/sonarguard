export default function MetricCard({ icon: Icon, label, value, trend, color }) {
  const colorClasses = {
    violet: 'border-neon-violet/30 bg-neon-violet/5',
    cyan: 'border-electric-cyan/30 bg-electric-cyan/5',
    green: 'border-green-500/30 bg-green-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
  }

  const iconColors = {
    violet: 'text-neon-violet',
    cyan: 'text-electric-cyan',
    green: 'text-green-500',
    orange: 'text-orange-500',
  }

  return (
    <div className={`glass-card rounded-lg p-6 border ${colorClasses[color]} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${iconColors[color]}`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
      </div>
      <div>
        <p className="text-slate-text/70 text-sm mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-neon-violet mb-2">{value}</h3>
        <p className="text-xs text-slate-text/60">{trend}</p>
      </div>
    </div>
  )
}
