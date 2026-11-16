# citty-test-utils migration plan v26.11.16

Standing: UNVERIFIED

## Identity
- path: /Users/sac/citty-test-utils
- remote: https://github.com/seanchatmangpt/citty-test-utils.git
- branch@sha: master@2bf7c2b, last commit 2026-08-23, 33 commits, 38 MB
- languages/build: JS/TS pnpm monorepo (package.json, pnpm-workspace.yaml,
  build.config.ts), Justfile; CLAUDE.md present (SPARC/claude-flow template)
- nested repos: none

## Observed state
- dirty=98: 79 `D` (.claude/agents/** claude-flow agent templates deleted on disk),
  16 `M` (.claude-flow/metrics/*.json and others), 3 `T`
- untracked=741: test/ (4 dirs), src/ (2), src-backup/, scratch/, temp-test-config/,
  test-results/, zod-test.mjs, reproduce_issue.mjs, TEST_READY.md, TEST_INFRA.md
- ahead 0 / behind 0 origin/master; stash 0; branch `enterprise` tracks origin/enterprise
- build dirs: none present
- submodules: none

## What it is
`un-test-utils` (formerly citty-test-utils): a modular CLI testing framework built on the
UnJS ecosystem, published to npm. Repo also carries claude-flow scaffolding, repro scripts
and release notes.

## Classification
WARM (census agrees; last real work Aug 2026).

## Migration risk
MEDIUM. 741 untracked files include src/ and test/ content plus src-backup/ -- some may be
real work, most looks like scratch (repro_*.mjs, temp-test-config, test-results). The 79
deletions are claude-flow template files, not product code.

## Recommended action
COMMIT-PUSH
1. DECISION: triage untracked src/ and test/ dirs -- `git status --porcelain | grep '^??'`
   and decide keep vs scratch. src-backup/, scratch/, temp-test-config/, test-results/,
   integration_out.log look disposable.
2. `git add src test *.md && git commit -m "wip: pre-migration snapshot of untracked work"`
3. DECISION: accept the .claude/agents deletions (`git add -A .claude`) or restore
   (`git checkout -- .claude`). They are template files; accepting is fine.
4. `git push origin master`
5. `rm -rf node_modules packages/*/node_modules` (none present now; skip if absent).
6. Re-clone on new machine.

## First commands on the new machine
`pnpm install && pnpm test`

## See Also
- ../v26.9.19/
- /Users/sac/docs/jira/v26.11.16/README.md
