#!/usr/bin/env python3
"""
Download all emails from IMAP accounts listed in accounts.csv into local .mbox files.

accounts.csv format:
  email,password,imap_server

Output structure:
  email_archive/
    beth@chem-is-try.com/
      INBOX.mbox
      INBOX.Sent.mbox
      ...
"""

import csv
import os
import sys
import time

from imap_client import connect, list_folders, fetch_messages
from storage import save_messages

ARCHIVE_DIR = "email_archive"


def load_accounts(csv_path: str) -> list[dict]:
    with open(csv_path, newline="") as f:
        return list(csv.DictReader(f))


def archive_account(imap_server: str, email_addr: str, password: str) -> None:
    print(f"\n=== {email_addr} ===")
    user_dir = os.path.join(ARCHIVE_DIR, email_addr)
    os.makedirs(user_dir, exist_ok=True)

    try:
        mail = connect(imap_server, email_addr, password)
    except Exception as e:
        print(f"  FAILED to connect/login: {e}")
        return

    try:
        folders = list_folders(mail)
    except RuntimeError as e:
        print(f"  FAILED: {e}")
        mail.logout()
        return

    print(f"  Found {len(folders)} folders: {folders}")

    for folder in folders:
        try:
            messages = fetch_messages(mail, folder)
            if not messages:
                print(f"  {folder}: empty or unreadable")
                continue
            print(f"  {folder}: {len(messages)} messages", end="", flush=True)
            path = save_messages(messages, user_dir, folder)
            print(f" -> saved to {path}")
        except Exception as e:
            print(f"\n  Error on folder {folder}: {e}")

    mail.logout()
    print(f"  Done: {email_addr}")


def main() -> None:
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "accounts.csv"
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        print("Usage: python3 download_emails.py accounts.csv")
        sys.exit(1)

    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    accounts = load_accounts(csv_path)
    print(f"Found {len(accounts)} accounts in {csv_path}")

    for account in accounts:
        imap_server = account.get("imap_server", "").strip()
        email_addr = account.get("email", "").strip()
        password = account.get("password", "").strip()

        if not all([imap_server, email_addr, password]):
            print(f"Skipping incomplete row: {account}")
            continue

        archive_account(imap_server, email_addr, password)
        time.sleep(1)

    print(f"\nAll done. Archives saved to: {os.path.abspath(ARCHIVE_DIR)}/")


if __name__ == "__main__":
    main()
