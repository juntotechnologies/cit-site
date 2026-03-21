import mailbox
import os
import re


def sanitize(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "_", name)


def save_messages(messages: list, user_dir: str, folder: str) -> str:
    path = os.path.join(user_dir, f"{sanitize(folder)}.mbox")
    mbox = mailbox.mbox(path)
    mbox.lock()
    for msg in messages:
        mbox.add(msg)
    mbox.flush()
    mbox.unlock()
    mbox.close()
    return path
