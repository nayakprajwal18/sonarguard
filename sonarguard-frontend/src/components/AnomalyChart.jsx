import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function AnomalyChart({ anomalies }) {
  // Prepare data for confidence distribution
  const confidenceBuckets = {
    '0-20%': 0,
    '20-40%': 0,
    '40-60%': 0,
    '60-80%': 0,
    '80-100%': 0,
  }

  anomalies.forEach(a => {
    const conf = a.confidence * 100
    if (conf < 20) confidenceBuckets['0-20%']++
    else if (conf < 40) confidenceBuckets['20-40%']++
    else if (conf < 60) confidenceBuckets['40-60%']++
    else if (conf < 80) confidenceBuckets['60-80%']++
    else confidenceBuckets['80-100%']++
  })

  const chartData = Object.entries(confidenceBuckets).map(([range, count]) => ({
    range,
    count,
  }))

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-purple border border-neon-violet/30 rounded-lg p-3 text-sm">
          <p className="text-electric-cyan font-semibold">{payload[0].payload.range}</p>
          <p className="text-neon-violet">Detections: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 31, 84, 0.3)" />
        <XAxis dataKey="range" stroke="#CBD5E1" />
        <YAxis stroke="#CBD5E1" />
        <Tooltip content={customTooltip} />
        <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
