import app.data.store as store


def save(account: dict):
    store.accounts[account["account_id"]] = account


def find_by_id(account_id: int):
    return store.accounts.get(account_id)
