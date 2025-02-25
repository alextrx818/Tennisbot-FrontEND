# Git Save and Push Process

This document outlines the exact steps taken to save and push code to the GitHub repository.

## Initial Setup (Only needed once)

1. Initialize git in the project directory:
```bash
cd /root/sports-backend
git init
```

2. Create .gitignore file with common exclusions:
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Logs
*.log
*.log.*

# Local data
tennis_bot_counters.json

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.venv
venv/
ENV/
```

3. Configure git user information:
```bash
git config --global user.email "alextrx818@gmail.com"
git config --global user.name "alextrx818"
```

4. Add remote repository (using HTTPS for password authentication):
```bash
git remote add origin https://github.com/alextrx818/FinalTennisBot.git
```

## Regular Push Process

1. Check git status to see changes:
```bash
git status
```

2. Stage all changes:
```bash
git add .
```

3. Commit changes with a descriptive message:
```bash
git commit -m "Description of changes"
```

4. Push to GitHub:
```bash
git push -u origin master
```

## Troubleshooting

If push fails with authentication error:
1. Ensure using HTTPS URL instead of SSH:
```bash
git remote set-url origin https://github.com/alextrx818/FinalTennisBot.git
```

2. When prompted, enter your GitHub username and password/token

## Latest Push Details (2025-02-25)

Files pushed:
- tennis_bot.py (improved logging)
- tennis_merger.py (improved matching logic)
- betsapi_prematch.py
- rapid_tennis_fetcher.py
- .gitignore
- requirements.txt

Commit message: "Initial commit: Tennis Bot with improved matching logic and logging"
