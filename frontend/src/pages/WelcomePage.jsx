import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const features = [
  { icon: '🏦', title: 'Multiple Accounts', desc: 'Open savings and checking accounts instantly.' },
  { icon: '💸', title: 'Easy Transfers', desc: 'Deposit, withdraw, and transfer with one click.' },
  { icon: '📊', title: 'Transaction History', desc: 'Track every transaction in real time.' },
]

const WelcomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen">
      <Header appName="BankApp" />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden py-28 text-white"
          style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 50%, #0f3460 100%)' }}>
          {/* Decorative orbs */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-600 opacity-20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600 opacity-15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Secure · Fast · Reliable
            </div>
            <h1 className="text-5xl font-extrabold mb-5 leading-tight tracking-tight">
              Banking made<br />
              <span className="text-indigo-400">simple.</span>
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Manage your accounts, track transactions, and stay in control of your finances — all in one place.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/40"
                onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button
                className="border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-xl transition-all backdrop-blur-sm"
                onClick={() => navigate('/register')}>
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-10">
            Everything you need
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="card p-7 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h5 className="font-bold text-slate-800 mb-2">{f.title}</h5>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default WelcomePage
