import { Radar, BarChart3, LogOut, MapPin, FileText, Home } from 'lucide-react'

export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'swath', label: 'Swath Analysis', icon: Radar },
    { id: 'logs', label: 'Anomaly Logs', icon: BarChart3 },
    { id: 'map', label: 'Survey Map', icon: MapPin },
    { id: 'reports', label: 'System Reports', icon: FileText },
  ]

  return (
    <aside className="w-64 glass-card border-r border-accent-purple/20 flex flex-col p-6 overflow-y-auto">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-violet to-electric-cyan flex items-center justify-center">
          <Radar className="w-6 h-6 text-obsidian" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-neon-violet">SonarGuard</h1>
          <p className="text-xs text-slate-text/80">Explainable AI for marine debris detection — AI flags, evidence backs it, humans decide.</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-3 flex-1">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-neon-violet/20 border border-neon-violet/40 text-neon-violet'
                  : 'text-slate-text hover:bg-accent-purple/20 hover:border-accent-purple/30 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Status Indicator */}
      <div className="pt-6 border-t border-accent-purple/20">
        <div className="glass-card rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
            <span className="text-xs font-semibold text-slate-text">System Active</span>
          </div>
          <p className="text-xs text-slate-text/70">Ready for detection</p>
        </div>
      </div>
    </aside>
  )
}
