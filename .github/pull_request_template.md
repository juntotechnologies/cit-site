# PR Checklist

Use this before merging any PR.

## Scope

- [ ] The PR has one clear purpose.
- [ ] Follow-up work is moved to issues or `docs/pr-docs`, not hidden in review comments.
- [ ] The PR description has a one-line summary plus bullets for meaningful changes.
- [ ] Related issues are linked, closed, or explicitly marked as follow-up.

## Code Quality

- [ ] Changed behavior has focused unit or integration tests.
- [ ] Concerns are reasonably separated.
- [ ] Shared truth is reused instead of duplicating policy, labels, or validation.
- [ ] No dead code, debug code, stale copy, or commented-out leftovers.

## Required Checks

- [ ] `npm test`
- [ ] `npm run build`
- [ ] GitHub CI is green (if configured).

## Conditional Checks

- [ ] If Astro pages/routes changed: `netlify.toml` redirects and `scripts/generate_redirects.mjs` output still agree.
- [ ] If content/data in `data/` or `src/data` changed: confirm generated pages render correctly.
- [ ] If email archive scripts (`scripts/download_emails.py`, `scripts/imap_client.py`, `scripts/storage.py`) changed: no live credentials are committed.

## Smoke Tests

- [ ] `npm run dev` starts and the changed pages render as expected in the browser.
- [ ] `npm run build && npm run preview` succeeds and the changed pages render in the production build.

## Merge Readiness

- [ ] PR branch is up to date enough for a clean merge.
- [ ] Risky or irreversible changes have a rollback note.
