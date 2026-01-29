#!/bin/bash

# Git Worktree自動クリーンアップスクリプト
# マージ済みブランチに対応するworktreeを削除します
# 使い方: ./scripts/cleanup-merged-worktrees.sh [--dry-run] [--auto] [--base-branch <branch>]

set -e

# デフォルト設定
DRY_RUN=false
AUTO_MODE=false
BASE_BRANCH="master"

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --base-branch)
            BASE_BRANCH="$2"
            shift 2
            ;;
        -h|--help)
            echo "使い方: npm run worktree:cleanup [-- [オプション]]"
            echo ""
            echo "オプション:"
            echo "  --dry-run              削除せずに対象を表示のみ"
            echo "  --auto                 確認なしで自動削除"
            echo "  --base-branch <branch> ベースブランチを指定（デフォルト: master）"
            echo "  -h, --help             このヘルプを表示"
            echo ""
            echo "例:"
            echo "  npm run worktree:cleanup                    # 対話的に削除"
            echo "  npm run worktree:cleanup -- --dry-run       # 削除対象を表示のみ"
            echo "  npm run worktree:cleanup -- --auto          # 自動削除"
            exit 0
            ;;
        *)
            echo "エラー: 不明なオプション: $1"
            echo "ヘルプを表示: $0 --help"
            exit 1
            ;;
    esac
done

# プロジェクトルートのディレクトリ名を取得
PROJECT_DIR=$(basename "$(pwd)")

echo "========================================="
echo "Git Worktree自動クリーンアップ"
echo "========================================="
echo "ベースブランチ: ${BASE_BRANCH}"
echo "プロジェクト: ${PROJECT_DIR}"
if [ "$DRY_RUN" = true ]; then
    echo "モード: ドライラン（削除しません）"
elif [ "$AUTO_MODE" = true ]; then
    echo "モード: 自動削除"
else
    echo "モード: 対話的"
fi
echo "========================================="
echo ""

# ベースブランチが存在するか確認
if ! git rev-parse --verify "${BASE_BRANCH}" >/dev/null 2>&1; then
    echo "エラー: ベースブランチ '${BASE_BRANCH}' が見つかりません"
    exit 1
fi

# マージ済みブランチを取得（ベースブランチ自体は除外）
echo "1. マージ済みブランチを検出中..."
MERGED_BRANCHES=$(git branch --merged "${BASE_BRANCH}" | grep -v "^\*" | grep -v "${BASE_BRANCH}" | sed 's/^[[:space:]]*[+*]*//' | sed 's/^[[:space:]]*//')

if [ -z "$MERGED_BRANCHES" ]; then
    echo ""
    echo "✓ マージ済みブランチは見つかりませんでした"
    exit 0
fi

echo "   見つかったマージ済みブランチ:"
echo "$MERGED_BRANCHES" | sed 's/^/     - /'
echo ""

# 現在のworktreeリストを取得
echo "2. 対応するworktreeを検索中..."
WORKTREES_TO_REMOVE=()

while IFS= read -r branch; do
    # 空行をスキップ
    [ -z "$branch" ] && continue

    # ブランチ名から type と name を抽出（例: feat/new-feature → feat, new-feature）
    if [[ $branch =~ ^([^/]+)/(.+)$ ]]; then
        TYPE="${BASH_REMATCH[1]}"
        NAME="${BASH_REMATCH[2]}"
        WORKTREE_DIR_NAME="${PROJECT_DIR}-${TYPE}-${NAME}"
        WORKTREE_PATH="../${WORKTREE_DIR_NAME}"

        # worktreeが実際に存在するか確認（ディレクトリ名で検索）
        if git worktree list | grep -q "${WORKTREE_DIR_NAME}"; then
            WORKTREES_TO_REMOVE+=("${WORKTREE_PATH}:${branch}")
            echo "   ✓ ${WORKTREE_PATH} (${branch})"
        fi
    fi
done <<< "$MERGED_BRANCHES"

if [ ${#WORKTREES_TO_REMOVE[@]} -eq 0 ]; then
    echo ""
    echo "✓ 削除対象のworktreeは見つかりませんでした"
    exit 0
fi

echo ""
echo "========================================="
echo "削除対象: ${#WORKTREES_TO_REMOVE[@]} 個のworktree"
echo "========================================="

# ドライランモードの場合はここで終了
if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "ドライランモード: 実際には削除しません"
    echo ""
    echo "削除するには以下を実行:"
    echo "  npm run worktree:cleanup"
    echo "または自動削除:"
    echo "  npm run worktree:cleanup -- --auto"
    exit 0
fi

# 確認プロンプト（自動モードでない場合）
if [ "$AUTO_MODE" = false ]; then
    echo ""
    read -p "これらのworktreeを削除してもよろしいですか? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "中止しました"
        exit 1
    fi
fi

# worktreeを削除
echo ""
echo "3. Worktreeを削除中..."
REMOVED_COUNT=0

for item in "${WORKTREES_TO_REMOVE[@]}"; do
    WORKTREE_PATH="${item%%:*}"
    BRANCH_NAME="${item##*:}"

    echo ""
    echo "   削除中: ${WORKTREE_PATH}"

    if git worktree remove "${WORKTREE_PATH}" --force; then
        echo "   ✓ 削除完了: ${WORKTREE_PATH}"
        ((REMOVED_COUNT++))
    else
        echo "   ✗ 削除失敗: ${WORKTREE_PATH}"
    fi
done

echo ""
echo "========================================="
echo "✓ クリーンアップ完了"
echo "========================================="
echo ""
echo "削除したworktree: ${REMOVED_COUNT} / ${#WORKTREES_TO_REMOVE[@]}"
echo ""
echo "注意: ブランチは残っています。"
echo ""
echo "マージ済みブランチも削除する場合:"
echo "  git branch -d <branch-name>"
echo ""
echo "または一括削除:"
echo "  git branch --merged ${BASE_BRANCH} | grep -v \"${BASE_BRANCH}\" | xargs git branch -d"
echo ""

exit 0
