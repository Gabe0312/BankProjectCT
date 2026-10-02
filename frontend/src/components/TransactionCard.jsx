const badgeClass = (type) => {
  if (type === 'DEPOSIT')    return 'bg-indigo-100 text-indigo-700'
  if (type === 'WITHDRAWAL') return 'bg-slate-100 text-slate-600'
  return 'bg-indigo-50 text-indigo-500'
}

const amountColor = (type) => {
  if (type === 'WITHDRAWAL') return 'text-red-500 font-semibold'
  return 'text-indigo-600 font-semibold'
}

const TransactionCard = ({ transaction }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
    <td className="table-td text-xs text-slate-400 font-mono">{transaction.txn_id.startsWith('TXN-') ? transaction.txn_id : transaction.txn_id.slice(-8)}</td>
    <td className="table-td">
      <span className={`badge ${badgeClass(transaction.txn_type)}`}>
        {transaction.txn_type}
      </span>
    </td>
    <td className={`table-td ${amountColor(transaction.txn_type)}`}>
      ${transaction.amount.toFixed(2)}
    </td>
    <td className="table-td text-xs text-slate-400">
      {new Date(transaction.created_at).toLocaleString()}
    </td>
  </tr>
)

export default TransactionCard
