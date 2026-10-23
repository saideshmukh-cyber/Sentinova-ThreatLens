# Push ThreatLens to GitHub

## 1. Check the working tree

```bash
git status
git branch
```

## 2. Make sure secrets are ignored

Confirm `.env` is not staged:

```bash
git status --ignored
```

Never commit:

- `.env`
- API keys
- JWT secrets
- access/refresh tokens
- database passwords
- `node_modules`
- `.next`
- `.venv`
- Python `__pycache__`

## 3. Commit the implementation

```bash
git add .
git status
git commit -m "feat: complete threatlens auth realtime and deployment baseline"
```

## 4. Create the GitHub repository

Create an empty repository named `sentinova-threatlens` (or your chosen repository name) on GitHub. Do not add another README if your local repository already has one.

Then check whether a remote already exists:

```bash
git remote -v
```

If none exists:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
```

## 5. Push

```bash
git branch -M main
git push -u origin main
```

## 6. After the first push

Open GitHub Actions and wait for the `ThreatLens CI` workflow.

It should run:

- backend compile checks
- backend unit tests
- frontend lint
- frontend production build
- Docker image builds

Do not merge/publish a production deployment while CI is red.
