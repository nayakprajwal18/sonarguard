import { useState } from 'react'
import { Download, Filter, Trash2, Search, FileJson, FileText } from 'lucide-react'

export default function AnomalyLogs({ anomalies, setAnomalies }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClass, setFilterClass] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = anomalies.filter(a => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'confirmed' && a.validated !== true) return false
      if (filterStatus === 'rejected' && a.validated !== false) return false
      if (filterStatus === 'pending' && a.validated !== null) return false
    }
    if (filterClass !== 'all' && a.target_class !== filterClass) return false
    if (searchQuery && !a.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueClasses = [...new Set(anomalies.map(a => a.target_class))]

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filtered, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `anomalies-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Class', 'Confidence', 'Shadow Ratio', 'Elevation', 'Latitude', 'Longitude', 'Status', 'Timestamp']
    const rows = filtered.map(a => [
      a.id,
      a.target_class,
      (a.confidence * 100).toFixed(1),
      (a.shadow_ratio * 100).toFixed(1),
      a.elevation_estimate.toFixed(2),
      a.latitude.toFixed(6),
      a.longitude.toFixed(6),
      a.validated === true ? 'Confirmed' : a.validated === false ? 'Rejected' : 'Pending',
      a.timestamp,
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `anomalies-${new Date().toISOString()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const deleteAnomaly = (id) => {
    setAnomalies(prev => prev.filter(a => a.id !== id))
  }

  const getStatusBadge = (anomaly) => {
    if (anomaly.validated === true) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-300">✓ VERIFIED</span>
    } else if (anomaly.validated === false) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/20 border border-red-600/40 text-red-300">✗ REJECTED</span>
    } else {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-600/20 border border-amber-600/40 text-amber-300">⊘ PENDING</span>
    }
  }

  const getPriorityBadge = (confidence, status) => {
    if (status !== null) return null // Don't show for validated items
    if (confidence >= 0.8) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-600/20 text-red-300">HIGH</span>
    if (confidence >= 0.6) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-600/20 text-amber-300">MED</span>
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-600/20 text-yellow-300">LOW</span>
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Header */}
      <div className="border-b border-cyan-600/20 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-text-primary">ANOMALY INVESTIGATION</h1>
          <p className="text-sm text-text-muted mt-1">Review, filter, and export detection records</p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Controls Panel */}
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Investigation Tools</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToJSON}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 transition-colors text-sm font-medium"
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide mb-2 block font-semibold">Search Target ID</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500/50" />
                <input
                  type="text"
                  placeholder="e.g., TGT-001"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy-800 border border-cyan-600/30 rounded-lg pl-9 pr-3 py-2 text-text-primary text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide mb-2 block font-semibold">Validation Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-navy-800 border border-cyan-600/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="confirmed">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide mb-2 block font-semibold">Target Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full bg-navy-800 border border-cyan-600/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-cyan-600/20">
            <p className="text-sm text-text-muted">
              Showing <span className="font-semibold text-cyan-400">{filtered.length}</span> of <span className="font-semibold text-cyan-400">{anomalies.length}</span> targets
            </p>
          </div>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="glass-card rounded-lg border border-cyan-600/30 bg-navy-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-600/20 bg-navy-950/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Classification</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Confidence</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Shadow</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-600/10">
                  {filtered.map((anomaly) => (
                    <tr key={anomaly.id} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-cyan-400 font-semibold">{anomaly.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">{anomaly.target_class}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-navy-800 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${anomaly.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-cyan-400 w-8 text-right">{(anomaly.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-text-secondary">{(anomaly.shadow_ratio * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(anomaly.confidence, anomaly.validated)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(anomaly)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteAnomaly(anomaly.id)}
                          className="p-2 rounded-lg hover:bg-red-600/10 text-red-400/50 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg p-12 border border-cyan-600/20 bg-navy-900/50 text-center space-y-3">
            <p className="text-text-secondary">No anomalies found matching your filters</p>
            <p className="text-text-muted text-sm">Upload a sonar image on the Dashboard to begin detection</p>
          </div>
        )}
      </div>
    </div>
  )
}
