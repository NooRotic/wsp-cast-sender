# Deployment Walkthrough

A complete reference for the CI/CD pipeline, environments, and release process for the **project-jet-sender** portfolio site.

---

## Environments

| Environment | URL | Branch | Deploy Trigger |
|---|---|---|---|
| Local dev | `localhost:3000` | any | `npm run dev` |
| Staging | `https://staging.walter.pollardjr.com` | `staging` | **Automatic** on push to `staging` branch |
| Production | `https://walter.pollardjr.com` | `main` | **Manual** — user-initiated |

Both staging and production are statically hosted on IONOS shared hosting. The Next.js build generates a fully static `/out` directory that is uploaded via SCP.

---

## Branch Strategy (GitHub Flow)

```
feature/your-feature   (branched from main)
        │
        │  PR → main
        │  CI runs (lint + test + build check)
        ▼
      main  ──── manual trigger ───► walter.pollardjr.com

  Optional staging preview:
  git push origin feature/your-feature:staging
  └── auto-deploys ─────────────────────────► staging.walter.pollardjr.com
```

- **`feature/*`** — All new work starts here. Branch from `main`.
- **`main`** — Production-ready code. PRs require CI to pass. Does **not** auto-deploy.
- **`staging`** — Optional preview environment. Push any branch here to preview on staging. Not a required step in the normal workflow.

---

## Normal Dev Workflow (Step-by-Step)

### 1. Create a feature branch from `main`

```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

### 2. Develop and push

```bash
# ... make changes ...
git add -p        # stage selectively
git commit -m "feat: describe your change"
git push origin feature/my-new-feature
```

CI (`ci.yml`) runs automatically on every push to validate the branch (lint + test + build).

### 3. Open a PR to `main`

On GitHub, open a Pull Request from `feature/my-new-feature` → `main`.

CI runs again on the PR. All three checks must pass:
- ESLint
- Jest test suite
- Production static build check

### 4. Merge to `main`

Once CI passes and you're satisfied, merge the PR. **This does NOT auto-deploy.** `main` is updated but production is unchanged.

### 5. Trigger production deploy (manual)

When you're ready to ship:

**Option A — GitHub UI:**
1. Go to `github.com/NooRotic/project-jet-sender/actions`
2. Click **"Deploy to Production"** in the left sidebar
3. Click **"Run workflow"** → select `main` → **"Run workflow"**

**Option B — CLI:**
```bash
gh workflow run "Deploy to Production" --ref main
```

The production deploy runs lint → test → build → SCP upload and targets `walter.pollardjr.com`. Takes ~2–3 minutes.

### 6. Verify production

Open `https://walter.pollardjr.com` and confirm the update is live.

---

## Optional: Staging Preview

Staging is available when you want to preview changes on a real server before merging to `main` — useful for Chromecast testing, layout verification across devices, or anything that's hard to validate locally.

**Push your feature branch to staging:**
```bash
git push origin feature/my-new-feature:staging
```

This overwrites the `staging` branch and automatically triggers `deploy-staging.yml`. The build runs with `NEXT_PUBLIC_BASE_URL=https://staging.walter.pollardjr.com` baked in.

**Preview at:** `https://staging.walter.pollardjr.com`

Staging is not a required gate — it's a scratchpad. You can skip it entirely or use it any time you want a real-environment preview before shipping.

---

## CI/CD Workflows

Three GitHub Actions workflows live in `.github/workflows/`:

### `ci.yml` — Validation

**Triggers:** Every PR + every push to any branch except `staging`

```
Install → Write .env → Lint → Test → Build check
```

Does not deploy. Catches regressions early. Runs on feature branches and on `main` directly.

### `deploy-staging.yml` — Staging Deploy

**Triggers:** Every push to the `staging` branch (including force-pushes from feature branches)

```
Job 1 — Lint · Test:
  Install → Write .env → Lint → Test

Job 2 — Build · Deploy (requires Job 1 to pass):
  Install → Write .env → Build (staging URL) → Verify → SSH backup → SCP upload → Permissions → Cleanup
```

