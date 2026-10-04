import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building2, ClipboardList, Lock, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'

const adminLinks = [
  { icon: Users,         label: 'Customers', path: '/admin/customers', desc: 'View, search & manage customers' },
  { icon: Building2,     label: 'Accounts',  path: '/admin/accounts',  desc: 'All accounts & premium filter' },
  { icon: ClipboardList, label: 'Audit Log', path: '/admin/audit',     desc: 'Review all financial activity' },
  { icon: Lock,          label: 'Users',     path: '/admin/users',     desc: 'Registered system users' },
]

const AdminDashboard = () => {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [custRes, accRes] = await Promise.all([
          api.get('/api/customers'),
          api.get('/api/accounts'),
        ])
        const accounts = accRes.data
        const totalBalanceCents = accounts.reduce(
          (sum, account) => sum + (account.balance_cents ?? Math.round(account.balance * 100)),
          0,
        )
        const savings  = accounts.filter(a => a.account_type === 'SAVINGS').length
        const checking = accounts.filter(a => a.account_type === 'CHECKING').length
        setStats({
          customers: custRes.data.length,
          accounts: accounts.length,
          totalBalanceCents,
          donut: [
            { name: 'Savings',  value: savings },
            { name: 'Checking', value: checking },
          ],
        })
      } catch {
        // stats are non-critical, fail silently
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  const statCards = stats ? [
    { label: 'Total Customers',         value: stats.customers,                         icon: Users },
    { label: 'Total Accounts',          value: stats.accounts,                          icon: Building2 },
    { label: 'Assets Under Management', value: `$${(stats.totalBalanceCents / 100).toFixed(2)}`, icon: DollarSign },
  ] : []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="admin" onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Banner */}
        <div className="rounded-2xl p-7 mb-8 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)' }}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Admin Panel</p>
          <p className="text-2xl font-extrabold mb-1">Good to see you, {username}</p>
          <p className="text-indigo-300 text-sm">Full system access enabled</p>
        </div>

        {/* Stats */}
        <h2 className="section-title mb-4">System Overview</h2>
        {statsLoading ? (
          <Spinner message="Loading stats..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {statCards.map(s => (
              <div key={s.label} className="card p-5 flex items-center gap-4">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{s.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Donut chart */}
        {!statsLoading && stats?.donut && stats.donut.some(d => d.value > 0) && (
          <div className="card p-5 mb-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Account Type Breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.donut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  <Cell fill="#6366f1" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip formatter={(value) => [`${value} accounts`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Access */}
        <h2 className="section-title mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminLinks.map(link => (
            <div
              key={link.path}
              className="card p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              onClick={() => navigate(link.path)}
            >
              <div className="bg-indigo-50 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                  <link.icon className="w-5 h-5 text-indigo-600" />
                </div>
              <h5 className="font-bold text-indigo-700 mb-1 text-sm">{link.label}</h5>
              <p className="text-slate-500 text-xs leading-relaxed">{link.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

export default AdminDashboard
