---
name: pm2
description: Auto-analyze project and generate PM2 process manager configuration for dev services (frontend, backend, database).
---

# PM2 Init Skill

Auto-analyze project and generate PM2 service configuration.

## Usage

```
/pm2 init              # Scan project and generate config
/pm2 start             # Start all services
/pm2 stop              # Stop all services
/pm2 status            # View service status
```

## Service Detection

| Type | Detection | Default Port |
|------|-----------|--------------|
| Vite | vite.config.* | 5173 |
| Next.js | next.config.* | 3000 |
| Nuxt | nuxt.config.* | 3000 |
| Express/Node | server/backend/api + package.json | 3000 |
| FastAPI/Flask | requirements.txt / pyproject.toml | 8000 |
| Go | go.mod / main.go | 8080 |

## Generated Files

```
project/
├── ecosystem.config.cjs     # PM2 config
└── {backend}/start.cjs      # Python wrapper (if applicable)
```

## PM2 Commands

```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```

## Key Rules

1. Config file must use `.cjs` extension
2. Node.js: specify bin path directly + interpreter
3. Python: use Node.js wrapper script
4. Port detection: user specified > .env > config > default
