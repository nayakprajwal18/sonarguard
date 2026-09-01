import { useState, useEffect } from 'react'
import { MapPin, Locate } from 'lucide-react'

export default function SurveyMap({ anomalies }) {
  const [mapContainer, setMapContainer] = useState(null)
  const [selectedPin, setSelectedPin] = useState(null)

  // Calculate bounds and center
  const calculateBounds = () => {
    if (anomalies.length === 0) {
      return {
        center: [0, 0],
        minLat: -1,
        maxLat: 1,
        minLon: -1,
        maxLon: 1,
      }
    }

    const lats = anomalies.map(a => a.latitude)
    const lons = anomalies.map(a => a.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)

    return {
      center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
      minLat,
      maxLat,
      minLon,
      maxLon,
    }
  }

  const bounds = calculateBounds()

  return (
    <div className="h-full overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neon-violet">Survey Map</h2>
        <p className="text-slate-text">Geospatial distribution of detected anomalies</p>
      </div>

      {/* Canvas-based Map */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <div className="space-y-4">
          {/* Map Canvas */}
          <canvas
            ref={setMapContainer}
            width={800}
            height={600}
            className="w-full bg-obsidian rounded-lg border border-electric-cyan/20"
            style={{ cursor: 'crosshair' }}
          />

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-accent-purple/20">
            <div className="flex gap-6 text-xs text-slate-text">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-violet"></div>
                <span>Pending Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Rejected</span>
              </div>
            </div>
            <div className="text-xs text-slate-text/60">
              Total Pins: {anomalies.length}
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <h3 className="text-lg font-semibold text-neon-violet mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Georeferenced Targets ({anomalies.length})
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {anomalies.length > 0 ? (
            anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                onClick={() => setSelectedPin(anomaly)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPin?.id === anomaly.id
                    ? 'bg-neon-violet/20 border-neon-violet'
                    : 'border-accent-purple/20 hover:border-neon-violet/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-electric-cyan flex items-center gap-2">
                      <Locate className="w-4 h-4" />
                      {anomaly.id}
                    </p>
                    <p className="text-xs text-slate-text/70 mt-1">
                      {anomaly.latitude.toFixed(4)}°N, {anomaly.longitude.toFixed(4)}°E
                    </p>
                    <p className="text-xs text-slate-text/70">
                      Depth: {anomaly.elevation_estimate.toFixed(2)}m • {anomaly.target_class}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    anomaly.validated === true
                      ? 'bg-green-500'
                      : anomaly.validated === false
                      ? 'bg-red-500'
                      : 'bg-neon-violet'
                  }`}></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-text/50 text-sm text-center py-4">No anomalies to display</p>
          )}
        </div>
      </div>

      {/* Selected Pin Details */}
      {selectedPin && (
        <div className="glass-card rounded-lg p-6 border border-neon-violet/30 bg-neon-violet/5">
          <h3 className="text-sm font-semibold text-neon-violet mb-3">Selected Target Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-text/70">Target ID</p>
              <p className="font-mono text-electric-cyan">{selectedPin.id}</p>
            </div>
            <div>
              <p className="text-slate-text/70">Classification</p>
              <p className="text-neon-violet font-semibold">{selectedPin.target_class}</p>
            </div>
            <div>
              <p className="text-slate-text/70">Latitude</p>
              <p className="font-mono text-electric-cyan">{selectedPin.latitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-slate-text/70">Longitude</p>
              <p className="font-mono text-electric-cyan">{selectedPin.longitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-slate-text/70">Water Depth</p>
              <p className="font-mono text-neon-violet">{selectedPin.elevation_estimate.toFixed(2)}m</p>
            </div>
            <div>
              <p className="text-slate-text/70">Confidence Score</p>
              <p className="text-neon-violet font-semibold">{(selectedPin.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-text/70">Shadow Ratio (confirms real object)</p>
              <p className="text-electric-cyan font-semibold">{(selectedPin.shadow_ratio * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-text/70">Status</p>
              <p className={`font-semibold ${
                selectedPin.validated === true
                  ? 'text-green-400'
                  : selectedPin.validated === false
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}>
                {selectedPin.validated === true ? 'Confirmed' : selectedPin.validated === false ? 'Rejected' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
