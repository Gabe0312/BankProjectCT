import { useNavigate, useLocation } from 'react-router-dom'

const Navbar = ({ username, role, onLogout }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const link = (label, path) => {
    const active = pathname === path || pathname.startsWith(path + '/')
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-indigo-600 text-white'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <nav className="bg-slate-950 text-white px-6 py-3.5 flex items-center gap-3 shadow-lg">
      <span
        className="font-bold text-base tracking-tight cursor-pointer flex items-center gap-2 mr-2"
        onClick={() => navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard')}
      >
        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md font-bold">N</span>
        NexBank
      </span>

      <span className="w-px h-4 bg-slate-700" />

      {role === 'admin' && (
        <>
          {link('Dashboard', '/admin/dashboard')}
          {link('Customers', '/admin/customers')}
          {link('Accounts', '/admin/accounts')}
          {link('Audit', '/admin/audit')}
          {link('Users', '/admin/users')}
        </>
      )}

      {role === 'customer' && (
        <>
          {link('My Accounts', '/dashboard')}
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-slate-400 text-sm hidden sm:block">{username}</span>
        <span className="w-px h-4 bg-slate-700 hidden sm:block" />
        <button
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
