import { AlertCircle, TrendingUp, Zap, Users, Download, Upload, Radar, Clock, Target } from 'lucide-react'
import { useState } from 'react'
import MetricCard from './MetricCard'
import AnomalyChart from './AnomalyChart'
import api from '../services/api'

export default function Dashboard({ anomalies, loading, onImageUpload }) {
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadLoading(true)
      setUploadError(null)
      setUploadSuccess(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('Uploading file:', file.name, 'Size:', file.size)
      
      const response = await api.post('/upload-sonar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('Upload response:', response.data)
      
      if (response.data && response.data.detections) {
        console.log('Detections received:', response.data.detections.length)
        setUploadSuccess(`Detected ${response.data.detections.length} object(s)`)
        onImageUpload(response.data.detections, response.data.processed_image)
      } else {
        setUploadError('Invalid response format - no detections field')
        console.error('No detections in response:', response.data)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      console.error('Error details:', err.response?.data || err.message)
      setUploadError(`Failed to upload image: ${err.response?.data?.detail || err.message}`)
    } finally {
      setUploadLoading(false)
      event.target.value = ''
    }
  }

  const confirmedDetections = anomalies.filter(a => a.validated === true).length
  const pendingReview = anomalies.filter(a => a.validated === null).length
  const rejectedDetections = anomalies.filter(a => a.validated === false).length
  const totalDetections = anomalies.length
  const averageConfidence = anomalies.length > 0 
    ? (anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length * 100).toFixed(1)
    : 0

  // Get first unreviewed or highest confidence anomaly
  const latestAnomalies = anomalies.sort((a, b) => {
    if (a.validated === null && b.validated !== null) return -1
    if (a.validated !== null && b.validated === null) return 1
    return b.confidence - a.confidence
  })
  const latestTarget = latestAnomalies[0]

  const detectionsByClass = {}
  anomalies.forEach(a => {
    detectionsByClass[a.target_class] = (detectionsByClass[a.target_class] || 0) + 1
  })

  // High priority = unreviewed with high confidence
  const highPriority = anomalies.filter(a => a.validated === null && a.confidence >= 0.7).length

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Header */}
      <div className="border-b border-cyan-600/20 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-8 py-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h1 className="text-4xl font-bold text-text-primary">SONARGUARD</h1>
              <p className="text-sm text-text-muted mt-1">Underwater Intelligence Platform</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-sm">
                  <p className="text-text-muted text-xs uppercase tracking-wide">Survey Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-mono text-cyan-400">●ONLINE</span>
                  </div>
                </div>
                <div className="border-l border-cyan-600/30 pl-4">
                  <p className="text-text-muted text-xs uppercase tracking-wide">Last Analysis</p>
                  <p className="font-mono text-cyan-400 text-sm mt-1">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Target}
            label="Total Targets"
            value={totalDetections}
            trend={totalDetections > 0 ? "Detected" : "None"}
            color="cyan"
          />
          <MetricCard
            icon={AlertCircle}
            label="High Priority"
            value={highPriority}
            trend={highPriority > 0 ? "Requires Review" : "Clear"}
            color="red"
          />
          <MetricCard
            icon={TrendingUp}
            label="Avg Confidence"
            value={`${averageConfidence}%`}
            trend={averageConfidence >= 70 ? "High precision" : "Variable"}
            color="emerald"
          />
          <MetricCard
            icon={Users}
            label="Pending Review"
            value={pendingReview}
            trend={pendingReview > 0 ? "Action needed" : "Clear"}
            color="amber"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Large Sonar Panel (Left - 2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="glass-card rounded-lg p-8 border border-cyan-600/30 bg-navy-900/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">UPLOAD SIDE-SCAN SONAR</h2>
                    <p className="text-sm text-text-muted mt-1">Drop sonar imagery here or browse files</p>
                  </div>
                  <Radar className="w-8 h-8 text-cyan-500/30" />
                </div>
                
                <label className="relative flex items-center justify-center w-full h-40 px-4 py-8 border-2 border-dashed border-cyan-600/50 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500 transition-all cursor-pointer group">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-cyan-500/40 group-hover:text-cyan-500 mx-auto mb-3 transition-colors" />
                    <p className="text-lg font-semibold text-text-primary group-hover:text-cyan-400">Drop sonar image here</p>
                    <p className="text-sm text-text-muted mt-2">or click to browse (PNG, JPG, TIFF)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="hidden"
                  />
                </label>

                {uploadError && (
                  <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/30 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{uploadError}</p>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="p-4 rounded-lg bg-emerald-600/10 border border-emerald-600/30 flex gap-3">
                    <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-300 text-sm font-semibold">{uploadSuccess}</p>
                  </div>
                )}
                {uploadLoading && (
                  <div className="p-3 rounded-lg bg-cyan-600/10 border border-cyan-600/30 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                    <p className="text-cyan-300 text-sm">Analyzing sonar image...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Pipeline */}
            {totalDetections > 0 && (
              <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Detection Pipeline</h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6 text-cyan-500" />
                    </div>
                    <p className="text-xs text-text-muted font-mono">INPUT</p>
                  </div>
                  <div className="flex-1 border-t border-cyan-600/30 mx-2"></div>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border-2 border-cyan-600/50 flex items-center justify-center mb-2">
                      <Zap className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-xs text-text-muted font-mono">PREPROCESS</p>
                  </div>
                  <div className="flex-1 border-t border-cyan-600/30 mx-2"></div>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-2">
                      <Radar className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-xs text-text-muted font-mono">AI DETECT</p>
                  </div>
                  <div className="flex-1 border-t border-cyan-600/30 mx-2"></div>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border-2 border-cyan-600/50 flex items-center justify-center mb-2">
                      <AlertCircle className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-xs text-text-muted font-mono">VERIFY</p>
                  </div>
                  <div className="flex-1 border-t border-cyan-600/30 mx-2"></div>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-600/50 flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-xs text-text-muted font-mono">REVIEW</p>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="glass-card rounded-lg border border-cyan-600/30 bg-navy-900/50 overflow-hidden">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
              >
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">How It Works</h3>
                <span className={`text-2xl text-text-muted transition-transform ${showHowItWorks ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showHowItWorks && (
                <div className="px-6 py-4 border-t border-cyan-600/20 space-y-3 text-sm text-text-secondary">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                    <p>Upload a side-scan sonar image from your survey</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                    <p>Classical CV pipeline scans and flags candidate objects</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                    <p>Each detection is verified against acoustic shadow, shape, and size metrics</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                    <p>Human expert reviews evidence and makes final accept/reject decision</p>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Distribution */}
            {totalDetections > 0 && (
              <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Detection Confidence Distribution</h3>
                <AnomalyChart anomalies={anomalies} />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Latest Target / Detection Insights */}
            {latestTarget ? (
              <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50 space-y-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Latest Target</h3>
                
                <div className="space-y-3 pb-4 border-b border-cyan-600/20">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide">Classification</p>
                    <p className="text-lg font-bold text-cyan-400 mt-1">{latestTarget.target_class}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide">Confidence</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-navy-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all"
                          style={{ width: `${latestTarget.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-mono text-cyan-400">{(latestTarget.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide">Priority</p>
                    <div className="flex items-center gap-2 mt-1">
                      {latestTarget.validated === null && latestTarget.confidence >= 0.7 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-xs font-bold text-red-300">HIGH</span>
                        </span>
                      ) : latestTarget.validated === null ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/40">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-bold text-amber-300">MEDIUM</span>
                        </span>
                      ) : latestTarget.validated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/20 border border-emerald-600/40">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-bold text-emerald-300">VERIFIED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-600/20 border border-slate-600/40">
                          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                          <span className="text-xs font-bold text-slate-300">REJECTED</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-text-muted uppercase tracking-wide">Status</p>
                  <p className="text-sm text-text-secondary">
                    {latestTarget.validated === null 
                      ? 'Awaiting human validation'
                      : latestTarget.validated
                      ? 'Confirmed by operator'
                      : 'Rejected by operator'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-lg p-6 border border-cyan-600/20 bg-navy-900/50 text-center space-y-2">
                <Radar className="w-12 h-12 text-cyan-500/30 mx-auto" />
                <p className="text-sm text-text-muted">No detections yet</p>
                <p className="text-xs text-text-muted/70">Upload a sonar image to begin</p>
              </div>
            )}

            {/* Detections by Class */}
            {Object.keys(detectionsByClass).length > 0 && (
              <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Targets by Class</h3>
                <div className="space-y-3">
                  {Object.entries(detectionsByClass).map(([className, count]) => (
                    <div key={className} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{className}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-navy-800 rounded-full h-1.5">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{ width: `${(count / totalDetections) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-mono text-cyan-400 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Summary */}
            <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Validation Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-text-secondary">Confirmed</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">{confirmedDetections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-text-secondary">Pending</span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">{pendingReview}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-text-secondary">Rejected</span>
                  </div>
                  <span className="font-mono text-red-400 font-bold">{rejectedDetections}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
