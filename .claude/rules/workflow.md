# Git Workflow Rules

## Git Worktree Workflow（必須）

**すべての変更は`git worktree`を使用して新しいブランチで作業し、Pull Requestとして提出すること。**

`/implement`スキルがworktree作成とブランチ管理を自動化します。

## Branch Naming Convention

- 機能追加: `feat/<機能名>`
- バグ修正: `fix/<修正内容>`
- ドキュメント: `docs/<内容>`
- リファクタリング: `refactor/<内容>`
- テスト追加: `test/<内容>`
- ビルド・設定: `chore/<内容>`

ベースブランチ: `master`

## /implement スキル（推奨）

新機能の実装は`/implement`スキルを使用してください：

```bash
/implement [実装したい機能の説明]
```

このスキルが自動的にブランチ名を決定し、worktreeを作成して新セッションにタスクを委譲します。

詳細: `.claude/commands/implement.md`

## Best Practices

1. **小さな変更**: PRは小さく保つ（レビューしやすい）
2. **明確なコミットメッセージ**: 変更内容を明確に記述
3. **テスト実行**: PR作成前に必ずテストを実行
4. **新しいブランチ**: 修正ごとに新しいworktreeを使用
5. `/ship`スキルを使用してコミット、プッシュ、PR作成を自動化

---

**Remember**: クリーンなGit履歴は、チーム開発とコードレビューの基盤。
