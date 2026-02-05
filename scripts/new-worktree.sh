#!/bin/bash

# Git Worktree作成スクリプト
# 使い方: ./scripts/new-worktree.sh <type> <name> [--prompt "description"]
# 例: ./scripts/new-worktree.sh feat new-feature --prompt "新機能の説明"

set -e

# 引数チェック
if [ $# -lt 2 ]; then
    echo "エラー: 引数が不足しています"
    echo "使い方: npm run worktree:new <type> <name> [--prompt \"description\"]"
    echo ""
    echo "利用可能なtype:"
    echo "  feat      - 新機能"
    echo "  fix       - バグ修正"
    echo "  docs      - ドキュメント"
    echo "  refactor  - リファクタリング"
    echo "  test      - テスト追加"
    echo "  chore     - ビルド・設定"
    echo ""
    echo "例: npm run worktree:new feat new-feature --prompt \"新機能の説明\""
    exit 1
fi

TYPE=$1
NAME=$2
PROMPT_TEXT=""

# オプション引数の解析
shift 2
while [[ $# -gt 0 ]]; do
    case $1 in
        --prompt)
            PROMPT_TEXT="$2"
            shift 2
            ;;
        --task)
            # 後方互換性のため --task も受け付ける（非推奨）
            echo "警告: --task オプションは非推奨です。--prompt を使用してください。"
            PROMPT_TEXT="$2"
            shift 2
            ;;
        *)
            echo "エラー: 不明なオプション '${1}'"
            exit 1
            ;;
    esac
done
BRANCH_NAME="${TYPE}/${NAME}"
BASE_BRANCH="master"

# 有効なtypeかチェック
VALID_TYPES=("feat" "fix" "docs" "refactor" "test" "chore")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TYPE} " ]]; then
    echo "エラー: 無効なtype '${TYPE}'"
    echo "利用可能なtype: ${VALID_TYPES[*]}"
    exit 1
fi

# プロジェクトルートのディレクトリ名を取得
PROJECT_DIR=$(basename "$(pwd)")

# worktreeディレクトリ名を生成（親ディレクトリに作成）
WORKTREE_DIR="../${PROJECT_DIR}-${TYPE}-${NAME}"

echo "========================================="
echo "Git Worktree作成"
echo "========================================="
echo "ブランチ名: ${BRANCH_NAME}"
echo "Worktreeパス: ${WORKTREE_DIR}"
echo "ベースブランチ: ${BASE_BRANCH}"
echo "========================================="

# ベースブランチの最新を取得
echo ""
echo "1. ベースブランチを更新..."
git fetch origin "${BASE_BRANCH}"

# worktreeディレクトリが既に存在するかチェック
if [ -d "${WORKTREE_DIR}" ]; then
    echo ""
    echo "エラー: Worktreeディレクトリが既に存在します: ${WORKTREE_DIR}"
    echo "既存のworktreeを削除する場合は: npm run worktree:remove ${TYPE} ${NAME}"
    exit 1
fi

# ブランチが既に存在するかチェック
if git rev-parse --verify "${BRANCH_NAME}" >/dev/null 2>&1; then
    echo ""
    echo "警告: ブランチ '${BRANCH_NAME}' は既に存在します"
    read -p "既存のブランチを使用しますか? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "中止しました"
        exit 1
    fi
    # 既存のブランチでworktreeを作成
    git worktree add "${WORKTREE_DIR}" "${BRANCH_NAME}"
else
    # 新しいブランチを作成してworktreeを作成
    echo ""
    echo "2. 新しいブランチを作成してworktreeを追加..."
    git worktree add -b "${BRANCH_NAME}" "${WORKTREE_DIR}" "origin/${BASE_BRANCH}"
fi

# 環境設定ファイルをコピー
echo ""
echo "3. 環境設定ファイルをコピー..."

FILES_TO_COPY=(".env" ".env.local" ".mcp.json" ".claude/settings.local.json")

for FILE in "${FILES_TO_COPY[@]}"; do
    if [ -f "${FILE}" ]; then
        # ディレクトリ構造を保持してコピー
        FILE_DIR=$(dirname "${FILE}")
        if [ "${FILE_DIR}" != "." ]; then
            mkdir -p "${WORKTREE_DIR}/${FILE_DIR}"
        fi
        cp "${FILE}" "${WORKTREE_DIR}/${FILE}"
        echo "  ✓ ${FILE} をコピーしました"
    else
        echo "  - ${FILE} は存在しません（スキップ）"
    fi
done

# ディレクトリをコピー
DIRS_TO_COPY=("plans")

for DIR in "${DIRS_TO_COPY[@]}"; do
    if [ -d "${DIR}" ]; then
        cp -r "${DIR}" "${WORKTREE_DIR}/${DIR}"
        echo "  ✓ ${DIR}/ ディレクトリをコピーしました"
    else
        echo "  - ${DIR}/ は存在しません（スキップ）"
    fi
done

# 依存関係をインストール
echo ""
echo "4. 依存関係をインストール..."
cd "${WORKTREE_DIR}"
npm install
cd - > /dev/null  # 元のディレクトリに戻る

# tmux統合処理
if [ -n "$TMUX" ]; then
    echo ""
    echo "5. tmux paneを作成してClaudeを起動..."
    echo ""

    # 新しいpaneを作成（水平分割、worktreeディレクトリで開始）
    PANE_ID=$(tmux split-window -h -c "${WORKTREE_DIR}" -P -F "#{pane_id}")

    if [ -z "$PANE_ID" ]; then
        echo "警告: tmux paneの作成に失敗しました"
        echo "手動でWorktreeディレクトリに移動してClaudeを起動してください:"
        echo "  cd ${WORKTREE_DIR}"
        echo "  claude"
    else
        # 1. Claudeをフォアグラウンドで起動
        # --add-dirで現在のworktreeを追加
        tmux send-keys -t "$PANE_ID" "claude --add-dir ." C-m

        # 2. Claudeの起動完了を待つ
        sleep 3
        # 信頼できるフォルダか？の選択
        tmux send-keys -t "$PANE_ID" C-m
        sleep 1

        # 3. プロンプトが指定されている場合は送信
        if [ -n "$PROMPT_TEXT" ]; then
            # プロンプトをClaudeに送信（フォアグラウンドで起動しているため受信可能）
            tmux send-keys -t "$PANE_ID" "$PROMPT_TEXT"
            sleep 1
            tmux send-keys -t "$PANE_ID" C-m

            echo "✓ 新しいpaneでClaudeが起動し、プロンプトを送信しました"
        else
            echo "✓ 新しいpaneでClaudeが起動しました"
        fi
        echo ""
        echo "Pane情報: ${PANE_ID}"
    fi
else
    echo ""
    echo "========================================="
    echo "注意: tmuxセッション外で実行されました"
    echo "========================================="
    echo ""
    echo "tmux統合機能を使用する場合は、tmuxセッション内で実行してください:"
    echo "  tmux"
    echo "  npm run worktree:new ${TYPE} ${NAME} --prompt \"プロンプトテキスト\""
    echo ""
fi

echo ""
echo "========================================="
echo "✓ Worktreeの作成が完了しました！"
echo "========================================="
echo ""
echo "Worktreeディレクトリに移動して作業を開始してください:"
echo ""
echo "  cd ${WORKTREE_DIR}"
echo ""
echo "開発サーバーの起動:"
echo "  npm run dev"
echo ""
echo "作業完了後、worktreeを削除:"
echo "  cd ../${PROJECT_DIR}"
echo "  npm run worktree:remove ${TYPE} ${NAME}"
echo ""
