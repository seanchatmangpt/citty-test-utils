# citty-test-utils: commit or clean uncommitted changes

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: working tree dirty at survey time
- Evidence: `git status --porcelain` → 118 path(s) (tracked-modified: 98, untracked: 20); sample:  M .claude-flow/metrics/performance.json; M .claude-flow/metrics/system-metrics.json; M .claude-flow/metrics/task-metrics.json;?? .ctu/;?? Justfile;

## Work to complete
- Review the 98 tracked-modified path(s); commit them as atomic pieces on a purpose branch, or revert what is transient.
- For the 20 untracked path(s): add intentional files to git and commit; gitignore or delete build artifacts/temp files.
- Note: this survey's ticket files under docs/jira/v26.9.19/ are intentionally uncommitted; include or exclude them deliberately in the commit plan.

## Acceptance
- `git status --porcelain` is clean (except items deliberately deferred and recorded here).

## History
- 2026-09-19 | OPEN | survey found dirty tree | 118 paths (T98/U20) | commit/clean pending
