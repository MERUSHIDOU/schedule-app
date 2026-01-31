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

# メインプロジェクトディレクトリを取得
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
MAIN_PROJECT_DIR=$(cd "$GIT_COMMON_DIR" && cd .. && pwd)

# Claudeを起動（バックグラウンド）
# - 現在のディレクトリ（ワークツリー）を追加
# - 元のプロジェクトディレクトリも追加（計画書や設計ドキュメント参照用）
claude --add-dir "$PWD" --add-dir "$MAIN_PROJECT_DIR" &
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
        tmux send-keys -t "$CURRENT_PANE" "$PROMPT"
        sleep 1 # プロンプトを確実に送信するために
        tmux send-keys -t "$CURRENT_PANE" C-m
    fi
fi

# Claudeプロセスを待機
wait $CLAUDE_PID
