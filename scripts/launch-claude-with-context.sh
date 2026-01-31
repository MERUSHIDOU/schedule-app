#!/bin/bash
# Claudeをコンテキスト付きで起動し、タスク内容から初期コマンドを自動実行

CONTEXT_FILE=".claude/worktree-context.md"

# タスク説明を抽出して初期コマンドを判定
determine_initial_command() {
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo ""
        return
    fi

    # ユーザーからの指示セクションを抽出
    local task_section=$(sed -n '/## ユーザーからの指示/,/## /p' "$CONTEXT_FILE" | head -n -1)

    # キーワード検出して初期コマンドを決定
    if echo "$task_section" | grep -qiE "テスト|TDD|実装|機能|修正|バグ|コード書|実装し"; then
        # デフォルト: TDD（テスト駆動開発）
        echo "/tdd"
    elif echo "$task_section" | grep -qiE "リファクタ|クリーンアップ|最適化|設計"; then
        # 設計系は計画確認
        echo "/plan"
    elif echo "$task_section" | grep -qiE "ドキュメント|doc|README|ログ"; then
        # ドキュメントはそのまま編集
        echo ""
    else
        # デフォルト: TDD
        echo "/tdd"
    fi
}

# 初期コマンドを取得して環境変数に設定
INITIAL_COMMAND=$(determine_initial_command)
export CLAUDE_INITIAL_COMMAND="$INITIAL_COMMAND"

# コンテキストファイルの内容を表示
if [ -f "$CONTEXT_FILE" ]; then
    echo "========================================="
    echo " Worktree タスクコンテキスト"
    echo "========================================="
    echo ""
    cat "$CONTEXT_FILE"
    echo ""
    echo "========================================="
    if [ -n "$INITIAL_COMMAND" ]; then
        echo " 推奨コマンド: $INITIAL_COMMAND"
    fi
    echo " Claudeを起動します..."
    echo "========================================="
    echo ""
fi

# Claudeを起動（バックグラウンド）
claude &
CLAUDE_PID=$!

# Claudeの起動と初期化を待つ
sleep 1

# 初期コマンドがあり、tmux pane内の場合は自動送信
if [ -n "$INITIAL_COMMAND" ] && [ -n "$TMUX" ]; then
    CURRENT_PANE=$(tmux display-message -p "#{pane_id}")
    if [ -n "$CURRENT_PANE" ]; then
        sleep 1  # Claudeの完全な初期化を待つ
        tmux send-keys -t "$CURRENT_PANE" "$INITIAL_COMMAND" C-m
    fi
fi

# Claudeプロセスを待機
wait $CLAUDE_PID
