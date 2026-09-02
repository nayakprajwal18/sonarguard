import { Radar, BarChart3, MapPin, FileText, Home, Activity, Zap } from 'lucide-react'

export default function Sidebar({ currentPage, setCurrentPage }) {
  const sections = [
    {
      title: 'MONITOR',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Real-time overview' },
        { id: 'swath', label: 'Swath Analysis', icon: Radar, description: 'Sonar visualization' },
      ]
    },
    {
      title: 'INVESTIGATE',
      items: [
        { id: 'logs', label: 'Anomaly Logs', icon: BarChart3, description: 'Detection review' },
        { id: 'map', label: 'Survey Map', icon: MapPin, description: 'Geospatial view' },
      ]
    },
    {
      title: 'REPORT',
      items: [
        { id: 'reports', label: 'System Reports', icon: FileText, description: 'Analytics' },
      ]
    }
  ]

  return (
    <aside className="w-64 glass-card border-r border-cyan-600/20 flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-cyan-600/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <Radar className="w-6 h-6 text-navy-950" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text-primary">SONARGUARD</h1>
            <p className="text-xs text-text-muted">Underwater Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-8 flex-1">
        {sections.map(section => (
          <div key={section.title} className="space-y-2">
            {/* Section Title */}
            <div className="px-2 py-1">
              <p className="text-xs font-bold text-text-muted tracking-widest uppercase">{section.title}</p>
            </div>
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-400'
                        : 'text-text-secondary hover:bg-navy-700/50 hover:border-cyan-600/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-text-muted group-hover:text-cyan-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className={`text-xs ${isActive ? 'text-cyan-500/70' : 'text-text-muted'}`}>{item.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status */}
      <div className="pt-8 border-t border-cyan-600/20 space-y-4">
        <div className="px-2 py-1">
          <p className="text-xs font-bold text-text-muted tracking-widest uppercase">System Status</p>
        </div>
        
        <div className="space-y-2">
          {/* AI Engine */}
          <div className="px-3 py-2 glass-dark rounded-lg border border-cyan-600/20 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">AI Engine</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 status-light online"></div>
                <span className="text-xs text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>
          
          {/* Sonar Input */}
          <div className="px-3 py-2 glass-dark rounded-lg border border-cyan-600/20 flex items-center gap-2">
            <Radar className="w-4 h-4 text-cyan-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">Sonar Input</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500 status-light online"></div>
                <span className="text-xs text-cyan-400 font-medium">Ready</span>
              </div>
            </div>
          </div>
          
          {/* Database */}
          <div className="px-3 py-2 glass-dark rounded-lg border border-cyan-600/20 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">Memory</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 status-light online"></div>
                <span className="text-xs text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
