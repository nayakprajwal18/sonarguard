import { CheckCircle, XCircle, AlertTriangle, Gauge, Info } from 'lucide-react'

function getReasonString(anomaly) {
  const shadowRatio = anomaly.shadow_ratio || 0
  const aspectRatio = anomaly.bbox_width / (anomaly.bbox_height || 1)
  
  let shadowClause = shadowRatio >= 0.4
    ? "strong acoustic shadow confirms the object rises off the seafloor"
    : "weak shadow contrast — lower confidence this is a raised object"
  
  let shapeClause = aspectRatio > 2 || aspectRatio < 0.5
    ? "elongated shape consistent with rope/net/pipe"
    : "compact shape consistent with a solid object"
  
  return `Flagged because of ${shadowClause} and ${shapeClause}.`
}

export default function XAIEvidencePanel({ selectedAnomaly, onValidation }) {
  if (!selectedAnomaly) {
    return (
      <div className="glass-card rounded-lg p-8 border border-cyan-600/30 bg-navy-900/50 flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Info className="w-12 h-12 text-cyan-500/30 mx-auto" />
          <p className="text-text-secondary text-sm">Select a target from the swath</p>
          <p className="text-text-muted text-xs">to review evidence and make validation decisions</p>
        </div>
      </div>
    )
  }

  const shadowRatioThreshold = 0.4
  const isHighConfidenceShadow = selectedAnomaly.shadow_ratio >= shadowRatioThreshold
  const confidencePercent = (selectedAnomaly.confidence * 100).toFixed(1)
  const shadowPercent = (selectedAnomaly.shadow_ratio * 100).toFixed(1)

  return (
    <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50 overflow-y-auto flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="space-y-3 pb-4 border-b border-cyan-600/20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-cyan-400">{selectedAnomaly.id}</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide font-semibold">
            {selectedAnomaly.target_class}
          </span>
        </div>
        <p className="text-xs text-text-muted">Explainable AI Evidence</p>
      </div>

      {/* Plain-English Reasoning */}
      <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-600/20">
        <p className="text-sm text-text-secondary leading-relaxed">{getReasonString(selectedAnomaly)}</p>
      </div>

      {/* Target Metrics */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Target Metrics</h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center px-3 py-2 bg-navy-800/30 rounded-lg">
            <span className="text-text-muted">Target ID</span>
            <span className="font-mono text-cyan-400">{selectedAnomaly.id}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 bg-navy-800/30 rounded-lg">
            <span className="text-text-muted">Classification</span>
            <span className="text-cyan-300 font-semibold">{selectedAnomaly.target_class}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 bg-navy-800/30 rounded-lg">
            <span className="text-text-muted">Pixel Width</span>
            <span className="font-mono text-cyan-400">{selectedAnomaly.bbox_width}px</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 bg-navy-800/30 rounded-lg">
            <span className="text-text-muted">Pixel Height</span>
            <span className="font-mono text-cyan-400">{selectedAnomaly.bbox_height}px</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 bg-navy-800/30 rounded-lg">
            <span className="text-text-muted">Est. Elevation</span>
            <span className="font-mono text-cyan-400">{selectedAnomaly.elevation_estimate.toFixed(1)}m</span>
          </div>
        </div>
      </div>

      {/* Confidence Metric */}
      <div className="space-y-3 p-4 bg-cyan-500/10 rounded-lg border border-cyan-600/20">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Detection Confidence
          </label>
          <span className="text-lg font-bold text-cyan-400">{confidencePercent}%</span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 transition-all"
            style={{ width: `${confidencePercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
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
          ? 'bg-emerald-500/10 border-emerald-600/20'
          : 'bg-amber-500/10 border-amber-600/20'
      }`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <span className={isHighConfidenceShadow ? 'text-emerald-400' : 'text-amber-400'}>
              Acoustic Shadow Contrast
            </span>
          </label>
          <span className={`text-lg font-bold ${isHighConfidenceShadow ? 'text-emerald-400' : 'text-amber-400'}`}>
            {shadowPercent}%
          </span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all ${
              isHighConfidenceShadow
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${Math.min(shadowPercent, 100)}%` }}
          ></div>
        </div>
        <div className="space-y-1 text-xs text-text-muted">
          <p>Threshold: {(shadowRatioThreshold * 100).toFixed(0)}% (seafloor confirmation)</p>
          <p className={isHighConfidenceShadow ? 'text-emerald-400' : 'text-amber-400'}>
            {isHighConfidenceShadow
              ? '✓ Shadow CONFIRMED - Valid target with acoustic elevation'
              : '⚠ Shadow LOW - May be false positive'}
          </p>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="flex gap-2 pt-4 border-t border-cyan-600/20">
        <button
          onClick={() => onValidation(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold text-sm transition-all transform hover:scale-105 active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          Accept
        </button>
        <button
          onClick={() => onValidation(false)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm transition-all transform hover:scale-105 active:scale-95"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>

      {/* Summary */}
      <div className="p-3 bg-navy-800/40 rounded-lg border border-cyan-600/20 text-xs text-text-muted space-y-1">
        <p className="font-semibold text-text-secondary">Summary</p>
        <p>• Confidence: {parseFloat(confidencePercent)}%</p>
        <p>• Shadow: {isHighConfidenceShadow ? 'VALID' : 'NEEDS REVIEW'}</p>
        <p>• Status: {selectedAnomaly.validated === null ? 'Awaiting validation' : selectedAnomaly.validated ? 'ACCEPTED' : 'REJECTED'}</p>
      </div>
    </div>
  )
}
