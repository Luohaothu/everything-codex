---
name: sessions
description: Browse and manage Codex session history. List recent sessions, view session details, and navigate session logs.
---

# Sessions Skill

Browse and manage Codex CLI session history.

## Usage

```
/sessions              # List recent sessions
/sessions list         # Same as above
/sessions info <id>    # Show session details
```

## Session Storage

Codex stores session logs in its native format. Sessions contain:
- Conversation history
- Tool invocations and results
- File changes made during the session
- Timestamps and metadata

## List Sessions

Display recent sessions with metadata:
- Session ID (short hash)
- Date and time
- Duration
- Working directory

## Session Info

Show details for a specific session:
- Full session ID
- Start/end timestamps
- Files modified
- Summary of work done

## Tips

- Use short IDs (first 6-8 characters) for convenience
- Sessions are stored chronologically
- Review past sessions before resuming related work
