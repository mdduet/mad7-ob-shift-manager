# Guide: Getting Started with Git & GitHub

## What is Git?

Git is a **version control system** that tracks changes to your code. Think of it like:
- A **time machine** for your code
- An **undo button** on steroids
- A **collaboration tool** for teams

## Key Commands

### Create & Commit

```bash
git init                           # Start a repository
git add <file>                     # Stage file(s)
git commit -m "message"            # Save snapshot
```

### Branches

```bash
git branch                         # List branches
git branch <name>                  # Create branch
git checkout -b <name>             # Create + switch branch
git checkout <name>                # Switch branch
```

### Remote & Sync

```bash
git remote add origin <url>        # Connect to GitHub
git push                           # Upload to GitHub
git pull                           # Download from GitHub
```

## Workflow Example

1. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Implement feature"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/new-feature
   ```

4. **Create a Pull Request on GitHub** (ask for code review)

5. **Merge to main** (deploy to production)

## Tips

- **Use clear branch names**: `feature/...`, `fix/...`, `docs/...`
- **Commit often** with clear messages
- **Pull before you push** to avoid conflicts
- **Review code** before merging (Pull Requests)

## Next Steps

- Learn about **Pull Requests** (PR) for code reviews
- Understand **merge conflicts** and how to resolve them
- Practice with a team repository
