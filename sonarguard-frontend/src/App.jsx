import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SwathAnalyzer from './components/SwathAnalyzer'
import AnomalyLogs from './components/AnomalyLogs'
import SurveyMap from './components/SurveyMap'
import SystemReports from './components/SystemReports'
import api from './services/api'
import { AlertCircle, Loader } from 'lucide-react'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sampleSonarImage, setSampleSonarImage] = useState(null)

  // Load sample sonar image and anomalies on mount
  useEffect(() => {
    loadSampleData()
  }, [])

  const loadSampleData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/detect-anomalies')
      if (response.data && response.data.anomalies) {
        setAnomalies(response.data.anomalies)
        setSampleSonarImage(response.data.sonar_image)
      }
    } catch (err) {
      console.error('Failed to load sample data:', err)
      setError('Failed to connect to backend API. Make sure the server is running on http://localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (detections, processedImage) => {
    setAnomalies(detections)
    setSampleSonarImage(processedImage)
    setCurrentPage('swath')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard anomalies={anomalies} loading={loading} onImageUpload={handleImageUpload} />
      case 'swath':
        return <SwathAnalyzer sonarImage={sampleSonarImage} anomalies={anomalies} setAnomalies={setAnomalies} />
      case 'logs':
        return <AnomalyLogs anomalies={anomalies} setAnomalies={setAnomalies} />
      case 'map':
        return <SurveyMap anomalies={anomalies} />
      case 'reports':
        return <SystemReports anomalies={anomalies} />
      default:
        return <Dashboard anomalies={anomalies} loading={loading} onImageUpload={handleImageUpload} />
    }
  }

  return (
    <div className="flex h-screen bg-obsidian text-lavender overflow-hidden">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-hidden relative">
        {error && (
          <div className="absolute top-4 right-4 left-64 z-50">
            <div className="glass-card rounded-lg p-4 border border-red-500/30 bg-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Connection Error</p>
                <p className="text-red-300/70 text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian/50 backdrop-blur-sm z-40">
            <div className="text-center space-y-3">
              <Loader className="w-12 h-12 text-neon-violet animate-spin mx-auto" />
              <p className="text-slate-text">Loading sonar data...</p>
            </div>
          </div>
        )}
        
        {renderPage()}
      </main>
    </div>
  )
}

