#!/bin/bash
# Claudeをコンテキスト付きで起動し、タスク内容を自然文で送信

CONTEXT_FILE=".claude/worktree-context.md"

# コンテキストファイルの内容を表示
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

# Claudeを起動（バックグラウンド）
claude --dangerously-skip-permissions &
CLAUDE_PID=$!

# Claudeの起動と初期化を待つ
sleep 2

# tmux pane内の場合、コンテキストを自然文で自動送信
if [ -f "$CONTEXT_FILE" ] && [ -n "$TMUX" ]; then
    CURRENT_PANE=$(tmux display-message -p "#{pane_id}")
    if [ -n "$CURRENT_PANE" ]; then
        # コンテキストファイルの内容を読み込み
        CONTEXT_CONTENT=$(cat "$CONTEXT_FILE")

        # 自然文でタスクを送信
        PROMPT="以下のタスクを実施してください：

$CONTEXT_CONTENT"

        # tmuxに送信（改行を含むテキストを送信）
        sleep 1  # Claudeの完全な初期化を待つ
        tmux send-keys -t "$CURRENT_PANE" "$PROMPT" C-m
    fi
fi

# Claudeプロセスを待機
wait $CLAUDE_PID
