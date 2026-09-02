import { useState } from 'react'
import { MapPin, Locate, Grid3x3 } from 'lucide-react'

export default function SurveyMap({ anomalies }) {
  const [selectedPin, setSelectedPin] = useState(null)
  const [showGrid, setShowGrid] = useState(true)

  // Calculate bounds and center
  const calculateBounds = () => {
    if (anomalies.length === 0) {
      return {
        center: [40.7128, -74.0060],
        minLat: 40.7,
        maxLat: 40.72,
        minLon: -74.02,
        maxLon: -74.0,
        width: 0.02,
        height: 0.02,
      }
    }

    const lats = anomalies.map(a => a.latitude)
    const lons = anomalies.map(a => a.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)

    // Add 10% padding
    const latPadding = (maxLat - minLat) * 0.1 || 0.01
    const lonPadding = (maxLon - minLon) * 0.1 || 0.01

    return {
      center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLon: minLon - lonPadding,
      maxLon: maxLon + lonPadding,
      width: (maxLon - minLon) + 2 * lonPadding,
      height: (maxLat - minLat) + 2 * latPadding,
    }
  }

  const bounds = calculateBounds()

  // Project lat/lon to SVG coordinates
  const projectPoint = (lat, lon) => {
    const x = ((lon - bounds.minLon) / bounds.width) * 800
    const y = ((bounds.maxLat - lat) / bounds.height) * 600
    return { x, y }
  }

  const getStatusColor = (validated) => {
    if (validated === true) return '#10b981' // emerald
    if (validated === false) return '#ef4444' // red
    return '#06b6d4' // cyan
  }

  const getStatusLabel = (validated) => {
    if (validated === true) return 'VERIFIED'
    if (validated === false) return 'REJECTED'
    return 'PENDING'
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Header */}
      <div className="border-b border-cyan-600/20 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-text-primary">GEOSPATIAL SURVEY</h1>
          <p className="text-sm text-text-muted mt-1">Distribution of detected targets across the survey area</p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* SVG Map Visualization */}
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Grid3x3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Survey Area Map</h3>
            </div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                showGrid
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-600/50'
                  : 'bg-cyan-600/10 text-cyan-400/50 border border-cyan-600/20'
              }`}
              aria-label={showGrid ? 'Hide coordinate grid overlay' : 'Show coordinate grid overlay'}
              title={showGrid ? 'Grid: ON' : 'Grid: OFF'}
            >
              Grid: {showGrid ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* SVG Map */}
          <svg
            width="100%"
            height="600"
            viewBox="0 0 800 600"
            className="w-full rounded-lg border border-cyan-600/20 bg-navy-950/50"
            style={{ cursor: 'default' }}
          >
            {/* Grid Background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="0.5" />
              </pattern>
            </defs>

            {showGrid && <rect width="800" height="600" fill="url(#grid)" />}

            {/* Coordinate system lines */}
            <g stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="5,5">
              <line x1="0" y1="300" x2="800" y2="300" />
              <line x1="400" y1="0" x2="400" y2="600" />
            </g>

            {/* Axis labels */}
            <text x="750" y="320" className="text-xs fill-cyan-400/50" fontSize="11">
              E
            </text>
            <text x="415" y="590" className="text-xs fill-cyan-400/50" fontSize="11">
              N
            </text>

            {/* Detected targets */}
            {anomalies.map((anomaly, idx) => {
              const pos = projectPoint(anomaly.latitude, anomaly.longitude)
              const isSelected = selectedPin?.id === anomaly.id
              const statusColor = getStatusColor(anomaly.validated)
              const radius = 6 + (isSelected ? 2 : 0)

              return (
                <g
                  key={anomaly.id}
                  onClick={() => setSelectedPin(anomaly)}
                  style={{ cursor: 'pointer' }}
                  className="transition-all"
                >
                  {/* Outer glow */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    fill={statusColor}
                    opacity="0.15"
                    className={isSelected ? 'opacity-30' : 'opacity-15 hover:opacity-25'}
                  />

                  {/* Main marker */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={statusColor}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1"
                    className={isSelected ? 'drop-shadow-lg' : ''}
                  />

                  {/* Center dot */}
                  <circle cx={pos.x} cy={pos.y} r="2" fill="rgba(0, 0, 0, 0.5)" />

                  {/* Label (only on hover/select) */}
                  {isSelected && (
                    <>
                      <text
                        x={pos.x}
                        y={pos.y - 18}
                        textAnchor="middle"
                        className="text-xs font-bold fill-cyan-300"
                        fontSize="12"
                      >
                        {anomaly.id}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 20}
                        textAnchor="middle"
                        className="text-xs fill-cyan-400/70"
                        fontSize="10"
                      >
                        {(anomaly.confidence * 100).toFixed(0)}% • {anomaly.target_class}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-cyan-600/20">
            <div className="flex gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-text-muted">Pending Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-text-muted">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-text-muted">Rejected</span>
              </div>
            </div>
            <div className="text-xs text-text-muted">
              Total Targets: <span className="font-semibold text-cyan-400">{anomalies.length}</span>
            </div>
          </div>

          {/* Coordinate Reference Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyan-600/20 text-xs">
            <div>
              <p className="text-text-muted">Survey Bounds</p>
              <p className="font-mono text-cyan-400">
                {bounds.minLat.toFixed(4)}° to {bounds.maxLat.toFixed(4)}°N
              </p>
            </div>
            <div>
              <p className="text-text-muted">Longitude Range</p>
              <p className="font-mono text-cyan-400">
                {bounds.minLon.toFixed(4)}° to {bounds.maxLon.toFixed(4)}°E
              </p>
            </div>
          </div>
        </div>

        {/* Georeferenced Targets Table */}
        <div className="glass-card rounded-lg border border-cyan-600/30 bg-navy-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-cyan-600/20 bg-navy-950/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Georeferenced Targets
            </h3>
          </div>

          {anomalies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-600/10">
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Latitude</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Longitude</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Depth (m)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-600/10">
                  {anomalies.map((anomaly) => (
                    <tr
                      key={anomaly.id}
                      onClick={() => setSelectedPin(anomaly)}
                      className={`cursor-pointer transition-colors ${
                        selectedPin?.id === anomaly.id
                          ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500'
                          : 'hover:bg-cyan-500/5'
                      }`}
                    >
                      <td className="px-6 py-3 text-sm font-mono text-cyan-400">{anomaly.id}</td>
                      <td className="px-6 py-3 text-sm text-text-secondary">{anomaly.target_class}</td>
                      <td className="px-6 py-3 text-sm font-mono text-text-muted">{anomaly.latitude.toFixed(6)}°</td>
                      <td className="px-6 py-3 text-sm font-mono text-text-muted">{anomaly.longitude.toFixed(6)}°</td>
                      <td className="px-6 py-3 text-sm font-mono text-text-muted">{anomaly.elevation_estimate.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-navy-800 rounded-full h-1">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-1 rounded-full"
                              style={{ width: `${anomaly.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-cyan-400 w-8">{(anomaly.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          anomaly.validated === true
                            ? 'bg-emerald-600/20 text-emerald-300'
                            : anomaly.validated === false
                            ? 'bg-red-600/20 text-red-300'
                            : 'bg-amber-600/20 text-amber-300'
                        }`}>
                          {getStatusLabel(anomaly.validated)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-text-muted">No targets detected yet. Upload a sonar image to begin survey.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Target Details */}
      {selectedPin && (
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Locate className="w-4 h-4 text-cyan-400" />
            Selected Target Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location Info */}
            <div className="space-y-3 border-r border-cyan-600/20 pr-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Target ID</p>
                <p className="font-mono text-lg text-cyan-400">{selectedPin.id}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Classification</p>
                <p className="text-text-secondary font-semibold">{selectedPin.target_class}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Coordinates</p>
                <p className="font-mono text-sm text-text-secondary">
                  {selectedPin.latitude.toFixed(6)}° N<br />
                  {selectedPin.longitude.toFixed(6)}° E
                </p>
              </div>
            </div>

            {/* Detection Metrics */}
            <div className="space-y-3 border-r border-cyan-600/20 pr-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Water Depth</p>
                <p className="font-mono text-lg text-cyan-400">{selectedPin.elevation_estimate.toFixed(2)} m</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Confidence Score</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-24 bg-navy-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full"
                      style={{ width: `${selectedPin.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono text-cyan-400">{(selectedPin.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Shadow Ratio</p>
                <p className="font-mono text-sm text-text-secondary">{(selectedPin.shadow_ratio * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Validation Status */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Validation Status</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                  selectedPin.validated === true
                    ? 'bg-emerald-600/20 text-emerald-300'
                    : selectedPin.validated === false
                    ? 'bg-red-600/20 text-red-300'
                    : 'bg-amber-600/20 text-amber-300'
                }`}>
                  {getStatusLabel(selectedPin.validated)}
                </span>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Detection Time</p>
                <p className="text-sm text-text-secondary">{new Date(selectedPin.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
