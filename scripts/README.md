# scripts

## download_emails.py

Downloads all mail from IMAP accounts into local `.mbox` files organized by user.

Requires an `accounts.csv` in the repo root:
```
email,password,imap_server
beth@chem-is-try.com,password123,imap.chem-is-try.com
```

```bash
uv run scripts/download_emails.py accounts.csv
```

Output is saved to `email_archive/<email>/`.
