import { useNavigate } from 'react-router-dom'

const Header = ({ appName, username, role, onLogout }) => {
  const navigate = useNavigate()

  return (
    <nav className="bg-slate-950 text-white px-6 py-3.5 flex items-center gap-4 shadow-lg">
      <span
        className="font-bold text-base tracking-tight cursor-pointer flex items-center gap-2"
        onClick={() => navigate('/welcome')}
      >
        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md font-bold">N</span>
        {appName}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {username && (
          <>
            <span className="text-slate-400 text-sm hidden sm:block">
              {username}
            </span>
            <span className="w-px h-4 bg-slate-700 hidden sm:block" />
            {role === 'admin' && (
              <button className="text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </button>
            )}
            {role === 'customer' && (
              <button className="text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                onClick={() => navigate('/dashboard')}>
                My Accounts
              </button>
            )}
            <button
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              onClick={onLogout}>
              Logout
            </button>
          </>
        )}

        {!username && (
          <>
            <button className="text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Header
