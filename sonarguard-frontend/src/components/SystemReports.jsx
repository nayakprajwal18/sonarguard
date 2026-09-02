import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { FileText, TrendingUp, AlertTriangle, Activity } from 'lucide-react'

export default function SystemReports({ anomalies }) {
  // Calculate statistics
  const totalDetections = anomalies.length
  const confirmedCount = anomalies.filter(a => a.validated === true).length
  const rejectedCount = anomalies.filter(a => a.validated === false).length
  const pendingCount = anomalies.filter(a => a.validated === null).length
  const avgConfidence = anomalies.length > 0 ? anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length : 0
  const avgShadowRatio = anomalies.length > 0 ? anomalies.reduce((sum, a) => sum + a.shadow_ratio, 0) / anomalies.length : 0

  // Class distribution
  const classDistribution = {}
  anomalies.forEach(a => {
    classDistribution[a.target_class] = (classDistribution[a.target_class] || 0) + 1
  })
  const classData = Object.entries(classDistribution).map(([name, value]) => ({ name, value }))

  // Status distribution
  const statusData = [
    { name: 'Verified', value: confirmedCount, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#06b6d4' },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
  ].filter(s => s.value > 0)

  // Confidence ranges
  const confidenceRanges = {
    '0-20%': anomalies.filter(a => a.confidence < 0.2).length,
    '20-40%': anomalies.filter(a => a.confidence >= 0.2 && a.confidence < 0.4).length,
    '40-60%': anomalies.filter(a => a.confidence >= 0.4 && a.confidence < 0.6).length,
    '60-80%': anomalies.filter(a => a.confidence >= 0.6 && a.confidence < 0.8).length,
    '80-100%': anomalies.filter(a => a.confidence >= 0.8).length,
  }

  const confidenceData = Object.entries(confidenceRanges).map(([range, count]) => ({
    range,
    count,
  }))

  // Shadow ratio analysis
  const highShadowRatio = anomalies.filter(a => a.shadow_ratio >= 0.4).length
  const lowShadowRatio = anomalies.length - highShadowRatio

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-900 border border-cyan-600/50 rounded-lg p-3 text-sm">
          <p className="text-cyan-400 font-semibold">{payload[0].payload.range || payload[0].name}</p>
          <p className="text-text-secondary">Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Header */}
      <div className="border-b border-cyan-600/20 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-text-primary">SYSTEM REPORTS</h1>
          <p className="text-sm text-text-muted mt-1">Comprehensive detection analytics and performance insights</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Detections', value: totalDetections, color: 'cyan', icon: Activity },
            { label: 'Verified', value: confirmedCount, color: 'emerald', icon: null },
            { label: 'Pending Review', value: pendingCount, color: 'amber', icon: null },
            { label: 'Rejected', value: rejectedCount, color: 'red', icon: null },
            { label: 'Avg. Confidence', value: `${(avgConfidence * 100).toFixed(1)}%`, color: 'cyan', icon: null },
          ].map((metric, i) => {
            const Icon = metric.icon
            return (
              <div key={i} className={`glass-card rounded-lg p-4 border border-cyan-600/30 bg-navy-900/50 text-center`}>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">{metric.label}</p>
                <p className={`text-3xl font-bold ${
                  metric.color === 'cyan' ? 'text-cyan-400' :
                  metric.color === 'emerald' ? 'text-emerald-400' :
                  metric.color === 'amber' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {metric.value}
                  {Icon && <Icon className="w-4 h-4 inline-block ml-2" />}
                </p>
              </div>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Validation Status Distribution
            </h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#06b6d4"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-center py-12">No data available</p>
            )}
          </div>

          {/* Class Distribution */}
          <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6">Detection by Target Class</h3>
            {classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
                  <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.5)" />
                  <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-center py-12">No data available</p>
            )}
          </div>

          {/* Confidence Distribution */}
          <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6">Confidence Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
                <XAxis dataKey="range" stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shadow Ratio Analysis */}
          <div className="glass-card rounded-lg p-6 border border-cyan-600/30 bg-navy-900/50">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              Acoustic Shadow Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">High Shadow Ratio (≥40%)</span>
                  <span className="text-emerald-400 font-semibold">{highShadowRatio}</span>
                </div>
                <div className="w-full bg-navy-800 rounded-full h-3 border border-cyan-600/10">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full"
                    style={{ width: `${totalDetections > 0 ? (highShadowRatio / totalDetections) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-emerald-400/70 mt-1">Valid targets with confirmed seafloor elevation</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Low Shadow Ratio (&lt;40%)</span>
                  <span className="text-amber-400 font-semibold">{lowShadowRatio}</span>
                </div>
                <div className="w-full bg-navy-800 rounded-full h-3 border border-cyan-600/10">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-3 rounded-full"
                    style={{ width: `${totalDetections > 0 ? (lowShadowRatio / totalDetections) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-amber-400/70 mt-1">Requires manual review - potential false positives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="glass-card rounded-lg p-8 border border-cyan-600/30 bg-navy-900/50">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Analysis Summary
          </h3>
          
          {totalDetections > 0 ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-2 border-cyan-600 pl-4">
                  <p className="text-text-muted mb-1">Detection Performance</p>
                  <p className="text-lg text-cyan-400 font-semibold">{totalDetections}</p>
                  <p className="text-text-muted text-xs mt-1">
                    anomalies detected with average confidence of <span className="text-cyan-400">{(avgConfidence * 100).toFixed(1)}%</span>
                  </p>
                </div>

                <div className="border-l-2 border-emerald-600 pl-4">
                  <p className="text-text-muted mb-1">Validation Status</p>
                  <p className="text-lg text-emerald-400 font-semibold">{confirmedCount} Verified</p>
                  <p className="text-text-muted text-xs mt-1">
                    {((confirmedCount / totalDetections) * 100).toFixed(1)}% confirmed • {pendingCount} pending • {rejectedCount} rejected
                  </p>
                </div>

                <div className="border-l-2 border-amber-600 pl-4">
                  <p className="text-text-muted mb-1">Shadow Ratio Validation</p>
                  <p className="text-lg text-amber-400 font-semibold">{highShadowRatio} Valid</p>
                  <p className="text-text-muted text-xs mt-1">
                    {((highShadowRatio / totalDetections) * 100).toFixed(1)}% meet 40% shadow threshold requirement
                  </p>
                </div>

                <div className="border-l-2 border-cyan-600 pl-4">
                  <p className="text-text-muted mb-1">Target Classification</p>
                  <p className="text-lg text-cyan-400 font-semibold">{Object.keys(classDistribution).length}</p>
                  <p className="text-text-muted text-xs mt-1">
                    unique target classes detected in survey
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-cyan-600/5 border border-cyan-600/20">
                <p className="text-sm text-text-secondary">
                  <span className="text-cyan-400 font-semibold">Recommendation: </span>
                  {pendingCount > 0 
                    ? `Review ${pendingCount} pending detections for human-in-the-loop validation. Focus quality assurance on ${lowShadowRatio} targets with low shadow ratios for confirmation.`
                    : `All ${totalDetections} detections have been reviewed. ${highShadowRatio} targets (${((highShadowRatio / totalDetections) * 100).toFixed(1)}%) meet shadow requirements for operational deployment.`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-muted">No detections available. Upload a sonar image to generate reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
