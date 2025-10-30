# Pre-Run Commit Instructions

## Important: Always Commit Before Major Operations

**Before proceeding with any significant commands or operations, ALWAYS:**

1. **Ask the user**: "Would you like to commit your current changes before proceeding?"

2. **Suggest a commit if there are uncommitted changes**, especially before:
    - Major refactoring operations
    - Database schema changes
    - Bulk data operations
    - File deletions or renames
    - Package installations or updates
    - Configuration changes
    - API endpoint modifications

3. **Provide a clear commit message suggestion** based on the work completed so far

## Example Prompt:
```
"I notice there are uncommitted changes in your project. Before proceeding with [operation],
would you like to commit your current work?

Suggested commit message: '[Brief description of changes]'

You can commit with: git add . && git commit -m 'Your message here'"
```

## Why This Matters:
- Provides a safe rollback point if something goes wrong
- Preserves work history
- Makes debugging easier
- Prevents loss of work
- Maintains clean git history

## When to Always Ask:
- Before running database migrations
- Before bulk file operations
- Before installing new dependencies
- Before modifying configuration files
- Before running cleanup scripts
- Before any destructive operations

## Exception:
Only skip this check if:
- The user explicitly states they don't want to commit
- The operation is read-only (e.g., viewing files, running queries that don't modify data)
- The user has just committed (within the last few operations)

---
*This is a reminder for the AI assistant to always prioritize data safety and version control best practices.*