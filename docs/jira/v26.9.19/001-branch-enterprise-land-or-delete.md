# citty-test-utils: land or delete remote branch `enterprise`

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: remote branch `enterprise` — not merged into `master`, no open PR
- Evidence: `git branch -r --no-merged origin/master` lists it; absent from `gh pr list` heads

## Work to complete
- Decide: open a PR (`gh pr create -R seanchatmangpt/citty-test-utils --head enterprise`) or delete (`git push origin --delete enterprise`).
- If superseded, delete; otherwise land through review.

## Acceptance
- After `git fetch --prune`, `git branch -r --no-merged origin/master` no longer lists `enterprise`.

## History
- 2026-09-19 | OPEN | survey found PR-less unmerged branch | enterprise | decision pending
