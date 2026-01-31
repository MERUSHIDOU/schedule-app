#!/bin/bash
# タスクコンテキストファイルを生成
# 使い方: create-worktree-context.sh <worktree-dir> <branch-name> [task-description]

set -e

WORKTREE_DIR=$1
BRANCH_NAME=$2
TASK_DESCRIPTION=${3:-"タスク説明はありません"}

# タイムスタンプ生成
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# 関連ドキュメントを検出
RELATED_DOCS=""

# 最新の実装計画を検出
if [ -d "plans" ]; then
    LATEST_PLAN=$(ls -t plans/*.md 2>/dev/null | head -1)
    if [ -n "$LATEST_PLAN" ]; then
        RELATED_DOCS+="### 実装計画\n- \`${LATEST_PLAN}\` - 実装計画書\n\n"
    fi
fi

# 設計ドキュメントを検出
if [ -d "docs/adr" ]; then
    LATEST_ADR=$(ls -t docs/adr/*.md 2>/dev/null | head -1)
    if [ -n "$LATEST_ADR" ]; then
        RELATED_DOCS+="### アーキテクチャ設計\n- \`${LATEST_ADR}\` - アーキテクチャ決定レコード\n\n"
    fi
fi

if [ -z "$RELATED_DOCS" ]; then
    RELATED_DOCS="該当なし"
fi

# テンプレートをコピーして変数を置換
TEMPLATE=".claude/templates/worktree-context.template.md"
OUTPUT="${WORKTREE_DIR}/.claude/worktree-context.md"

# .claudeディレクトリを作成（存在しない場合）
mkdir -p "${WORKTREE_DIR}/.claude"

# テンプレートが存在すれば使用
if [ -f "$TEMPLATE" ]; then
    # シンプルな置換を実行
    sed -e "s|{{TIMESTAMP}}|${TIMESTAMP}|g" \
        -e "s|{{BRANCH_NAME}}|${BRANCH_NAME}|g" \
        -e "s|{{WORKTREE_DIR}}|${WORKTREE_DIR}|g" \
        -e "s|{{TASK_DESCRIPTION}}|${TASK_DESCRIPTION}|g" \
        "$TEMPLATE" > "$OUTPUT"

    # 関連ドキュメントを置換（複雑なので別途処理）
    # perlを使用して複数行の置換に対応
    perl -i -pe "s|{{RELATED_DOCS}}|$RELATED_DOCS|g" "$OUTPUT"
else
    # テンプレートがない場合は直接生成
    cat > "$OUTPUT" <<EOF
# Worktree タスクコンテキスト

作成日時: ${TIMESTAMP}
ブランチ: ${BRANCH_NAME}
Worktreeパス: ${WORKTREE_DIR}

## ユーザーからの指示

${TASK_DESCRIPTION}

## 関連ドキュメント

${RELATED_DOCS}

## 推奨ワークフロー

1. このコンテキストを確認
2. 実装計画を読む（\`plans/\`ディレクトリ内）
3. \`/tdd\`でテスト駆動開発を開始、または直接実装を開始
4. \`/code-review\`でセキュリティと品質をレビュー
5. \`/ship\`でコミット、プッシュ、PR作成

## 備考

このファイルは自動生成されました。
必要に応じてこのファイルを編集してタスク情報を更新できます。
EOF
fi

echo "✓ コンテキストファイルを生成しました: ${OUTPUT}"
