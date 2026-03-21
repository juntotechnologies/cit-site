#!/usr/bin/env python3
"""
Download all emails from IMAP accounts listed in accounts.csv into local .mbox files.

accounts.csv format:
  email,password,imap_server

Output structure:
  email_archive/
    beth@chem-is-try.com/
      INBOX.mbox
      Sent Items.mbox
      ...
    chemistry@chem-is-try.com/
      ...
"""

import imaplib
import mailbox
import email
import os
import csv
import re
import sys
import time

ARCHIVE_DIR = "email_archive"
PORT = 993


def sanitize_folder_name(name):
    return re.sub(r'[\\/*?:"<>|]', "_", name)


def download_account(imap_server, email_addr, password):
    print(f"\n=== {email_addr} ===")
    user_dir = os.path.join(ARCHIVE_DIR, email_addr)
    os.makedirs(user_dir, exist_ok=True)

    try:
        mail = imaplib.IMAP4_SSL(imap_server, PORT)
        mail.login(email_addr, password)
    except Exception as e:
        print(f"  FAILED to connect/login: {e}")
        return

    # List all folders
    status, folder_list = mail.list()
    if status != "OK":
        print(f"  FAILED to list folders")
        mail.logout()
        return

    folders = []
    for item in folder_list:
        decoded = item.decode() if isinstance(item, bytes) else item
        # Parse folder name from response like: (\HasNoChildren) "/" "INBOX"
        parts = decoded.split('"')
        folder_name = parts[-1].strip().strip('"') if len(parts) >= 2 else decoded.split()[-1]
        folders.append(folder_name)

    print(f"  Found {len(folders)} folders: {folders}")

    for folder in folders:
        try:
            status, _ = mail.select(f'"{folder}"', readonly=True)
            if status != "OK":
                print(f"  Skipping {folder} (could not select)")
                continue

            status, msg_ids = mail.search(None, "ALL")
            if status != "OK" or not msg_ids[0]:
                print(f"  {folder}: empty or unreadable")
                continue

            id_list = msg_ids[0].split()
            print(f"  {folder}: {len(id_list)} messages", end="", flush=True)

            safe_name = sanitize_folder_name(folder)
            mbox_path = os.path.join(user_dir, f"{safe_name}.mbox")
            mbox = mailbox.mbox(mbox_path)
            mbox.lock()

            for i, msg_id in enumerate(id_list):
                try:
                    status, msg_data = mail.fetch(msg_id, "(RFC822)")
                    if status != "OK":
                        continue
                    raw = msg_data[0][1]
                    msg = email.message_from_bytes(raw)
                    mbox.add(msg)
                except Exception as e:
                    print(f"\n    Error fetching msg {msg_id}: {e}")
                if (i + 1) % 50 == 0:
                    print(f" {i+1}...", end="", flush=True)

            mbox.flush()
            mbox.unlock()
            mbox.close()
            print(f" -> saved to {mbox_path}")

        except Exception as e:
            print(f"\n  Error on folder {folder}: {e}")

    mail.logout()
    print(f"  Done: {email_addr}")


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "accounts.csv"
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        print("Usage: python3 download_emails.py accounts.csv")
        sys.exit(1)

    os.makedirs(ARCHIVE_DIR, exist_ok=True)

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        accounts = list(reader)

    print(f"Found {len(accounts)} accounts in {csv_path}")

    for account in accounts:
        imap_server = account.get("imap_server", "").strip()
        email_addr = account.get("email", "").strip()
        password = account.get("password", "").strip()

        if not all([imap_server, email_addr, password]):
            print(f"Skipping incomplete row: {account}")
            continue

        download_account(imap_server, email_addr, password)
        time.sleep(1)  # be polite between accounts

    print(f"\nAll done. Archives saved to: {os.path.abspath(ARCHIVE_DIR)}/")


if __name__ == "__main__":
    main()
