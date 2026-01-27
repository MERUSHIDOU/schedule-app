#!/bin/bash

# Git Worktree削除スクリプト
# 使い方: ./scripts/remove-worktree.sh <type> <name>
# 例: ./scripts/remove-worktree.sh feat new-feature

set -e

# 引数チェック
if [ $# -ne 2 ]; then
    echo "エラー: 引数が不足しています"
    echo "使い方: npm run worktree:remove <type> <name>"
    echo ""
    echo "例: npm run worktree:remove feat new-feature"
    exit 1
fi

TYPE=$1
NAME=$2
BRANCH_NAME="${TYPE}/${NAME}"

# プロジェクトルートのディレクトリ名を取得
PROJECT_DIR=$(basename "$(pwd)")

# worktreeディレクトリ名を生成
WORKTREE_DIR="../${PROJECT_DIR}-${TYPE}-${NAME}"

echo "========================================="
echo "Git Worktree削除"
echo "========================================="
echo "ブランチ名: ${BRANCH_NAME}"
echo "Worktreeパス: ${WORKTREE_DIR}"
echo "========================================="

# worktreeが存在するかチェック
if ! git worktree list | grep -q "${WORKTREE_DIR}"; then
    echo ""
    echo "エラー: Worktreeが見つかりません: ${WORKTREE_DIR}"
    echo ""
    echo "現在のworktree一覧:"
    git worktree list
    exit 1
fi

# 確認プロンプト
echo ""
read -p "このworktreeを削除してもよろしいですか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "中止しました"
    exit 1
fi

# worktreeを削除
echo ""
echo "1. Worktreeを削除..."
git worktree remove "${WORKTREE_DIR}" --force

echo ""
echo "========================================="
echo "✓ Worktreeの削除が完了しました"
echo "========================================="
echo ""
echo "ブランチ '${BRANCH_NAME}' は残っています。"
echo ""
echo "ブランチも削除する場合:"
echo "  git branch -D ${BRANCH_NAME}"
echo ""
echo "リモートからもブランチを削除する場合:"
echo "  git push origin --delete ${BRANCH_NAME}"
echo ""
