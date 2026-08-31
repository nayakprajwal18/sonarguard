import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { FileText, TrendingUp, AlertTriangle } from 'lucide-react'

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
    { name: 'Confirmed', value: confirmedCount, color: '#22c55e' },
    { name: 'Pending', value: pendingCount, color: '#8B5CF6' },
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
        <div className="bg-dark-purple border border-neon-violet/30 rounded-lg p-3 text-sm">
          <p className="text-electric-cyan font-semibold">{payload[0].payload.range || payload[0].name}</p>
          <p className="text-neon-violet">Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neon-violet">System Reports</h2>
        <p className="text-slate-text">Comprehensive anomaly detection analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Detections', value: totalDetections, color: 'violet' },
          { label: 'Confirmed', value: confirmedCount, color: 'green' },
          { label: 'Pending Review', value: pendingCount, color: 'yellow' },
          { label: 'Rejected', value: rejectedCount, color: 'red' },
          { label: 'Avg. Confidence', value: `${(avgConfidence * 100).toFixed(1)}%`, color: 'cyan' },
        ].map((metric, i) => (
          <div key={i} className={`glass-card rounded-lg p-4 border border-accent-purple/20 text-center`}>
            <p className="text-slate-text/70 text-xs mb-1">{metric.label}</p>
            <p className={`text-2xl font-bold ${
              metric.color === 'violet' ? 'text-neon-violet' :
              metric.color === 'cyan' ? 'text-electric-cyan' :
              metric.color === 'green' ? 'text-green-400' :
              metric.color === 'yellow' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
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
                  fill="#8B5CF6"
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
            <p className="text-slate-text/50 text-center py-12">No data available</p>
          )}
        </div>

        {/* Class Distribution */}
        <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4">Detection by Class</h3>
          {classData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 31, 84, 0.3)" />
                <XAxis dataKey="name" stroke="#CBD5E1" />
                <YAxis stroke="#CBD5E1" />
                <Tooltip content={customTooltip} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-text/50 text-center py-12">No data available</p>
          )}
        </div>

        {/* Confidence Distribution */}
        <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4">Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 31, 84, 0.3)" />
              <XAxis dataKey="range" stroke="#CBD5E1" />
              <YAxis stroke="#CBD5E1" />
              <Tooltip content={customTooltip} />
              <Bar dataKey="count" fill="#06B6D4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shadow Ratio Analysis */}
        <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
          <h3 className="text-lg font-semibold text-neon-violet mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Acoustic Shadow Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-text">High Shadow Ratio (≥40%)</span>
                <span className="text-neon-violet font-semibold">{highShadowRatio}</span>
              </div>
              <div className="w-full bg-accent-purple/20 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${totalDetections > 0 ? (highShadowRatio / totalDetections) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-400 mt-1">Valid targets with confirmed seafloor elevation</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-text">Low Shadow Ratio (<40%)</span>
                <span className="text-electric-cyan font-semibold">{lowShadowRatio}</span>
              </div>
              <div className="w-full bg-accent-purple/20 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full"
                  style={{ width: `${totalDetections > 0 ? (lowShadowRatio / totalDetections) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-orange-400 mt-1">Requires manual review - potential false positives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="glass-card rounded-lg p-6 border border-accent-purple/20">
        <h3 className="text-lg font-semibold text-neon-violet mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Analysis Summary
        </h3>
        <div className="space-y-3 text-sm text-slate-text">
          <p>
            <span className="text-neon-violet font-semibold">• Detection Performance:</span> {totalDetections} anomalies detected with average confidence of {(avgConfidence * 100).toFixed(1)}%
          </p>
          <p>
            <span className="text-neon-violet font-semibold">• Validation Status:</span> {confirmedCount} confirmed ({((confirmedCount / totalDetections) * 100).toFixed(1)}%), {pendingCount} pending review, {rejectedCount} rejected
          </p>
          <p>
            <span className="text-neon-violet font-semibold">• Shadow Ratio Analysis:</span> {highShadowRatio} targets ({((highShadowRatio / totalDetections) * 100).toFixed(1)}%) meet the 40% shadow threshold requirement for valid seafloor detections
          </p>
          <p>
            <span className="text-neon-violet font-semibold">• Target Distribution:</span> {Object.keys(classDistribution).length} unique target classifications detected
          </p>
          <p>
            <span className="text-neon-violet font-semibold">• Recommendation:</span> {pendingCount > 0 ? `Review ${pendingCount} pending detections for validation.` : 'All detections have been reviewed.'} Focus human review on targets with low shadow ratios for quality assurance.
          </p>
        </div>
      </div>
    </div>
  )
}
