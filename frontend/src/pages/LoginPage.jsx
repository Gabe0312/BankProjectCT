import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Footer from '../components/Footer'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const LoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.password.trim()) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      const { access_token, role, customer_id } = res.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('role', role)
      localStorage.setItem('customer_id', customer_id ?? '')
      localStorage.setItem('username', form.username)
      navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      setError(err.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <span className="text-white font-extrabold text-xl">B</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <div className="card p-8">
            {loading && <Spinner message="Signing in..." />}
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Username</label>
                <input className={`input ${errors.username ? 'ring-2 ring-red-400' : ''}`} name="username" placeholder="Enter username"
                  value={form.username} onChange={handleChange} />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                <input className={`input ${errors.password ? 'ring-2 ring-red-400' : ''}`} type="password" name="password" placeholder="Enter password"
                  value={form.password} onChange={handleChange} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <span className="text-indigo-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate('/register')}>
              Register here
            </span>
          </p>

        </div>
      </main>
      <Footer />
    </div>
  )
}

export default LoginPage
