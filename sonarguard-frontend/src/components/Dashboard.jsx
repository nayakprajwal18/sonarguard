import { AlertCircle, TrendingUp, Zap, Users, Download, Upload } from 'lucide-react'
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
  const totalDetections = anomalies.length
  const averageConfidence = anomalies.length > 0 
    ? (anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length * 100).toFixed(1)
    : 0

  const detectionsByClass = {}
  anomalies.forEach(a => {
    detectionsByClass[a.target_class] = (detectionsByClass[a.target_class] || 0) + 1
  })

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neon-violet">Detection Dashboard</h2>
        <p className="text-slate-text">Real-time sonar anomaly monitoring and analysis</p>
      </div>

      {/* Upload Section */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neon-violet mb-1">Upload Sonar Image</h3>
            <p className="text-slate-text/70 text-sm">Upload a new sonar image to analyze</p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-violet/20 hover:bg-neon-violet/30 text-neon-violet transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Select Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploadLoading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{uploadError}</p>
          </div>
        )}
        {uploadSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-green-400 text-sm">{uploadSuccess}</p>
          </div>
        )}
        {uploadLoading && (
          <div className="mt-3 text-sm text-slate-text/70">Analyzing image...</div>
        )}
      </div>

      {/* How It Works Panel */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-neon-violet">How it works</h3>
          <span className="text-slate-text text-xl">{showHowItWorks ? '−' : '+'}</span>
        </button>
        {showHowItWorks && (
          <div className="mt-4 space-y-3 text-sm text-slate-text">
            <div className="flex gap-3">
              <span className="text-neon-violet font-bold">1.</span>
              <p>Upload a sonar image</p>
            </div>
            <div className="flex gap-3">
              <span className="text-neon-violet font-bold">2.</span>
              <p>AI scans it and flags candidate objects</p>
            </div>
            <div className="flex gap-3">
              <span className="text-neon-violet font-bold">3.</span>
              <p>Each flag is checked against shadow, shape, and size — not just a confidence score</p>
            </div>
            <div className="flex gap-3">
              <span className="text-neon-violet font-bold">4.</span>
              <p>A human reviews the evidence and accepts or rejects</p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={AlertCircle}
          label="Total Detections"
          value={totalDetections}
          trend="+12%"
          color="violet"
        />
        <MetricCard
          icon={TrendingUp}
          label="Confirmed Targets"
          value={confirmedDetections}
          trend={`${((confirmedDetections/totalDetections)*100).toFixed(0)}%`}
          color="cyan"
        />
        <MetricCard
          icon={Zap}
          label="Avg Confidence"
          value={`${averageConfidence}%`}
          trend="High precision"
          color="green"
        />
        <MetricCard
          icon={Users}
          label="Human Reviews"
          value={anomalies.filter(a => a.validated === null).length}
          trend="Pending review"
          color="orange"
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4">Detection Confidence Distribution</h3>
          <AnomalyChart anomalies={anomalies} />
        </div>

        {/* Detection Breakdown */}
        <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4">Detections by Class</h3>
          <div className="space-y-3">
            {Object.entries(detectionsByClass).length > 0 ? (
              Object.entries(detectionsByClass).map(([className, count]) => (
                <div key={className} className="flex items-center justify-between">
                  <span className="text-sm text-slate-text">{className}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-neon-violet/20 rounded px-2 py-1">
                      <span className="text-sm font-semibold text-neon-violet">{count}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-text/70 text-sm">No detections yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Anomalies */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neon-violet">Recent Anomalies</h3>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-violet/10 hover:bg-neon-violet/20 text-neon-violet transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent-purple/20">
                <th className="text-left py-3 px-4 text-slate-text font-semibold">Target ID</th>
                <th className="text-left py-3 px-4 text-slate-text font-semibold">Class</th>
                <th className="text-left py-3 px-4 text-slate-text font-semibold">Confidence</th>
                <th className="text-left py-3 px-4 text-slate-text font-semibold">Shadow Ratio</th>
                <th className="text-left py-3 px-4 text-slate-text font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.slice(0, 5).map((anomaly) => (
                <tr key={anomaly.id} className="border-b border-accent-purple/10 hover:bg-accent-purple/10 transition-colors">
                  <td className="py-3 px-4 text-electric-cyan font-mono">{anomaly.id}</td>
                  <td className="py-3 px-4">{anomaly.target_class}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-accent-purple/20 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-neon-violet to-electric-cyan h-2 rounded-full"
                          style={{ width: `${anomaly.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span>{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{(anomaly.shadow_ratio * 100).toFixed(1)}%</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
