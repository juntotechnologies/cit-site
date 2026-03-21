import imaplib
import email
import re

PORT = 993


def connect(imap_server: str, email_addr: str, password: str) -> imaplib.IMAP4_SSL:
    mail = imaplib.IMAP4_SSL(imap_server, PORT)
    mail.login(email_addr, password)
    return mail


def list_folders(mail: imaplib.IMAP4_SSL) -> list[str]:
    status, folder_list = mail.list()
    if status != "OK":
        raise RuntimeError("Failed to list folders")
    folders = []
    for item in folder_list:
        decoded = item.decode() if isinstance(item, bytes) else item
        parts = decoded.split('"')
        name = parts[-1].strip().strip('"') if len(parts) >= 2 else decoded.split()[-1]
        folders.append(name)
    return folders


def fetch_messages(mail: imaplib.IMAP4_SSL, folder: str) -> list:
    status, _ = mail.select(f'"{folder}"', readonly=True)
    if status != "OK":
        return []
    status, msg_ids = mail.search(None, "ALL")
    if status != "OK" or not msg_ids[0]:
        return []
    messages = []
    for msg_id in msg_ids[0].split():
        status, msg_data = mail.fetch(msg_id, "(RFC822)")
        if status != "OK":
            continue
        messages.append(email.message_from_bytes(msg_data[0][1]))
    return messages
