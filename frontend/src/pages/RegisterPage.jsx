import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Footer from '../components/Footer'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const fieldDefs = [
  { name: 'username', label: 'Username',  type: 'text',     placeholder: 'Choose a username' },
  { name: 'password', label: 'Password',  type: 'password', placeholder: 'Choose a password' },
  { name: 'name',     label: 'Full Name', type: 'text',     placeholder: 'Your full name' },
  { name: 'email',    label: 'Email',     type: 'email',    placeholder: 'your@email.com' },
  { name: 'phone',    label: 'Phone',     type: 'text',     placeholder: 'Phone number' },
]

const validate = (form) => {
  const e = {}
  if (!form.username.trim())                          e.username = 'Username is required'
  else if (form.username.trim().length < 3)           e.username = 'Username must be at least 3 characters'
  else if (/\s/.test(form.username))                  e.username = 'Username cannot contain spaces'
  else if (form.username.trim().toLowerCase() === 'admin') e.username = 'Username "admin" is reserved'

  if (!form.password)                                 e.password = 'Password is required'
  else if (form.password.length < 6)                  e.password = 'Password must be at least 6 characters'

  if (!form.name.trim())                              e.name = 'Full name is required'

  if (!form.email.trim())                             e.email = 'Email is required'
  else if (!form.email.includes('@') || !form.email.includes('.')) e.email = 'Enter a valid email address'

  if (!form.phone.trim())                             e.phone = 'Phone is required'
  else if (!/^[\d\s().+-]{7,}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'

  return e
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <span className="text-white font-extrabold text-xl">B</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Create account</h1>
            <p className="text-slate-500 text-sm mt-1">Join BankApp today</p>
          </div>

          <div className="card p-8">
            {loading && <Spinner message="Creating account..." />}
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {fieldDefs.map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input
                    className={`input ${errors[f.name] ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                    name={f.name} type={f.type} placeholder={f.placeholder}
                    value={form[f.name]} onChange={handleChange}
                  />
                  {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name]}</p>}
                </div>
              ))}
              <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <span className="text-indigo-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate('/login')}>
              Sign in
            </span>
          </p>

        </div>
      </main>
      <Footer />
    </div>
  )
}

export default RegisterPage