### `deploy-ssh.yml` — Production Deploy

**Triggers:** Manual only (`workflow_dispatch`) — never fires automatically

```
Job 1 — Lint · Test:
  Install → Write .env → Lint → Test

Job 2 — Build · Deploy (requires Job 1 to pass):
  Install → Write .env → Build (prod URL) → Verify → SSH backup → SCP upload → Permissions → Cleanup
```

---

## Environment Variable Injection

`.env` is gitignored and never committed. All environment variables are injected at build time from the `ENV_FILE` GitHub Secret.

Each workflow writes the secret to disk before building:
```yaml
- name: Write .env from secret
  env:
    ENV_FILE: ${{ secrets.ENV_FILE }}
  run: printf '%s' "$ENV_FILE" > .env
```

`NEXT_PUBLIC_BASE_URL` is then overridden per-environment via the build step's `env:` block:
- Staging: `https://staging.walter.pollardjr.com`
- Production: `https://walter.pollardjr.com`

Since all `NEXT_PUBLIC_*` variables are inlined at build time by Next.js, each environment gets its own correctly-baked static export.

---

## GitHub Secrets Reference

| Secret | Used by | Purpose |
|---|---|---|
| `ENV_FILE` | all workflows | Full `.env` file contents — all `NEXT_PUBLIC_*` vars |
| `SSH_HOST` | staging, prod | IONOS server hostname |
| `SSH_USERNAME` | staging, prod | IONOS SSH/FTP username |
| `SSH_PASSWORD` | staging, prod | IONOS SSH/FTP password |
| `SSH_PORT` | staging, prod | SSH port (IONOS standard) |
| `DEPLOY_PATH` | prod | Absolute path to production web root parent |
| `STAGING_DEPLOY_PATH` | staging | Absolute path to staging directory parent |

> **Note:** IONOS shared hosting supports password-based SSH authentication only. Key-based auth is a Cloud/VPS feature. `SSH_PASSWORD` is used in place of `SSH_PRIVATE_KEY`.

---

## Server Directory Structure

```
$DEPLOY_PATH/
├── senderApp/                    ← production (walter.pollardjr.com)
├── senderApp-backup-20260303/    ← auto-created on each deploy (keeps 3)
└── ...

$STAGING_DEPLOY_PATH/
├── senderApp/                    ← staging (staging.walter.pollardjr.com)
└── senderApp-backup-*/           ← keeps last 2
```

Files in `senderApp/` are served directly as static HTML/CSS/JS — no Node.js server is involved in production.

---

## Branch Protection Rules

To enforce CI as a hard gate (prevent merging if tests fail), configure branch protection in GitHub:

**Settings → Branches → Add branch ruleset**

Recommended for `main`:
- Require status checks to pass: `ci / Lint · Test · Build`
- Require branches to be up to date before merging
- Restrict direct pushes (PRs only)

`staging` does not need protection — it's an ephemeral preview branch, not a shared integration branch.

---

## Local Development

```bash
npm run dev          # Start dev server at localhost:3000 (dynamic mode, HMR)
npm run lint         # ESLint
npm test             # Jest test suite
npm run test:watch   # Watch mode
npm run build:production  # Production static export → /out
npm run deploy:build      # lint + build + fix asset paths (same as CI)
```

The dev server runs in dynamic Next.js mode (no static export). Production builds use `output: 'export'` and run `fix-absolute-paths.js` to convert `/_next/` absolute paths to relative paths for static hosting.

---

## Rollback

If a bad deploy reaches production:

1. SSH into the server
2. The previous release is saved as `senderApp-backup-YYYYMMDD_HHMMSS/`
3. Swap the directories:
   ```bash
   mv senderApp senderApp-broken
   mv senderApp-backup-YYYYMMDD_HHMMSS senderApp
   ```
4. Previous version is immediately live (no build required)
