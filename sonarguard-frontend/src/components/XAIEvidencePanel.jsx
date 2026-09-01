import { CheckCircle, XCircle, AlertTriangle, Gauge } from 'lucide-react'

export default function XAIEvidencePanel({ selectedAnomaly, onValidation }) {
  if (!selectedAnomaly) {
    return (
      <div className="w-80 glass-card rounded-lg p-6 border border-accent-purple/20 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-slate-text/50 mx-auto" />
          <p className="text-slate-text/60 text-sm">Select an anomaly to view XAI evidence</p>
        </div>
      </div>
    )
  }

  const shadowRatioThreshold = 0.4
  const isHighConfidenceShadow = selectedAnomaly.shadow_ratio >= shadowRatioThreshold
  const confidencePercent = (selectedAnomaly.confidence * 100).toFixed(1)
  const shadowPercent = (selectedAnomaly.shadow_ratio * 100).toFixed(1)

  return (
    <div className="w-80 glass-card rounded-lg p-6 border border-accent-purple/20 overflow-y-auto flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-accent-purple/20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neon-violet">{selectedAnomaly.id}</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-neon-violet/20 text-neon-violet">
            {selectedAnomaly.target_class}
          </span>
        </div>
        <p className="text-xs text-slate-text/70">Explainable AI Evidence Panel</p>
      </div>

      {/* Target Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-electric-cyan">Target Metrics</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-text">Target ID:</span>
            <span className="font-mono text-neon-violet">{selectedAnomaly.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-text">Classification:</span>
            <span className="text-neon-violet font-semibold">{selectedAnomaly.target_class}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-text">Pixel Width:</span>
            <span className="font-mono text-electric-cyan">{selectedAnomaly.bbox_width}px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-text">Pixel Height:</span>
            <span className="font-mono text-electric-cyan">{selectedAnomaly.bbox_height}px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-text">Estimated Elevation:</span>
            <span className="font-mono text-neon-violet">{selectedAnomaly.elevation_estimate.toFixed(2)}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-text">GPS Coordinates:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-electric-cyan text-xs">
                {selectedAnomaly.latitude.toFixed(4)}, {selectedAnomaly.longitude.toFixed(4)}
              </span>
              {selectedAnomaly.location_estimated && (
                <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 whitespace-nowrap">
                  Estimated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Metric */}
      <div className="space-y-3 p-4 bg-neon-violet/5 rounded-lg border border-neon-violet/20">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-neon-violet flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Detection Confidence
          </label>
          <span className="text-lg font-bold text-neon-violet">{confidencePercent}%</span>
        </div>
        <div className="w-full bg-accent-purple/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-neon-violet to-electric-cyan h-3 transition-all"
            style={{ width: `${confidencePercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-text/70">
          {parseFloat(confidencePercent) > 80
            ? '✓ High confidence detection'
            : parseFloat(confidencePercent) > 50
            ? '◐ Medium confidence - human review recommended'
            : '⚠ Low confidence - verify manually'}
        </p>
      </div>

      {/* Shadow Ratio Analysis */}
      <div className={`space-y-3 p-4 rounded-lg border ${
        isHighConfidenceShadow
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-orange-500/5 border-orange-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold flex items-center gap-2">
            <span className={isHighConfidenceShadow ? 'text-green-400' : 'text-orange-400'}>
              Acoustic Shadow Contrast
            </span>
          </label>
          <span className={`text-lg font-bold ${isHighConfidenceShadow ? 'text-green-400' : 'text-orange-400'}`}>
            {shadowPercent}%
          </span>
        </div>
        <div className="w-full bg-accent-purple/30 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 transition-all ${
              isHighConfidenceShadow
                ? 'bg-gradient-to-r from-green-500 to-green-400'
                : 'bg-gradient-to-r from-orange-500 to-orange-400'
            }`}
            style={{ width: `${Math.min(shadowPercent, 100)}%` }}
          ></div>
        </div>
        <div className="space-y-1 text-xs text-slate-text/70">
          <p>Threshold: {(shadowRatioThreshold * 100).toFixed(0)}% (required for seafloor confirmation)</p>
          <p className={isHighConfidenceShadow ? 'text-green-400' : 'text-orange-400'}>
            {isHighConfidenceShadow
              ? '✓ Shadow ratio CONFIRMED - Valid target with confirmed seafloor elevation'
              : '⚠ Shadow ratio LOW - Target may be false positive. Review acoustic signature.'}
          </p>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="flex gap-3 pt-4 border-t border-accent-purple/20">
        <button
          onClick={() => onValidation(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold transition-all transform hover:scale-105"
        >
          <CheckCircle className="w-5 h-5" />
          Accept
        </button>
        <button
          onClick={() => onValidation(false)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold transition-all transform hover:scale-105"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </button>
      </div>

      {/* Confidence Summary */}
      <div className="p-3 bg-accent-purple/10 rounded-lg border border-accent-purple/20 text-xs text-slate-text/70 space-y-1">
        <p className="font-semibold text-slate-text">Detection Summary:</p>
        <p>• Confidence: {parseFloat(confidencePercent)}% detection accuracy</p>
        <p>• Shadow Analysis: {isHighConfidenceShadow ? 'VALID' : 'NEEDS REVIEW'}</p>
        <p>• Status: {selectedAnomaly.validated === null ? 'Awaiting human validation' : selectedAnomaly.validated ? 'ACCEPTED' : 'REJECTED'}</p>
      </div>
    </div>
  )
}
