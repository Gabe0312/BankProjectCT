import app.data.store as store


def append(account_id: int, txn: dict):
    if account_id not in store.transactions:
        store.transactions[account_id] = []
    store.transactions[account_id].append(txn)


def find_by_account_id(account_id: int):
    return store.transactions.get(account_id, [])
