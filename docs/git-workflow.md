# Git 運用ルール

このリポジトリの Git 運用は **agent-commons の共通ルール** に従う
（`~/.claude/rules/git-flow.md` および `~/.claude/docs/specs/workflows/git-flow.md`）。
本ドキュメントには、共通ルールから外れる本リポジトリ固有の差分のみを記載する。

## 1. ブランチ戦略: main 単独

常設ブランチは `main` のみ。`develop` は持たない。

| ブランチ | 用途 | ベース |
| --- | --- | --- |
| `main` | 公開中のサイトのソース。GitHub Pages の配信元 | - |
| `feature/{機能名}-{Issue番号}` | 機能追加・演出変更等 | `main` |
| `bugfix/{修正内容}-{Issue番号}` | バグ修正 | `main` |

### 共通ルールからの差分

- `develop` を使わず、作業ブランチは `main` をベースに切る
- ブランチ名から `#` を **外す**（`feature/git-workflow-7` のように `#` なし）
  - 理由: Bash 操作時に `#` がコメント解釈されクォート必須になる事故を構造的に回避する
  - Issue 紐付けは PR 本文の `Closes #N` で担保

## 2. PR 必須

`main` への直接コミット・直接 push は禁止。軽微な修正（typo・コメント・README の文言調整等）も含めて、すべての変更を PR 経由でマージする。

例外なし。

## 3. PR の base とマージ方式

- PR の base は常に `main`
- マージ方式は **通常マージ（Merge commit）** を既定とする
  - GitHub 側で squash マージは無効化済み（`allow_squash_merge=false`）

## 4. マージ後の後片付け

PR マージ後の作業ブランチ・worktree の削除は `/handoff` スキルの手順に従う。
GitHub 側のリモートブランチは `delete_branch_on_merge=true` 設定により自動削除される。

## 5. worktree 運用

並行作業前提のため、作業ブランチの作成は git-worktree で行う（共通ルールどおり）。本リポジトリでの命名は以下:

```bash
git fetch origin
git worktree add -b feature/{機能名}-{Issue番号} ../becky3.github.io-wt-{Issue番号} origin/main
```

配置はリポジトリ親ディレクトリ、命名は `becky3.github.io-wt-{Issue番号}`。
