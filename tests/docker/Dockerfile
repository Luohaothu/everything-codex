FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl jq bash diffutils golang-go python3 python3-pip python3-venv default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Install Codex CLI.
# Keep CODEX_VERSION in sync with:
# - tests/docker/docker-compose.yml (build.args.CODEX_VERSION default)
# - tests/docker/.env.example (CODEX_VERSION default)
ARG CODEX_VERSION=0.98.0
RUN npm install -g @openai/codex@${CODEX_VERSION} && npm cache clean --force

# Non-root user to simulate real install environment
ARG TESTUSER_UID=1001
ARG TESTUSER_GID=1001
RUN getent group ${TESTUSER_GID} >/dev/null 2>&1 || groupadd -g ${TESTUSER_GID} testuser; \
    if id -u testuser >/dev/null 2>&1; then \
      usermod -o -u ${TESTUSER_UID} -g ${TESTUSER_GID} testuser; \
    else \
      useradd -m -s /bin/bash -o -u ${TESTUSER_UID} -g ${TESTUSER_GID} testuser; \
    fi
USER testuser
WORKDIR /home/testuser

RUN mkdir -p /home/testuser/.codex /home/testuser/.agents/skills

ENV NODE_ENV=test HOME=/home/testuser

ENTRYPOINT ["/workspace/tests/docker/entrypoint.sh"]
CMD ["all"]
