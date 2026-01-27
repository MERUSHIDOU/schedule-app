#!/bin/bash

# Git Worktree作成スクリプト
# 使い方: ./scripts/new-worktree.sh <type> <name>
# 例: ./scripts/new-worktree.sh feat new-feature

set -e

# 引数チェック
if [ $# -ne 2 ]; then
    echo "エラー: 引数が不足しています"
    echo "使い方: npm run worktree:new <type> <name>"
    echo ""
    echo "利用可能なtype:"
    echo "  feat      - 新機能"
    echo "  fix       - バグ修正"
    echo "  docs      - ドキュメント"
    echo "  refactor  - リファクタリング"
    echo "  test      - テスト追加"
    echo "  chore     - ビルド・設定"
    echo ""
    echo "例: npm run worktree:new feat new-feature"
    exit 1
fi

TYPE=$1
NAME=$2
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

# 依存関係をインストール
echo ""
echo "4. 依存関係をインストール..."
cd "${WORKTREE_DIR}"
npm install

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
