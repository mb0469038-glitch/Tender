# Strict Git & Deployment Control Rule

## Mandatory Policy
AI assistants must NEVER automatically commit, push, or deploy code without explicit permission.

### Rules:
1. **No Auto-Commit:** Never execute `git commit` unless the user explicitly requests it (e.g., "commit this", "make a commit").
2. **No Auto-Push:** Never execute `git push` unless the user explicitly requests it (e.g., "push to origin", "push changes").
3. **No Auto-Deploy:** Never execute file transfers, `scp`, `rsync`, or Docker deployments to the remote server (`213.199.37.145`) unless the user explicitly requests deployment (e.g., "deploy to server", "upload to live site").
4. **Local Review First:** All code modifications must remain in the local working directory so the user can review and test them directly on `http://localhost:1420` via hot module reloading.
