import { useState } from 'react'
import { Download, Filter, Trash2 } from 'lucide-react'

export default function AnomalyLogs({ anomalies, setAnomalies }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClass, setFilterClass] = useState('all')

  const filtered = anomalies.filter(a => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'confirmed' && a.validated !== true) return false
      if (filterStatus === 'rejected' && a.validated !== false) return false
      if (filterStatus === 'pending' && a.validated !== null) return false
    }
    if (filterClass !== 'all' && a.target_class !== filterClass) return false
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

  return (
    <div className="h-full overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neon-violet">Anomaly Logs</h2>
        <p className="text-slate-text">Review and export detected marine debris anomalies</p>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-neon-violet" />
          <h3 className="text-sm font-semibold text-neon-violet">Filters</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-xs text-slate-text mb-2 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-obsidian border border-accent-purple/30 rounded-lg px-3 py-2 text-slate-text text-sm focus:outline-none focus:border-neon-violet"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="text-xs text-slate-text mb-2 block">Target Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-obsidian border border-accent-purple/30 rounded-lg px-3 py-2 text-slate-text text-sm focus:outline-none focus:border-neon-violet"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Export Buttons */}
          <button
            onClick={exportToJSON}
            className="col-span-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neon-violet/20 hover:bg-neon-violet/30 text-neon-violet font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">JSON</span>
          </button>

          <button
            onClick={exportToCSV}
            className="col-span-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-electric-cyan/20 hover:bg-electric-cyan/30 text-electric-cyan font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">CSV</span>
          </button>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-accent-purple/20">
          <p className="text-xs text-slate-text">
            Showing <span className="font-semibold text-neon-violet">{filtered.length}</span> of <span className="font-semibold text-neon-violet">{anomalies.length}</span> anomalies
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-accent-purple/20">
              <th className="text-left py-3 px-4 text-slate-text font-semibold">ID</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Class</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Confidence Score</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Shadow Ratio (confirms real object)</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Elevation (m)</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Location</th>
              <th className="text-left py-3 px-4 text-slate-text font-semibold">Status</th>
              <th className="text-center py-3 px-4 text-slate-text font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((anomaly) => (
                <tr key={anomaly.id} className="border-b border-accent-purple/10 hover:bg-accent-purple/10 transition-colors">
                  <td className="py-3 px-4 text-electric-cyan font-mono">{anomaly.id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full bg-neon-violet/20 text-neon-violet text-xs">
                      {anomaly.target_class}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-accent-purple/20 rounded-full h-2">
                        <div
                          className="bg-neon-violet h-2 rounded-full"
                          style={{ width: `${anomaly.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{(anomaly.shadow_ratio * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 font-mono text-electric-cyan">{anomaly.elevation_estimate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-xs text-slate-text/70">
                    {anomaly.latitude.toFixed(3)}, {anomaly.longitude.toFixed(3)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      anomaly.validated === true
                        ? 'bg-green-500/20 text-green-400'
                        : anomaly.validated === false
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {anomaly.validated === true ? 'Confirmed' : anomaly.validated === false ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteAnomaly(anomaly.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete anomaly"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-text/50">
                  No anomalies match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
