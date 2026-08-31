import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SwathAnalyzer from './components/SwathAnalyzer'
import AnomalyLogs from './components/AnomalyLogs'
import SurveyMap from './components/SurveyMap'
import SystemReports from './components/SystemReports'
import api from './services/api'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [sampleSonarImage, setSampleSonarImage] = useState(null)

  // Load sample sonar image and anomalies on mount
  useEffect(() => {
    loadSampleData()
  }, [])

  const loadSampleData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/detect-anomalies')
      if (response.data && response.data.anomalies) {
        setAnomalies(response.data.anomalies)
        setSampleSonarImage(response.data.sonar_image)
      }
    } catch (error) {
      console.error('Failed to load sample data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard anomalies={anomalies} loading={loading} />
      case 'swath':
        return <SwathAnalyzer sonarImage={sampleSonarImage} anomalies={anomalies} setAnomalies={setAnomalies} />
      case 'logs':
        return <AnomalyLogs anomalies={anomalies} setAnomalies={setAnomalies} />
      case 'map':
        return <SurveyMap anomalies={anomalies} />
      case 'reports':
        return <SystemReports anomalies={anomalies} />
      default:
        return <Dashboard anomalies={anomalies} loading={loading} />
    }
  }

  return (
    <div className="flex h-screen bg-obsidian text-lavender overflow-hidden">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  )
}
