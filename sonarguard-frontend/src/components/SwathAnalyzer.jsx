import { useState, useEffect } from 'react'
import { Sliders, Eye, EyeOff, Maximize2 } from 'lucide-react'
import XAIEvidencePanel from './XAIEvidencePanel'

export default function SwathAnalyzer({ sonarImage, anomalies, setAnomalies }) {
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedAnomaly, setSelectedAnomaly] = useState(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showAnnotations, setShowAnnotations] = useState(true)

  useEffect(() => {
    if (sonarImage) {
      drawRawImage()
    }
  }, [sonarImage, brightness, contrast, showGrid])

  useEffect(() => {
    if (sonarImage) {
      drawProcessedImage()
    }
  }, [sonarImage, anomalies, selectedAnomaly, showAnnotations])

  const drawGrid = (ctx, width, height, gridSize = 40) => {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.20)'
    ctx.lineWidth = 0.5
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawRawImage = () => {
    const canvas = document.getElementById('raw-sonar-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'
      
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height)
      }
    }
    img.src = sonarImage
  }

  const drawProcessedImage = () => {
    const canvas = document.getElementById('processed-sonar-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height)
      }

      if (showAnnotations) {
        anomalies.forEach((anomaly) => {
          const isSelected = selectedAnomaly?.id === anomaly.id
          
          let boxColor = '#06B6D4'
          if (isSelected) {
            boxColor = '#22D3EE'
          } else if (anomaly.validated === true) {
            boxColor = '#10B981'
          } else if (anomaly.validated === false) {
            boxColor = '#EF4444'
          }

          // Always draw bounding box
          ctx.strokeStyle = boxColor
          ctx.lineWidth = isSelected ? 3 : 2
          ctx.strokeRect(anomaly.bbox_x, anomaly.bbox_y, anomaly.bbox_width, anomaly.bbox_height)

          // Only show additional elements when selected
          if (isSelected) {
            // Glow effect
            ctx.strokeStyle = `rgba(34, 211, 238, 0.3)`
            ctx.lineWidth = 6
            ctx.strokeRect(anomaly.bbox_x, anomaly.bbox_y, anomaly.bbox_width, anomaly.bbox_height)

            // Center marker
            const centerX = anomaly.bbox_x + anomaly.bbox_width / 2
            const centerY = anomaly.bbox_y + anomaly.bbox_height / 2
            const markerSize = 6
            ctx.strokeStyle = boxColor
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(centerX - markerSize, centerY)
            ctx.lineTo(centerX + markerSize, centerY)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX, centerY - markerSize)
            ctx.lineTo(centerX, centerY + markerSize)
            ctx.stroke()

            // Confidence ring only when selected
            const ringRadius = Math.sqrt(
              Math.pow(anomaly.bbox_width / 2, 2) + Math.pow(anomaly.bbox_height / 2, 2)
            )
            ctx.strokeStyle = `rgba(6, 182, 212, ${anomaly.confidence * 0.4})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
            ctx.stroke()

            // ID label only when selected
            ctx.fillStyle = `rgba(34, 211, 238, 0.9)`
            ctx.fillRect(anomaly.bbox_x, anomaly.bbox_y - 25, 60, 20)
            ctx.fillStyle = '#0F1419'
            ctx.font = 'bold 12px Arial'
            ctx.fillText(`${anomaly.id}`, anomaly.bbox_x + 5, anomaly.bbox_y - 10)
          }
        })
      }
    }
    img.src = sonarImage
  }

  const handleAnomalyClick = (anomaly) => {
    setSelectedAnomaly(anomaly)
  }

  const handleValidation = (isAccepted) => {
    if (!selectedAnomaly) return

    setAnomalies(prev =>
      prev.map(a =>
        a.id === selectedAnomaly.id
          ? { ...a, validated: isAccepted }
          : a
      )
    )
    setSelectedAnomaly(null)
  }

  return (
    <div className="h-full flex gap-6 p-8 overflow-hidden bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Main Swath Panel */}
      <div className="flex-1 flex flex-col gap-6 overflow-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">SWATH ANALYSIS</h1>
          <p className="text-sm text-text-muted mt-1">Side-scan sonar visualization and target identification</p>
        </div>

        {/* Controls */}
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Image Controls</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="p-2 rounded-lg hover:bg-cyan-500/10 transition-colors text-cyan-400"
                title={showGrid ? "Hide grid" : "Show grid"}
              >
                <Maximize2 className={`w-5 h-5 transition-opacity ${showGrid ? 'opacity-100' : 'opacity-50'}`} />
              </button>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className="p-2 rounded-lg hover:bg-cyan-500/10 transition-colors text-cyan-400"
                title={showAnnotations ? "Hide annotations" : "Show annotations"}
              >
                {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-secondary">Brightness</label>
                <span className="text-xs font-mono text-cyan-400">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-secondary">Contrast</label>
                <span className="text-xs font-mono text-cyan-400">{contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-2 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Raw Sonar Swath */}
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Raw Sonar Swath</h3>
          <canvas
            id="raw-sonar-canvas"
            width={800}
            height={350}
            className="w-full bg-navy-950 rounded-lg border border-cyan-600/40 sonar-grid"
          />
          <p className="text-xs text-text-muted mt-3">Unadjusted sonar return with adjustable brightness and contrast</p>
        </div>

        {/* Processed Sonar Swath */}
        <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Processed Swath (Detections)</h3>
            <p className="text-xs text-text-muted">AI-detected targets with acoustic confirmation. Click to select and review evidence.</p>
          </div>
          <div className="relative">
            <canvas
              id="processed-sonar-canvas"
              width={800}
              height={350}
              className="w-full bg-navy-950 rounded-lg border border-cyan-600/40 sonar-grid cursor-crosshair"
            />
            {/* Clickable anomaly overlays */}
            <div className="absolute inset-0 rounded-lg">
              {anomalies.map((anomaly) => (
                <button
                  key={anomaly.id}
                  onClick={() => handleAnomalyClick(anomaly)}
                  className="absolute group"
                  style={{
                    left: `${(anomaly.bbox_x / 800) * 100}%`,
                    top: `${(anomaly.bbox_y / 350) * 100}%`,
                    width: `${(anomaly.bbox_width / 800) * 100}%`,
                    height: `${(anomaly.bbox_height / 350) * 100}%`,
                  }}
                  title={`${anomaly.target_class}: ${(anomaly.confidence * 100).toFixed(0)}%`}
                >
                  <div className={`w-full h-full rounded border-2 transition-all ${
                    selectedAnomaly?.id === anomaly.id
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-cyan-600/50 hover:border-cyan-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Click on targets to select. Color: Cyan (pending) | Green (verified) | Red (rejected)</p>
        </div>

        {/* Anomaly List */}
        {anomalies.length > 0 && (
          <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Detected Targets ({anomalies.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {anomalies.map((anomaly) => (
                <button
                  key={anomaly.id}
                  onClick={() => handleAnomalyClick(anomaly)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                    selectedAnomaly?.id === anomaly.id
                      ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-300'
                      : 'border-cyan-600/20 hover:border-cyan-500/50 hover:bg-navy-800/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-cyan-400">{anomaly.id}</span>
                      <span className="text-xs text-text-muted">{anomaly.target_class}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-navy-800 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-1.5 rounded-full"
                          style={{ width: `${anomaly.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 w-8 text-right">{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - XAI Evidence */}
      <div className="w-96">
        <XAIEvidencePanel 
          selectedAnomaly={selectedAnomaly} 
          onValidation={handleValidation}
        />
      </div>
    </div>
  )
}
