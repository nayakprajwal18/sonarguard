import { useState, useRef, useEffect } from 'react'
import { Sliders, Download } from 'lucide-react'
import XAIEvidencePanel from './XAIEvidencePanel'

export default function SwathAnalyzer({ sonarImage, anomalies, setAnomalies }) {
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedAnomaly, setSelectedAnomaly] = useState(null)
  const [rawCanvasRef, setRawCanvasRef] = useState(null)
  const [processedCanvasRef, setProcessedCanvasRef] = useState(null)

  // Draw raw sonar image with brightness/contrast adjustments
  useEffect(() => {
    if (sonarImage) {
      drawRawImage()
    }
  }, [sonarImage, brightness, contrast])

  // Draw processed image with detected bounding boxes
  useEffect(() => {
    if (sonarImage) {
      drawProcessedImage()
    }
  }, [sonarImage, anomalies, selectedAnomaly])

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

      // Draw detected anomalies with bounding boxes
      anomalies.forEach((anomaly, idx) => {
        const isSelected = selectedAnomaly?.id === anomaly.id

        // Bounding box
        ctx.strokeStyle = isSelected ? '#06B6D4' : '#8B5CF6'
        ctx.lineWidth = isSelected ? 4 : 2
        ctx.strokeRect(anomaly.bbox_x, anomaly.bbox_y, anomaly.bbox_width, anomaly.bbox_height)

        // Confidence ring
        const ringRadius = Math.sqrt(
          Math.pow(anomaly.bbox_width / 2, 2) + Math.pow(anomaly.bbox_height / 2, 2)
        )
        const centerX = anomaly.bbox_x + anomaly.bbox_width / 2
        const centerY = anomaly.bbox_y + anomaly.bbox_height / 2

        ctx.strokeStyle = `rgba(139, 92, 246, ${anomaly.confidence * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()

        // Label
        ctx.fillStyle = isSelected ? '#06B6D4' : '#8B5CF6'
        ctx.font = 'bold 12px Arial'
        ctx.fillText(`${anomaly.id}`, centerX - 10, centerY - ringRadius - 10)
      })
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
    <div className="h-full flex gap-6 p-8 overflow-hidden">
      {/* Left Panel - Raw & Processed Swaths */}
      <div className="flex-1 flex flex-col gap-6 overflow-auto">
        {/* Controls */}
        <div className="glass-card rounded-lg p-4 border border-accent-purple/20">
          <div className="flex items-center gap-4">
            <Sliders className="w-5 h-5 text-neon-violet" />
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-sm text-slate-text mb-2 block">
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-slate-text mb-2 block">
                  Contrast: {contrast}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Raw Sonar Swath */}
        <div className="glass-card rounded-lg p-4 border border-accent-purple/20">
          <h3 className="text-sm font-semibold text-neon-violet mb-3">Raw Sonar Swath</h3>
          <canvas
            id="raw-sonar-canvas"
            width={600}
            height={300}
            className="w-full bg-obsidian rounded-lg border border-electric-cyan/20"
          />
        </div>

        {/* Processed Sonar Swath with Anomalies */}
        <div className="glass-card rounded-lg p-4 border border-accent-purple/20">
          <h3 className="text-sm font-semibold text-neon-violet mb-3">Processed Swath (Detections)</h3>
          <div className="relative">
            <canvas
              id="processed-sonar-canvas"
              width={600}
              height={300}
              className="w-full bg-obsidian rounded-lg border border-electric-cyan/20 cursor-pointer"
            />
            {/* Clickable anomaly overlays */}
            <div className="absolute inset-0 rounded-lg">
              {anomalies.map((anomaly) => (
                <button
                  key={anomaly.id}
                  onClick={() => handleAnomalyClick(anomaly)}
                  className="absolute group"
                  style={{
                    left: `${(anomaly.bbox_x / 600) * 100}%`,
                    top: `${(anomaly.bbox_y / 300) * 100}%`,
                    width: `${(anomaly.bbox_width / 600) * 100}%`,
                    height: `${(anomaly.bbox_height / 300) * 100}%`,
                  }}
                  title={`${anomaly.target_class}: ${(anomaly.confidence * 100).toFixed(0)}%`}
                >
                  <div className={`w-full h-full rounded border-2 transition-all ${
                    selectedAnomaly?.id === anomaly.id
                      ? 'border-electric-cyan bg-electric-cyan/10'
                      : 'border-neon-violet/50 hover:border-neon-violet'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Anomaly List */}
        <div className="glass-card rounded-lg p-4 border border-accent-purple/20">
          <h3 className="text-sm font-semibold text-neon-violet mb-3">Detected Anomalies ({anomalies.length})</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {anomalies.map((anomaly) => (
              <button
                key={anomaly.id}
                onClick={() => handleAnomalyClick(anomaly)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
                  selectedAnomaly?.id === anomaly.id
                    ? 'bg-neon-violet/20 border-neon-violet'
                    : 'border-accent-purple/20 hover:border-neon-violet/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-electric-cyan">{anomaly.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-text">{anomaly.target_class}</span>
                    <div className="w-16 bg-accent-purple/20 rounded-full h-1.5">
                      <div
                        className="bg-neon-violet h-1.5 rounded-full"
                        style={{ width: `${anomaly.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - XAI Evidence */}
      <XAIEvidencePanel
        selectedAnomaly={selectedAnomaly}
        onValidation={handleValidation}
      />
    </div>
  )
}
