# Working on GeoWars / EARTHLING

This project has **one live production site** (deployed from `main` via Netlify) while
we actively build a lot more. The whole point of this workflow is: **production keeps
working while we iterate.** Follow these rules and you can't accidentally ship a
half-finished feature or lose work.

## The one rule that matters

**`main` is always shippable.** Whatever is on `main` can be deployed to production
at any moment without breaking. If work isn't ready to be live, it does NOT go on `main`.

## Day-to-day flow

1. **Never commit directly to `main`.** Always work on a branch:
   ```
   git switch -c feat/short-description   # new feature
   git switch -c fix/short-description    # bug fix
   ```
2. **Commit often, in small clean slices.** Don't let work pile up uncommitted.
   A good commit is one coherent change with a clear message. Uncommitted work is
   work you can lose.
3. **Before you merge a branch, it must be green:**
   ```
   npm run typecheck
   npm test
   npm run build
   ```
   (Shortcut: `npm run check` runs all three.)
4. **Open a Pull Request into `main`.** Netlify builds a preview URL for the PR ,
   look at it before merging. Merge only when the slice is done and green.
5. **A branch does not have to contain the whole vision.** It just has to be a
   complete, non-broken increment. Ship the parts that are done; keep the rest on
   another branch.

## What NOT to do

- ❌ Don't commit straight to `main`.
- ❌ Don't merge a branch with failing tests or a broken build.
- ❌ Don't let dozens of files sit uncommitted for days.
- ❌ Don't commit IDE cache, build output, or scratch files. `.gitignore` covers
  `.vs/`, `dist/`, `.tmp-ne/`, `.scratch/`, reports, and audit files. If you're adding
  throwaway notes, put them under `.scratch/`.
- ❌ Don't delete branches with unmerged work unless you're sure you don't want it.
  Parking a stale branch costs nothing; deleting loses history.

## Cleaning up branches (safe recipe)

Only delete branches whose work is already in `main`:
```
git branch --merged main          # lists branches safe to delete locally
git branch -d <branch>            # -d refuses to delete unmerged work (safe)
git push origin --delete <branch> # remove the remote copy
git remote prune origin           # drop stale remote-tracking refs
```
Use `-d` (lowercase), never `-D`, so git protects you from deleting unmerged work.

## Deploys

- Production deploys from `main` (`netlify.toml`: `npm run build` → `dist/`).
- Every PR gets a Netlify deploy preview. Use it to sanity-check before merging.

## Recommended one-time setup

- Turn on **branch protection** for `main` on GitHub: require the CI check
  (`.github/workflows/ci.yml`) to pass before merge. This enforces "main is always
  shippable" automatically instead of relying on memory.
