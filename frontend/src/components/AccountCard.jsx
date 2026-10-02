import { useState } from 'react'
import api from '../services/api'

const AccountCard = ({ account, onAction, onNicknameUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [nicknameInput, setNicknameInput] = useState(account.nickname || '')
  const [saving, setSaving] = useState(false)

  const handleSaveNickname = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/accounts/${account._id}/nickname`, { nickname: nicknameInput || null })
      onNicknameUpdate(account._id, nicknameInput || null)
      setEditing(false)
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  const isSavings = account.account_type === 'SAVINGS'

  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

      {/* Unified indigo top strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className={`badge ${isSavings ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            {account.account_type}
          </span>
          {!editing && (
            <>
              {account.nickname && (
                <span className="text-sm font-semibold text-slate-700">{account.nickname}</span>
              )}
              <button
                className="text-slate-300 hover:text-slate-500 text-xs transition-colors"
                title="Edit nickname"
                onClick={() => setEditing(true)}
              >
                ✏️
              </button>
            </>
          )}
          {editing && (
            <div className="flex items-center gap-1.5">
              <input
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Nickname"
                autoFocus
              />
              <button className="btn-primary text-xs px-2.5 py-1.5" onClick={handleSaveNickname} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
              <button className="btn-ghost text-xs px-2.5 py-1.5" onClick={() => setEditing(false)}>
                ✕
              </button>
            </div>
          )}
        </div>
        <span className="text-slate-300 text-xs font-mono">{account.account_number || account._id.slice(-6)}</span>
      </div>

      {/* Balance */}
      <div className="px-5 py-3">
        <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wider">Balance</p>
        <p className="text-3xl font-bold text-slate-800">${account.balance.toFixed(2)}</p>
        {account.created_at && (
          <p className="text-xs text-slate-400 mt-1">Opened {new Date(account.created_at).toLocaleDateString()}</p>
        )}
      </div>

      {/* Actions — all indigo variants */}
      <div className="flex gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
        <button className="btn-primary flex-1 text-xs py-2" onClick={() => onAction(account._id, 'deposit', account.account_number)}>Deposit</button>
        <button className="btn-soft flex-1 text-xs py-2" onClick={() => onAction(account._id, 'withdraw', account.account_number)}>Withdraw</button>
        <button className="btn-ghost flex-1 text-xs py-2" onClick={() => onAction(account._id, 'transactions', account.account_number)}>History</button>
        <button className="btn-primary flex-1 text-xs py-2" onClick={() => onAction(account._id, 'transfer', account.account_number)}>Transfer</button>
      </div>

    </div>
  )
}

export default AccountCard
