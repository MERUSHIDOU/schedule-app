#!/bin/bash
# Claudeをコンテキスト付きで起動

CONTEXT_FILE=".claude/worktree-context.md"

if [ -f "$CONTEXT_FILE" ]; then
    echo "========================================="
    echo " Worktree タスクコンテキスト"
    echo "========================================="
    echo ""
    cat "$CONTEXT_FILE"
    echo ""
    echo "========================================="
    echo " Claudeを起動します..."
    echo "========================================="
    echo ""
fi

# Claudeを起動
claude
