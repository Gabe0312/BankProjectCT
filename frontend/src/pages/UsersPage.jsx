import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const UsersPage = () => {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/users')
        setUsers(res.data)
      } catch (err) {
        setError(err.error || 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="admin" onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        <div className="page-header">
          <h2 className="section-title">🔐 Registered Users</h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/admin/dashboard')}>← Back</button>
        </div>

        {loading && <Spinner message="Loading users..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <p className="text-slate-400 text-xs mb-3">{users.length} user(s) registered</p>
        )}

        {!loading && !error && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th">Username</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Customer No.</th>
                    <th className="table-th">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="table-td font-semibold text-slate-800">{user.username}</td>
                      <td className="table-td">
                        <span className={`badge ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="table-td text-xs text-slate-400 font-mono">{user.customer_number || user.customer_id || '—'}</td>
                      <td className="table-td text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default UsersPage
