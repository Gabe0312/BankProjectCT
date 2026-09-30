import app.data.store as store


def save(user: dict):
    store.accounts[user["user_id"]] = user


def find_by_id(user_id: int):
    return store.accounts.get(user_id)
